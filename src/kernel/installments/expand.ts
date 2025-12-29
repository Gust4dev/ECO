import { randomUUID } from "crypto";
import { addMonths, setDate, endOfMonth, startOfMonth } from "date-fns";
import { toLocalDate, getCompetenceFromDate } from "@/lib/dates";
import type { InstallmentInput, ExpandedInstallment } from "../types";

export function expandInstallments(input: InstallmentInput): ExpandedInstallment[] {
  const {
    description,
    totalAmountCents,
    installments,
    startDate,
    categoryId,
    goalId,
    dayOfMonth,
  } = input;

  if (installments < 1 || installments > 72) {
    throw new Error("Número de parcelas deve ser entre 1 e 72");
  }

  if (totalAmountCents <= 0) {
    throw new Error("Valor total deve ser maior que zero");
  }

  const installmentGroupId = randomUUID();
  const baseAmount = Math.floor(totalAmountCents / installments);
  const remainder = totalAmountCents - baseAmount * installments;
  
  const localStartDate = toLocalDate(startDate);
  const targetDay = dayOfMonth ?? localStartDate.getDate();

  const expanded: ExpandedInstallment[] = [];

  for (let i = 0; i < installments; i++) {
    const amountCents = i === 0 ? baseAmount + remainder : baseAmount;

    let occurredAt = addMonths(localStartDate, i);
    const lastDayOfMonth = endOfMonth(occurredAt).getDate();
    occurredAt = setDate(occurredAt, Math.min(targetDay, lastDayOfMonth));

    const competenceAt = getCompetenceFromDate(occurredAt);

    expanded.push({
      description: `${description} (${i + 1}/${installments})`,
      amountCents,
      occurredAt,
      competenceAt,
      installmentGroupId,
      installmentNumber: i + 1,
      installmentTotal: installments,
      categoryId,
      goalId,
    });
  }

  return expanded;
}

export function calculateInstallmentAmount(
  totalCents: number,
  installments: number
): { baseAmount: number; firstAmount: number } {
  const baseAmount = Math.floor(totalCents / installments);
  const remainder = totalCents - baseAmount * installments;
  return {
    baseAmount,
    firstAmount: baseAmount + remainder,
  };
}

export function recalculateRemainingInstallments(
  originalTotal: number,
  paidAmount: number,
  remainingCount: number
): number {
  const remaining = originalTotal - paidAmount;
  if (remaining <= 0 || remainingCount <= 0) return 0;
  return Math.ceil(remaining / remainingCount);
}