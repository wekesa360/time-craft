/**
 * Admin Dashboard Service
 * Handles content management, analytics, and system monitoring
 */

import { Database } from './db';

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions: string[];
  is_active: boolean;
  created_by?: string;
  created_at: number;
  updated_at: number;
}

export interface SystemMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: 'counter' | 'gauge' | 'histogram';
  tags?: Record<string, any>;
  recorded_at: number;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  category: 'bug' | 'feature_request' | 'billing' | 'technical_support' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  title: string;
  description: string;
  language: string;
  assigned_to?: string;
  resolution?: string;
  resolved_at?: number;
  created_at: number;
  updated_at: number;
}

export interface FeatureFlag {
  id: string;
  flag_name: string;
  description?: string;
  is_enabled: boolean;
  rollout_percentage: number;
  target_groups: string[];
  created_by?: string;
  created_at: number;
  updated_at: number;
}

export interface DashboardStats {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  new_users_today: number;
  total_tasks: number;
  completed_tasks_today: number;
  total_focus_sessions: number;
  focus_sessions_today: number;
  support_tickets_open: number;
  revenue_monthly: number;
  subscription_breakdown: Record<string, number>;
}

export class AdminDashboardService {
  constructor(private db: Database) {}

  /**
   * Check if user has admin permissions
   */
  async checkAdminPermissions(userId: string, requiredPermission?: string): Promise<AdminUser | null> {
    try {
      const admin = await this.db.query(`
        SELECT * FROM admin_users 
        WHERE user_id = ? AND is_active = true
      `, [userId]) as AdminUser | null;

      if (!admin) return [];

      admin.permissions = JSON.parse(admin.permissions as any);

      if (requiredPermission && !admin.permissions.includes(requiredPermission)) {
        return [];
      }

      return (admin.results || []);
    } catch (error) {
      console.error('Error checking admin permissions:', error);
      return [];
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = Date.now();
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const weekStart = now - (7 * 24 * 60 * 60 * 1000);

      // Get user statistics
      const totalUsers = await this.db.query(`SELECT COUNT(*) as count FROM users`);
      const activeUsersToday = await this.db.query(`
        SELECT COUNT(DISTINCT user_id) as count FROM tasks 
        WHERE updated_at >= ?
      `, [todayStart]);
      const activeUsersWeek = await this.db.query(`
        SELECT COUNT(DISTINCT user_id) as count FROM tasks 
        WHERE updated_at >= ?
      `, [weekStart]);
      const newUsersToday = await this.db.query(`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at >= ?
      `, [todayStart]);

      // Get task statistics
      const totalTasks = await this.db.query(`SELECT COUNT(*) as count FROM tasks`);
      const completedTasksToday = await this.db.query(`
        SELECT COUNT(*) as count FROM tasks 
        WHERE status = 'completed' AND updated_at >= ?
      `, [todayStart]);

      // Get focus session statistics
      const totalFocusSessions = await this.db.query(`SELECT COUNT(*) as count FROM focus_sessions`);
      const focusSessionsToday = await this.db.query(`
        SELECT COUNT(*) as count FROM focus_sessions 
        WHERE created_at >= ?
      `, [todayStart]);

      // Get support ticket statistics
      const openTickets = await this.db.query(`
        SELECT COUNT(*) as count FROM support_tickets 
        WHERE status IN ('open', 'in_progress')
      `);

      // Get subscription breakdown
      const subscriptionBreakdown = await this.db.query(`
        SELECT subscription_type, COUNT(*) as count 
        FROM users 
        GROUP BY subscription_type
      `);

      const subscriptionMap: Record<string, number> = {};
      subscriptionBreakdown.forEach((row: any) => {
        subscriptionMap[row.subscription_type] = row.count;
      });

      return {
        total_users: totalUsers?.count || 0,
        active_users_today: activeUsersToday?.count || 0,
        active_users_week: activeUsersWeek?.count || 0,
        new_users_today: newUsersToday?.count || 0,
        total_tasks: totalTasks?.count || 0,
        completed_tasks_today: completedTasksToday?.count || 0,
        total_focus_sessions: totalFocusSessions?.count || 0,
        focus_sessions_today: focusSessionsToday?.count || 0,
        support_tickets_open: openTickets?.count || 0,
        revenue_monthly: 0, // Would need payment integration
        subscription_breakdown: subscriptionMap
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw new Error('Failed to get dashboard statistics');
    }
  }

  /**
   * Record system metric
   */
  async recordMetric(
    metricName: string,
    value: number,
    type: 'counter' | 'gauge' | 'histogram',
    tags?: Record<string, any>
  ): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO system_metrics (id, metric_name, metric_value, metric_type, tags, recorded_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metricName,
        value,
        type,
        tags ? JSON.stringify(tags) : null,
        Date.now(),
        Date.now()
      ).run();
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }

