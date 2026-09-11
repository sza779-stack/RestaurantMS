import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLogService } from './audit-log.service';
import { AuditInterceptor } from './audit.interceptor';

/**
 * AuditModule — registers `AuditLogService` (DI-injectable from any module) and
 * a global `AuditInterceptor`. The interceptor is no-op for any controller method
 * that does NOT carry `@Auditable(...)` metadata, so wiring it globally is safe.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    AuditLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditLogService],
})
export class AuditModule {}
