export interface ExpScheduleEntry {
  mod: 'Barge' | 'Rail';
  dep: number;      // ISO day: 1=Mon...7=Sun
  transit: number;
  buffer: number;
  terms?: string[]; // optional terminal filter
}

export const EXP_SCHED: Record<string, { RTM?: ExpScheduleEntry[]; ANR?: ExpScheduleEntry[] }> = {
  'DEDUI01': {
    RTM: [
      { mod: 'Rail',  dep: 4, transit: 1, buffer: 2 },
      { mod: 'Rail',  dep: 7, transit: 2, buffer: 2 },
      { mod: 'Barge', dep: 3, transit: 3, buffer: 2 },
      { mod: 'Barge', dep: 5, transit: 3, buffer: 2 },
    ],
    ANR: [
      { mod: 'Barge', dep: 2, transit: 3, buffer: 2 },
      { mod: 'Barge', dep: 6, transit: 3, buffer: 2 },
    ],
  },
  'DEBNX01': {
    RTM: [
      { mod: 'Barge', dep: 2, transit: 3, buffer: 2 },
      { mod: 'Barge', dep: 6, transit: 2, buffer: 2 },
    ],
    ANR: [
      { mod: 'Barge', dep: 2, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 6, transit: 2, buffer: 2 },
    ],
  },
  'DEAJHRA': {
    RTM: [
      { mod: 'Barge', dep: 6, transit: 3, buffer: 1 },
    ],
    ANR: [
      { mod: 'Barge', dep: 2, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 6, transit: 3, buffer: 1 },
    ],
  },
  'DEGRH01': {
    RTM: [
      { mod: 'Barge', dep: 2, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 5, transit: 4, buffer: 1 },
    ],
    ANR: [
      { mod: 'Barge', dep: 7, transit: 4, buffer: 1 },
      { mod: 'Barge', dep: 3, transit: 4, buffer: 1 },
      { mod: 'Barge', dep: 6, transit: 3, buffer: 1 },
    ],
  },
  'DEG4TG': {
    RTM: [
      { mod: 'Barge', dep: 2, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 4, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 6, transit: 3, buffer: 1 },
    ],
    ANR: [
      { mod: 'Barge', dep: 3, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 6, transit: 3, buffer: 1 },
    ],
  },
  'DEMHG02': {
    RTM: [
      { mod: 'Barge', dep: 1, transit: 4, buffer: 1 },
      { mod: 'Barge', dep: 6, transit: 3, buffer: 1 },
    ],
    ANR: [
      { mod: 'Barge', dep: 1, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 4, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 6, transit: 3, buffer: 1 },
    ],
  },
  'DEMNZ01': {
    RTM: [
      { mod: 'Barge', dep: 1, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 5, transit: 4, buffer: 1 },
    ],
    ANR: [
      { mod: 'Barge', dep: 2, transit: 3, buffer: 1 },
      { mod: 'Barge', dep: 5, transit: 4, buffer: 1 },
    ],
  },
  'DENUE02': {
    RTM: [
      { mod: 'Rail', dep: 1, transit: 1, buffer: 2, terms: ['NLROT21', 'NLROTTM', 'NLROT01'] },
      { mod: 'Rail', dep: 3, transit: 1, buffer: 2, terms: ['NLROTWG', 'NLROTTM', 'NLROT01'] },
      { mod: 'Rail', dep: 4, transit: 1, buffer: 2, terms: ['NLROT01', 'NLROT21', 'NLROTTM'] },
      { mod: 'Rail', dep: 5, transit: 1, buffer: 2, terms: ['NLROT01', 'NLROTTM', 'NLROTWG', 'NLROT21'] },
      { mod: 'Rail', dep: 6, transit: 2, buffer: 2, terms: ['NLROT01', 'NLROTTM'] },
    ],
  },
};
