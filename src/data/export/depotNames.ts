export const EXP_DEPOTS: Record<string, string> = {
  'DEDUI01': 'Hutchison Ports Duisburg',
  'DEDTM01': 'CTD Dortmund',
  'DEBNX01': 'Bonn AZS',
  'DETREAZ': 'Trier AZS',
  'DEAJHRA': 'Rheinhafen Andernach',
  'DEG4TG':  'Gustavsburg Contargo',
  'DEMNZ01': 'Mainz Frankenbach',
  'DEGRH01': 'Germersheim DPW',
  'DEMUN01': 'Muenchen (Rail Hub)',
  'DENUE02': 'Nuernberg CDN',
};

export const EXP_TERM_NAMES: Record<string, string> = {
  'NLROTTM':  'APM Terminals Rotterdam',
  'NLROTWG':  'Rotterdam World Gateway',
  'NLROT01':  'Hutchison Ports Delta II',
  'NLROT21':  'ECT Delta Terminal',
  'BEANT869': 'PSA Europa Terminal',
  'BEANT913': 'PSA Noordzee Terminal',
};

// YOT = calendar days before vessel ETD the terminal starts accepting gate-in
export const EXP_TERM_YOT: Record<string, number> = {
  'NLROTTM':  5,
  'NLROTWG':  7,
  'NLROT01':  8,
  'NLROT21':  8,
  'BEANT869': 7,
  'BEANT913': 7,
};
