export interface ExpRule {
  id: string;
  zipLabel: string;
  ranges: [number, number][];
  rtm: { p1: string | null; p2?: string };
  anr: { p1: string | null; p2?: string };
}

export const EXP_RULES: ExpRule[] = [
  { id: 'r01', zipLabel: '31000–31999', ranges: [[31000, 31999]], rtm: { p1: 'DEDTM01' }, anr: { p1: null } },
  { id: 'r02', zipLabel: '32000–34999', ranges: [[32000, 34999]], rtm: { p1: 'DEDUI01' }, anr: { p1: 'DEDUI01' } },
  { id: 'r03', zipLabel: '35000–36999', ranges: [[35000, 36999]], rtm: { p1: 'DEMNZ01' }, anr: { p1: 'DEMNZ01' } },
  { id: 'r04', zipLabel: '37000–39999', ranges: [[37000, 39999]], rtm: { p1: 'DEDTM01' }, anr: { p1: 'DEDUI01' } },
  { id: 'r05', zipLabel: '40000–47999', ranges: [[40000, 47999]], rtm: { p1: 'DEDUI01' }, anr: { p1: 'DEDUI01' } },
  { id: 'r06', zipLabel: '48000–53999', ranges: [[48000, 53999]], rtm: { p1: 'DEDUI01' }, anr: { p1: 'DEDUI01' } },
  { id: 'r07', zipLabel: '54000–54999', ranges: [[54000, 54999]], rtm: { p1: 'DEAJHRA' }, anr: { p1: 'DEAJHRA' } },
  { id: 'r08', zipLabel: '55000–55999', ranges: [[55000, 55999]], rtm: { p1: 'DEAJHRA' }, anr: { p1: 'DEAJHRA' } },
  { id: 'r09', zipLabel: '56000–56999', ranges: [[56000, 56999]], rtm: { p1: 'DEAJHRA', p2: 'DEBNX01' }, anr: { p1: 'DEAJHRA', p2: 'DEBNX01' } },
  { id: 'r10', zipLabel: '57000–59999', ranges: [[57000, 59999]], rtm: { p1: 'DEDUI01' }, anr: { p1: 'DEDUI01' } },
  { id: 'r11', zipLabel: '60000–65999', ranges: [[60000, 65999]], rtm: { p1: 'DEG4TG' },  anr: { p1: 'DEG4TG' } },
  { id: 'r12', zipLabel: '66000–89999', ranges: [[66000, 89999]], rtm: { p1: 'DEGRH01' }, anr: { p1: 'DEGRH01' } },
  { id: 'r13', zipLabel: '90000–97999', ranges: [[90000, 97999]], rtm: { p1: 'DENUE02' }, anr: { p1: null } },
];
