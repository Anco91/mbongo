import { prisma } from '@/server/db';
import { NotFoundError, HttpError } from '@/server/common/http';
import { chargeQueryToWhere } from '@/server/common/filter-to-where';
import {
  Charge,
  ChargeQuery,
  CreateChargeInput,
  UpdateChargeInput,
  generatePayments,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO, startOfDay } from 'date-fns';

export class ChargeService {
  async findMany(query: ChargeQuery): Promise<Charge[]> {
    const rows = await prisma.charge.findMany({
      where: chargeQueryToWhere(query),
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
          startDate: parseISO(input.startDate),
          endDate: input.endDate ? parseISO(input.endDate) : null,
          frequency: input.frequency,
          installments: input.installments,
          provisioned: input.provisioned ?? false,
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

    if (!this.touchesSchedule(input)) {
      const row = await prisma.charge.update({
        where: { id },
        data: this.toPrisma(input),
      });
      return this.toCharge(row);
    }

    // M2 (design D6) : édition du calendrier — les échéances futures
    // PENDING sans rapprochement sont remplacées ; les échéances payées ou
    // rapprochées restent STRICTEMENT intouchées. Pour les types à
    // échéancier complet (INSTALLMENT, ONE_OFF, UPCOMING), tout l'échéancier
    // PENDING non rapproché est reconstruit (dates fixes depuis startDate).
    const effectiveType = input.type ?? existing.type;
    const from = startOfDay(new Date());
    const deleteWhere: Prisma.PaymentWhereInput = {
      chargeId: id,
      status: 'PENDING',
      transactionId: null,
      ...(effectiveType === 'FIXED_RECURRING' || effectiveType === 'TEMPORARY'
        ? { dueDate: { gte: from } }
        : {}),
    };

    const row = await prisma.$transaction(async (tx) => {
      const updated = await tx.charge.update({
        where: { id },
        data: this.toPrisma(input),
      });
      await tx.payment.deleteMany({ where: deleteWhere });
      await this.generateAndStorePayments(tx, updated, from);
      return updated;
    });
    return this.toCharge(row);
  }

  /** Vrai si l'édition touche le calendrier (montant, fréquence, dates, N). */
  private touchesSchedule(input: UpdateChargeInput): boolean {
    const scheduleFields: Array<keyof UpdateChargeInput> = [
      'type',
      'amount',
      'currency',
      'frequency',
      'startDate',
      'endDate',
      'installments',
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

  private toPrisma(
    input: CreateChargeInput | UpdateChargeInput
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
    if (input.provisioned !== undefined) data.provisioned = input.provisioned;
    if (input.accountId !== undefined) data.accountId = input.accountId;
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
