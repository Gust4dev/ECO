import { z } from "zod";

export const cuidSchema = z.string().cuid();

export const centavosSchema = z.number().int().min(0);

export const percentualSchema = z.number().min(0).max(100);

export const dateSchema = z.coerce.date();

export const competenceSchema = z.string().regex(/^\d{4}-\d{2}$/, {
  message: "Formato inválido. Use YYYY-MM",
});

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).refine((data) => data.startDate <= data.endDate, {
  message: "Data inicial deve ser menor ou igual à data final",
});

export type Pagination = z.infer<typeof paginationSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;