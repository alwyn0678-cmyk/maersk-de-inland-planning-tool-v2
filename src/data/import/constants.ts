export const IMP_HAS_SCHED = new Set<string>([
  'DEDUI01', 'DEGRH01', 'DEG4TG', 'DEBNX01', 'NUE02', 'DEMHG02', 'DEAJHRA',
]);

export const IMP_NO_RAIL = new Set<string>(['DEMNZ01', 'DEGRH01']);

export const IMP_CODE_ALIAS: Record<string, string> = {
  'DE9G4TG': 'DEG4TG',
  'DENUE02':  'NUE02',
};
