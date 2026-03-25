/**
 * scheduleExcel.ts
 *
 * Download current schedule data as an .xlsx workbook, and parse
 * an uploaded .xlsx workbook back into schedule override objects.
 *
 * Both sheets use the same simplified structure:
 *   Import: Port | Terminal Code | Mode | ETD Day | ETA Day
 *   Export: Port | Depot Code   | Mode | ETD Day | ETA Day
 *
 * Transit days are auto-calculated from the ETD→ETA day difference.
 * Buffer days default to: Rail = 2, Barge = 1.
 * Terminal Filter (Export) is no longer required — advanced use only via manual upload.
 */

import * as XLSX from 'xlsx';
import { IMP_SCHEDULES, ImpSchedule } from '../data/import/schedules';
import { EXP_SCHED, ExpScheduleEntry } from '../data/export/schedules';
import { IMP_TERM_NAMES } from '../data/import/terminalNames';
import { EXP_DEPOTS } from '../data/export/depotNames';
import { ImpOverrides, ExpOverrides } from './scheduleOverrides';

// ISO weekday lookup: 1=Mon … 7=Sun
const ISO_TO_DAY: Record<number, string> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun',
};
const DAY_TO_ISO: Record<string, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
};

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build and download an .xlsx file with two sheets:
 *   "Import Schedules" — all IMP_SCHEDULES entries
 *   "Export Schedules" — all EXP_SCHED entries
 *
 * This represents the current live schedule data (including any active
 * overrides, so the download always reflects what the tool is using).
 */
