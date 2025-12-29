"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";
import { formatMonthYear } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface MonthProjection {
  competence: string;
  month: Date;
  cumulativeBalance: number;
  incomeTotal: number;
  expenseTotal: number;
}

interface ProjectionChartProps {
  projections: MonthProjection[];
}

export function ProjectionChart({ projections }: ProjectionChartProps) {
  if (projections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Projeção 12 Meses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Adicione transações para ver sua projeção financeira.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxBalance = Math.max(...projections.map((p) => Math.abs(p.cumulativeBalance)));
  const minBalance = Math.min(...projections.map((p) => p.cumulativeBalance));
  const hasNegative = minBalance < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Projeção 12 Meses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projections.slice(0, 6).map((projection, index) => {
            const isNegative = projection.cumulativeBalance < 0;
            const barWidth = maxBalance > 0
              ? (Math.abs(projection.cumulativeBalance) / maxBalance) * 100
              : 0;

            return (
              <div key={projection.competence} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">
                    {formatMonthYear(new Date(projection.month))}
                  </span>
                  <span className={cn(
                    "font-medium",
                    isNegative ? "text-destructive" : "text-foreground"
                  )}>
                    {formatBRL(projection.cumulativeBalance)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      isNegative ? "bg-destructive" : "bg-primary",
                      index === 0 && "bg-primary"
                    )}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {projections.length > 6 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            +{projections.length - 6} meses restantes
          </p>
        )}
      </CardContent>
    </Card>
  );
}