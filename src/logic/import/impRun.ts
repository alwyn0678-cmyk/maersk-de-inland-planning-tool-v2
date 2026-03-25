import { ZipEntry } from '../../data/import/zipMap';
import { IMP_NO_RAIL, IMP_HAS_SCHED } from '../../data/import/constants';
import { IMP_TERM_NAMES, IMP_TRUCK_BY_TERM } from '../../data/import/terminalNames';
import { impLookupTerms, impScCode } from './zipLookup';
import { impFindScheds } from './scheduleFinder';
import { impComputeInst, ImpInstance } from './computeInstances';
import { lookupEmptyDepot, getEmptySizeType, getEmptySizeLabel } from '../emptyDepotLookup';
import { parseDate, fmtDateISO } from '../dateUtils';
import { getRegion } from '../regionLookup';
import { EmptyDepotSlot } from '../../data/emptyDepots';

export interface ImpRunParams {
  zip: string;
  size: string;
  type: string;
  port: 'RTM' | 'ANR';
  etdDate: string;
  etdTime: string;
}

export interface ImpRunResult {
  error?: string;
  zip: string;
  region: string;
  size: string;
  type: string;
  port: string;
  portName: string;
  vesselETD: Date;
  etdTime: string;
  isFuture: boolean;
  terms: ZipEntry | null;
  all: ImpInstance[];
  maxCards: number;
  hasB2: boolean;
  emptyDepot: EmptyDepotSlot | null;
  emptyLabel: string;
}

export function impTName(c: string): string {
  return IMP_TERM_NAMES[c] || IMP_TERM_NAMES[impScCode(c)] || c;
}

export function impTruck(loc: string): string {
  return IMP_TRUCK_BY_TERM[loc] || IMP_TRUCK_BY_TERM[impScCode(loc)] || '—';
}

export function impHasSc(c: string): boolean {
  return !!c && IMP_HAS_SCHED.has(impScCode(c));
}

export function impRun(params: ImpRunParams): ImpRunResult {
  const { zip, size, type, port, etdDate, etdTime } = params;

  const vesselETD = parseDate(etdDate);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const isFuture = vesselETD > now;
  const region = getRegion(zip);
  const portName = port === 'RTM' ? 'Rotterdam' : 'Antwerp';

  const terms = impLookupTerms(zip, port);
  if (!terms) {
    return { error: `No terminal mapping found for postcode ${zip} via ${portName}. Contact inland operations.`, zip, region, size, type, port, portName, vesselETD, etdTime, isFuture, terms: null, all: [], maxCards: 2, hasB2: false, emptyDepot: null, emptyLabel: '' };
  }

  let all: ImpInstance[] = [];

  if (terms.b) {
    const bs = impFindScheds(terms.b, port, 'Barge');
    for (const s of bs) all = all.concat(impComputeInst(s, vesselETD, etdTime, port, isFuture, 8));
  }
  if (terms.b2) {
    const bs2 = impFindScheds(terms.b2, port, 'Barge');
    for (const s of bs2) all = all.concat(impComputeInst(s, vesselETD, etdTime, port, isFuture, 8));
  }
  if (terms.r && !IMP_NO_RAIL.has(impScCode(terms.r))) {
    const rs = impFindScheds(terms.r, port, 'Rail');
    for (const s of rs) all = all.concat(impComputeInst(s, vesselETD, etdTime, port, isFuture, 8));
  }
  // Cross-modal: if barge and rail terminals differ
  if (terms.b && terms.r && impScCode(terms.b) !== impScCode(terms.r)) {
    if (!IMP_NO_RAIL.has(impScCode(terms.b))) {
      const xr = impFindScheds(terms.b, port, 'Rail');
      for (const s of xr) all = all.concat(impComputeInst(s, vesselETD, etdTime, port, isFuture, 8));
    }
    const xb = impFindScheds(terms.r, port, 'Barge');
    for (const s of xb) all = all.concat(impComputeInst(s, vesselETD, etdTime, port, isFuture, 8));
  }

  // Sort & dedup
  all.sort((a, b) => a.etd.getTime() - b.etd.getTime());
  const seen: Record<string, boolean> = {};
  const deduped: ImpInstance[] = [];
  for (const m of all) {
    const key = `${fmtDateISO(m.etd)}-${m.mod}-${m.loc}`;
    if (!seen[key]) { seen[key] = true; deduped.push(m); }
  }

  const primaryLoc = impScCode(terms.b || terms.r || '');
  const maxCards = primaryLoc === 'DEDUI01' ? 3 : 2;
  const hasB2 = !!terms.b2;

  const sizeType = getEmptySizeType(size, type);
  const emptyLabel = getEmptySizeLabel(size, type);
  const emptyDepot = lookupEmptyDepot(zip, sizeType, port);

  return { zip, region, size, type, port, portName, vesselETD, etdTime, isFuture, terms, all: deduped, maxCards, hasB2, emptyDepot, emptyLabel };
}
