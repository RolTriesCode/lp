export const DAY_MS = 24 * 60 * 60 * 1_000;

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return toDateKey(date) === value ? date : null;
}

export function startOfWeek(date: Date): Date {
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - mondayOffset);
  return value;
}

export function addDays(date: Date, amount: number): Date {
  const value = new Date(date);
  value.setDate(value.getDate() + amount);
  return value;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function startOfMonthGrid(date: Date): Date {
  return startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function calendarRange(date: Date, view: "week" | "month"): { start: Date; end: Date } {
  const start = view === "week" ? startOfWeek(date) : startOfMonthGrid(date);
  return { start, end: addDays(start, view === "week" ? 7 : 42) };
}

export function toLocalDateTimeValue(value: Date): string {
  const date = toDateKey(value);
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${date}T${hours}:${minutes}`;
}

