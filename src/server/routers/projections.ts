import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { calculateProjection } from "@/kernel/projections/calculator";
import { startOfMonth, subMonths } from "date-fns";

export const projectionsRouter = router({
  getMonthly: protectedProcedure
    .input(
      z.object({
        monthsAhead: z.number().int().min(1).max(24).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const profile = await ctx.prisma.userProfile.findUnique({
        where: { userId: ctx.userId },
      });

      const sixMonthsAgo = subMonths(new Date(), 6);

      const [incomeHistory, pendingExpenses, goals] = await Promise.all([
        ctx.prisma.transaction.groupBy({
          by: ["competenceAt"],
          where: {
            userId: ctx.userId,
            type: "INCOME",
            status: "CONFIRMED",
            competenceAt: { gte: sixMonthsAgo },
          },
          _sum: { amountCents: true },
        }),
        ctx.prisma.transaction.findMany({
          where: {
            userId: ctx.userId,
            type: "EXPENSE",
            status: "PENDING",
            competenceAt: { gte: startOfMonth(new Date()) },
          },
          select: {
            amountCents: true,
            competenceAt: true,
            isInstallment: true,
          },
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

      return calculateProjection({
        monthsAhead: input.monthsAhead,
        startingBalance: currentBalance,
        averageIncome,
        pendingExpenses,
        goals,
      });
    }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const startOfLastMonth = subMonths(startOfCurrentMonth, 1);

    const [currentMonth, lastMonth, activeGoals] = await Promise.all([
      ctx.prisma.transaction.aggregate({
        where: {
          userId: ctx.userId,
          competenceAt: { gte: startOfCurrentMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { amountCents: true },
      }),
      ctx.prisma.transaction.aggregate({
        where: {
          userId: ctx.userId,
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

    return {
      currentBalance,
      currentMonthTotal: currentMonth._sum.amountCents ?? 0,
      lastMonthTotal: lastMonth._sum.amountCents ?? 0,
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
    where: { userId, status: "CONFIRMED" },
    _sum: { amountCents: true },
  });

  const income = result.find((r: any) => r.type === "INCOME")?._sum.amountCents ?? 0;
  const expense = result.find((r: any) => r.type === "EXPENSE")?._sum.amountCents ?? 0;

  return income - expense;
}