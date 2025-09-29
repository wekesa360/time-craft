import type { Env } from './env';
import type { 
  DatabaseResult, 
  PaginationParams, 
  User, 
  Task, 
  TaskFilters,
  HealthLog,
  HealthLogFilters,
  FinancialEntry,
  FinancialFilters,
  SupportedLanguage 
} from '../types/database';
import { generateId } from '../utils/id';

// Import D1 types explicitly
import type { D1Database, D1Result } from '@cloudflare/workers-types';

/* ---------- Row helpers ---------- */
export type Row<T = Record<string, unknown>> = T;

/* ---------- Insert helper ---------- */
export async function insert<T = Row>(
  env: Env,
  table: string,
  data: Record<string, unknown>
): Promise<D1Result> {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(',');
  const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
  
  // Serialize objects and arrays to JSON strings for D1
  const values = Object.values(data).map(value => {
    if (value !== null && typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  });
  
  const stmt = env.DB.prepare(sql).bind(...values);
  return stmt.run();
}

/* ---------- Select helpers ---------- */
export async function select<T = Row>(
  env: Env,
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const stmt = env.DB.prepare(sql);
  const res = params ? await stmt.bind(...params).all() : await stmt.all();
  return (res.results ?? []) as T[];
}

/* ---------- First row helper ---------- */
export async function first<T = Row>(
  env: Env,
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await select<T>(env, sql, params);
  return rows[0] ?? null;
}

/* ---------- Update helper ---------- */
export async function update(
  env: Env,
  table: string,
  set: Record<string, unknown>,
  where: string,
  params: unknown[] = []
): Promise<D1Result> {
  const setClause = Object.keys(set).map(k => `${k} = ?`).join(',');
  const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
  
  // Serialize objects and arrays to JSON strings for D1
  const setValues = Object.values(set).map(value => {
    if (value !== null && typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  });
  
  const stmt = env.DB.prepare(sql).bind(...setValues, ...params);
  return stmt.run();
}

/* ---------- Delete helper ---------- */
export async function remove(
  env: Env,
  table: string,
  where: string,
  params: unknown[] = []
): Promise<D1Result> {
  const sql = `DELETE FROM ${table} WHERE ${where}`;
  const stmt = env.DB.prepare(sql).bind(...params);
  return stmt.run();
}

/* ---------- Advanced Database Operations ---------- */

export class DatabaseService {
  constructor(private env: Env) {}

  // Generic query method for compatibility
  async query(sql: string, params?: unknown[]): Promise<{ results?: any[]; success?: boolean; meta?: any }> {
    try {
      const stmt = this.env.DB.prepare(sql);
      const result = params ? await stmt.bind(...params).all() : await stmt.all();
      return {
        results: result.results || [],
        success: result.success,
        meta: result.meta
      };
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Execute method for INSERT/UPDATE/DELETE operations
  async execute(sql: string, params?: unknown[]): Promise<D1Result> {
    const stmt = this.env.DB.prepare(sql);
    return params ? await stmt.bind(...params).run() : await stmt.run();
  }

  // Pagination helper with cursor support
  async paginate<T = Row>(
    sql: string,
    params: unknown[],
    pagination: PaginationParams
  ): Promise<DatabaseResult<T>> {
    const limit = Math.min(pagination.limit || 50, 100); // Max 100 items
    const offset = pagination.offset || 0;

    // Add pagination to query
    const paginatedSql = `${sql} LIMIT ${limit + 1} OFFSET ${offset}`;
    const results = await select<T>(this.env, paginatedSql, params);
    
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, -1) : results;
    
    return {
      data,
      hasMore,
      total: undefined, // Could add COUNT query if needed
      nextCursor: hasMore ? String(offset + limit) : undefined
    };
  }

  // Transaction wrapper for D1
  async transaction<T>(
    callback: (db: D1Database) => Promise<T>
  ): Promise<T> {
    // D1 doesn't support explicit transactions yet, but we can batch operations
    return callback(this.env.DB);
  }

  // Bulk insert with error handling
  async bulkInsert(
    table: string,
    records: Record<string, unknown>[],
    batchSize: number = 100
  ): Promise<{ success: number; errors: any[] }> {
    let success = 0;
    const errors: any[] = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        for (const record of batch) {
          await insert(this.env, table, record);
          success++;
        }
      } catch (error) {
        errors.push({
          batchIndex: Math.floor(i / batchSize),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { success, errors };
  }

  // Soft delete with timestamp
  async softDelete(
    table: string,
    id: string,
    userId?: string
  ): Promise<D1Result> {
    const now = Date.now();
    const where = userId ? 'id = ? AND user_id = ?' : 'id = ?';
    const params = userId ? [id, userId] : [id];
    
    return update(this.env, table, { deleted_at: now }, where, params);
  }

  // User-specific query builder
  async getUserData<T = Row>(
    userId: string,
    table: string,
    filters?: Record<string, any>
  ): Promise<T[]> {
    let sql = `SELECT * FROM ${table} WHERE user_id = ?`;
    const params = [userId];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          sql += ` AND ${key} = ?`;
          params.push(value);
        }
      }
    }

    sql += ` ORDER BY created_at DESC`;
    return select<T>(this.env, sql, params);
  }
}

/* ---------- Specialized Database Operations ---------- */

// User operations
export class UserRepository {
  constructor(private env: Env) {}

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const now = Date.now();
    const user: User = {
      id: generateId('user'),
      ...userData,
      created_at: now,
      updated_at: now
    };

    await insert(this.env, 'users', user as unknown as Record<string, unknown>);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return first<User>(this.env, 'SELECT * FROM users WHERE email = ?', [email]);
  }

  async findById(id: string): Promise<User | null> {
    return first<User>(this.env, 'SELECT * FROM users WHERE id = ?', [id]);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const updateData = { ...updates, updated_at: Date.now() };
    await update(this.env, 'users', updateData, 'id = ?', [id]);
  }

  async updateSubscription(
    userId: string, 
    subscriptionType: string, 
    expiresAt: number | null,
    stripeCustomerId?: string
  ): Promise<void> {
    const updateData: any = {
      subscription_type: subscriptionType,
      subscription_expires_at: expiresAt,
      updated_at: Date.now()
    };
    
    if (stripeCustomerId) {
      updateData.stripe_customer_id = stripeCustomerId;
    }

    await update(this.env, 'users', updateData, 'id = ?', [userId]);
  }
}

// Task operations
export class TaskRepository {
  constructor(private env: Env) {}

  async createTask(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const now = Date.now();
    const task: Task = {
      id: generateId('task'),
      ...taskData,
      created_at: now,
      updated_at: now
    };

    await insert(this.env, 'tasks', task as unknown as Record<string, unknown>);
    return task;
  }

  async getTasks(userId: string, filters: TaskFilters = {}): Promise<DatabaseResult<Task>> {
    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.priority) {
      sql += ' AND priority = ?';
      params.push(String(filters.priority));
    }

    if (filters.context_type) {
      sql += ' AND context_type = ?';
      params.push(filters.context_type);
    }

    if (filters.start_date) {
      sql += ' AND created_at >= ?';
      params.push(String(filters.start_date));
    }

    if (filters.end_date) {
      sql += ' AND created_at <= ?';
      params.push(String(filters.end_date));
    }

    if (filters.search) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Eisenhower Matrix filters
    if (filters.quadrant) {
      sql += ' AND eisenhower_quadrant = ?';
      params.push(filters.quadrant);
    }

    if (filters.urgency) {
      sql += ' AND urgency = ?';
      params.push(String(filters.urgency));
    }

    if (filters.importance) {
      sql += ' AND importance = ?';
      params.push(String(filters.importance));
    }

    if (filters.is_delegated !== undefined) {
      sql += ' AND is_delegated = ?';
      params.push(filters.is_delegated ? '1' : '0');
    }

    sql += ' ORDER BY ';
    if (filters.priority) {
      sql += 'priority DESC, ';
    }
    sql += 'ai_priority_score DESC NULLS LAST, due_date ASC NULLS LAST, created_at DESC';

    const db = new DatabaseService(this.env);
    return db.paginate<Task>(sql, params, filters);
  }

  async updateTask(id: string, userId: string, updates: Partial<Task>): Promise<void> {
    const updateData = { ...updates, updated_at: Date.now() };
    await update(this.env, 'tasks', updateData, 'id = ? AND user_id = ?', [id, userId]);
  }

  async completeTask(id: string, userId: string): Promise<void> {
    await this.updateTask(id, userId, { status: 'done' });
  }

  async getTaskStats(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    const now = Date.now();
    
    const [totalResult, completedResult, pendingResult, overdueResult] = await Promise.all([
      first<{ count: number }>(this.env, 'SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [userId]),
      first<{ count: number }>(this.env, 'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?', [userId, 'done']),
      first<{ count: number }>(this.env, 'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ?', [userId, 'pending']),
      first<{ count: number }>(this.env, 'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = ? AND due_date < ?', [userId, 'pending', now])
    ]);

    return {
      total: totalResult?.count || 0,
      completed: completedResult?.count || 0,
      pending: pendingResult?.count || 0,
      overdue: overdueResult?.count || 0
    };
  }
}

// Health tracking operations
export class HealthRepository {
  constructor(private env: Env) {}

  async logHealthData(healthData: Omit<HealthLog, 'id' | 'created_at'>): Promise<HealthLog> {
    const healthLog: HealthLog = {
      id: generateId('health'),
      ...healthData,
      created_at: Date.now()
    };

    await insert(this.env, 'health_logs', healthLog as unknown as Record<string, unknown>);
    return healthLog;
  }

  async getHealthLogs(userId: string, filters: HealthLogFilters = {}): Promise<DatabaseResult<HealthLog>> {
    let sql = 'SELECT * FROM health_logs WHERE user_id = ?';
    const params = [userId];

    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.source) {
      sql += ' AND source = ?';
      params.push(filters.source);
    }

    if (filters.start_date) {
      sql += ' AND recorded_at >= ?';
      params.push(String(filters.start_date));
    }

    if (filters.end_date) {
      sql += ' AND recorded_at <= ?';
      params.push(String(filters.end_date));
    }

    sql += ' ORDER BY recorded_at DESC';

    const db = new DatabaseService(this.env);
    return db.paginate<HealthLog>(sql, params, filters);
  }

  async getHealthSummary(userId: string, days: number = 7): Promise<{
    exerciseCount: number;
    nutritionCount: number;
    moodAverage: number | null;
    hydrationTotal: number;
  }> {
    const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const [exercise, nutrition, mood, hydration] = await Promise.all([
      first<{ count: number }>(this.env, 
        'SELECT COUNT(*) as count FROM health_logs WHERE user_id = ? AND type = ? AND recorded_at >= ?', 
        [userId, 'exercise', startDate]
      ),
      first<{ count: number }>(this.env, 
        'SELECT COUNT(*) as count FROM health_logs WHERE user_id = ? AND type = ? AND recorded_at >= ?', 
        [userId, 'nutrition', startDate]
      ),
      first<{ avg_mood: number }>(this.env, 
        `SELECT AVG(CAST(json_extract(payload, '$.score') AS REAL)) as avg_mood 
         FROM health_logs 
         WHERE user_id = ? AND type = ? AND recorded_at >= ?`, 
        [userId, 'mood', startDate]
      ),
      first<{ total_ml: number }>(this.env, 
        `SELECT SUM(CAST(json_extract(payload, '$.amount_ml') AS INTEGER)) as total_ml 
         FROM health_logs 
         WHERE user_id = ? AND type = ? AND recorded_at >= ?`, 
        [userId, 'hydration', startDate]
      )
    ]);

    return {
      exerciseCount: exercise?.count || 0,
      nutritionCount: nutrition?.count || 0,
      moodAverage: mood?.avg_mood || null,
      hydrationTotal: hydration?.total_ml || 0
    };
  }
}

