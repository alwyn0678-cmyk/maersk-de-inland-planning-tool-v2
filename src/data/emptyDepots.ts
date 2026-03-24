export interface EmptyDepotSlot {
  p1: string;
  p1n: string;
  p2: string | null;
  p2n: string | null;
}

export interface EmptyDepotRow {
  lo: number;
  hi: number;
  rtm: EmptyDepotSlot;
  anr: EmptyDepotSlot;
}

export const EMPTY_DEPOTS: Record<'40dchc' | '20' | '40reefer', EmptyDepotRow[]> = {
  '40dchc': [
    { lo: 0,     hi: 34999, rtm: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: 'DEDUI03', p2n: 'DIT Depot' },         anr: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: null, p2n: null } },
    { lo: 35000, hi: 36999, rtm: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach',         p2: 'DEG4TG', p2n: 'Gustavsburg Contargo' }, anr: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach', p2: 'DEG4TG', p2n: 'Gustavsburg Contargo' } },
    { lo: 40000, hi: 52999, rtm: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: 'DEDUI03', p2n: 'DIT Depot' },         anr: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: null, p2n: null } },
    { lo: 53000, hi: 53999, rtm: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: 'DEBNX01', p2n: 'Bonn AZS' },         anr: { p1: 'DEBNX01', p1n: 'Bonn AZS', p2: null, p2n: null } },
    { lo: 54000, hi: 54999, rtm: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach',      p2: 'DEBNX01', p2n: 'Am Zehnhoff Bonn' },  anr: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach', p2: null, p2n: null } },
    { lo: 55000, hi: 55999, rtm: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach',         p2: null, p2n: null },                     anr: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach', p2: null, p2n: null } },
    { lo: 56000, hi: 56999, rtm: { p1: 'DEBNX01', p1n: 'Bonn AZS',                  p2: null, p2n: null },                     anr: { p1: 'DEBNX01', p1n: 'Bonn AZS', p2: null, p2n: null } },
    { lo: 57000, hi: 59999, rtm: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: 'DEDUI03', p2n: 'DIT Depot' },         anr: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: null, p2n: null } },
    { lo: 60000, hi: 65999, rtm: { p1: 'DEG4TG',  p1n: 'Gustavsburg Contargo',      p2: 'DEMNZ01', p2n: 'Mainz Frankenbach' },  anr: { p1: 'DEG4TG',  p1n: 'Gustavsburg Contargo', p2: 'DEMNZ01', p2n: 'Mainz Frankenbach' } },
    { lo: 66000, hi: 79999, rtm: { p1: 'DEGRH01', p1n: 'Germersheim DPW',           p2: null, p2n: null },                     anr: { p1: 'DEGRH01', p1n: 'Germersheim DPW', p2: null, p2n: null } },
    { lo: 80000, hi: 87999, rtm: { p1: 'DEMUN01', p1n: 'Muenchen',                  p2: null, p2n: null },                     anr: { p1: 'DEMUN01', p1n: 'Muenchen', p2: null, p2n: null } },
    { lo: 88000, hi: 89999, rtm: { p1: 'DEGRH01', p1n: 'Germersheim DPW',           p2: null, p2n: null },                     anr: { p1: 'DEGRH01', p1n: 'Germersheim DPW', p2: null, p2n: null } },
    { lo: 90000, hi: 99000, rtm: { p1: 'DENUE02', p1n: 'Nuernberg CDN',             p2: null, p2n: null },                     anr: { p1: 'DENUE02', p1n: 'Nuernberg CDN', p2: null, p2n: null } },
  ],
  '20': [
    { lo: 0,     hi: 34999, rtm: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: 'DEDUI03', p2n: 'DIT Depot' },         anr: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: null, p2n: null } },
    { lo: 35000, hi: 36999, rtm: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach',      p2: 'DEBNX01', p2n: 'Bonn AZS' },         anr: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach', p2: 'DEBNX01', p2n: 'Bonn AZS' } },
    { lo: 40000, hi: 52999, rtm: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: 'DEDUI03', p2n: 'DIT Depot' },         anr: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: null, p2n: null } },
    { lo: 53000, hi: 53999, rtm: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: 'DEBNX01', p2n: 'Bonn AZS' },         anr: { p1: 'DEBNX01', p1n: 'Bonn AZS', p2: null, p2n: null } },
    { lo: 54000, hi: 54999, rtm: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach',      p2: null, p2n: null },                     anr: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach', p2: null, p2n: null } },
    { lo: 55000, hi: 55999, rtm: { p1: 'DEG4TG',  p1n: 'Gustavsburg Contargo',      p2: 'DEAJHRA', p2n: 'Rheinhafen Andernach' }, anr: { p1: 'DEG4TG', p1n: 'Gustavsburg Contargo', p2: 'DEAJHRA', p2n: 'Rheinhafen Andernach' } },
    { lo: 56000, hi: 56999, rtm: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach',      p2: 'DEBNX01', p2n: 'Bonn AZS' },         anr: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach', p2: 'DEBNX01', p2n: 'Bonn AZS' } },
    { lo: 57000, hi: 59999, rtm: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: 'DEDUI03', p2n: 'DIT Depot' },         anr: { p1: 'DEDUI01', p1n: 'Hutchison Ports Duisburg', p2: null, p2n: null } },
    { lo: 60000, hi: 65999, rtm: { p1: 'DEG4TG',  p1n: 'Gustavsburg Contargo',      p2: 'DEAJHRA', p2n: 'Rheinhafen Andernach' }, anr: { p1: 'DEG4TG', p1n: 'Gustavsburg Contargo', p2: 'DEAJHRA', p2n: 'Rheinhafen Andernach' } },
    { lo: 66000, hi: 79999, rtm: { p1: 'DEGRH01', p1n: 'Germersheim DPW',           p2: null, p2n: null },                     anr: { p1: 'DEGRH01', p1n: 'Germersheim DPW', p2: null, p2n: null } },
    { lo: 80000, hi: 87999, rtm: { p1: 'DEMUN01', p1n: 'Muenchen',                  p2: null, p2n: null },                     anr: { p1: 'DEMUN01', p1n: 'Muenchen', p2: null, p2n: null } },
    { lo: 88000, hi: 89999, rtm: { p1: 'DEGRH01', p1n: 'Germersheim DPW',           p2: null, p2n: null },                     anr: { p1: 'DEGRH01', p1n: 'Germersheim DPW', p2: null, p2n: null } },
    { lo: 90000, hi: 99000, rtm: { p1: 'DENUE02', p1n: 'Nuernberg CDN',             p2: null, p2n: null },                     anr: { p1: 'DENUE02', p1n: 'Nuernberg CDN', p2: null, p2n: null } },
  ],
  '40reefer': [
    { lo: 0,     hi: 34999, rtm: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null }, anr: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null } },
    { lo: 35000, hi: 36999, rtm: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach',  p2: null, p2n: null }, anr: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach', p2: null, p2n: null } },
    { lo: 40000, hi: 52999, rtm: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null }, anr: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null } },
    { lo: 53000, hi: 53999, rtm: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null }, anr: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null } },
    { lo: 54000, hi: 54999, rtm: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach', p2: 'DEBNX01', p2n: 'Am Zehnhoff Bonn' }, anr: { p1: 'DEAJHRA', p1n: 'Rheinhafen Andernach', p2: null, p2n: null } },
    { lo: 55000, hi: 55999, rtm: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach',  p2: null, p2n: null }, anr: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach', p2: null, p2n: null } },
    { lo: 56000, hi: 56999, rtm: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null }, anr: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null } },
    { lo: 57000, hi: 59999, rtm: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null }, anr: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null } },
    { lo: 60000, hi: 65999, rtm: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach',  p2: null, p2n: null }, anr: { p1: 'DEMNZ01', p1n: 'Mainz Frankenbach', p2: null, p2n: null } },
    { lo: 66000, hi: 79999, rtm: { p1: 'DEGRH01', p1n: 'Germersheim DPW',    p2: null, p2n: null }, anr: { p1: 'DEGRH01', p1n: 'Germersheim DPW', p2: null, p2n: null } },
    { lo: 80000, hi: 87999, rtm: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null }, anr: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null } },
    { lo: 88000, hi: 89999, rtm: { p1: 'DEGRH01', p1n: 'Germersheim DPW',    p2: null, p2n: null }, anr: { p1: 'DEGRH01', p1n: 'Germersheim DPW', p2: null, p2n: null } },
    { lo: 90000, hi: 99000, rtm: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null }, anr: { p1: 'REQUEST', p1n: 'Request Inland Ops', p2: null, p2n: null } },
  ],
};
