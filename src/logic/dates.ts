import { addDays, isWeekend, nextDay, getDay, isAfter, isBefore, startOfDay, addHours } from 'date-fns';

// Simple German holidays (mocked for this example)
const HOLIDAYS = [
  '2026-01-01', // New Year
  '2026-04-03', // Good Friday
  '2026-04-06', // Easter Monday
  '2026-05-01', // Labor Day
  '2026-05-14', // Ascension Day
  '2026-05-25', // Whit Monday
  '2026-10-03', // Day of German Unity
  '2026-12-25', // Christmas Day
  '2026-12-26', // Boxing Day
];

export function isHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0];
  return HOLIDAYS.includes(dateString);
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

export function addBusinessDays(date: Date, days: number): Date {
  let result = new Date(date);
  let added = 0;
  while (added < days) {
    result = addDays(result, 1);
    if (isBusinessDay(result)) {
      added++;
    }
  }
  return result;
}

export function subtractBusinessDays(date: Date, days: number): Date {
  let result = new Date(date);
  let subtracted = 0;
  while (subtracted < days) {
    result = addDays(result, -1);
    if (isBusinessDay(result)) {
      subtracted++;
    }
  }
  return result;
}

export function getNextDepartureDate(currentDate: Date, departureDayOfWeek: number): Date {
  const currentDayOfWeek = getDay(currentDate);
  if (currentDayOfWeek === departureDayOfWeek) {
    return currentDate;
  }
  return nextDay(currentDate, departureDayOfWeek as Day);
}

type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;
