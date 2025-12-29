import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { calculateProjection } from "@/kernel/projections/calculator";
import { startOfMonth, subMonths, addMonths } from "date-fns";
import { nowLocal } from "@/lib/dates";

export const projectionsRouter = router({
  getMonthly: protectedProcedure
    .input(
      z.object({
        monthsAhead: z.number().int().min(1).max(24).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = nowLocal();
      const threeMonthsAgo = subMonths(startOfMonth(now), 3);
      const twelveMonthsAhead = addMonths(startOfMonth(now), input.monthsAhead);

      const profile = await ctx.prisma.userProfile.findUnique({
        where: { userId: ctx.userId },
      });

      const [incomeHistory, pendingExpenses, confirmedCurrentMonth, goals] = await Promise.all([
        ctx.prisma.transaction.groupBy({
          by: ["competenceAt"],
          where: {
            userId: ctx.userId,
            type: "INCOME",
            status: "CONFIRMED",
            competenceAt: {
              gte: threeMonthsAgo,
              lt: startOfMonth(now),
            },
          },
          _sum: { amountCents: true },
        }),

        ctx.prisma.transaction.findMany({
          where: {
            userId: ctx.userId,
            type: "EXPENSE",
            status: "PENDING",
            competenceAt: {
              gte: startOfMonth(now),
              lte: twelveMonthsAhead,
            },
          },
          select: {
            amountCents: true,
            competenceAt: true,
            isInstallment: true,
          },
        }),

        ctx.prisma.transaction.aggregate({
          where: {
            userId: ctx.userId,
            type: "EXPENSE",
            status: "CONFIRMED",
            competenceAt: {
              gte: startOfMonth(now),
              lt: addMonths(startOfMonth(now), 1),
            },
          },
          _sum: { amountCents: true },
        }),

        ctx.prisma.goal.findMany({
          where: { userId: ctx.userId, status: "ACTIVE" },
          orderBy: { priority: "asc" },
        }),
      ]);

      const averageIncome =
        incomeHistory.length > 0
          ? Math.round(
              incomeHistory.reduce((sum, m) => sum + (m._sum.amountCents ?? 0), 0) /
                incomeHistory.length
            )
          : profile?.averageMonthlyIncome ?? 0;

      const currentBalance = await getCurrentBalance(ctx.prisma, ctx.userId);

      const allPendingExpenses = [
        ...pendingExpenses,
        ...(confirmedCurrentMonth._sum.amountCents
          ? [{ amountCents: confirmedCurrentMonth._sum.amountCents, competenceAt: startOfMonth(now), isInstallment: false }]
          : []),
      ];

      return calculateProjection({
        monthsAhead: input.monthsAhead,
        startingBalance: currentBalance,
        averageIncome,
        pendingExpenses: allPendingExpenses,
        goals,
      });
    }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const now = nowLocal();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = subMonths(startOfCurrentMonth, 1);

    const [currentMonthIncome, currentMonthExpense, lastMonthIncome, lastMonthExpense, activeGoals] = await Promise.all([
      ctx.prisma.transaction.aggregate({
        where: {
          userId: ctx.userId,
          type: "INCOME",
          competenceAt: { gte: startOfCurrentMonth },
          status: "CONFIRMED",
        },
        _sum: { amountCents: true },
      }),

      ctx.prisma.transaction.aggregate({
        where: {
          userId: ctx.userId,
          type: "EXPENSE",
          competenceAt: { gte: startOfCurrentMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { amountCents: true },
      }),

      ctx.prisma.transaction.aggregate({
        where: {
          userId: ctx.userId,
          type: "INCOME",
          competenceAt: { gte: startOfLastMonth, lt: startOfCurrentMonth },
          status: "CONFIRMED",
        },
        _sum: { amountCents: true },
      }),

      ctx.prisma.transaction.aggregate({
        where: {
          userId: ctx.userId,
          type: "EXPENSE",
          competenceAt: { gte: startOfLastMonth, lt: startOfCurrentMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { amountCents: true },
      }),

      ctx.prisma.goal.findMany({
        where: { userId: ctx.userId, status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          targetCents: true,
          currentCents: true,
          estimatedDate: true,
        },
      }),
    ]);

    const currentBalance = await getCurrentBalance(ctx.prisma, ctx.userId);

    const currentIncome = currentMonthIncome._sum.amountCents ?? 0;
    const currentExpense = currentMonthExpense._sum.amountCents ?? 0;
    const lastIncome = lastMonthIncome._sum.amountCents ?? 0;
    const lastExpense = lastMonthExpense._sum.amountCents ?? 0;

    const currentNet = currentIncome - currentExpense;
    const lastNet = lastIncome - lastExpense;
    const percentChange = lastNet !== 0 ? ((currentNet - lastNet) / Math.abs(lastNet)) * 100 : 0;

    return {
      currentBalance,
      currentMonthIncome: currentIncome,
      currentMonthExpense: currentExpense,
      lastMonthIncome: lastIncome,
      lastMonthExpense: lastExpense,
      percentChange: Math.round(percentChange * 10) / 10,
      activeGoals: activeGoals.map((g) => ({
        ...g,
        percentComplete: Math.round((g.currentCents / g.targetCents) * 100),
      })),
    };
  }),
});

async function getCurrentBalance(prisma: any, userId: string): Promise<number> {
  const result = await prisma.transaction.groupBy({
    by: ["type"],
    where: { 
      userId, 
      status: "CONFIRMED",
    },
    _sum: { amountCents: true },
  });

  const income = result.find((r: any) => r.type === "INCOME")?._sum.amountCents ?? 0;
  const expense = result.find((r: any) => r.type === "EXPENSE")?._sum.amountCents ?? 0;

  return income - expense;
}