export function downloadSchedulesExcel(
  impSchedules: ImpSchedule[] = IMP_SCHEDULES,
  expSched: typeof EXP_SCHED = EXP_SCHED,
): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Import Schedules ──────────────────────────────────────────────
  const impHeader = ['Port', 'Terminal Code', 'Terminal Name (reference only)', 'Mode', 'ETD Day', 'ETA Day'];
  const impData = impSchedules.map(s => [
    s.t,
    s.loc,
    IMP_TERM_NAMES[s.loc] ?? s.loc,
    s.mod,
    s.etd,
    s.eta,
  ]);
  const wsImp = XLSX.utils.aoa_to_sheet([impHeader, ...impData]);
  wsImp['!cols'] = [
    { wch: 12 }, { wch: 14 }, { wch: 32 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
  ];
  wsImp['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsImp, 'Import Schedules');

  // ── Sheet 2: Export Schedules (simplified — ETD + ETA only) ───────────────
  const expHeader = [
    'Port', 'Depot Code', 'Depot Name (reference only)', 'Mode', 'ETD Day', 'ETA Day',
  ];
  const expData: (string | number)[][] = [];
  for (const [depotCode, ports] of Object.entries(expSched)) {
    for (const [portKey, entries] of Object.entries(ports)) {
      if (!entries) continue;
      for (const e of entries) {
        // Calculate the ETA day from departure + transit
        const etaDayNum = ((e.dep - 1 + e.transit) % 7) + 1;
        expData.push([
          portKey,
          depotCode,
          EXP_DEPOTS[depotCode] ?? depotCode,
          e.mod,
          ISO_TO_DAY[e.dep] ?? String(e.dep),
          ISO_TO_DAY[etaDayNum] ?? String(etaDayNum),
        ]);
      }
    }
  }
  const wsExp = XLSX.utils.aoa_to_sheet([expHeader, ...expData]);
  wsExp['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 32 }, { wch: 8 }, { wch: 10 }, { wch: 10 },
  ];
  wsExp['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, wsExp, 'Export Schedules');

  // ── Instructions sheet ────────────────────────────────────────────────────
  const instrData = [
    ['MAERSK DE INLAND PLANNING TOOL — Schedule Update Template'],
    [''],
    ['SIMPLIFIED STRUCTURE — both sheets work the same way:'],
    ['  Port | Code | Mode | ETD Day | ETA Day'],
    [''],
    ['HOW TO UPDATE SCHEDULES'],
    ['1. Edit the "Import Schedules" or "Export Schedules" sheets only.'],
    ['2. Only include rows for the terminals/depots that have changed.'],
    ['3. Valid values for Port (Import):  Rotterdam | Antwerpen'],
    ['4. Valid values for Port (Export):  RTM | ANR'],
    ['5. Valid values for Mode:           Barge | Rail'],
    ['6. Valid values for ETD Day / ETA Day:  Mon  Tue  Wed  Thu  Fri  Sat  Sun'],
    [''],
    ['AUTOMATIC CALCULATIONS'],
    ['Transit days are auto-calculated from the ETD→ETA day difference.'],
    ['Buffer days default to: Rail = 2 days, Barge = 1 day.'],
    ['You do NOT need to enter transit or buffer — just ETD and ETA days.'],
    [''],
    ['To reset all custom schedules back to built-in defaults, use the'],
    ['"Reset to defaults" button in the Schedule Manager page.'],
  ];
  const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
  wsInstr['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instructions');

  const fileName = `maersk-de-schedules-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSE UPLOADED FILE
// ─────────────────────────────────────────────────────────────────────────────

export interface ParseResult {
  impOverrides: ImpOverrides;
  expOverrides: ExpOverrides;
  updatedImpTerminals: string[];
  updatedExpDepots: string[];
  impRowCount: number;
  expRowCount: number;
  warnings: string[];
}

/**
 * Parse an uploaded .xlsx file and return schedule overrides.
 * Only terminals/depots present in the file will have entries in the result —
 * allowing partial updates without touching other terminals.
 */
export function parseScheduleFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        const warnings: string[] = [];
        const impOverrides: ImpOverrides = {};
        const expOverrides: ExpOverrides = {};
        const updatedImpTerminals: string[] = [];
        const updatedExpDepots: string[] = [];
        let impRowCount = 0;
        let expRowCount = 0;

        // ── Import sheet ────────────────────────────────────────────────────
        const impSheetName = wb.SheetNames.find(n =>
          n.toLowerCase().replace(/\s/g, '').includes('importschedule') ||
          n.toLowerCase().includes('import')
        );
        if (impSheetName) {
          const ws = wb.Sheets[impSheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

          for (const row of rows) {
            const port = String(row['Port'] ?? '').trim();
            const loc  = String(row['Terminal Code'] ?? '').trim().toUpperCase();
            const mod  = String(row['Mode'] ?? '').trim();
            // Accept both new simplified names and old column names
            const etd  = String(row['ETD Day'] ?? row['Departure Day'] ?? '').trim();
            const eta  = String(row['ETA Day'] ?? row['Arrival Day'] ?? '').trim();

            // Skip blank or header-repeat rows
            if (!port && !loc) continue;

            if (!port || !loc || !mod || !etd || !eta) {
              warnings.push(`Import row skipped — missing fields (terminal: "${loc || 'unknown'}")`);
              continue;
            }
            if (port !== 'Rotterdam' && port !== 'Antwerpen') {
              warnings.push(`Import: unknown port "${port}" for terminal ${loc} — expected Rotterdam or Antwerpen`);
              continue;
            }
            if (mod !== 'Barge' && mod !== 'Rail') {
              warnings.push(`Import: unknown mode "${mod}" for terminal ${loc} — expected Barge or Rail`);
              continue;
            }
            if (!DAY_TO_ISO[etd] && etd !== 'Sun') {
              const validDays = Object.keys(DAY_TO_ISO);
              if (!validDays.includes(etd)) {
                warnings.push(`Import: unknown departure day "${etd}" for terminal ${loc}`);
                continue;
              }
            }

            if (!impOverrides[loc]) {
              impOverrides[loc] = [];
              updatedImpTerminals.push(loc);
            }
            impOverrides[loc].push({
              t: port as 'Rotterdam' | 'Antwerpen',
              loc,
              mod: mod as 'Barge' | 'Rail',
              etd,
              eta,
            });
            impRowCount++;
          }
        } else {
          warnings.push('No "Import Schedules" sheet found in the uploaded file.');
        }

        // ── Export sheet ────────────────────────────────────────────────────
        const expSheetName = wb.SheetNames.find(n =>
          n.toLowerCase().replace(/\s/g, '').includes('exportschedule') ||
          (n.toLowerCase().includes('export') && !n.toLowerCase().includes('import'))
        );
        if (expSheetName) {
          const ws = wb.Sheets[expSheetName];
          const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws, { defval: '' });

          for (const row of rows) {
            const port      = String(row['Port'] ?? '').trim().toUpperCase();
            const depotCode = String(row['Depot Code'] ?? '').trim().toUpperCase();
            const mod       = String(row['Mode'] ?? '').trim();
            // Support both old column name ("Departure Day") and new simplified ("ETD Day")
            const depDay    = String(row['ETD Day'] ?? row['Departure Day'] ?? '').trim();
            // Support both old column name ("Arrival Day") and new simplified ("ETA Day")
            const arrDay    = String(row['ETA Day'] ?? row['Arrival Day'] ?? '').trim();
            // Legacy fields — optional for backward compatibility
            const transitRaw = row['Transit Days'];
            const bufferRaw  = row['Buffer Days'];
            const termsRaw   = String(row['Terminal Filter'] ?? '').trim();

            if (!port && !depotCode) continue;

            if (!port || !depotCode || !mod || !depDay) {
              warnings.push(`Export row skipped — missing fields (depot: "${depotCode || 'unknown'}")`);
              continue;
            }
            if (port !== 'RTM' && port !== 'ANR') {
              warnings.push(`Export: unknown port "${port}" for depot ${depotCode} — expected RTM or ANR`);
              continue;
            }
            if (mod !== 'Barge' && mod !== 'Rail') {
              warnings.push(`Export: unknown mode "${mod}" for depot ${depotCode} — expected Barge or Rail`);
              continue;
            }
            const dep = DAY_TO_ISO[depDay];
            if (!dep) {
              warnings.push(`Export: unknown ETD day "${depDay}" for depot ${depotCode}`);
              continue;
            }

            // Calculate transit from ETD→ETA if ETA day provided; otherwise use legacy Transit Days column
            let transit: number;
            if (arrDay && DAY_TO_ISO[arrDay]) {
              const arr = DAY_TO_ISO[arrDay];
              transit = ((arr - dep + 7) % 7) || 7; // 0 → same day = 7 days
            } else if (transitRaw !== undefined && transitRaw !== '') {
              transit = Number(transitRaw);
              if (isNaN(transit) || transit < 0) {
                warnings.push(`Export: invalid transit "${transitRaw}" for depot ${depotCode}`);
                continue;
              }
            } else {
              warnings.push(`Export row skipped — no ETA Day or Transit Days for depot ${depotCode}`);
              continue;
            }

            // Default buffer: Rail = 2, Barge = 1 — override only if explicit column present
            let buffer: number;
            if (bufferRaw !== undefined && bufferRaw !== '') {
              buffer = Number(bufferRaw);
              if (isNaN(buffer) || buffer < 0) buffer = mod === 'Rail' ? 2 : 1;
            } else {
              buffer = mod === 'Rail' ? 2 : 1;
            }

            if (!expOverrides[depotCode]) {
              expOverrides[depotCode] = {};
              updatedExpDepots.push(depotCode);
            }
            if (!expOverrides[depotCode][port as 'RTM' | 'ANR']) {
              expOverrides[depotCode][port as 'RTM' | 'ANR'] = [];
            }
            const entry: ExpScheduleEntry = { mod: mod as 'Barge' | 'Rail', dep, transit, buffer };
            if (termsRaw) {
              entry.terms = termsRaw.split(',').map(s => s.trim()).filter(Boolean);
            }
            expOverrides[depotCode][port as 'RTM' | 'ANR']!.push(entry);
            expRowCount++;
          }
        } else {
          warnings.push('No "Export Schedules" sheet found in the uploaded file.');
        }

        resolve({
          impOverrides,
          expOverrides,
          updatedImpTerminals,
          updatedExpDepots,
          impRowCount,
          expRowCount,
          warnings,
        });
      } catch (err) {
        reject(new Error(`Failed to parse schedule file: ${String(err)}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
