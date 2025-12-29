"use client";

import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc-client";
import { formatBRL } from "@/lib/money";
import { formatMonthYear } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default function ProjectionsPage() {
  const { data: projections, isLoading } = trpc.projections.getMonthly.useQuery({
    monthsAhead: 12,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const hasNegativeMonth = projections?.some((p) => p.cumulativeBalance < 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projeções</h1>
        <p className="text-muted-foreground">
          Visualize sua situação financeira para os próximos 12 meses
        </p>
      </div>

      {hasNegativeMonth && (
        <div className="flex items-center gap-3 rounded-lg border border-warning bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="font-medium text-warning">Atenção</p>
            <p className="text-sm text-muted-foreground">
              Sua projeção indica saldo negativo em alguns meses. Revise seus gastos.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {projections?.map((projection, index) => {
          const isNegative = projection.cumulativeBalance < 0;
          const isCurrentMonth = index === 0;

          return (
            <Card
              key={projection.competence}
              className={cn(
                isCurrentMonth && "border-primary",
                isNegative && "border-destructive"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full",
                        isNegative
                          ? "bg-destructive/10"
                          : "bg-primary/10"
                      )}
                    >
                      {isNegative ? (
                        <TrendingDown className="h-6 w-6 text-destructive" />
                      ) : (
                        <TrendingUp className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">
                        {formatMonthYear(new Date(projection.month))}
                        {isCurrentMonth && (
                          <span className="ml-2 text-xs text-primary">(Atual)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {projection.pendingInstallments} parcelas pendentes
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        "text-lg font-bold",
                        isNegative ? "text-destructive" : "text-foreground"
                      )}
                    >
                      {formatBRL(projection.cumulativeBalance)}
                    </p>
                    <div className="flex items-center justify-end gap-2 text-sm">
                      <span className="text-success">
                        +{formatBRL(projection.incomeTotal)}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-destructive">
                        -{formatBRL(projection.expenseTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}