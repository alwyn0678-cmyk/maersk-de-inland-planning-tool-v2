import { IMP_SCHEDULES, ImpSchedule } from '../../data/import/schedules';
import { impScCode } from './zipLookup';
import { getImpOverrides } from '../scheduleOverrides';

/** Build the active schedule list: overridden terminals replace built-in rows. */
function getActiveImpSchedules(): ImpSchedule[] {
  const overrides = getImpOverrides();
  if (!overrides || Object.keys(overrides).length === 0) return IMP_SCHEDULES;
  const overriddenSet = new Set(Object.keys(overrides));
  const base = IMP_SCHEDULES.filter(s => !overriddenSet.has(s.loc));
  const overrideEntries = Object.values(overrides).flat();
  return [...base, ...overrideEntries];
}

export function impFindScheds(
  termCode: string,
  port: 'RTM' | 'ANR',
  modFilter?: 'Barge' | 'Rail'
): ImpSchedule[] {
  const sc = impScCode(termCode);
  const tn = port === 'RTM' ? 'Rotterdam' : 'Antwerpen';
  return getActiveImpSchedules().filter(
    s => s.t === tn && s.loc === sc && (!modFilter || s.mod === modFilter)
  );
}
