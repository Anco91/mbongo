import { prisma } from '@/server/db';
import { NotFoundError, HttpError } from '@/server/common/http';
import { createWhereTranslator } from '@/server/common/where-translator';
import {
  Charge,
  ChargeQuery,
  CreateChargeInput,
  UpdateChargeInput,
  generatePayments,
  checkChargeSubcategory,
  resolveChargeSubcategory,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO, startOfDay, startOfMonth } from 'date-fns';

const chargeWhereTranslator = createWhereTranslator<Prisma.ChargeWhereInput>({
  label: { ops: ['eq', 'contains', 'startsWith', 'endsWith'] },
  type: { ops: ['eq', 'in', 'not'] },
  currency: { ops: ['eq', 'in'] },
  accountId: { ops: ['eq', 'in'] },
  category: { ops: ['eq', 'contains', 'in'] },
  frequency: { ops: ['eq', 'in'] },
  provisioned: { ops: ['eq'] },
});

export class ChargeService {
  async findMany(query: ChargeQuery): Promise<Charge[]> {
    const rows = await prisma.charge.findMany({
      where: chargeWhereTranslator(query as Record<string, unknown>),
      orderBy: { startDate: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
    });
    return rows.map((row) => this.toCharge(row));
  }

  async findOne(id: string): Promise<Charge> {
    const row = await prisma.charge.findUnique({ where: { id } });
    if (!row) throw new NotFoundError('Charge', id);
    return this.toCharge(row);
  }

  async create(input: CreateChargeInput): Promise<Charge> {
    const account = await prisma.account.findUnique({
      where: { id: input.accountId },
    });
    if (!account) {
      throw new HttpError(422, {
        message: `Unknown account: ${input.accountId}`,
      });
    }
    const subcategoryIssue = checkChargeSubcategory(
      input.category,
      input.subcategory ?? null
    );
    if (subcategoryIssue) {
      throw new HttpError(422, { message: subcategoryIssue });
    }
    await this.assertOwner(input.memberId ?? null, input.shared ?? false);
    // M2 (design D5) : création TRANSACTIONNELLE — la charge et ses
    // échéances sont persistées tout-ou-rien. Un échec ne laisse
    // ni charge ni échéance orpheline.
    const row = await prisma.$transaction(async (tx) => {
      const chargeRow = await tx.charge.create({
        data: {
          label: input.label,
          type: input.type,
          amount: input.amount,
          currency: input.currency,
          accountId: input.accountId,
          category: input.category,
          subcategory: input.subcategory ?? null,
          startDate: parseISO(input.startDate),
          endDate: input.endDate ? parseISO(input.endDate) : null,
          frequency: input.frequency,
          installments: input.installments,
          dueDay: input.dueDay ?? null,
          provisioned: input.provisioned ?? false,
          memberId: input.memberId ?? null,
          shared: input.shared ?? false,
        },
      });
      await this.generateAndStorePayments(
        tx,
        chargeRow,
        startOfDay(new Date())
      );
      return chargeRow;
    });
    return this.toCharge(row);
  }

  async update(id: string, input: UpdateChargeInput): Promise<Charge> {
    const existing = await prisma.charge.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Charge', id);

    const subcategory = this.resolveSubcategory(existing, input);
    await this.assertOwner(
      input.memberId !== undefined ? input.memberId : existing.memberId,
      input.shared !== undefined ? input.shared : existing.shared
    );

    if (!this.touchesSchedule(input)) {
      const row = await prisma.charge.update({
        where: { id },
        data: this.toPrisma(input, subcategory),
      });
      return this.toCharge(row);
    }

    // Design D4 : le jour de prélèvement n'existe que pour le mensuel.
    const effectiveType = input.type ?? existing.type;
    const effectiveFrequency = input.frequency ?? existing.frequency;
    const effectiveDueDay =
      input.dueDay !== undefined ? input.dueDay : (existing.dueDay ?? null);
    if (effectiveDueDay !== null && effectiveFrequency !== 'monthly') {
      throw new HttpError(422, {
        message: 'Due day is only allowed for monthly charges',
      });
    }

    // M2 (design D6) : édition du calendrier — les échéances futures
    // PENDING sans rapprochement sont remplacées ; les échéances payées ou
    // rapprochées restent STRICTEMENT intouchées. Pour les types à
    // échéancier complet (INSTALLMENT, ONE_OFF, UPCOMING), tout l'échéancier
    // PENDING non rapproché est reconstruit (dates fixes depuis startDate).
    // Pour le mensuel (design D4), la borne est le début du MOIS courant :
    // le mois d'ancrage est toujours régénéré, sinon éditer le jour
    // recréerait l'échéance passée du mois courant en doublon.
    const from = startOfDay(new Date());
    const deleteWhere: Prisma.PaymentWhereInput = {
      chargeId: id,
      status: 'PENDING',
      transactionId: null,
      ...(effectiveType === 'FIXED_RECURRING' || effectiveType === 'TEMPORARY'
        ? {
            dueDate:
              effectiveFrequency === 'monthly'
                ? { gte: startOfMonth(from) }
                : { gte: from },
          }
        : {}),
    };

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.charge.update({
        where: { id },
        data: this.toPrisma(input, subcategory),
      });
      await tx.payment.deleteMany({ where: deleteWhere });
      await this.generateAndStorePayments(tx, updated, from);
      return updated;
    });
    return this.toCharge(row);
  }

  /**
   * Vrai si l'édition touche le calendrier (montant, fréquence, dates, N,
   * jour de prélèvement).
   */
  private touchesSchedule(input: UpdateChargeInput): boolean {
    const scheduleFields: Array<keyof UpdateChargeInput> = [
      'type',
      'amount',
      'currency',
      'frequency',
      'startDate',
      'endDate',
      'installments',
      'dueDay',
    ];
    return scheduleFields.some((field) => input[field] !== undefined);
  }

  /**
   * Génère et persiste les échéances d'une charge dans la transaction
   * courante. Ne fait rien pour une charge sans échéance à générer.
   */
  private async generateAndStorePayments(
    tx: Prisma.TransactionClient,
    chargeRow: Prisma.ChargeGetPayload<object>,
    from: Date
  ): Promise<void> {
    const payments = generatePayments(this.toCharge(chargeRow), from);
    if (payments.length === 0) return;
    await tx.payment.createMany({
      data: payments.map((payment) => ({
        ...payment,
        dueDate: parseISO(payment.dueDate),
      })),
    });
  }

  async remove(id: string): Promise<void> {
    const existing = await prisma.charge.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Charge', id);
    await prisma.charge.delete({ where: { id } });
  }

  /**
   * Sub-category to write for a patch, or undefined when the patch touches
   * neither category nor sub-category. Throws 422 on a foreign value.
   */
  private resolveSubcategory(
    existing: Prisma.ChargeGetPayload<object>,
    input: UpdateChargeInput
  ): string | null | undefined {
    if (input.category === undefined && input.subcategory === undefined) {
      return undefined;
    }
    const resolved = resolveChargeSubcategory(
      {
        category: existing.category,
        subcategory: existing.subcategory ?? null,
      },
      input
    );
    const issue = checkChargeSubcategory(
      input.category ?? existing.category,
      resolved ?? null
    );
    if (issue) throw new HttpError(422, { message: issue });
    return resolved ?? null;
  }

  /** 422 on a common charge with an owner, or an unknown owner member. */
  private async assertOwner(
    memberId: string | null,
    shared: boolean
  ): Promise<void> {
    if (shared && memberId) {
      throw new HttpError(422, {
        message: 'A common charge cannot have an owner member',
      });
    }
    if (!memberId) return;
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      throw new HttpError(422, { message: `Unknown member: ${memberId}` });
    }
  }

  private toPrisma(
    input: CreateChargeInput | UpdateChargeInput,
    subcategory?: string | null
  ): Prisma.ChargeUncheckedUpdateInput {
    const data: Prisma.ChargeUncheckedUpdateInput = {};
    if (input.label !== undefined) data.label = input.label;
    if (input.type !== undefined) data.type = input.type;
    if (input.amount !== undefined) data.amount = input.amount;
    if (input.currency !== undefined) data.currency = input.currency;
    if (input.category !== undefined) data.category = input.category;
    if (input.startDate !== undefined)
      data.startDate = parseISO(input.startDate);
    if (input.endDate !== undefined)
      data.endDate = input.endDate ? parseISO(input.endDate) : null;
    if (input.frequency !== undefined) data.frequency = input.frequency;
    if (input.installments !== undefined)
      data.installments = input.installments;
    if (input.dueDay !== undefined) data.dueDay = input.dueDay;
    if (input.provisioned !== undefined) data.provisioned = input.provisioned;
    if (input.accountId !== undefined) data.accountId = input.accountId;
    if (input.memberId !== undefined) data.memberId = input.memberId;
    if (input.shared !== undefined) data.shared = input.shared;
    if (subcategory !== undefined) data.subcategory = subcategory;
    return data;
  }

  private toCharge(row: Prisma.ChargeGetPayload<object>): Charge {
    return {
      ...row,
      type: row.type as Charge['type'],
      currency: row.currency as Charge['currency'],
      startDate: row.startDate.toISOString(),
      endDate: row.endDate?.toISOString() ?? null,
      frequency: row.frequency as Charge['frequency'],
      installments: row.installments,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

const globalForChargeService = globalThis as { chargeService?: ChargeService };
export const chargeService =
  globalForChargeService.chargeService ?? new ChargeService();

if (process.env.NODE_ENV !== 'production') {
  globalForChargeService.chargeService = chargeService;
}
