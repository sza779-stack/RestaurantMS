import { PrismaService } from '../../prisma/prisma.service';
interface JournalLineInput {
    ledgerAccountId: string;
    debit?: number | string | null;
    credit?: number | string | null;
    description?: string;
}
interface CreateJournalEntryInput {
    companyId: string;
    storeId?: string;
    date?: Date | string;
    entryNumber?: string;
    referenceType?: string;
    referenceId?: string;
    description: string;
    isPosted?: boolean;
    createdById?: string;
    lines: JournalLineInput[];
}
export declare class FinanceService {
    private prisma;
    constructor(prisma: PrismaService);
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
    getJournalEntries(companyId: string, params: {
        startDate?: Date;
        endDate?: Date;
    }): Promise<({
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
    createJournalEntry(data: CreateJournalEntryInput): Promise<{
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
    private generateEntryNumber;
}
export {};
