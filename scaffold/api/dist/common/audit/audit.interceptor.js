"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rxjs_1 = require("rxjs");
const audit_log_service_1 = require("./audit-log.service");
const audit_log_decorator_1 = require("./audit-log.decorator");
function getByPath(obj, path) {
    if (!obj || !path)
        return undefined;
    return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}
function redactBody(body, redactKeys) {
    if (!body || typeof body !== 'object' || !redactKeys?.length)
        return body;
    const cloned = Array.isArray(body) ? [...body] : { ...body };
    for (const key of redactKeys) {
        if (key in cloned)
            cloned[key] = '[REDACTED]';
    }
    return cloned;
}
let AuditInterceptor = AuditInterceptor_1 = class AuditInterceptor {
    constructor(reflector, auditLogService) {
        this.reflector = reflector;
        this.auditLogService = auditLogService;
        this.logger = new common_1.Logger(AuditInterceptor_1.name);
    }
    intercept(context, next) {
        const options = this.reflector.get(audit_log_decorator_1.AUDIT_LOG_METADATA, context.getHandler());
        if (!options) {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest();
        return next.handle().pipe((0, rxjs_1.tap)((responseBody) => {
            try {
                const user = request.user || {};
                const action = options.action ||
                    `${request.method || 'UNKNOWN'} ${request.route?.path || request.url || ''}`.trim();
                let entityId;
                if (typeof options.entityIdFrom === 'function') {
                    entityId = options.entityIdFrom({
                        params: request.params,
                        body: request.body,
                        response: responseBody,
                    });
                }
                else if (options.entityIdFrom) {
                    const raw = getByPath(request, options.entityIdFrom);
                    entityId = raw != null ? String(raw) : undefined;
                }
                else {
                    entityId =
                        (responseBody && typeof responseBody === 'object' && 'id' in responseBody
                            ? String(responseBody.id)
                            : undefined) ||
                            (request.params?.id ? String(request.params.id) : undefined);
                }
                const storeId = request.body?.storeId ||
                    request.query?.storeId ||
                    (responseBody && typeof responseBody === 'object'
                        ? responseBody.storeId
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
            }
            catch (err) {
                this.logger.warn(`audit interceptor failure: ${err instanceof Error ? err.message : String(err)}`);
            }
        }));
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = AuditInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        audit_log_service_1.AuditLogService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map