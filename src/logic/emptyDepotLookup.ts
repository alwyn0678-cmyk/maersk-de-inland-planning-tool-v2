import { EMPTY_DEPOTS, EmptyDepotSlot } from '../data/emptyDepots';

export type SizeType = '40dchc' | '20' | '40reefer';

export function getEmptySizeType(size: string, type: string): SizeType {
  if (type === 'reefer' || type === 'href') return '40reefer';
  if (size === '20') return '20';
  return '40dchc';
}

export function getEmptySizeLabel(size: string, type: string): string {
  if (type === 'reefer' || type === 'href') return "40' Reefer";
  if (size === '20') return "20'";
  return "40' DC/HC";
}

export function lookupEmptyDepot(zip: string, sizeType: SizeType, port: 'RTM' | 'ANR'): EmptyDepotSlot | null {
  const z = parseInt(zip, 10);
  const table = EMPTY_DEPOTS[sizeType];
  if (!table) return null;
  for (const row of table) {
    if (z >= row.lo && z <= row.hi) {
      return port === 'ANR' ? row.anr : row.rtm;
    }
  }
  return null;
}
