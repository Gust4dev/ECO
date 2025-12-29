"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import {
  Search,
  Plus,
  Target,
  ArrowUpDown,
  TrendingUp,
  Settings,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommandBarProps {
  onNewTransaction?: () => void;
  onNewGoal?: () => void;
}

export function CommandBar({ onNewTransaction, onNewGoal }: CommandBarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />
      <div className="absolute left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
        <Command className="rounded-xl border bg-card shadow-2xl">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Digite um comando ou pesquise..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </Command.Empty>

            <Command.Group heading="Ações Rápidas" className="px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => onNewTransaction?.())}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <Plus className="h-4 w-4 text-primary" />
                <span>Nova Transação</span>
                <span className="ml-auto text-xs text-muted-foreground">⌘+N</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => onNewGoal?.())}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <Target className="h-4 w-4 text-success" />
                <span>Nova Meta</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-border" />

            <Command.Group heading="Navegação" className="px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard"))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/transactions"))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Transações</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/goals"))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <Target className="h-4 w-4" />
                <span>Metas</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/projections"))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Projeções</span>
              </Command.Item>
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-border" />

            <Command.Group heading="Sistema" className="px-2 py-1.5">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}