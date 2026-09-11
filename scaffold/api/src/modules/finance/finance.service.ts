import { BadRequestException, Injectable } from '@nestjs/common';
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

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getAccounts(companyId: string) {
    if (!companyId) throw new BadRequestException('companyId is required');
    return this.prisma.ledgerAccount.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });
  }

  async getJournalEntries(
    companyId: string,
    params: { startDate?: Date; endDate?: Date },
  ) {
    if (!companyId) throw new BadRequestException('companyId is required');
    // JournalEntry doesn't carry companyId directly — it links to LedgerAccount through its
    // lines. Scope by "every entry that touches at least one of this company's accounts" so
    // tenants never see each other's books.
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

  async createJournalEntry(data: CreateJournalEntryInput) {
    if (!data?.companyId) {
      throw new BadRequestException('companyId is required');
    }
    if (!data?.description) {
      throw new BadRequestException('description is required');
    }
    if (!Array.isArray(data.lines) || data.lines.length < 2) {
      throw new BadRequestException(
        'A journal entry needs at least two lines (one debit, one credit).',
      );
    }

    const accountIds = Array.from(
      new Set(data.lines.map((l) => l.ledgerAccountId).filter(Boolean)),
    );
    if (accountIds.length === 0) {
      throw new BadRequestException('Each line must reference a ledgerAccountId.');
    }
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { id: { in: accountIds }, companyId: data.companyId },
      select: { id: true },
    });
    if (accounts.length !== accountIds.length) {
      throw new BadRequestException(
        'One or more ledger account IDs are unknown or belong to a different company.',
      );
    }

    // Double-entry rule: total debits must equal total credits (within rounding tolerance).
    const totalDebits = data.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredits = data.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
    if (Math.abs(totalDebits - totalCredits) > 0.005) {
      throw new BadRequestException(
        `Journal entry is unbalanced: debits=${totalDebits.toFixed(2)} credits=${totalCredits.toFixed(2)}.`,
      );
    }
    if (totalDebits === 0) {
      throw new BadRequestException('Journal entry must move a non-zero amount.');
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

  /**
   * Generate a unique JE number like `JE-20260511-0007`. Counts entries for today globally;
   * JE numbers are unique across all tenants which is fine for an opaque ID.
   */
  private async generateEntryNumber(): Promise<string> {
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
      if (!isNaN(parsed)) seq = parsed + 1;
    }
    return `${datePrefix}-${String(seq).padStart(4, '0')}`;
  }
}
