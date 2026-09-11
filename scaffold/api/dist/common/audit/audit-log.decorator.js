"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auditable = exports.AUDIT_LOG_METADATA = void 0;
const common_1 = require("@nestjs/common");
exports.AUDIT_LOG_METADATA = 'audit:log';
const Auditable = (options) => (0, common_1.SetMetadata)(exports.AUDIT_LOG_METADATA, options);
exports.Auditable = Auditable;
//# sourceMappingURL=audit-log.decorator.js.map