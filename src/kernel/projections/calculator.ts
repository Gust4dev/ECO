import { addMonths, startOfMonth, format } from "date-fns";
import type { MonthProjection, GoalAllocation } from "../types";

interface ProjectionInput {
  monthsAhead: number;
  startingBalance: number;
  averageIncome: number;
  pendingExpenses: Array<{
    amountCents: number;
    competenceAt: Date;
  }>;
  goals: Array<{
    id: string;
    name: string;
    targetCents: number;
    currentCents: number;
    monthlyAllocation: number | null;
    priority: number;
  }>;
}

export function calculateProjection(input: ProjectionInput): MonthProjection[] {
  const { monthsAhead, startingBalance, averageIncome, pendingExpenses, goals } = input;

  const projections: MonthProjection[] = [];
  let cumulativeBalance = startingBalance;
  const goalProgress = new Map<string, number>(
    goals.map((g) => [g.id, g.currentCents])
  );

  for (let i = 0; i < monthsAhead; i++) {
    const monthDate = startOfMonth(addMonths(new Date(), i));
    const competence = format(monthDate, "yyyy-MM");

    const monthExpenses = pendingExpenses
      .filter((e) => format(e.competenceAt, "yyyy-MM") === competence)
      .reduce((sum, e) => sum + e.amountCents, 0);

    const incomeTotal = averageIncome;
    const expenseTotal = monthExpenses;
    const balance = incomeTotal - expenseTotal;

    cumulativeBalance += balance;

    const goalAllocations = calculateGoalAllocations(
      goals,
      goalProgress,
      Math.max(0, cumulativeBalance)
    );

    projections.push({
      competence,
      month: monthDate,
      incomeTotal,
      expenseTotal,
      balance,
      cumulativeBalance,
      pendingInstallments: pendingExpenses.filter(
        (e) => format(e.competenceAt, "yyyy-MM") === competence
      ).length,
      goalAllocations,
    });
  }

  return projections;
}

function calculateGoalAllocations(
  goals: ProjectionInput["goals"],
  progressMap: Map<string, number>,
  availableBalance: number
): GoalAllocation[] {
  let remaining = availableBalance;

  return goals
    .sort((a, b) => a.priority - b.priority)
    .map((goal) => {
      const currentCents = progressMap.get(goal.id) ?? goal.currentCents;
      const allocation = goal.monthlyAllocation ?? 0;
      const allocatedCents = Math.min(allocation, remaining);

      remaining -= allocatedCents;
      progressMap.set(goal.id, currentCents + allocatedCents);

      const newCurrent = currentCents + allocatedCents;
      const percentComplete = Math.round((newCurrent / goal.targetCents) * 100);

      let estimatedDate: Date | null = null;
      if (allocation > 0 && newCurrent < goal.targetCents) {
        const monthsRemaining = Math.ceil((goal.targetCents - newCurrent) / allocation);
        estimatedDate = addMonths(new Date(), monthsRemaining);
      } else if (newCurrent >= goal.targetCents) {
        estimatedDate = new Date();
      }

      return {
        goalId: goal.id,
        goalName: goal.name,
        allocatedCents,
        targetCents: goal.targetCents,
        currentCents: newCurrent,
        percentComplete: Math.min(100, percentComplete),
        estimatedDate,
      };
    });
}