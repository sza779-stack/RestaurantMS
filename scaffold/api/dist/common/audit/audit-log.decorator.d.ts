export declare const AUDIT_LOG_METADATA = "audit:log";
export interface AuditableOptions {
    entityType: string;
    action?: string;
    entityIdFrom?: string | ((args: {
        params: any;
        body: any;
        response: any;
    }) => string | undefined);
    redact?: string[];
}
export declare const Auditable: (options: AuditableOptions) => MethodDecorator;
