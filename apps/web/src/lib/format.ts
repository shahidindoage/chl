/**
 * Display formatting for match dates. The API speaks ISO 8601
 * (`z.string().datetime()`); the design renders "16 Sep 2026" / "04:00 PM".
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function parts(iso: string): { day: number; month: string; year: number; hours: number; minutes: number } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: d.getDate(),
    month: MONTHS[d.getMonth()],
    year: d.getFullYear(),
    hours: d.getHours(),
    minutes: d.getMinutes(),
  };
}

/** "16 Sep 2026" */
export function formatMatchDate(iso: string): string {
  const p = parts(iso);
  return p ? `${p.day} ${p.month} ${p.year}` : "—";
}

/** "04:00 PM" */
export function formatMatchTime(iso: string): string {
  const p = parts(iso);
  if (!p) return "—";
  const suffix = p.hours >= 12 ? "PM" : "AM";
  const h12 = p.hours % 12 === 0 ? 12 : p.hours % 12;
  return `${h12}:${String(p.minutes).padStart(2, "0")} ${suffix}`;
}

/** "16" — day-of-month chip in the all-matches list. */
export function formatDay(iso: string): string {
  const p = parts(iso);
  return p ? String(p.day) : "--";
}

/** "SEP" — month chip in the all-matches list. */
export function formatMonth(iso: string): string {
  const p = parts(iso);
  return p ? p.month.toUpperCase() : "—";
}

/** "16 Sep" — compact form for the footer fixture list. */
export function formatShortDate(iso: string): string {
  const p = parts(iso);
  return p ? `${p.day} ${p.month}` : "—";
}

/** "completed" -> "Completed", for status pills. */
export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
