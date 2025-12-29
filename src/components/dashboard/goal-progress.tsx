"use client";

import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  currentCents: number;
  targetCents: number;
  percentComplete: number;
}

interface GoalProgressProps {
  goals: Goal[];
}

export function GoalProgress({ goals }: GoalProgressProps) {
  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma meta cadastrada. Crie sua primeira meta para acompanhar seu progresso.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{goal.name}</span>
              <span className="text-sm text-muted-foreground">
                {goal.percentComplete}%
              </span>
            </div>
            <Progress
              value={goal.percentComplete}
              indicatorClassName={cn(
                goal.percentComplete >= 100
                  ? "bg-success"
                  : goal.percentComplete >= 75
                  ? "bg-primary"
                  : goal.percentComplete >= 50
                  ? "bg-warning"
                  : "bg-primary"
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatBRL(goal.currentCents)}</span>
              <span>{formatBRL(goal.targetCents)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}