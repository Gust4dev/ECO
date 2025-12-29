"use client";

import { Plus, Target, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc-client";
import { formatBRL } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default function GoalsPage() {
  const { data, isLoading } = trpc.goals.list.useQuery({
    limit: 20,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso das suas metas financeiras
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Nova Meta
        </button>
      </div>

      {!data?.goals.length ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                Nenhuma meta cadastrada
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Crie sua primeira meta para começar a acompanhar seu progresso.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.goals.map((goal) => {
            const percentComplete = Math.round(
              (goal.currentCents / goal.targetCents) * 100
            );

            return (
              <Card key={goal.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{goal.name}</CardTitle>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        goal.status === "ACTIVE"
                          ? "bg-primary/10 text-primary"
                          : goal.status === "COMPLETED"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {goal.status === "ACTIVE"
                        ? "Ativa"
                        : goal.status === "COMPLETED"
                        ? "Concluída"
                        : goal.status === "PAUSED"
                        ? "Pausada"
                        : "Cancelada"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{percentComplete}%</span>
                    </div>
                    <Progress
                      value={percentComplete}
                      indicatorClassName={cn(
                        percentComplete >= 100
                          ? "bg-success"
                          : percentComplete >= 75
                          ? "bg-primary"
                          : "bg-primary/60"
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatBRL(goal.currentCents)}
                    </span>
                    <span className="font-medium">
                      {formatBRL(goal.targetCents)}
                    </span>
                  </div>
                  {goal.targetDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Meta: {formatShortDate(goal.targetDate)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
