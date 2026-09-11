import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  userId?: string;
  storeId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

/**
 * AuditLogService — persists audit entries to the `audit_logs` table.
 *
 * Calls are fire-and-forget from the interceptor's perspective: if the write fails
 * (DB hiccup, schema drift, etc.) we log a warning and swallow the error so a logging
 * failure can never break the actual mutation that just succeeded.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          storeId: entry.storeId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          oldValues: entry.oldValues ?? undefined,
          newValues: entry.newValues ?? undefined,
          metadata: entry.metadata ?? undefined,
        },
      });
    } catch (err) {
      this.logger.warn(
        `audit log write failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
