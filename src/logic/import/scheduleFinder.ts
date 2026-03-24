import { IMP_SCHEDULES, ImpSchedule } from '../../data/import/schedules';
import { impScCode } from './zipLookup';

export function impFindScheds(
  termCode: string,
  port: 'RTM' | 'ANR',
  modFilter?: 'Barge' | 'Rail'
): ImpSchedule[] {
  const sc = impScCode(termCode);
  const tn = port === 'RTM' ? 'Rotterdam' : 'Antwerpen';
  return IMP_SCHEDULES.filter(
    s => s.t === tn && s.loc === sc && (!modFilter || s.mod === modFilter)
  );
}
