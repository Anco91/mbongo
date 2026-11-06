import { prisma } from '@/server/db';
import { NotFoundError } from '@/server/common/http';
import { chargeQueryToWhere } from '@/server/common/filter-to-where';
import {
  Charge,
  ChargeQuery,
  CreateChargeInput,
  UpdateChargeInput,
} from '@mbongo/shared';
import { Prisma } from '@prisma/client';
import { parseISO } from 'date-fns';

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
    const row = await prisma.charge.create({
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
    return this.toCharge(row);
  }

  async update(id: string, input: UpdateChargeInput): Promise<Charge> {
    const existing = await prisma.charge.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Charge', id);
    const row = await prisma.charge.update({
      where: { id },
      data: this.toPrisma(input),
    });
    return this.toCharge(row);
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
