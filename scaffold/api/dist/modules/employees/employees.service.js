"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let EmployeesService = class EmployeesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(storeId) {
        return this.prisma.employee.findMany({
            where: { storeId },
        });
    }
    async findById(id) {
        return this.prisma.employee.findUnique({
            where: { id },
        });
    }
    async create(data) {
        return this.prisma.employee.create({ data });
    }
    async clockIn(data) {
        return this.prisma.timeEntry.create({
            data: {
                ...data,
                clockIn: new Date(),
            },
        });
    }
    async clockOut(id) {
        return this.prisma.timeEntry.update({
            where: { id },
            data: { clockOut: new Date() },
        });
    }
    async getW2Profile(employeeId) {
        const profile = await this.prisma.w2Profile.findUnique({
            where: { employeeId },
        });
        if (profile && profile.ssn) {
            const { decrypt } = await Promise.resolve().then(() => __importStar(require('../../common/utils/encryption.util')));
            profile.ssn = decrypt(profile.ssn);
        }
        return profile;
    }
    async upsertW2Profile(employeeId, data) {
        const { encrypt } = await Promise.resolve().then(() => __importStar(require('../../common/utils/encryption.util')));
        const ssn = data.ssn ? encrypt(data.ssn) : undefined;
        return this.prisma.w2Profile.upsert({
            where: { employeeId },
            update: {
                ...data,
                ssn,
            },
            create: {
                ...data,
                employeeId,
                ssn: ssn || '',
            },
        });
    }
};
exports.EmployeesService = EmployeesService;
exports.EmployeesService = EmployeesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmployeesService);
//# sourceMappingURL=employees.service.js.map