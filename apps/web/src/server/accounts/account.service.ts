import 'server-only';
import { prisma } from '@/server/db';
import { NotFoundError, HttpError } from '@/server/common/http';
import { accountQueryToWhere } from '@/server/common/filter-to-where';
import {
  Account,
  AccountQuery,
  CreateAccountInput,
  UpdateAccountInput,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';

export class AccountService {
  async findMany(query: AccountQuery): Promise<Account[]> {
    const rows = await prisma.account.findMany({
      where: accountQueryToWhere(query),
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });
    return rows.map((row) => this.toAccount(row));
  }

  async findOne(id: string): Promise<Account> {
    const row = await prisma.account.findUnique({ where: { id } });
    if (!row) throw new NotFoundError('Account', id);
    return this.toAccount(row);
  }

  async create(input: CreateAccountInput): Promise<Account> {
    if (input.memberId) {
      const member = await prisma.member.findUnique({
        where: { id: input.memberId },
      });
      if (!member) {
        throw new HttpError(422, {
          message: `Unknown member: ${input.memberId}`,
        });
      }
    }
    // M2 (spec deferred-card) : le compte de règlement est obligatoire pour
    // une carte de crédit, interdit pour tout autre type (400). Un compte
    // à débit différé se règle sur lui-même, sans champ.
    await this.validateLinkedAccount(input.accountType, input.linkedAccountId, {
      required: input.accountType === 'CREDIT_CARD',
    });
    const row = await prisma.account.create({
      data: {
        name: input.name,
        bank: input.bank ?? null,
        currency: input.currency,
        accountType: input.accountType,
        memberId: input.memberId ?? null,
        overdraftLimit: input.overdraftLimit ?? 0,
        deferredCard: input.deferredCard ?? false,
        billingDay: input.billingDay ?? null,
        linkedAccountId:
          input.accountType === 'CREDIT_CARD'
            ? (input.linkedAccountId ?? null)
            : null,
        openingBalance: input.openingBalance ?? 0,
        status: input.status ?? 'ACTIVE',
        closedAt: input.closedAt ? parseISO(input.closedAt) : null,
      },
    });
    return this.toAccount(row);
  }

  async update(id: string, input: UpdateAccountInput): Promise<Account> {
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Account', id);
    // Même invariant à l'édition : type effectif et linkedAccountId effectifs.
    const effectiveType = input.accountType ?? existing.accountType;
    const effectiveLinked =
      input.linkedAccountId !== undefined
        ? input.linkedAccountId
        : existing.linkedAccountId;
    await this.validateLinkedAccount(effectiveType, effectiveLinked, {
      // À l'édition, le règlement n'est exigé que si le type DEVIENT une
      // carte de crédit : une carte legacy sans lien reste éditable.
      required: input.accountType === 'CREDIT_CARD',
    });
    const row = await prisma.account.update({
      where: { id },
      data: this.toPrisma(input),
    });
    return this.toAccount(row);
  }

  /**
   * Invariants du compte de règlement (M2, spec deferred-card) :
   * - requis pour une carte de crédit (validation 400 sinon) ;
   * - refusé pour tout autre type de compte (400) ;
   * - un linkedAccountId inconnu est rejeté en 422 lisible.
   */
  private async validateLinkedAccount(
    accountType: string,
    linkedAccountId: string | null | undefined,
    options: { required: boolean }
  ): Promise<void> {
    if (accountType !== 'CREDIT_CARD') {
      if (linkedAccountId) {
        throw new HttpError(400, {
          message: 'linkedAccountId is only allowed for CREDIT_CARD accounts',
        });
      }
      return;
    }
    if (!linkedAccountId) {
      if (options.required) {
        throw new HttpError(400, {
          message:
            'A credit card requires a settlement account (linkedAccountId)',
        });
      }
      return;
    }
    const settlement = await prisma.account.findUnique({
      where: { id: linkedAccountId },
    });
    if (!settlement) {
      throw new HttpError(422, {
        message: `Unknown settlement account: ${linkedAccountId}`,
      });
    }
  }

  async close(id: string): Promise<Account> {
    const existing = await prisma.account.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Account', id);
    const row = await prisma.account.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
    return this.toAccount(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await prisma.account.findUnique({
      where: { id },
      include: {
        transactions: { take: 1 },
        snapshots: { take: 1 },
        outgoingTransfers: { take: 1 },
        charges: { take: 1 },
      },
    });
    if (!existing) throw new NotFoundError('Account', id);
    const hasData =
      existing.transactions.length > 0 ||
      existing.snapshots.length > 0 ||
      existing.outgoingTransfers.length > 0 ||
      existing.charges.length > 0;
    if (hasData) {
      throw new HttpError(409, 'Account has existing data — close it instead');
    }
    await prisma.account.delete({ where: { id } });
  }

  private toPrisma(
    input: UpdateAccountInput
  ): Prisma.AccountUncheckedUpdateInput {
    const data: Prisma.AccountUncheckedUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.bank !== undefined) data.bank = input.bank;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.accountType !== undefined) data.accountType = input.accountType;
    if (input.memberId !== undefined) data.memberId = input.memberId;
    if (input.overdraftLimit !== undefined)
      data.overdraftLimit = input.overdraftLimit;
    if (input.deferredCard !== undefined)
      data.deferredCard = input.deferredCard;
    if (input.billingDay !== undefined) data.billingDay = input.billingDay;
    if (input.linkedAccountId !== undefined)
      data.linkedAccountId = input.linkedAccountId;
    if (input.openingBalance !== undefined)
      data.openingBalance = input.openingBalance;
    if (input.status !== undefined) data.status = input.status;
    if (input.closedAt !== undefined)
      data.closedAt = input.closedAt ? parseISO(input.closedAt) : null;
    return data;
  }

  private toAccount(row: Prisma.AccountGetPayload<object>): Account {
    return {
      ...row,
      currency: row.currency as Account['currency'],
      accountType: row.accountType as Account['accountType'],
      status: row.status as Account['status'],
      closedAt: row.closedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

const globalForAccountService = globalThis as {
  accountService?: AccountService;
};
export const accountService =
  globalForAccountService.accountService ?? new AccountService();

if (process.env.NODE_ENV !== 'production') {
  globalForAccountService.accountService = accountService;
}
