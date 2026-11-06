/**
 * Charge Service
 *
 * NestJS-shaped service: one class per domain, instantiated once.
 * Contains CRUD operations and business logic for charges.
 *
 * @module Server/Charges/Service
 */

import { prisma } from '@/server/db';
import {
  ChargeQuery,
  CreateChargeInput,
  UpdateChargeInput,
  Charge as SharedCharge,
  ScheduledPayment as SharedScheduledPayment,
  Charge,
  generateScheduledPayments,
} from '@mbongo/shared';
import { queryToWhere } from '@/server/common/filter-to-where';
import { HttpError, NotFoundError } from '@/server/common/http';
import { Prisma } from '@prisma/client';

/**
 * Charge Service
 *
 * Provides CRUD operations and business logic for charges.
 * This is the NestJS-like service layer that handles:
 * - CRUD operations (findMany, findOne, create, update, remove)
 * - Business logic (charge creation with scheduled payments)
 * - Data transformation (Prisma model → Shared domain shape)
 *
 * @example
 * ```typescript
 * const service = new ChargeService();
 *
 * // Find all charges
 * const charges = await service.findMany({});
 *
 * // Create a charge with scheduled payments
 * const charge = await service.create({ label: 'Loyer', amount: 1000, ... });
 * ```
 */
export class ChargeService {
  /**
   * Find many charges with optional filtering and pagination
   *
   * ~90% of the backend: parameterized reads. No bespoke finders.
   *
   * @param query - Query parameters with filters, pagination, and sorting
   * @returns Array of charges with their scheduled payments
   *
   * @example
   * ```typescript
   * const charges = await service.findMany({
   *   type: { eq: 'FIXED_RECURRING' },
   *   limit: 50,
   * });
   * ```
   */
  async findMany(query: ChargeQuery): Promise<Charge[]> {
    const where = queryToWhere(query);

    return prisma.charge.findMany({
      where: where as Prisma.ChargeWhereInput,
      orderBy: { startDate: 'desc' },
      take: query.limit,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      include: {
        payments: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });
  }

  /**
   * Find a single charge by ID
   *
   * @param id - Charge ID (UUID)
   * @returns Charge with its scheduled payments
   * @throws NotFoundError if charge is not found
   */
  async findOne(id: string): Promise<Charge> {
    const charge = await prisma.charge.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!charge) {
      throw new NotFoundError('Charge', id);
    }

    return charge;
  }

  /**
   * Create a new charge with scheduled payments
   *
   * The ~10%: transactional business operation.
   * Charge + scheduled payments, atomically.
   *
   * @param input - Charge creation input
   * @returns Created charge with its scheduled payments
   *
   * @example
   * ```typescript
   * const charge = await service.create({
   *   label: 'Loyer',
   *   type: 'FIXED_RECURRING',
   *   amount: 1000,
   *   currency: 'CHF',
   *   accountId: 'abc123',
   *   startDate: '2024-01-01',
   *   frequency: 'monthly',
   * });
   * ```
   */
  async create(input: CreateChargeInput): Promise<Charge> {
    // Validate that we can create scheduled payments
    this.validateChargeInput(input);

    // Transform input to Prisma create data
    const createData = this.transformToPrisma(input);

    // Create charge and scheduled payments in a transaction
    return prisma.$transaction(async (tx) => {
      const charge = await tx.charge.create({
        data: createData,
      });

      // Generate scheduled payments
      const domainCharge = this.toDomain(charge);
      const scheduledPayments = generateScheduledPayments(
        domainCharge,
        new Date()
      );

      // Create scheduled payments in the database
      if (scheduledPayments.length > 0) {
        await tx.scheduledPayment.createMany({
          data: scheduledPayments.map((p) => ({
            id: p.id,
            chargeId: charge.id,
            amount: p.amount,
            currency: p.currency,
            dueDate: new Date(p.dueDate),
            status: p.status,
            paidAt: p.paidAt ? new Date(p.paidAt) : null,
          })),
        });
      }

      // Return the charge with its payments
      return tx.charge.findUnique({
        where: { id: charge.id },
        include: { payments: true },
      })!;
    });
  }

