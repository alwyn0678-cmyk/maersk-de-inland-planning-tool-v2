export interface ImpSchedule {
  t: 'Rotterdam' | 'Antwerpen';
  etd: string;
  loc: string;
  eta: string;
  mod: 'Barge' | 'Rail';
}

export const IMP_SCHEDULES: ImpSchedule[] = [
  // === DEMHG02 (Mannheim) ===
  { t: 'Antwerpen', etd: 'Wed', loc: 'DEMHG02', eta: 'Mon', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Sat', loc: 'DEMHG02', eta: 'Thu', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Mon', loc: 'DEMHG02', eta: 'Sat', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Thu', loc: 'DEMHG02', eta: 'Tue', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Mon', loc: 'DEMHG02', eta: 'Sat', mod: 'Barge' },
  // === DEGRH01 (Germersheim) ===
  { t: 'Antwerpen', etd: 'Wed', loc: 'DEGRH01', eta: 'Mon', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Sat', loc: 'DEGRH01', eta: 'Wed', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Mon', loc: 'DEGRH01', eta: 'Fri', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Thu', loc: 'DEGRH01', eta: 'Tue', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Mon', loc: 'DEGRH01', eta: 'Fri', mod: 'Barge' },
  // === DEAJHRA (Andernach) ===
  { t: 'Antwerpen', etd: 'Mon', loc: 'DEAJHRA', eta: 'Fri', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Thu', loc: 'DEAJHRA', eta: 'Mon', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Mon', loc: 'DEAJHRA', eta: 'Thu', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Wed', loc: 'DEAJHRA', eta: 'Mon', mod: 'Barge' },
  // === DEG4TG (Gustavsburg) ===
  { t: 'Antwerpen', etd: 'Mon', loc: 'DEG4TG', eta: 'Fri', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Fri', loc: 'DEG4TG', eta: 'Mon', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Mon', loc: 'DEG4TG', eta: 'Fri', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Thu', loc: 'DEG4TG', eta: 'Mon', mod: 'Barge' },
  // === DEDUI01 (Duisburg) — Updated Mar 2026 ===
  { t: 'Antwerpen', etd: 'Sun', loc: 'DEDUI01', eta: 'Fri', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Mon', loc: 'DEDUI01', eta: 'Fri', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Tue', loc: 'DEDUI01', eta: 'Fri', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Wed', loc: 'DEDUI01', eta: 'Mon', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Thu', loc: 'DEDUI01', eta: 'Mon', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Fri', loc: 'DEDUI01', eta: 'Mon', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Wed', loc: 'DEDUI01', eta: 'Fri', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Sat', loc: 'DEDUI01', eta: 'Mon', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Wed', loc: 'DEDUI01', eta: 'Fri', mod: 'Rail' },
  { t: 'Rotterdam', etd: 'Thu', loc: 'DEDUI01', eta: 'Mon', mod: 'Rail' },
  // === DEBNX01 (Bonn) ===
  { t: 'Antwerpen', etd: 'Mon', loc: 'DEBNX01', eta: 'Fri', mod: 'Barge' },
  { t: 'Antwerpen', etd: 'Thu', loc: 'DEBNX01', eta: 'Tue', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Mon', loc: 'DEBNX01', eta: 'Fri', mod: 'Barge' },
  { t: 'Rotterdam', etd: 'Thu', loc: 'DEBNX01', eta: 'Tue', mod: 'Barge' },
  // === NUE02 (Nuernberg) ===
  { t: 'Rotterdam', etd: 'Tue', loc: 'NUE02', eta: 'Thu', mod: 'Rail' },
  { t: 'Rotterdam', etd: 'Fri', loc: 'NUE02', eta: 'Sun', mod: 'Rail' },
];
