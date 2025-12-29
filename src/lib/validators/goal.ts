import { z } from "zod";
import { cuidSchema, centavosSchema, dateSchema } from "./common";

export const goalStatusSchema = z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]);

export const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetCents: centavosSchema.positive(),
  targetDate: dateSchema.optional(),
  monthlyAllocation: centavosSchema.optional(),
  priority: z.number().int().min(1).max(10).default(5),
});

export const updateGoalSchema = z.object({
  id: cuidSchema,
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  targetCents: centavosSchema.positive().optional(),
  targetDate: dateSchema.nullable().optional(),
  monthlyAllocation: centavosSchema.nullable().optional(),
  priority: z.number().int().min(1).max(10).optional(),
  status: goalStatusSchema.optional(),
});

export const allocateToGoalSchema = z.object({
  goalId: cuidSchema,
  amountCents: centavosSchema.positive(),
});

export const listGoalsSchema = z.object({
  status: goalStatusSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
});

export type CreateGoal = z.infer<typeof createGoalSchema>;
export type UpdateGoal = z.infer<typeof updateGoalSchema>;
export type AllocateToGoal = z.infer<typeof allocateToGoalSchema>;
export type ListGoals = z.infer<typeof listGoalsSchema>;