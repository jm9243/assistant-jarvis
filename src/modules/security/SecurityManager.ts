import { SensitiveData, AuditLog, SecurityPolicy } from './types';

export class SecurityManager {
  private policy: SecurityPolicy;
  private sensitivePatterns: SensitiveData[] = [];
  private auditLogs: AuditLog[] = [];

  constructor(policy: Partial<SecurityPolicy> = {}) {
    this.policy = {
      enableDataMasking: true,
      enableAuditLogging: true,
      enableEncryption: false,
      retentionDays: 30,
      ...policy,
    };

    this.initializeSensitivePatterns();
  }

  maskSensitiveData(text: string): string {
    if (!this.policy.enableDataMasking) {
      return text;
    }

    let masked = text;
    for (const pattern of this.sensitivePatterns) {
      const maskChar = pattern.maskChar || '*';
      masked = masked.replace(
        pattern.pattern,
        (match) => maskChar.repeat(Math.max(1, match.length - 2)) + match.slice(-2)
      );
    }
    return masked;
  }

  logAudit(action: string, resource?: string, details?: Record<string, any>): void {
    if (!this.policy.enableAuditLogging) {
      return;
    }

    const log: AuditLog = {
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      action,
      resource,
      details,
      result: 'success',
    };

    this.auditLogs.push(log);

    // Clean up old logs based on retention policy
    this.cleanupOldLogs();
  }

  getAuditLogs(filter?: { action?: string; resource?: string }): AuditLog[] {
    if (!filter) {
      return [...this.auditLogs];
    }

    return this.auditLogs.filter((log) => {
      if (filter.action && log.action !== filter.action) {
        return false;
      }
      if (filter.resource && log.resource !== filter.resource) {
        return false;
      }
      return true;
    });
  }

  clearAuditLogs(): void {
    this.auditLogs = [];
  }

  updatePolicy(policy: Partial<SecurityPolicy>): void {
    this.policy = { ...this.policy, ...policy };
  }

  getPolicy(): SecurityPolicy {
    return { ...this.policy };
  }

  private initializeSensitivePatterns(): void {
    this.sensitivePatterns = [
      {
        type: 'password',
        pattern: /password[=:]\s*([^\s]+)/gi,
      },
      {
        type: 'apikey',
        pattern: /api[_-]?key[=:]\s*([^\s]+)/gi,
      },
      {
        type: 'token',
        pattern: /token[=:]\s*([^\s]+)/gi,
      },
      {
        type: 'pii',
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
      },
    ];
  }

  private cleanupOldLogs(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.policy.retentionDays);

    this.auditLogs = this.auditLogs.filter((log) => log.timestamp >= cutoffDate);
  }
}
