import { EXP_DEPOTS, EXP_TERM_NAMES, EXP_TERM_YOT } from '../../data/export/depotNames';
import { EXP_SCHED } from '../../data/export/schedules';
import { expFindRule } from './ruleLookup';
import { expGetNextDeps, ExpDeparture } from './getNextDepartures';
import { lookupEmptyDepot, getEmptySizeType, getEmptySizeLabel } from '../emptyDepotLookup';
import { parseDate, addDays } from '../dateUtils';
import { prevBizDay, holidaysInRange } from '../bizDayUtils';
import { getRegion } from '../regionLookup';
import { EmptyDepotSlot } from '../../data/emptyDepots';

export interface ExpRunParams {
  zip: string;
  size: string;
  type: string;
  loadDate: string;
  loadTime: string;
  terminalValue: string; // "NLROTTM|5|RTM"
}

export interface ExpCard extends ExpDeparture {
  depotCode: string;
  depotName: string;
  termCode: string;
  termName: string;
  yot: number;
  port: 'RTM' | 'ANR';
  earliestCCO: Date;
  latestETA: Date;
  orderDL: Date;
  holidaysInTransit: Date[];
  isRecommended: boolean;
}

export interface ExpRunResult {
  error?: string;
  notServicedAntwerp?: boolean;
  isrRequired?: boolean;
  noSchedule?: boolean;
  noScheduleDepotName?: string;
  zip: string;
  region: string;
  size: string;
  type: string;
  loadingDate: Date;
  loadTime: string;
  termCode: string;
  termName: string;
  yot: number;
  port: 'RTM' | 'ANR';
  depotCode: string;
  depotName: string;
  depotP2Code?: string;
  depotP2Name?: string;
  cards: ExpCard[];
  orderDLPassed?: boolean;
  orderDL?: Date;
  customsDeadline?: Date;
  emptyDepot: EmptyDepotSlot | null;
  emptyLabel: string;
  skipped: { mod: string; etd: Date; reason: string }[];
}

export function expRun(params: ExpRunParams): ExpRunResult {
  const { zip, size, type, loadDate, loadTime, terminalValue } = params;

  const [termCode, yotStr, portStr] = terminalValue.split('|');
  const yot = parseInt(yotStr, 10);
  const port = portStr as 'RTM' | 'ANR';
  const loadingDate = parseDate(loadDate);
  const region = getRegion(zip);
  const termName = EXP_TERM_NAMES[termCode] || termCode;

  const base = { zip, region, size, type, loadingDate, loadTime, termCode, termName, yot, port, depotCode: '', depotName: '', cards: [], skipped: [], emptyDepot: null, emptyLabel: '' };

  const rule = expFindRule(zip);
  if (!rule) {
    return { ...base, error: `Postcode ${zip} is not in the depot matrix. Contact the inland coordination team.` };
  }

  const opts = port === 'RTM' ? rule.rtm : (rule.anr || rule.rtm);
  if (!opts.p1) {
    return { ...base, notServicedAntwerp: true };
  }

  const depotCode = opts.p1;
  const depotName = EXP_DEPOTS[depotCode] || depotCode;
  const depotP2Code = opts.p2;
  const depotP2Name = depotP2Code ? (EXP_DEPOTS[depotP2Code] || depotP2Code) : undefined;

  // IMO/Reefer via Duisburg hard block
  if ((type === 'reefer' || type === 'imo') && depotCode === 'DEDUI01') {
    return { ...base, depotCode, depotName, depotP2Code, depotP2Name, isrRequired: true };
  }

  // No schedule depots
  const noSchedDepots = new Set(['DEMUN01', 'DEDTM01']);
  if (noSchedDepots.has(depotCode) || !EXP_SCHED[depotCode]) {
    return { ...base, depotCode, depotName, depotP2Code, depotP2Name, noSchedule: true, noScheduleDepotName: depotName };
  }

  const sizeType = getEmptySizeType(size, type);
  const emptyLabel = getEmptySizeLabel(size, type);
  const emptyDepot = lookupEmptyDepot(zip, sizeType, port);

  // RTM customs deadline: loading time + 3 hours
  let customsDeadline: Date | undefined;
  if (port === 'RTM') {
    const [lh, lm] = loadTime.split(':').map(Number);
    customsDeadline = new Date(loadingDate);
    customsDeadline.setHours(lh + 3, lm, 0, 0);
  }

  const result = expGetNextDeps(depotCode, port, loadingDate, loadTime, 2, termCode);

  if (result.orderDLPassed) {
    return { ...base, depotCode, depotName, depotP2Code, depotP2Name, orderDLPassed: true, orderDL: result.orderDL, skipped: result.skipped, emptyDepot, emptyLabel };
  }

  // Sort: Rail first, then Barge. Within same modality sort by ETD.
  const sorted = [...result.deps].sort((a, b) => {
    if (a.mod !== b.mod) return a.mod === 'Rail' ? -1 : 1;
    return a.etd.getTime() - b.etd.getTime();
  });

  const cards: ExpCard[] = sorted.map((dep, idx) => {
    const earliestCCO = addDays(dep.eat, dep.buffer);
    const latestETA = addDays(dep.eat, yot - 1);
    const orderDL = result.orderDL || prevBizDay(addDays(loadingDate, -2));
    const holsInTransit = holidaysInRange(dep.etd, dep.eat);
    return {
      ...dep,
      depotCode,
      depotName,
      termCode,
      termName,
      yot,
      port,
      earliestCCO,
      latestETA,
      orderDL,
      holidaysInTransit: holsInTransit,
      isRecommended: idx === 0,
    };
  });

  return {
    zip, region, size, type, loadingDate, loadTime, termCode, termName, yot, port,
    depotCode, depotName, depotP2Code, depotP2Name,
    cards, orderDL: result.orderDL, customsDeadline, emptyDepot, emptyLabel,
    skipped: result.skipped,
  };
}
