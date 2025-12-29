import { z } from "zod";
import { cuidSchema, centavosSchema, dateSchema } from "./common";

export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);

export const transactionStatusSchema = z.enum(["PENDING", "CONFIRMED", "CANCELLED"]);

export const createTransactionSchema = z.object({
  description: z.string().min(1).max(255),
  amountCents: centavosSchema.positive(),
  type: transactionTypeSchema,
  categoryId: cuidSchema.optional(),
  occurredAt: dateSchema,
  goalId: cuidSchema.optional(),
  installments: z.number().int().min(1).max(72).optional(),
});

export const updateTransactionSchema = z.object({
  id: cuidSchema,
  description: z.string().min(1).max(255).optional(),
  amountCents: centavosSchema.positive().optional(),
  categoryId: cuidSchema.nullable().optional(),
  goalId: cuidSchema.nullable().optional(),
});

export const cancelTransactionSchema = z.object({
  id: cuidSchema,
  reason: z.string().min(1).max(500),
  cancelEntireGroup: z.boolean().default(false),
});

export const listTransactionsSchema = z.object({
  competence: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: transactionTypeSchema.optional(),
  status: transactionStatusSchema.optional(),
  categoryId: cuidSchema.optional(),
  goalId: cuidSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
export type CancelTransaction = z.infer<typeof cancelTransactionSchema>;
export type ListTransactions = z.infer<typeof listTransactionsSchema>;