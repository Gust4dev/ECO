import { addMonths, startOfMonth } from "date-fns";

interface EstimatorInput {
  targetCents: number;
  currentCents: number;
  monthlyAllocation: number;
}

export function estimateGoalCompletion(input: EstimatorInput): Date | null {
  const { targetCents, currentCents, monthlyAllocation } = input;

  if (monthlyAllocation <= 0) return null;
  if (currentCents >= targetCents) return new Date();

  const remaining = targetCents - currentCents;
  const monthsNeeded = Math.ceil(remaining / monthlyAllocation);

  return startOfMonth(addMonths(new Date(), monthsNeeded));
}

export function calculateMonthlyAllocationForTarget(
  targetCents: number,
  currentCents: number,
  targetDate: Date
): number {
  const now = new Date();
  if (targetDate <= now) return targetCents - currentCents;

  const remaining = targetCents - currentCents;
  if (remaining <= 0) return 0;

  const monthsDiff = Math.max(
    1,
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
      (targetDate.getMonth() - now.getMonth())
  );

  return Math.ceil(remaining / monthsDiff);
}

export function getGoalHealthStatus(
  targetDate: Date | null,
  estimatedDate: Date | null
): "ON_TRACK" | "AT_RISK" | "BEHIND" | "NO_TARGET" {
  if (!targetDate) return "NO_TARGET";
  if (!estimatedDate) return "AT_RISK";

  const targetTime = targetDate.getTime();
  const estimatedTime = estimatedDate.getTime();
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

  if (estimatedTime <= targetTime) return "ON_TRACK";
  if (estimatedTime <= targetTime + oneMonthMs) return "AT_RISK";
  return "BEHIND";
}