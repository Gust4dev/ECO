import {
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  format,
  parse,
  isWithinInterval,
  differenceInMonths,
  setDate,
  isBefore,
  isAfter,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export function getCompetenceDate(date: Date, billingCycleDay: number): Date {
  const day = date.getDate();
  if (day >= billingCycleDay) {
    return startOfMonth(addMonths(date, 1));
  }
  return startOfMonth(date);
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function generateMonthsAhead(fromDate: Date, count: number): Date[] {
  const months: Date[] = [];
  for (let i = 0; i < count; i++) {
    months.push(startOfMonth(addMonths(fromDate, i)));
  }
  return months;
}

export function generateInstallmentDates(
  startDate: Date,
  totalInstallments: number,
  dayOfMonth: number
): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < totalInstallments; i++) {
    let date = addMonths(startDate, i);
    date = setDate(date, Math.min(dayOfMonth, endOfMonth(date).getDate()));
    dates.push(date);
  }
  return dates;
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: ptBR });
}

export function formatShortDate(date: Date): string {
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

export function formatCompetence(date: Date): string {
  return format(date, "yyyy-MM");
}

export function parseCompetence(competence: string): Date {
  return parse(competence, "yyyy-MM", new Date());
}

export function monthsBetween(start: Date, end: Date): number {
  return Math.abs(differenceInMonths(end, start));
}

export function isInMonth(date: Date, monthDate: Date): boolean {
  const { start, end } = getMonthRange(monthDate);
  return isWithinInterval(date, { start, end });
}

export function isPastMonth(date: Date): boolean {
  return isBefore(endOfMonth(date), startOfMonth(new Date()));
}

export function isFutureMonth(date: Date): boolean {
  return isAfter(startOfMonth(date), endOfMonth(new Date()));
}

export function getCurrentCompetence(): Date {
  return startOfMonth(new Date());
}

export function getPreviousMonths(count: number): Date[] {
  const months: Date[] = [];
  const now = new Date();
  for (let i = count; i > 0; i--) {
    months.push(startOfMonth(subMonths(now, i)));
  }
  return months;
}