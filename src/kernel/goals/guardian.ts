import type { GoalAlert } from "../types";
import { differenceInMonths } from "date-fns";

interface Goal {
  id: string;
  name: string;
  targetCents: number;
  currentCents: number;
  targetDate: Date | null;
  estimatedDate: Date | null;
  monthlyAllocation: number | null;
}

interface GuardianInput {
  goals: Goal[];
  availableBalance: number;
}

export function analyzeGoalHealth(goals: Goal[]): GoalAlert[] {
  const alerts: GoalAlert[] = [];

  for (const goal of goals) {
    const alert = evaluateGoal(goal);
    if (alert) {
      alerts.push(alert);
    }
  }

  return alerts.sort((a, b) => {
    const priority = { BEHIND: 0, AT_RISK: 1, ON_TRACK: 2 };
    return priority[a.type] - priority[b.type];
  });
}

function evaluateGoal(goal: Goal): GoalAlert | null {
  if (!goal.targetDate && !goal.estimatedDate) {
    return null;
  }

  const now = new Date();
  const targetDate = goal.targetDate;
  const estimatedDate = goal.estimatedDate;

  if (!targetDate) {
    return {
      type: "ON_TRACK",
      goalId: goal.id,
      goalName: goal.name,
      message: `Sem data alvo definida. Previsão: ${estimatedDate?.toLocaleDateString("pt-BR")}`,
      originalDate: null,
      estimatedDate,
      monthsDelayed: 0,
    };
  }

  if (!estimatedDate) {
    return {
      type: "AT_RISK",
      goalId: goal.id,
      goalName: goal.name,
      message: "Sem alocação mensal definida. Impossível calcular previsão.",
      originalDate: targetDate,
      estimatedDate: null,
      monthsDelayed: 0,
    };
  }

  const monthsDelayed = differenceInMonths(estimatedDate, targetDate);

  if (monthsDelayed <= 0) {
    return {
      type: "ON_TRACK",
      goalId: goal.id,
      goalName: goal.name,
      message: "Meta no caminho certo para ser alcançada no prazo.",
      originalDate: targetDate,
      estimatedDate,
      monthsDelayed: 0,
    };
  }

  if (monthsDelayed <= 2) {
    return {
      type: "AT_RISK",
      goalId: goal.id,
      goalName: goal.name,
      message: `Meta com ${monthsDelayed} mês(es) de atraso previsto. Considere aumentar a alocação mensal.`,
      originalDate: targetDate,
      estimatedDate,
      monthsDelayed,
    };
  }

  return {
    type: "BEHIND",
    goalId: goal.id,
    goalName: goal.name,
    message: `Meta atrasada em ${monthsDelayed} meses. Ação urgente necessária.`,
    originalDate: targetDate,
    estimatedDate,
    monthsDelayed,
  };
}

export function checkGoalConflicts(input: GuardianInput): string[] {
  const { goals, availableBalance } = input;
  const warnings: string[] = [];

  const totalMonthlyAllocation = goals.reduce(
    (sum, g) => sum + (g.monthlyAllocation ?? 0),
    0
  );

  if (totalMonthlyAllocation > availableBalance) {
    const deficit = totalMonthlyAllocation - availableBalance;
    warnings.push(
      `Alocação mensal total (${formatCents(totalMonthlyAllocation)}) excede o saldo disponível (${formatCents(availableBalance)}) em ${formatCents(deficit)}.`
    );
  }

  const sortedGoals = [...goals].sort((a, b) => {
    if (!a.targetDate) return 1;
    if (!b.targetDate) return -1;
    return a.targetDate.getTime() - b.targetDate.getTime();
  });

  for (let i = 0; i < sortedGoals.length - 1; i++) {
    const current = sortedGoals[i];
    const next = sortedGoals[i + 1];

    if (current.estimatedDate && next.targetDate) {
      if (current.estimatedDate > next.targetDate) {
        warnings.push(
          `A meta "${current.name}" pode atrasar a meta "${next.name}".`
        );
      }
    }
  }

  return warnings;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}