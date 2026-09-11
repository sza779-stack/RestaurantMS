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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let FinanceService = class FinanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAccounts(companyId) {
        if (!companyId)
            throw new common_1.BadRequestException('companyId is required');
        return this.prisma.ledgerAccount.findMany({
            where: { companyId },
            orderBy: { code: 'asc' },
        });
    }
    async getJournalEntries(companyId, params) {
        if (!companyId)
            throw new common_1.BadRequestException('companyId is required');
        return this.prisma.journalEntry.findMany({
            where: {
                date: {
                    gte: params.startDate,
                    lte: params.endDate,
                },
                lines: {
                    some: {
                        ledgerAccount: {
                            companyId,
                        },
                    },
                },
            },
            include: { lines: true },
            orderBy: { date: 'desc' },
        });
    }
    async createJournalEntry(data) {
        if (!data?.companyId) {
            throw new common_1.BadRequestException('companyId is required');
        }
        if (!data?.description) {
            throw new common_1.BadRequestException('description is required');
        }
        if (!Array.isArray(data.lines) || data.lines.length < 2) {
            throw new common_1.BadRequestException('A journal entry needs at least two lines (one debit, one credit).');
        }
        const accountIds = Array.from(new Set(data.lines.map((l) => l.ledgerAccountId).filter(Boolean)));
        if (accountIds.length === 0) {
            throw new common_1.BadRequestException('Each line must reference a ledgerAccountId.');
        }
        const accounts = await this.prisma.ledgerAccount.findMany({
            where: { id: { in: accountIds }, companyId: data.companyId },
            select: { id: true },
        });
        if (accounts.length !== accountIds.length) {
            throw new common_1.BadRequestException('One or more ledger account IDs are unknown or belong to a different company.');
        }
        const totalDebits = data.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
        const totalCredits = data.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
        if (Math.abs(totalDebits - totalCredits) > 0.005) {
            throw new common_1.BadRequestException(`Journal entry is unbalanced: debits=${totalDebits.toFixed(2)} credits=${totalCredits.toFixed(2)}.`);
        }
        if (totalDebits === 0) {
            throw new common_1.BadRequestException('Journal entry must move a non-zero amount.');
        }
        const entryNumber = data.entryNumber || (await this.generateEntryNumber());
        return this.prisma.journalEntry.create({
            data: {
                entryNumber,
                storeId: data.storeId,
                date: data.date ? (typeof data.date === 'string' ? new Date(data.date) : data.date) : new Date(),
                referenceType: data.referenceType,
                referenceId: data.referenceId,
                description: data.description,
                isPosted: data.isPosted ?? false,
                postedAt: data.isPosted ? new Date() : undefined,
                createdById: data.createdById,
                lines: {
                    create: data.lines.map((l) => ({
                        ledgerAccountId: l.ledgerAccountId,
                        debit: Number(l.debit || 0),
                        credit: Number(l.credit || 0),
                        description: l.description,
                    })),
                },
            },
            include: { lines: true },
        });
    }
    async generateEntryNumber() {
        const today = new Date();
        const datePrefix = `JE-${today.toISOString().slice(0, 10).replace(/-/g, '')}`;
        const last = await this.prisma.journalEntry.findFirst({
            where: { entryNumber: { startsWith: datePrefix } },
            orderBy: { entryNumber: 'desc' },
        });
        let seq = 1;
        if (last) {
            const parts = last.entryNumber.split('-');
            const parsed = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(parsed))
                seq = parsed + 1;
        }
        return `${datePrefix}-${String(seq).padStart(4, '0')}`;
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map