import type { BudgetAlert } from "../types";

interface CategorySpending {
  categoryId: string;
  categoryName: string;
  budgetCents: number | null;
  spentCents: number;
}

export function analyzeBudget(categories: CategorySpending[]): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  for (const category of categories) {
    if (!category.budgetCents || category.budgetCents <= 0) {
      continue;
    }

    const percentUsed = (category.spentCents / category.budgetCents) * 100;

    if (percentUsed >= 100) {
      alerts.push({
        type: "EXCEEDED",
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        budgetCents: category.budgetCents,
        spentCents: category.spentCents,
        percentUsed: Math.round(percentUsed),
        message: `Orçamento de ${category.categoryName} estourado em ${formatCents(category.spentCents - category.budgetCents)}.`,
      });
    } else if (percentUsed >= 80) {
      alerts.push({
        type: "WARNING",
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        budgetCents: category.budgetCents,
        spentCents: category.spentCents,
        percentUsed: Math.round(percentUsed),
        message: `${category.categoryName} em ${Math.round(percentUsed)}% do orçamento. Restam ${formatCents(category.budgetCents - category.spentCents)}.`,
      });
    }
  }

  return alerts.sort((a, b) => {
    if (a.type === "EXCEEDED" && b.type !== "EXCEEDED") return -1;
    if (a.type !== "EXCEEDED" && b.type === "EXCEEDED") return 1;
    return b.percentUsed - a.percentUsed;
  });
}

export function calculateRemainingBudget(
  categories: CategorySpending[]
): number {
  return categories.reduce((total, cat) => {
    if (!cat.budgetCents) return total;
    const remaining = cat.budgetCents - cat.spentCents;
    return total + Math.max(0, remaining);
  }, 0);
}

export function suggestBudgetAdjustment(
  categories: CategorySpending[],
  targetSavings: number
): Map<string, number> {
  const suggestions = new Map<string, number>();

  const overspent = categories.filter(
    (c) => c.budgetCents && c.spentCents > c.budgetCents
  );

  for (const cat of overspent) {
    if (!cat.budgetCents) continue;

    const overage = cat.spentCents - cat.budgetCents;
    const suggestedBudget = Math.ceil(cat.spentCents * 1.1);

    suggestions.set(cat.categoryId, suggestedBudget);
  }

  const underutilized = categories
    .filter((c) => c.budgetCents && c.spentCents < c.budgetCents * 0.5)
    .sort((a, b) => {
      const aUtil = a.spentCents / (a.budgetCents ?? 1);
      const bUtil = b.spentCents / (b.budgetCents ?? 1);
      return aUtil - bUtil;
    });

  let remainingSavings = targetSavings;

  for (const cat of underutilized) {
    if (remainingSavings <= 0) break;
    if (!cat.budgetCents) continue;

    const unusedBudget = cat.budgetCents - cat.spentCents;
    const reduction = Math.min(unusedBudget * 0.5, remainingSavings);
    const suggestedBudget = cat.budgetCents - reduction;

    suggestions.set(cat.categoryId, Math.round(suggestedBudget));
    remainingSavings -= reduction;
  }

  return suggestions;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}