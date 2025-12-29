export interface InstallmentInput {
  description: string;
  totalAmountCents: number;
  installments: number;
  startDate: Date;
  categoryId?: string;
  goalId?: string;
  dayOfMonth?: number;
}

export interface ExpandedInstallment {
  description: string;
  amountCents: number;
  occurredAt: Date;
  competenceAt: Date;
  installmentGroupId: string;
  installmentNumber: number;
  installmentTotal: number;
  categoryId?: string;
  goalId?: string;
}

export interface MonthProjection {
  competence: string;
  month: Date;
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  cumulativeBalance: number;
  pendingInstallments: number;
  goalAllocations: GoalAllocation[];
}

export interface GoalAllocation {
  goalId: string;
  goalName: string;
  allocatedCents: number;
  targetCents: number;
  currentCents: number;
  percentComplete: number;
  estimatedDate: Date | null;
}

export interface ProjectionInput {
  userId: string;
  monthsAhead: number;
  startingBalance: number;
  averageIncome: number;
}

export interface BudgetAlert {
  type: "WARNING" | "EXCEEDED";
  categoryId: string;
  categoryName: string;
  budgetCents: number;
  spentCents: number;
  percentUsed: number;
  message: string;
}

export interface GoalAlert {
  type: "ON_TRACK" | "AT_RISK" | "BEHIND";
  goalId: string;
  goalName: string;
  message: string;
  originalDate: Date | null;
  estimatedDate: Date | null;
  monthsDelayed: number;
}