import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";

export function todayRange() {
  const now = new Date();
  return { from: startOfDay(now), to: endOfDay(now) };
}

export function weekRange(date = new Date()) {
  return {
    from: startOfWeek(date, { weekStartsOn: 1 }),
    to: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function monthRange(date = new Date()) {
  return { from: startOfMonth(date), to: endOfMonth(date) };
}

export function last7DaysRange() {
  const now = new Date();
  return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
}

export function formatDate(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDayShort(date: Date | string) {
  return format(new Date(date), "EEE");
}

export function formatMonthDay(date: Date | string) {
  return format(new Date(date), "MMM d");
}
