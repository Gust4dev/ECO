import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import {
  createTransactionSchema,
  updateTransactionSchema,
  cancelTransactionSchema,
  listTransactionsSchema,
} from "@/lib/validators/transaction";
import { expandInstallments } from "@/kernel/installments/expand";
import { startOfMonth, endOfMonth } from "date-fns";

export const transactionsRouter = router({
  list: protectedProcedure
    .input(listTransactionsSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {
        userId: ctx.userId,
        status: input.status ?? { not: "CANCELLED" },
      };

      if (input.competence) {
        const [year, month] = input.competence.split("-").map(Number);
        const date = new Date(year, month - 1, 1);
        where.competenceAt = {
          gte: startOfMonth(date),
          lte: endOfMonth(date),
        };
      }

      if (input.type) where.type = input.type;
      if (input.categoryId) where.categoryId = input.categoryId;
      if (input.goalId) where.goalId = input.goalId;

      const [transactions, total] = await Promise.all([
        ctx.prisma.transaction.findMany({
          where,
          include: { category: true, goal: true },
          orderBy: { occurredAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.transaction.count({ where }),
      ]);

      return {
        transactions,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  create: protectedProcedure
    .input(createTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.installments && input.installments > 1) {
        const expanded = expandInstallments({
          description: input.description,
          totalAmountCents: input.amountCents,
          installments: input.installments,
          startDate: input.occurredAt,
          categoryId: input.categoryId,
          goalId: input.goalId,
        });

        const transactions = await ctx.prisma.transaction.createMany({
          data: expanded.map((t) => ({
            userId: ctx.userId,
            description: t.description,
            amountCents: t.amountCents,
            type: input.type,
            status: "PENDING",
            occurredAt: t.occurredAt,
            competenceAt: t.competenceAt,
            isInstallment: true,
            installmentGroupId: t.installmentGroupId,
            installmentNumber: t.installmentNumber,
            installmentTotal: t.installmentTotal,
            categoryId: t.categoryId,
            goalId: t.goalId,
          })),
        });

        return { count: transactions.count, installmentGroupId: expanded[0].installmentGroupId };
      }

      const transaction = await ctx.prisma.transaction.create({
        data: {
          userId: ctx.userId,
          description: input.description,
          amountCents: input.amountCents,
          type: input.type,
          status: "CONFIRMED",
          occurredAt: input.occurredAt,
          competenceAt: startOfMonth(input.occurredAt),
          categoryId: input.categoryId,
          goalId: input.goalId,
        },
        include: { category: true, goal: true },
      });

      return transaction;
    }),

  update: protectedProcedure
    .input(updateTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.transaction.findFirst({
        where: { id, userId: ctx.userId },
      });

      if (!existing) {
        throw new Error("Transação não encontrada");
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          entityType: "transaction",
          entityId: id,
          action: "UPDATE",
          previousData: existing as any,
          newData: data as any,
        },
      });

      return ctx.prisma.transaction.update({
        where: { id },
        data,
        include: { category: true, goal: true },
      });
    }),

  cancel: protectedProcedure
    .input(cancelTransactionSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.transaction.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!existing) {
        throw new Error("Transação não encontrada");
      }

      if (input.cancelEntireGroup && existing.installmentGroupId) {
        await ctx.prisma.transaction.updateMany({
          where: {
            installmentGroupId: existing.installmentGroupId,
            userId: ctx.userId,
          },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelReason: input.reason,
          },
        });

        return { cancelledCount: existing.installmentTotal ?? 1 };
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          entityType: "transaction",
          entityId: input.id,
          action: "CANCEL",
          previousData: existing as any,
        },
      });

      return ctx.prisma.transaction.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: input.reason,
        },
      });
    }),

  getByGroup: protectedProcedure
    .input(z.object({ groupId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.transaction.findMany({
        where: {
          installmentGroupId: input.groupId,
          userId: ctx.userId,
        },
        orderBy: { installmentNumber: "asc" },
        include: { category: true },
      });
    }),
});