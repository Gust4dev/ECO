export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(fromCents(cents));
}

export function parseBRL(value: string): number {
  const cleaned = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return toCents(parsed);
}

export function sumCents(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

export function percentOf(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 10000) / 100;
}

export function applyPercentage(cents: number, percentage: number): number {
  return Math.round(cents * (percentage / 100));
}