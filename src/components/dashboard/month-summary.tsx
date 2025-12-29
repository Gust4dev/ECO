"use client";

import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

interface MonthSummaryProps {
  currentBalance: number;
  income: number;
  expenses: number;
  percentChange?: number;
}

export function MonthSummary({
  currentBalance,
  income,
  expenses,
  percentChange = 0,
}: MonthSummaryProps) {
  const isPositive = percentChange >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Saldo Atual
              </p>
              <p className={cn(
                "text-2xl font-bold",
                currentBalance >= 0 ? "text-foreground" : "text-destructive"
              )}>
                {formatBRL(currentBalance)}
              </p>
            </div>
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              currentBalance >= 0 ? "bg-primary/10" : "bg-destructive/10"
            )}>
              <Wallet className={cn(
                "h-6 w-6",
                currentBalance >= 0 ? "text-primary" : "text-destructive"
              )} />
            </div>
          </div>
          {percentChange !== 0 && (
            <div className="mt-3 flex items-center gap-1 text-sm">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
              <span className={isPositive ? "text-success" : "text-destructive"}>
                {Math.abs(percentChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Receitas
              </p>
              <p className="text-2xl font-bold text-success">
                {formatBRL(income)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Despesas
              </p>
              <p className="text-2xl font-bold text-destructive">
                {formatBRL(expenses)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}