// Financial tracking operations
export class FinanceRepository {
  constructor(private env: Env) {}

  async createTransaction(transactionData: Omit<FinancialEntry, 'id' | 'created_at'>): Promise<FinancialEntry> {
    const transaction: FinancialEntry = {
      id: generateId('fin'),
      ...transactionData,
      created_at: Date.now()
    };

    await insert(this.env, 'financial_entries', transaction as unknown as Record<string, unknown>);
    return transaction;
  }

  async getTransactions(userId: string, filters: FinancialFilters = {}): Promise<DatabaseResult<FinancialEntry>> {
    let sql = 'SELECT * FROM financial_entries WHERE user_id = ?';
    const params = [userId];

    if (filters.transaction_type) {
      sql += ' AND transaction_type = ?';
      params.push(filters.transaction_type);
    }

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.min_amount) {
      sql += ' AND amount >= ?';
      params.push(String(filters.min_amount));
    }

    if (filters.max_amount) {
      sql += ' AND amount <= ?';
      params.push(String(filters.max_amount));
    }

    if (filters.start_date) {
      sql += ' AND transaction_date >= ?';
      params.push(String(filters.start_date));
    }

    if (filters.end_date) {
      sql += ' AND transaction_date <= ?';
      params.push(String(filters.end_date));
    }

