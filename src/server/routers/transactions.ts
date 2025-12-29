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
import { getCompetenceFromDate } from "@/lib/dates";

const installmentUpdateSchema = z.object({
  id: z.string().cuid(),
  description: z.string().min(1).max(255).optional(),
  amountCents: z.number().int().positive().optional(),
  categoryId: z.string().cuid().nullable().optional(),
  scope: z.enum(["SINGLE", "THIS_AND_FUTURE", "ALL"]).default("SINGLE"),
});

export const transactionsRouter = router({
  list: protectedProcedure
    .input(listTransactionsSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
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

        await ctx.prisma.auditLog.create({
          data: {
            userId: ctx.userId,
            entityType: "transaction_group",
            entityId: expanded[0].installmentGroupId,
            action: "CREATE",
            newData: {
              description: input.description,
              totalAmountCents: input.amountCents,
              installments: input.installments,
            } as object,
          },
        });

        return { count: transactions.count, installmentGroupId: expanded[0].installmentGroupId };
      }

      const competenceAt = getCompetenceFromDate(input.occurredAt);

      const transaction = await ctx.prisma.transaction.create({
        data: {
          userId: ctx.userId,
          description: input.description,
          amountCents: input.amountCents,
          type: input.type,
          status: "CONFIRMED",
          occurredAt: input.occurredAt,
          competenceAt,
          categoryId: input.categoryId,
          goalId: input.goalId,
        },
        include: { category: true, goal: true },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          entityType: "transaction",
          entityId: transaction.id,
          action: "CREATE",
          newData: transaction as object,
        },
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

      if (existing.isInstallment) {
        throw new Error(
          "Use updateInstallment para editar parcelas. Escolha: SINGLE, THIS_AND_FUTURE ou ALL."
        );
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          entityType: "transaction",
          entityId: id,
          action: "UPDATE",
          previousData: existing as object,
          newData: data as object,
        },
      });

      return ctx.prisma.transaction.update({
        where: { id },
        data,
        include: { category: true, goal: true },
      });
    }),

  updateInstallment: protectedProcedure
    .input(installmentUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, scope, ...data } = input;

      const existing = await ctx.prisma.transaction.findFirst({
        where: { id, userId: ctx.userId },
      });

      if (!existing) {
        throw new Error("Transação não encontrada");
      }

      if (!existing.isInstallment || !existing.installmentGroupId) {
        throw new Error("Transação não é uma parcela");
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          entityType: "transaction",
          entityId: id,
          action: "UPDATE",
          previousData: { ...existing, updateScope: scope } as object,
          newData: data as object,
        },
      });

      if (scope === "SINGLE") {
        return ctx.prisma.transaction.update({
          where: { id },
          data,
          include: { category: true, goal: true },
        });
      }

      if (scope === "THIS_AND_FUTURE") {
        const updated = await ctx.prisma.transaction.updateMany({
          where: {
            installmentGroupId: existing.installmentGroupId,
            userId: ctx.userId,
            installmentNumber: { gte: existing.installmentNumber ?? 0 },
            status: { not: "CANCELLED" },
          },
          data,
        });

        return { updatedCount: updated.count, scope };
      }

      if (scope === "ALL") {
        const updated = await ctx.prisma.transaction.updateMany({
          where: {
            installmentGroupId: existing.installmentGroupId,
            userId: ctx.userId,
            status: { not: "CANCELLED" },
          },
          data,
        });

        return { updatedCount: updated.count, scope };
      }

      throw new Error("Scope inválido");
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
        await ctx.prisma.auditLog.create({
          data: {
            userId: ctx.userId,
            entityType: "transaction_group",
            entityId: existing.installmentGroupId,
            action: "CANCEL",
            previousData: { reason: input.reason } as object,
          },
        });

        const updated = await ctx.prisma.transaction.updateMany({
          where: {
            installmentGroupId: existing.installmentGroupId,
            userId: ctx.userId,
            status: { not: "CANCELLED" },
          },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelReason: input.reason,
          },
        });

        return { cancelledCount: updated.count };
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          entityType: "transaction",
          entityId: input.id,
          action: "CANCEL",
          previousData: existing as object,
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

  cancelFutureInstallments: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        reason: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.transaction.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!existing) {
        throw new Error("Transação não encontrada");
      }

      if (!existing.isInstallment || !existing.installmentGroupId) {
        throw new Error("Transação não é uma parcela");
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.userId,
          entityType: "transaction_group",
          entityId: existing.installmentGroupId,
          action: "CANCEL",
          previousData: {
            reason: input.reason,
            scope: "THIS_AND_FUTURE",
            fromInstallment: existing.installmentNumber,
          } as object,
        },
      });

      const updated = await ctx.prisma.transaction.updateMany({
        where: {
          installmentGroupId: existing.installmentGroupId,
          userId: ctx.userId,
          installmentNumber: { gte: existing.installmentNumber ?? 0 },
          status: { not: "CANCELLED" },
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: input.reason,
        },
      });

      return { cancelledCount: updated.count };
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

  getInstallmentInfo: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.transaction.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!transaction) {
        throw new Error("Transação não encontrada");
      }

      if (!transaction.isInstallment || !transaction.installmentGroupId) {
        return { isInstallment: false };
      }

      const allInstallments = await ctx.prisma.transaction.findMany({
        where: {
          installmentGroupId: transaction.installmentGroupId,
          userId: ctx.userId,
        },
        orderBy: { installmentNumber: "asc" },
        select: {
          id: true,
          installmentNumber: true,
          status: true,
          amountCents: true,
        },
      });

      const paidCount = allInstallments.filter((i) => i.status === "CONFIRMED").length;
      const cancelledCount = allInstallments.filter((i) => i.status === "CANCELLED").length;
      const pendingCount = allInstallments.filter((i) => i.status === "PENDING").length;
      const totalPaid = allInstallments
        .filter((i) => i.status === "CONFIRMED")
        .reduce((sum, i) => sum + i.amountCents, 0);

      return {
        isInstallment: true,
        groupId: transaction.installmentGroupId,
        currentNumber: transaction.installmentNumber,
        totalInstallments: transaction.installmentTotal,
        paidCount,
        pendingCount,
        cancelledCount,
        totalPaid,
        installments: allInstallments,
      };
    }),
});