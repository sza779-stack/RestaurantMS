import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    getAccounts(companyId: string): Promise<{
        id: string;
        name: string;
        type: import(".prisma/client").$Enums.AccountType;
        companyId: string;
        isActive: boolean;
        code: string;
        parentId: string | null;
        subtype: string | null;
        isBankAccount: boolean;
        bankName: string | null;
        accountNumber: string | null;
    }[]>;
    getJournalEntries(companyId: string, startDate?: string, endDate?: string): Promise<({
        lines: {
            id: string;
            description: string | null;
            debit: import("@prisma/client/runtime/library").Decimal;
            credit: import("@prisma/client/runtime/library").Decimal;
            ledgerAccountId: string;
            journalEntryId: string;
        }[];
    } & {
        id: string;
        storeId: string | null;
        createdAt: Date;
        description: string;
        referenceType: string | null;
        referenceId: string | null;
        createdById: string | null;
        entryNumber: string;
        date: Date;
        isPosted: boolean;
        postedAt: Date | null;
    })[]>;
    createJournalEntry(data: any): Promise<{
        lines: {
            id: string;
            description: string | null;
            debit: import("@prisma/client/runtime/library").Decimal;
            credit: import("@prisma/client/runtime/library").Decimal;
            ledgerAccountId: string;
            journalEntryId: string;
        }[];
    } & {
        id: string;
        storeId: string | null;
        createdAt: Date;
        description: string;
        referenceType: string | null;
        referenceId: string | null;
        createdById: string | null;
        entryNumber: string;
        date: Date;
        isPosted: boolean;
        postedAt: Date | null;
    }>;
}
