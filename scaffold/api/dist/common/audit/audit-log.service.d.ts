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
export declare class AuditLogService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    record(entry: AuditLogEntry): Promise<void>;
}
