"use client";

import { useState } from "react";
import { Plus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc-client";
import { formatBRL } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default function TransactionsPage() {
  const [competence] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data, isLoading } = trpc.transactions.list.useQuery({
    competence,
    limit: 50,
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
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
            <Filter className="h-4 w-4" />
            Filtrar
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Nova Transação
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transações do Mês</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.transactions.length ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhuma transação encontrada neste mês.
            </p>
          ) : (
            <div className="space-y-2">
              {data.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
                        transaction.type === "INCOME"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatShortDate(new Date(transaction.occurredAt))}
                        {transaction.category && ` • ${transaction.category.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-semibold",
                        transaction.type === "INCOME"
                          ? "text-success"
                          : "text-destructive"
                      )}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}
                      {formatBRL(transaction.amountCents)}
                    </p>
                    {transaction.isInstallment && (
                      <p className="text-xs text-muted-foreground">
                        {transaction.installmentNumber}/{transaction.installmentTotal}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}