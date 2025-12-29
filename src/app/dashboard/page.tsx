"use client";

import { MonthSummary } from "@/components/dashboard/month-summary";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { ProjectionChart } from "@/components/dashboard/projection-chart";
import { trpc } from "@/lib/trpc-client";

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = trpc.projections.getSummary.useQuery();
  const { data: projections, isLoading: projectionsLoading } = trpc.projections.getMonthly.useQuery({
    monthsAhead: 12,
  });

  if (summaryLoading || projectionsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das suas finanças
        </p>
      </div>

      <MonthSummary
        currentBalance={summary?.currentBalance ?? 0}
        income={summary?.currentMonthIncome ?? 0}
        expenses={summary?.currentMonthExpense ?? 0}
        percentChange={summary?.percentChange ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProjectionChart projections={projections ?? []} />
        <GoalProgress goals={summary?.activeGoals ?? []} />
      </div>
    </div>
  );
}