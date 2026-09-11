import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from './audit-log.service';
import {
  AUDIT_LOG_METADATA,
  AuditableOptions,
} from './audit-log.decorator';

function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc: any, key) => (acc == null ? acc : acc[key]), obj);
}

function redactBody(body: any, redactKeys?: string[]): any {
  if (!body || typeof body !== 'object' || !redactKeys?.length) return body;
  const cloned: any = Array.isArray(body) ? [...body] : { ...body };
  for (const key of redactKeys) {
    if (key in cloned) cloned[key] = '[REDACTED]';
  }
  return cloned;
}

/**
 * AuditInterceptor — reads `@Auditable(...)` metadata on the controller method and,
 * after a successful HTTP response, persists an entry to `audit_logs`.
 *
 * Failures during write are swallowed so audit logging cannot break a successful
 * business operation. Designed to be registered globally in `app.module` providers.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<AuditableOptions | undefined>(
      AUDIT_LOG_METADATA,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap((responseBody) => {
        try {
          const user = request.user || {};
          const action =
            options.action ||
            `${request.method || 'UNKNOWN'} ${request.route?.path || request.url || ''}`.trim();

          let entityId: string | undefined;
          if (typeof options.entityIdFrom === 'function') {
            entityId = options.entityIdFrom({
              params: request.params,
              body: request.body,
              response: responseBody,
            });
          } else if (options.entityIdFrom) {
            const raw = getByPath(request, options.entityIdFrom);
            entityId = raw != null ? String(raw) : undefined;
          } else {
            // Sensible defaults: prefer response.id, fall back to params.id.
            entityId =
              (responseBody && typeof responseBody === 'object' && 'id' in responseBody
                ? String((responseBody as any).id)
                : undefined) ||
              (request.params?.id ? String(request.params.id) : undefined);
          }

          const storeId =
            request.body?.storeId ||
            request.query?.storeId ||
            (responseBody && typeof responseBody === 'object'
              ? (responseBody as any).storeId
              : undefined);

          void this.auditLogService.record({
            userId: user.userId,
            storeId: typeof storeId === 'string' ? storeId : undefined,
            action,
            entityType: options.entityType,
            entityId,
            newValues: redactBody(request.body, options.redact),
            metadata: {
              method: request.method,
              url: request.originalUrl || request.url,
              ip: request.ip,
              userAgent: request.headers?.['user-agent'],
            },
          });
        } catch (err) {
          this.logger.warn(
            `audit interceptor failure: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }),
    );
  }
}
