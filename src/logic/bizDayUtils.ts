import { GERMAN_HOLIDAYS } from '../data/holidays';
import { fmtDateISO, addDays } from './dateUtils';

export function isHoliday(d: Date): boolean {
  return GERMAN_HOLIDAYS.has(fmtDateISO(d));
}

export function isBizDay(d: Date): boolean {
  const dow = d.getDay();
  return dow !== 0 && dow !== 6 && !isHoliday(d);
}

export function nextBizDay(d: Date): Date {
  let cur = new Date(d);
  cur.setHours(0, 0, 0, 0);
  while (!isBizDay(cur)) cur = addDays(cur, 1);
  return cur;
}

export function prevBizDay(d: Date): Date {
  let cur = new Date(d);
  cur.setHours(0, 0, 0, 0);
  while (!isBizDay(cur)) cur = addDays(cur, -1);
  return cur;
}

export function holidaysInRange(start: Date, end: Date): Date[] {
  const result: Date[] = [];
  let cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endMs = new Date(end).setHours(0, 0, 0, 0);
  while (cur.getTime() <= endMs) {
    if (isHoliday(cur)) result.push(new Date(cur));
    cur = addDays(cur, 1);
  }
  return result;
}