  /**
   * Update an existing charge
   *
   * @param id - Charge ID to update
   * @param input - Update data (partial)
   * @returns Updated charge
   * @throws NotFoundError if charge is not found
   */
  async update(id: string, input: UpdateChargeInput): Promise<Charge> {
    // Check if charge exists
    const existing = await prisma.charge.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Charge', id);
    }

    // Transform update input to Prisma update data
    const updateData = this.transformToPrisma(input);

    return prisma.charge.update({
      where: { id },
      data: updateData,
      include: { payments: true },
    });
  }

  /**
   * Remove a charge and its scheduled payments
   *
   * @param id - Charge ID to delete
   * @throws NotFoundError if charge is not found
   */
  async remove(id: string): Promise<void> {
    // Check if charge exists
    const existing = await prisma.charge.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Charge', id);
    }

    await prisma.charge.delete({ where: { id } });
  }

  /**
   * Regenerate scheduled payments for a charge
   *
   * Useful when charge properties change (e.g., frequency, amount, dates)
   * This will delete existing payments and create new ones.
   *
   * @param chargeId - Charge ID to regenerate payments for
   * @returns Updated charge with new scheduled payments
   * @throws NotFoundError if charge is not found
   */
  async regeneratePayments(chargeId: string): Promise<Charge> {
    // Find the charge
    const charge = await prisma.charge.findUnique({
      where: { id: chargeId },
      include: { payments: true },
    });

    if (!charge) {
      throw new NotFoundError('Charge', chargeId);
    }

    // Delete existing payments
    await prisma.scheduledPayment.deleteMany({
      where: { chargeId },
    });

    // Generate new payments
    const domainCharge = this.toDomain(charge);
    const scheduledPayments = generateScheduledPayments(
      domainCharge,
      new Date()
    );

    // Create new payments
    if (scheduledPayments.length > 0) {
      await prisma.scheduledPayment.createMany({
        data: scheduledPayments.map((p) => ({
          id: p.id,
          chargeId: charge.id,
          amount: p.amount,
          currency: p.currency,
          dueDate: new Date(p.dueDate),
          status: p.status,
          paidAt: p.paidAt ? new Date(p.paidAt) : null,
        })),
      });
    }

    // Return updated charge with new payments
    return prisma.charge.findUnique({
      where: { id: chargeId },
      include: { payments: true },
    })!;
  }

  /**
   * Get scheduled payments for a charge
   *
   * @param chargeId - Charge ID
   * @returns Array of scheduled payments
   * @throws NotFoundError if charge is not found
   */
  async getPayments(chargeId: string): Promise<SharedScheduledPayment[]> {
    const charge = await prisma.charge.findUnique({
      where: { id: chargeId },
      include: { payments: true },
    });

    if (!charge) {
      throw new NotFoundError('Charge', chargeId);
    }

    return charge.payments.map(this.toSharedScheduledPayment);
  }

  /**
   * Get overdue payments for a charge
   *
   * @param chargeId - Charge ID
   * @returns Array of overdue payments
   */
  async getOverduePayments(
    chargeId: string
  ): Promise<SharedScheduledPayment[]> {
    const payments = await this.getPayments(chargeId);
    const now = new Date();

    return payments.filter((p) => {
      const dueDate = new Date(p.dueDate);
      return p.status === 'PENDING' && dueDate < now;
    });
  }

  /**
   * Get next payment for a charge
   *
   * @param chargeId - Charge ID
   * @returns Next scheduled payment or null
   */
  async getNextPayment(
    chargeId: string
  ): Promise<SharedScheduledPayment | null> {
    const payments = await this.getPayments(chargeId);
    const now = new Date();

    const pending = payments.filter((p) => p.status === 'PENDING');
    const sorted = pending.sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });

    for (const payment of sorted) {
      const dueDate = new Date(payment.dueDate);
      if (dueDate >= now) {
        return payment;
      }
    }

    return null;
  }

  /**
   * Mark a payment as paid
   *
   * @param paymentId - Payment ID to mark as paid
   * @returns Updated payment
   * @throws NotFoundError if payment is not found
   */
  async markPaymentAsPaid(paymentId: string): Promise<SharedScheduledPayment> {
    const payment = await prisma.scheduledPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('ScheduledPayment', paymentId);
    }

    const updated = await prisma.scheduledPayment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return this.toSharedScheduledPayment(updated);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Validate charge input before creation
   */
  private validateChargeInput(
    input: CreateChargeInput | UpdateChargeInput
  ): void {
    // FIXED_RECURRING and TEMPORARY require frequency
    if (input.type === 'FIXED_RECURRING' && !input.frequency) {
      throw new HttpError(
        400,
        { message: 'FIXED_RECURRING charges require a frequency' },
        'VALIDATION_ERROR'
      );
    }

    if (input.type === 'TEMPORARY') {
      if (!input.frequency) {
        throw new HttpError(
          400,
          { message: 'TEMPORARY charges require a frequency' },
          'VALIDATION_ERROR'
        );
      }
      if (!input.endDate) {
        throw new HttpError(
          400,
          { message: 'TEMPORARY charges require an endDate' },
          'VALIDATION_ERROR'
        );
      }
    }

    // INSTALLMENT requires installments
    if (input.type === 'INSTALLMENT' && !input.installments) {
      throw new HttpError(
        400,
        { message: 'INSTALLMENT charges require an installment count' },
        'VALIDATION_ERROR'
      );
    }
  }

  /**
   * Transform shared charge input to Prisma create/update data
   */
  private transformToPrisma(
    input: CreateChargeInput | UpdateChargeInput | Partial<Charge>
  ): Partial<Prisma.ChargeCreateInput> | Partial<Prisma.ChargeUpdateInput> {
    const result: Record<string, unknown> = {};

    if ('label' in input && input.label !== undefined)
      result.label = input.label;
    if ('type' in input && input.type !== undefined) result.type = input.type;
    if ('amount' in input && input.amount !== undefined)
      result.amount = input.amount;
    if ('currency' in input && input.currency !== undefined)
      result.currency = input.currency;
    if ('category' in input && input.category !== undefined)
      result.category = input.category;
    if ('startDate' in input && input.startDate !== undefined)
      result.startDate = new Date(input.startDate as string);
    if ('endDate' in input && input.endDate !== undefined)
      result.endDate = input.endDate ? new Date(input.endDate as string) : null;
    if ('frequency' in input && input.frequency !== undefined)
      result.frequency = input.frequency;
    if ('installments' in input && input.installments !== undefined)
      result.installments = input.installments;
    if ('provisioned' in input && input.provisioned !== undefined)
      result.provisioned = input.provisioned;
    if ('accountId' in input && input.accountId !== undefined)
      result.accountId = input.accountId;

    return result;
  }

  /**
   * Convert Prisma Charge model to Shared Charge domain shape
   */
  private toDomain(
    charge: Prisma.ChargeGetPayload<{
      include: { payments: true };
    }>
  ): SharedCharge {
    return {
      id: charge.id,
      label: charge.label,
      type: charge.type as SharedCharge['type'],
      amount: charge.amount,
      currency: charge.currency as SharedCharge['currency'],
      accountId: charge.accountId,
      category: charge.category,
      startDate: charge.startDate.toISOString(),
      endDate: charge.endDate?.toISOString() ?? null,
      frequency: charge.frequency as SharedCharge['frequency'] | null,
      installments: charge.installments ?? null,
      provisioned: charge.provisioned,
      createdAt: charge.createdAt.toISOString(),
      updatedAt: charge.updatedAt.toISOString(),
    };
  }

  /**
   * Convert Prisma ScheduledPayment model to Shared ScheduledPayment domain shape
   */
  private toSharedScheduledPayment(
    payment: Prisma.ScheduledPaymentGetPayload<{}>
  ): SharedScheduledPayment {
    return {
      id: payment.id,
      chargeId: payment.chargeId,
      amount: payment.amount,
      currency: payment.currency as SharedScheduledPayment['currency'],
      dueDate: payment.dueDate.toISOString(),
      status: payment.status as SharedScheduledPayment['status'],
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

const globalForChargeService = globalThis as unknown as {
  chargeService?: ChargeService;
};

/**
 * Singleton instance of ChargeService
 *
 * Usage:
 * ```typescript
 * import { chargeService } from '@/server/charges/charge.service';
 *
 * const charges = await chargeService.findMany({});
 * ```
 */
export const chargeService =
  globalForChargeService.chargeService ?? new ChargeService();

// Cache the instance in development for HMR
if (process.env.NODE_ENV !== 'production') {
  globalForChargeService.chargeService = chargeService;
}
