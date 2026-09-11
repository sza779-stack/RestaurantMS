import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_METADATA = 'audit:log';

export interface AuditableOptions {
  /** Domain entity type, e.g. "Order", "User", "Payment". */
  entityType: string;
  /** Logical action name, e.g. "UPDATE_STATUS", "PROCESS_PAYMENT". Defaults to HTTP method. */
  action?: string;
  /**
   * How to derive the entity ID. Either a literal request key path
   * (e.g. "params.id", "body.orderId") or a custom function.
   */
  entityIdFrom?:
    | string
    | ((args: { params: any; body: any; response: any }) => string | undefined);
  /**
   * Optionally strip fields out of the request body before persisting to `newValues`.
   * Useful for masking passwords, card numbers, etc.
   */
  redact?: string[];
}

/**
 * `@Auditable({...})` — marks a controller method as audit-logged.
 *
 * The `AuditInterceptor` (when registered globally or per-controller) will read this
 * metadata and write to the `audit_logs` table after a successful response. If the
 * decorator is absent, nothing is logged for that endpoint — opt-in only.
 */
export const Auditable = (options: AuditableOptions): MethodDecorator =>
  SetMetadata(AUDIT_LOG_METADATA, options);
