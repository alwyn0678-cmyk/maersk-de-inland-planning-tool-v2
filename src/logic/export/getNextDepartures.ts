import { EXP_SCHED } from '../../data/export/schedules';
import { addDays, jsDay } from '../dateUtils';
import { prevBizDay } from '../bizDayUtils';

export interface ExpDeparture {
  mod: 'Barge' | 'Rail';
  etd: Date;
  eat: Date;   // Estimated Arrival at Terminal
  buffer: number;
  offset: number;
  nextDayCutoff: boolean;
}

export interface ExpDepsResult {
  deps: ExpDeparture[];
  skipped: { mod: string; etd: Date; reason: string }[];
  orderDLPassed?: boolean;
  orderDL?: Date;
}

export function expGetNextDeps(
  code: string,
  port: 'RTM' | 'ANR',
  loadingDate: Date,
  loadTimeStr: string,
  n = 2,
  termCode?: string
): ExpDepsResult {
  const schedByPort = EXP_SCHED[code];
  if (!schedByPort) return { deps: [], skipped: [] };
  const sch = schedByPort[port];
  if (!sch || !sch.length) return { deps: [], skipped: [] };

  const filtered = termCode
    ? sch.filter(s => !s.terms || s.terms.includes(termCode))
    : sch;
  if (!filtered.length) return { deps: [], skipped: [] };

  const [lh, lm] = (loadTimeStr || '08:00').split(':').map(Number);
  const loadingAfterNoon = (lh * 60 + lm) >= 720;

  const orderDL = prevBizDay(addDays(loadingDate, -2));
  const nowDL = new Date(); nowDL.setHours(0, 0, 0, 0);
  if (nowDL >= orderDL) return { deps: [], skipped: [], orderDLPassed: true, orderDL };

  // Max departures per depot
  const maxDeps = code === 'DEDUI01' ? 3 : n;

  const found: ExpDeparture[] = [];
  const skipped: { mod: string; etd: Date; reason: string }[] = [];

  for (let offset = 0; offset <= 25 && found.length < maxDeps; offset++) {
    const d = addDays(loadingDate, offset);
    const dow = jsDay(d);

    for (const s of filtered) {
      if (s.dep !== dow) continue;
      if (offset === 0) continue; // same day excluded

      if (offset === 1 && loadingAfterNoon) {
        skipped.push({ mod: s.mod, etd: new Date(d), reason: 'next-day-cutoff' });
        continue;
      }

      if (found.length < maxDeps) {
        found.push({
          mod: s.mod,
          etd: new Date(d),
          eat: addDays(d, s.transit),
          buffer: s.buffer || 2,
          offset,
          nextDayCutoff: offset === 1 && !loadingAfterNoon,
        });
      }
    }
  }

  return { deps: found, skipped, orderDL };
}
