import { EXP_RULES, ExpRule } from '../../data/export/rules';

export function expFindRule(zip: string): ExpRule | null {
  const z = parseInt(zip, 10);
  for (const r of EXP_RULES) {
    if (r.ranges.some(([lo, hi]) => z >= lo && z <= hi)) return r;
  }
  return null;
}
