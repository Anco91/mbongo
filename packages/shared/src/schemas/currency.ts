import { z } from 'zod';

export const currencySchema = z.enum(['CHF', 'EUR', 'USD']);
export type Currency = z.infer<typeof currencySchema>;
