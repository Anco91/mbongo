import type {
  CreatePaymentInput,
  CreatePaymentsInput,
  Payment,
  PaymentQuery,
  UpdatePaymentInput,
} from '../schemas/payment';

export interface PaymentHttp {
  findMany(query?: PaymentQuery): Promise<Payment[]>;
  findOne(id: string): Promise<Payment>;
  create(input: CreatePaymentInput): Promise<Payment>;
  createMany(inputs: CreatePaymentsInput): Promise<Payment[]>;
  update(id: string, input: UpdatePaymentInput): Promise<Payment>;
  /** Rapproche l'échéance d'une transaction (M2). */
  reconcile(id: string, transactionId: string): Promise<Payment>;
  /** Dérapproche l'échéance : retour PENDING. */
  unlink(id: string): Promise<Payment>;
  remove(id: string): Promise<void>;
}