    sql += ' ORDER BY transaction_date DESC';

    const db = new DatabaseService(this.env);
    return db.paginate<FinancialEntry>(sql, params, filters);
  }

  async getFinancialSummary(userId: string, month: number, year: number): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    expensesByCategory: { category: string; amount: number }[];
  }> {
    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59).getTime();

    const [income, expenses, categoryBreakdown] = await Promise.all([
      first<{ total: number }>(this.env,
        'SELECT SUM(amount) as total FROM financial_entries WHERE user_id = ? AND transaction_type = ? AND transaction_date >= ? AND transaction_date <= ?',
        [userId, 'income', startOfMonth, endOfMonth]
      ),
      first<{ total: number }>(this.env,
        'SELECT SUM(amount) as total FROM financial_entries WHERE user_id = ? AND transaction_type = ? AND transaction_date >= ? AND transaction_date <= ?',
        [userId, 'expense', startOfMonth, endOfMonth]
      ),
      select<{ category: string; amount: number }>(this.env,
        'SELECT category, SUM(amount) as amount FROM financial_entries WHERE user_id = ? AND transaction_type = ? AND transaction_date >= ? AND transaction_date <= ? GROUP BY category ORDER BY amount DESC',
        [userId, 'expense', startOfMonth, endOfMonth]
      )
    ]);

    const totalIncome = income?.total || 0;
    const totalExpenses = expenses?.total || 0;

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      expensesByCategory: categoryBreakdown
    };
  }
}

