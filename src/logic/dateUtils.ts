const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Add N calendar days to a date (returns new Date) */
export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Parse ISO date string YYYY-MM-DD as local midnight */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/** "Tue 24 Mar 2026" */
export function fmt(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/** "Tue 24 Mar" (no year) */
export function fmtS(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

/** "2026-03-24" */
export function fmtDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * ISO weekday: Mon=1 ... Sat=6, Sun=7
 * Used by export planner schedule data.
 */
export function jsDay(d: Date): number {
  return d.getDay() === 0 ? 7 : d.getDay();
}

/**
 * Import-style day parse: "Mon"→1 "Tue"→2 ... "Sun"→0
 * Returns JS getDay() value (0=Sun, 6=Sat)
 */
export function impDayNum(s: string): number {
  const n = s.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (n.startsWith('mon')) return 1;
  if (n.startsWith('tue')) return 2;
  if (n.startsWith('wed')) return 3;
  if (n.startsWith('thu')) return 4;
  if (n.startsWith('fri')) return 5;
  if (n.startsWith('sat')) return 6;
  if (n.startsWith('sun')) return 0;
  return -1;
}

/**
 * Return the date on/after `from` that falls on weekday `dow` (JS getDay convention).
 * Same day returns same date; advances otherwise.
 */
export function impNextWD(from: Date, dow: number): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const diff = (dow - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}
