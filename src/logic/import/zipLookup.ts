import { IMP_ZIP, ZipEntry } from '../../data/import/zipMap';
import { IMP_CODE_ALIAS } from '../../data/import/constants';

export function impScCode(c: string): string {
  return IMP_CODE_ALIAS[c] || c;
}

export function impLookupTerms(zip: string, port: 'RTM' | 'ANR'): ZipEntry | null {
  const z2 = zip.substring(0, 2);
  const m = IMP_ZIP[port];
  if (!m) return null;
  let e = m[z2];
  if (!e) e = m[z2.charAt(0)];
  return e || null;
}