  /**
   * Get system metrics
   */
  async getMetrics(
    metricName?: string,
    startTime?: number,
    endTime?: number,
    limit: number = 100
  ): Promise<SystemMetric[]> {
    try {
      let query = `SELECT * FROM system_metrics WHERE 1=1`;
      const params: any[] = [];

      if (metricName) {
        query += ` AND metric_name = ?`;
        params.push(metricName);
      }

      if (startTime) {
        query += ` AND recorded_at >= ?`;
        params.push(startTime);
      }

      if (endTime) {
        query += ` AND recorded_at <= ?`;
        params.push(endTime);
      }

      query += ` ORDER BY recorded_at DESC LIMIT ?`;
      params.push(limit);

      const results = await this.db.prepare(query).bind(...params).all();
      
      return results.map((row: any) => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : null
      })) as SystemMetric[];
    } catch (error) {
      console.error('Error getting metrics:', error);
      return [];
    }
  }

  /**
   * Create support ticket
   */
  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await this.db.prepare(`
        INSERT INTO support_tickets (
          id, user_id, category, priority, status, title, description, 
          language, assigned_to, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        ticketId,
        ticket.user_id,
        ticket.category,
        ticket.priority,
        ticket.status,
        ticket.title,
        ticket.description,
        ticket.language,
        ticket.assigned_to || null,
        Date.now(),
        Date.now()
      ).run();

      return (ticketId.results || []);
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket');
    }
  }

  /**
   * Update support ticket
   */
  async updateSupportTicket(
    ticketId: string,
    updates: Partial<Pick<SupportTicket, 'status' | 'priority' | 'assigned_to' | 'resolution'>>,
    adminUserId: string
  ): Promise<boolean> {
    try {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      
      if (updates.status === 'resolved' || updates.status === 'closed') {
        values.push(Date.now()); // resolved_at
        await this.db.prepare(`
          UPDATE support_tickets 
          SET ${setClause}, resolved_at = ?, updated_at = ?
          WHERE id = ?
        `).bind(...values, Date.now(), ticketId).run();
      } else {
        await this.db.prepare(`
          UPDATE support_tickets 
          SET ${setClause}, updated_at = ?
          WHERE id = ?
        `).bind(...values, Date.now(), ticketId).run();
      }

      // Log admin action
      await this.logAdminAction(adminUserId, 'update_ticket', 'support_ticket', ticketId, {}, updates);

      return (true.results || []);
    } catch (error) {
      console.error('Error updating support ticket:', error);
      return (false.results || []);
    }
  }

  /**
   * Get support tickets
   */
  async getSupportTickets(
    status?: string,
    assignedTo?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<SupportTicket[]> {
    try {
      let query = `SELECT * FROM support_tickets WHERE 1=1`;
      const params: any[] = [];

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }

      if (assignedTo) {
        query += ` AND assigned_to = ?`;
        params.push(assignedTo);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const results = await this.db.prepare(query).bind(...params).all();
      return results as SupportTicket[];
    } catch (error) {
      console.error('Error getting support tickets:', error);
      return [];
    }
  }

  /**
   * Manage feature flags
   */
  async updateFeatureFlag(
    flagName: string,
    updates: Partial<Pick<FeatureFlag, 'is_enabled' | 'rollout_percentage' | 'target_groups'>>,
    adminUserId: string
  ): Promise<boolean> {
    try {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      let values = Object.values(updates);
      
      // Handle target_groups JSON serialization
      if (updates.target_groups) {
        const index = Object.keys(updates).indexOf('target_groups');
        values[index] = JSON.stringify(updates.target_groups);
      }

      await this.db.prepare(`
        UPDATE feature_flags 
        SET ${setClause}, updated_at = ?
        WHERE flag_name = ?
      `).bind(...values, Date.now(), flagName).run();

      // Log admin action
      await this.logAdminAction(adminUserId, 'update_feature_flag', 'feature_flag', flagName, {}, updates);

      return (true.results || []);
    } catch (error) {
      console.error('Error updating feature flag:', error);
      return (false.results || []);
    }
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags(): Promise<FeatureFlag[]> {
    try {
      const results = await this.db.query(`
        SELECT * FROM feature_flags ORDER BY flag_name
      `);

      return results.map((row: any) => ({
        ...row,
        target_groups: JSON.parse(row.target_groups || '[]')
      })) as FeatureFlag[];
    } catch (error) {
      console.error('Error getting feature flags:', error);
      return [];
    }
  }

  /**
   * Log admin action for audit trail
   */
  async logAdminAction(
    adminUserId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    oldValues: any,
    newValues: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO admin_audit_log (
          id, admin_user_id, action, resource_type, resource_id,
          old_values, new_values, ip_address, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminUserId,
        action,
        resourceType,
        resourceId,
        JSON.stringify(oldValues),
        JSON.stringify(newValues),
        ipAddress || null,
        userAgent || null,
        Date.now()
      ).run();
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Get audit log
   */
  async getAuditLog(
    adminUserId?: string,
    action?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      let query = `SELECT * FROM admin_audit_log WHERE 1=1`;
      const params: any[] = [];

      if (adminUserId) {
        query += ` AND admin_user_id = ?`;
        params.push(adminUserId);
      }

      if (action) {
        query += ` AND action = ?`;
        params.push(action);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const results = await this.db.prepare(query).bind(...params).all();
      
      return results.map((row: any) => ({
        ...row,
        old_values: JSON.parse(row.old_values || '{}'),
        new_values: JSON.parse(row.new_values || '{}')
      }));
    } catch (error) {
      console.error('Error getting audit log:', error);
      return [];
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(days: number = 30): Promise<any> {
    try {
      const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

      // Daily active users
      const dailyActiveUsers = await this.db.query(`
        SELECT 
          DATE(created_at / 1000, 'unixepoch') as date,
          COUNT(DISTINCT user_id) as active_users
        FROM tasks 
        WHERE created_at >= ?
        GROUP BY DATE(created_at / 1000, 'unixepoch')
        ORDER BY date
      `, [startTime]);

      // New user registrations
      const newRegistrations = await this.db.query(`
        SELECT 
          DATE(created_at / 1000, 'unixepoch') as date,
          COUNT(*) as new_users
        FROM users 
        WHERE created_at >= ?
        GROUP BY DATE(created_at / 1000, 'unixepoch')
        ORDER BY date
      `, [startTime]);

      // Feature usage
      const featureUsage = await this.db.query(`
        SELECT 
          'tasks' as feature,
          COUNT(*) as usage_count
        FROM tasks WHERE created_at >= ?
        UNION ALL
        SELECT 
          'focus_sessions' as feature,
          COUNT(*) as usage_count
        FROM focus_sessions WHERE created_at >= ?
        UNION ALL
        SELECT 
          'habits' as feature,
          COUNT(*) as usage_count
        FROM habit_completions WHERE created_at >= ?
      `, [startTime, startTime, startTime]);

      return {
        daily_active_users: dailyActiveUsers,
        new_registrations: newRegistrations,
        feature_usage: featureUsage
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return {};
    }
  }
}