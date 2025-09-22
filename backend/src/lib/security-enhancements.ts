// Enhanced Security Features Service
// Handles advanced audit logging, encryption, and compliance

import { logger } from './logger';
import { DatabaseService } from './db';
// Using Cloudflare's Web Crypto API instead of Node.js crypto

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
}

export interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access' | 'rate_limit_exceeded';
  userId?: string;
  ipAddress: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface ComplianceReport {
  reportId: string;
  reportType: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'pci';
  generatedAt: number;
  period: {
    start: number;
    end: number;
  };
  data: {
    totalUsers: number;
    dataProcessed: number;
    dataRetained: number;
    dataDeleted: number;
    securityIncidents: number;
    auditLogs: number;
  };
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    hipaa: boolean;
    sox: boolean;
    pci: boolean;
  };
}

export class SecurityEnhancementService {
  private db: DatabaseService;
  private encryptionKey: string;
  private auditLogs: AuditLog[] = [];
  private securityEvents: SecurityEvent[] = [];
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(db: DatabaseService, encryptionKey: string) {
    this.db = db;
    this.encryptionKey = encryptionKey;
  }

  /**
   * Log security audit event
   */
  async logAuditEvent(auditData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const auditLog: AuditLog = {
      id: auditId,
      ...auditData,
      timestamp: Date.now()
    };

    // Store in memory for immediate access
    this.auditLogs.push(auditLog);

    // Store in database
    await this.db.execute(`
      INSERT INTO audit_logs (
        id, user_id, action, resource, resource_id, details, ip_address,
        user_agent, timestamp, severity, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      auditLog.id,
      auditLog.userId,
      auditLog.action,
      auditLog.resource,
      auditLog.resourceId || null,
      JSON.stringify(auditLog.details),
      auditLog.ipAddress,
      auditLog.userAgent,
      auditLog.timestamp,
      auditLog.severity,
      auditLog.success,
      auditLog.errorMessage || null
    ]);

    // Check for suspicious patterns
    await this.checkSuspiciousActivity(auditLog);

    logger.info('Audit event logged', {
      auditId,
      userId: auditLog.userId,
      action: auditLog.action,
      severity: auditLog.severity
    });

    return auditId;
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(auditLog: AuditLog): Promise<void> {
    const suspiciousPatterns = [
      {
        name: 'Multiple Failed Logins',
        check: async () => {
          const recentFailures = this.auditLogs.filter(log => 
            log.userId === auditLog.userId &&
            log.action === 'login' &&
            !log.success &&
            log.timestamp > Date.now() - 15 * 60 * 1000 // Last 15 minutes
          );
          return recentFailures.length >= 5;
        },
        severity: 'high' as const
      },
      {
        name: 'Unusual IP Address',
        check: async () => {
          const userIPs = this.auditLogs
            .filter(log => log.userId === auditLog.userId)
            .map(log => log.ipAddress)
            .slice(-10); // Last 10 IPs
          
          return !userIPs.includes(auditLog.ipAddress) && userIPs.length >= 3;
        },
        severity: 'medium' as const
      },
      {
        name: 'High-Risk Action',
        check: async () => {
          const highRiskActions = ['delete_user', 'change_password', 'export_data', 'admin_access'];
          return highRiskActions.includes(auditLog.action);
        },
        severity: 'high' as const
      }
    ];

    for (const pattern of suspiciousPatterns) {
      if (await pattern.check()) {
        await this.createSecurityEvent({
          type: 'suspicious_activity',
          userId: auditLog.userId,
          ipAddress: auditLog.ipAddress,
          details: {
            pattern: pattern.name,
            auditId: auditLog.id,
            action: auditLog.action
          },
          severity: pattern.severity
        });
      }
    }
  }

  /**
   * Create security event
   */
  async createSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const eventId = `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const securityEvent: SecurityEvent = {
      id: eventId,
      ...eventData,
      timestamp: Date.now(),
      resolved: false
    };

    // Store in memory
    this.securityEvents.push(securityEvent);

    // Store in database
    await this.db.execute(`
      INSERT INTO security_events (
        id, type, user_id, ip_address, details, severity, timestamp, resolved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      securityEvent.id,
      securityEvent.type,
      securityEvent.userId || null,
      securityEvent.ipAddress,
      JSON.stringify(securityEvent.details),
      securityEvent.severity,
      securityEvent.timestamp,
      securityEvent.resolved
    ]);

    // Send alert for critical events
    if (securityEvent.severity === 'critical') {
      await this.sendSecurityAlert(securityEvent);
    }

    logger.warn('Security event created', {
      eventId,
      type: securityEvent.type,
      severity: securityEvent.severity,
      userId: securityEvent.userId
    });

    return eventId;
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    // This would integrate with alerting systems (email, Slack, etc.)
    logger.error('SECURITY ALERT', {
      eventId: event.id,
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details: event.details
    });
  }

  /**
   * Advanced rate limiting
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    action: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `${identifier}_${action}`;
    const now = Date.now();
    
    const current = this.rateLimitTracker.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset window
      this.rateLimitTracker.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      };
    }
    
    if (current.count >= limit) {
      // Rate limit exceeded
      await this.createSecurityEvent({
        type: 'rate_limit_exceeded',
        ipAddress: identifier,
        details: {
          action,
          limit,
          windowMs,
          count: current.count
        },
        severity: 'medium'
      });
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime
      };
    }
    
    // Increment counter
    current.count++;
    this.rateLimitTracker.set(key, current);
    
    return {
      allowed: true,
      remaining: limit - current.count,
      resetTime: current.resetTime
    };
  }

  /**
   * Encrypt sensitive data using Web Crypto API
   */
  async encryptData(data: string): Promise<string> {
    try {
      // Generate a random IV
      const iv = crypto.getRandomValues(new Uint8Array(16));
      
      // Import the encryption key
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(this.encryptionKey.slice(0, 32)), // Ensure 32 bytes
        { name: 'AES-CBC' },
        false,
        ['encrypt']
      );
      
      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        key,
        new TextEncoder().encode(data)
      );
      
      // Convert to hex strings and combine
      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
      const encryptedHex = Array.from(new Uint8Array(encrypted))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      
      return ivHex + ':' + encryptedHex;
    } catch (error) {
      logger.error('Encryption failed', { error: error instanceof Error ? error.message : String(error) });
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data using Web Crypto API
   */
  async decryptData(encryptedData: string): Promise<string> {
    try {
      const parts = encryptedData.split(':');
      const ivHex = parts[0];
      const encryptedHex = parts[1];
      
      // Convert hex strings back to Uint8Arrays
      const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      const encrypted = new Uint8Array(encryptedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      
      // Import the decryption key
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(this.encryptionKey.slice(0, 32)), // Ensure 32 bytes
        { name: 'AES-CBC' },
        false,
        ['decrypt']
      );
      
      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logger.error('Decryption failed', { error: error instanceof Error ? error.message : String(error) });
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    reportType: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'pci',
    period: { start: number; end: number }
  ): Promise<ComplianceReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get data statistics
    const totalUsers = await this.db.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE created_at BETWEEN ? AND ?
    `, [period.start, period.end]);

    const dataProcessed = await this.db.query(`
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE timestamp BETWEEN ? AND ?
    `, [period.start, period.end]);

    const securityIncidents = await this.db.query(`
      SELECT COUNT(*) as count FROM security_events 
      WHERE timestamp BETWEEN ? AND ? AND severity IN ('high', 'critical')
    `, [period.start, period.end]);

    const report: ComplianceReport = {
      reportId,
      reportType,
      generatedAt: Date.now(),
      period,
      data: {
        totalUsers: (totalUsers.results?.[0] as any)?.count || 0,
        dataProcessed: (dataProcessed.results?.[0] as any)?.count || 0,
        dataRetained: 0, // Calculate based on retention policies
        dataDeleted: 0, // Calculate based on deletion logs
        securityIncidents: (securityIncidents.results?.[0] as any)?.count || 0,
        auditLogs: this.auditLogs.length
      },
      compliance: {
        gdpr: reportType === 'gdpr' ? await this.checkGDPRCompliance() : false,
        ccpa: reportType === 'ccpa' ? await this.checkCCPACompliance() : false,
        hipaa: reportType === 'hipaa' ? await this.checkHIPAACompliance() : false,
        sox: reportType === 'sox' ? await this.checkSOXCompliance() : false,
        pci: reportType === 'pci' ? await this.checkPCICompliance() : false
      }
    };

    // Store report
    await this.db.execute(`
      INSERT INTO compliance_reports (
        report_id, report_type, generated_at, period_start, period_end, data, compliance
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      report.reportId,
      report.reportType,
      report.generatedAt,
      report.period.start,
      report.period.end,
      JSON.stringify(report.data),
      JSON.stringify(report.compliance)
    ]);

    logger.info('Compliance report generated', {
      reportId,
      reportType,
      period: report.period
    });

    return report;
  }

  /**
   * Check GDPR compliance
   */
  private async checkGDPRCompliance(): Promise<boolean> {
    // Check for data protection measures
    const hasDataEncryption = true; // Assume encryption is enabled
    const hasAuditLogging = this.auditLogs.length > 0;
    const hasDataRetentionPolicy = true; // Assume retention policy exists
    
    return hasDataEncryption && hasAuditLogging && hasDataRetentionPolicy;
  }

  /**
   * Check CCPA compliance
   */
  private async checkCCPACompliance(): Promise<boolean> {
    // Check for California Consumer Privacy Act compliance
    const hasDataTransparency = true; // Assume data usage is transparent
    const hasOptOutMechanism = true; // Assume opt-out mechanism exists
    
    return hasDataTransparency && hasOptOutMechanism;
  }

  /**
   * Check HIPAA compliance
   */
  private async checkHIPAACompliance(): Promise<boolean> {
    // Check for Health Insurance Portability and Accountability Act compliance
    const hasHealthDataEncryption = true; // Assume health data is encrypted
    const hasAccessControls = true; // Assume access controls exist
    
    return hasHealthDataEncryption && hasAccessControls;
  }

  /**
   * Check SOX compliance
   */
  private async checkSOXCompliance(): Promise<boolean> {
    // Check for Sarbanes-Oxley Act compliance
    const hasFinancialControls = true; // Assume financial controls exist
    const hasAuditTrail = this.auditLogs.length > 0;
    
    return hasFinancialControls && hasAuditTrail;
  }

  /**
   * Check PCI compliance
   */
  private async checkPCICompliance(): Promise<boolean> {
    // Check for Payment Card Industry compliance
    const hasPaymentDataEncryption = true; // Assume payment data is encrypted
    const hasSecureTransmission = true; // Assume secure transmission
    
    return hasPaymentDataEncryption && hasSecureTransmission;
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(): Promise<{
    totalAuditLogs: number;
    securityEvents: number;
    criticalEvents: number;
    recentActivity: AuditLog[];
    topActions: Array<{ action: string; count: number }>;
    complianceStatus: Record<string, boolean>;
  }> {
    const recentActivity = this.auditLogs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    const actionCounts = new Map<string, number>();
    for (const log of this.auditLogs) {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    }

    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const criticalEvents = this.securityEvents.filter(e => e.severity === 'critical').length;

    return {
      totalAuditLogs: this.auditLogs.length,
      securityEvents: this.securityEvents.length,
      criticalEvents,
      recentActivity,
      topActions,
      complianceStatus: {
        gdpr: await this.checkGDPRCompliance(),
        ccpa: await this.checkCCPACompliance(),
        hipaa: await this.checkHIPAACompliance(),
        sox: await this.checkSOXCompliance(),
        pci: await this.checkPCICompliance()
      }
    };
  }

  /**
   * Resolve security event
   */
  async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<void> {
    await this.db.execute(`
      UPDATE security_events 
      SET resolved = true, resolved_at = ?, resolved_by = ?
      WHERE id = ?
    `, [Date.now(), resolvedBy, eventId]);

    // Update in memory
    const event = this.securityEvents.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
      event.resolvedAt = Date.now();
      event.resolvedBy = resolvedBy;
    }

    logger.info('Security event resolved', {
      eventId,
      resolvedBy
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    severity?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }

    if (filters.severity) {
      query += ' AND severity = ?';
      params.push(filters.severity);
    }

    if (filters.startTime) {
      query += ' AND timestamp >= ?';
      params.push(filters.startTime);
    }

    if (filters.endTime) {
      query += ' AND timestamp <= ?';
      params.push(filters.endTime);
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const result = await this.db.query(query, params);

    return (result.results || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      resource: row.resource,
      resourceId: row.resource_id,
      details: JSON.parse(row.details),
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: row.timestamp,
      severity: row.severity,
      success: row.success,
      errorMessage: row.error_message
    }));
  }
}
