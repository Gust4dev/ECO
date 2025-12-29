"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { parseBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

interface QuickExpenseProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickExpense({ onClose, onSuccess }: QuickExpenseProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [installments, setInstallments] = useState(1);

  const utils = trpc.useUtils();
  const createTransaction = trpc.transactions.create.useMutation({
    onSuccess: () => {
      utils.transactions.list.invalidate();
      utils.projections.getSummary.invalidate();
      utils.projections.getMonthly.invalidate();
      onSuccess?.();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amountCents = parseBRL(amount);
    if (!description.trim() || amountCents <= 0) return;

    createTransaction.mutate({
      description: description.trim(),
      amountCents,
      type,
      occurredAt: new Date(),
      installments: installments > 1 ? installments : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nova Transação</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("EXPENSE")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                type === "EXPENSE"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType("INCOME")}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                type === "INCOME"
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço, Freelance..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Valor</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="R$ 0,00"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {type === "EXPENSE" && (
            <div>
              <label className="mb-1 block text-sm font-medium">Parcelas</label>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}x {n === 1 ? "(à vista)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={createTransaction.isPending}
            className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {createTransaction.isPending ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              "Salvar"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}