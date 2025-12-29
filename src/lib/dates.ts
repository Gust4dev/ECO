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
  parseISO,
  formatISO,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/Sao_Paulo";

export function toLocalDate(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(d, TIMEZONE);
}

export function toUTCDate(date: Date): Date {
  return fromZonedTime(date, TIMEZONE);
}

export function nowLocal(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

export function todayLocal(): Date {
  return startOfDay(nowLocal());
}

export function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromISODateString(dateString: string): Date {
  return parse(dateString, "yyyy-MM-dd", new Date());
}

export function getCompetenceDate(date: Date, billingCycleDay: number = 1): Date {
  const localDate = toLocalDate(date);
  const day = localDate.getDate();
  
  if (day >= billingCycleDay) {
    return startOfMonth(addMonths(localDate, 1));
  }
  return startOfMonth(localDate);
}

export function getCompetenceFromDate(date: Date): Date {
  const localDate = toLocalDate(date);
  return startOfMonth(localDate);
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  const localDate = toLocalDate(date);
  return {
    start: startOfMonth(localDate),
    end: endOfMonth(localDate),
  };
}

export function generateMonthsAhead(fromDate: Date, count: number): Date[] {
  const localDate = toLocalDate(fromDate);
  const months: Date[] = [];
  for (let i = 0; i < count; i++) {
    months.push(startOfMonth(addMonths(localDate, i)));
  }
  return months;
}

export function generateInstallmentDates(
  startDate: Date,
  totalInstallments: number,
  dayOfMonth: number
): Date[] {
  const localStart = toLocalDate(startDate);
  const dates: Date[] = [];
  
  for (let i = 0; i < totalInstallments; i++) {
    let date = addMonths(localStart, i);
    const lastDay = endOfMonth(date).getDate();
    date = setDate(date, Math.min(dayOfMonth, lastDay));
    dates.push(date);
  }
  return dates;
}

export function formatMonthYear(date: Date): string {
  return format(toLocalDate(date), "MMMM yyyy", { locale: ptBR });
}

export function formatShortDate(date: Date): string {
  return format(toLocalDate(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatCompetence(date: Date): string {
  return format(toLocalDate(date), "yyyy-MM");
}

export function parseCompetence(competence: string): Date {
  return parse(competence, "yyyy-MM", new Date());
}

export function monthsBetween(start: Date, end: Date): number {
  return Math.abs(differenceInMonths(toLocalDate(end), toLocalDate(start)));
}

export function isInMonth(date: Date, monthDate: Date): boolean {
  const localDate = toLocalDate(date);
  const { start, end } = getMonthRange(monthDate);
  return isWithinInterval(localDate, { start, end });
}

export function isPastMonth(date: Date): boolean {
  const localDate = toLocalDate(date);
  return isBefore(endOfMonth(localDate), startOfMonth(nowLocal()));
}

export function isFutureMonth(date: Date): boolean {
  const localDate = toLocalDate(date);
  return isAfter(startOfMonth(localDate), endOfMonth(nowLocal()));
}

export function getCurrentCompetence(): Date {
  return startOfMonth(nowLocal());
}

export function getPreviousMonths(count: number): Date[] {
  const months: Date[] = [];
  const now = nowLocal();
  for (let i = count; i > 0; i--) {
    months.push(startOfMonth(subMonths(now, i)));
  }
  return months;
}

export function getCompetenceRange(competence: string): { start: Date; end: Date } {
  const date = parseCompetence(competence);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}