// Localization operations
// Backward compatibility alias
export const Database = DatabaseService;

export class LocalizationRepository {
  constructor(private env: Env) {}

  async getLocalizedContent(language: SupportedLanguage, keys?: string[]): Promise<Record<string, string>> {
    let sql = 'SELECT content_key, content FROM localized_content WHERE language = ?';
    const params: (SupportedLanguage | string)[] = [language];

    if (keys && keys.length > 0) {
      const placeholders = keys.map(() => '?').join(',');
      sql += ` AND content_key IN (${placeholders})`;
      params.push(...(keys as string[]));
    }

    const results = await select<{ content_key: string; content: string }>(this.env, sql, params);
    
    return results.reduce((acc, row) => {
      acc[row.content_key] = row.content;
      return acc;
    }, {} as Record<string, string>);
  }

  async setLocalizedContent(
    contentKey: string,
    language: SupportedLanguage,
    content: string
  ): Promise<void> {
    const data = {
      id: generateId('loc'),
      content_key: contentKey,
      language,
      content,
      created_at: Date.now()
    };

    // Use INSERT OR REPLACE to handle updates
    const sql = `INSERT OR REPLACE INTO localized_content 
                 (id, content_key, language, content, created_at) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    await this.env.DB.prepare(sql)
      .bind(data.id, data.content_key, data.language, data.content, data.created_at)
      .run();
  }
}