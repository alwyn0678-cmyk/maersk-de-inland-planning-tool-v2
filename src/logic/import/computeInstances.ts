import { ImpSchedule } from '../../data/import/schedules';
import { addDays, impDayNum, impNextWD, fmtDateISO } from '../dateUtils';
import { nextBizDay, prevBizDay } from '../bizDayUtils';

export interface ImpInstance {
  mod: 'Barge' | 'Rail';
  etd: Date;
  eta: Date;
  custDel: Date;
  orderDL: Date;
  custDL: Date | null;
  loc: string;
  etdDay: string;
  etaDay: string;
  rec: boolean;
}

export function impComputeInst(
  sched: ImpSchedule,
  vesselETD: Date,
  vesselTime: string,
  port: 'RTM' | 'ANR',
  isFuture: boolean,
  weeks: number
): ImpInstance[] {
  const inst: ImpInstance[] = [];
  const now = new Date();

  const etdDow = impDayNum(sched.etd);
  const etaDow = impDayNum(sched.eta);

  const searchFrom = isFuture ? addDays(vesselETD, 1) : new Date(now);
  searchFrom.setHours(0, 0, 0, 0);

  // Vessel ETD + 1 day at vesselTime — used for RTM customs deadline filter
  const vp1 = addDays(vesselETD, 1);
  const parts = (vesselTime || '08:00').split(':');
  vp1.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);

  for (let w = 0; w < weeks; w++) {
    const base = addDays(searchFrom, w * 7);
    const termETD = impNextWD(base, etdDow);

    if (termETD < searchFrom || termETD <= now) continue;

    let depotArr = impNextWD(addDays(termETD, 1), etaDow);
    if (depotArr <= termETD) depotArr = addDays(depotArr, 7);

    const custDel = nextBizDay(addDays(depotArr, 1));
    const orderDL = prevBizDay(addDays(termETD, -7));

    if (now >= orderDL) continue;

    // Customs deadline (Rotterdam only)
    let custDL: Date | null = null;
    if (port === 'RTM') {
      const d = termETD.getDay();
      if (d === 0 || d === 1 || d === 6) {
        // Find previous Friday at 15:00
        const fri = new Date(termETD);
        while (fri.getDay() !== 5) fri.setDate(fri.getDate() - 1);
        fri.setHours(15, 0, 0, 0);
        custDL = fri;
      } else {
        custDL = addDays(termETD, -1);
        custDL.setHours(12, 0, 0, 0);
      }
    }

    // Customs deadline filter (Rotterdam only)
    if (port === 'RTM' && custDL) {
      if (isFuture) {
        if (custDL <= vp1 || now >= custDL) continue;
      } else {
        if (now >= custDL) continue;
      }
    }

    const dsv = Math.round((termETD.getTime() - vesselETD.getTime()) / 86400000);
    const rec = dsv >= 1 && dsv <= 10;

    inst.push({ mod: sched.mod, etd: termETD, eta: depotArr, custDel, orderDL, custDL, loc: sched.loc, etdDay: sched.etd, etaDay: sched.eta, rec });
  }

  inst.sort((a, b) => a.etd.getTime() - b.etd.getTime());

  // Dedup by key: date + mod + loc
  const seen: Record<string, boolean> = {};
  const out: ImpInstance[] = [];
  for (const i of inst) {
    const k = `${fmtDateISO(i.etd)}-${i.mod}-${i.loc}`;
    if (!seen[k]) { seen[k] = true; out.push(i); }
  }
  return out;
}
