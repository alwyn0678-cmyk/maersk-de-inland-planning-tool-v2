import { ImpSchedule } from '../data/import/schedules';
import { ExpScheduleEntry } from '../data/export/schedules';

export interface ScheduleOverrideMeta {
  lastUploadDate: string;           // ISO string
  updatedImpTerminals: string[];    // cumulative list of terminal codes
  updatedExpDepots: string[];       // cumulative list of depot codes
}

export type ImpOverrides = Record<string, ImpSchedule[]>;
export type ExpOverrides = Record<string, { RTM?: ExpScheduleEntry[]; ANR?: ExpScheduleEntry[] }>;

let _imp: ImpOverrides | null  = null;
let _exp: ExpOverrides | null  = null;
let _meta: ScheduleOverrideMeta | null = null;

export function getImpOverrides(): ImpOverrides | null  { return _imp;  }
export function getExpOverrides(): ExpOverrides | null  { return _exp;  }
export function getOverrideMeta(): ScheduleOverrideMeta | null { return _meta; }

/**
 * Called on app load with data fetched from Supabase.
 * Hydrates module state directly — no localStorage involved.
 */
export function loadRemoteOverrides(
  imp: ImpOverrides | null,
  exp: ExpOverrides | null,
  meta: ScheduleOverrideMeta | null,
): void {
  _imp  = imp;
  _exp  = exp;
  _meta = meta;
}

/**
 * Merge new overrides into existing ones (partial-update safe).
 * Only terminals/depots present in the new upload are replaced.
 * Returns the full merged state to be saved to Supabase.
 */
export function applyScheduleOverrides(
  newImp: ImpOverrides | null,
  newExp: ExpOverrides | null,
  added: { impTerminals: string[]; expDepots: string[] },
): { imp: ImpOverrides; exp: ExpOverrides; meta: ScheduleOverrideMeta } {
  if (newImp && Object.keys(newImp).length > 0) {
    _imp = { ...(_imp ?? {}), ...newImp };
  }
  if (newExp && Object.keys(newExp).length > 0) {
    _exp = { ...(_exp ?? {}), ...newExp };
  }

  _meta = {
    lastUploadDate: new Date().toISOString(),
    updatedImpTerminals: [...new Set([...(_meta?.updatedImpTerminals ?? []), ...added.impTerminals])],
    updatedExpDepots:    [...new Set([...(_meta?.updatedExpDepots    ?? []), ...added.expDepots   ])],
  };

  return { imp: _imp ?? {}, exp: _exp ?? {}, meta: _meta };
}

/** Wipe all overrides — reverts to built-in schedule data. */
export function resetAllOverrides(): void {
  _imp = null; _exp = null; _meta = null;
}
