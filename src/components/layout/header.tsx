"use client";

import { useState } from "react";
import { Menu, Search, Plus, Command } from "lucide-react";
import { cn } from "../../lib/utils";

export function Header() {
  const [showCommandHint, setShowCommandHint] = useState(true);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <button className="lg:hidden">
          <Menu className="h-6 w-6" />
        </button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar transações..."
            className="h-9 w-64 rounded-lg border bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {showCommandHint && (
          <div className="hidden items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground md:flex">
            <Command className="h-3 w-3" />
            <span>+</span>
            <span className="font-medium">K</span>
            <span className="ml-1">para comandos</span>
          </div>
        )}

        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Transação</span>
        </button>
      </div>
    </header>
  );
}
