import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  createGoalSchema,
  updateGoalSchema,
  allocateToGoalSchema,
  listGoalsSchema,
} from "@/lib/validators/goal";
import { estimateGoalCompletion } from "@/kernel/goals/estimator";

export const goalsRouter = router({
  list: protectedProcedure
    .input(listGoalsSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { userId: ctx.userId };
      if (input.status) where.status = input.status;

      const [goals, total] = await Promise.all([
        ctx.prisma.goal.findMany({
          where,
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.goal.count({ where }),
      ]);

      return {
        goals,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: {
          transactions: {
            where: { status: { not: "CANCELLED" } },
            orderBy: { occurredAt: "desc" },
            take: 10,
          },
        },
      });

      if (!goal) throw new Error("Meta não encontrada");
      return goal;
    }),

  create: protectedProcedure
    .input(createGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const estimatedDate = input.monthlyAllocation
        ? estimateGoalCompletion({
            targetCents: input.targetCents,
            currentCents: 0,
            monthlyAllocation: input.monthlyAllocation,
          })
        : null;

      return ctx.prisma.goal.create({
        data: {
          userId: ctx.userId,
          name: input.name,
          description: input.description,
          targetCents: input.targetCents,
          targetDate: input.targetDate,
          monthlyAllocation: input.monthlyAllocation,
          priority: input.priority,
          estimatedDate,
        },
      });
    }),

  update: protectedProcedure
    .input(updateGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.goal.findFirst({
        where: { id, userId: ctx.userId },
      });

      if (!existing) throw new Error("Meta não encontrada");

      let estimatedDate = existing.estimatedDate;
      if (data.monthlyAllocation !== undefined || data.targetCents !== undefined) {
        const targetCents = data.targetCents ?? existing.targetCents;
        const monthlyAllocation = data.monthlyAllocation ?? existing.monthlyAllocation;

        if (monthlyAllocation) {
          estimatedDate = estimateGoalCompletion({
            targetCents,
            currentCents: existing.currentCents,
            monthlyAllocation,
          });
        }
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          entityType: "goal",
          entityId: id,
          action: "UPDATE",
          previousData: existing as object,
          newData: data as object,
        },
      });

      return ctx.prisma.goal.update({
        where: { id },
        data: { ...data, estimatedDate },
      });
    }),

  allocate: protectedProcedure
    .input(allocateToGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const goal = await ctx.prisma.goal.findFirst({
        where: { id: input.goalId, userId: ctx.userId },
      });

      if (!goal) throw new Error("Meta não encontrada");
      if (goal.status !== "ACTIVE") throw new Error("Meta não está ativa");

      const newCurrentCents = goal.currentCents + input.amountCents;
      const isCompleted = newCurrentCents >= goal.targetCents;

      return ctx.prisma.goal.update({
        where: { id: input.goalId },
        data: {
          currentCents: newCurrentCents,
          status: isCompleted ? "COMPLETED" : "ACTIVE",
        },
      });
    }),
});