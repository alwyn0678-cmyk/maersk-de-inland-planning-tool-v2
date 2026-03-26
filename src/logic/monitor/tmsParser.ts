// ── TMS Excel Parser ─────────────────────────────────────────────────────────
// Parses raw XLSX rows from the TMS export into NormalizedShipment objects.
// Uses existing planner logic (terminal names, ZIP lookups) for enrichment.

import {
  TmsRawRow,
  NormalizedShipment,
  EquipmentInfo,
  PortTerminalInfo,
  InlandTerminalInfo,
  TrafficDirection,
  ExecutionStatus,
} from '../../types/monitor';
import { IMP_TERM_NAMES } from '../../data/import/terminalNames';
import { EXP_DEPOTS } from '../../data/export/depotNames';
import { impLookupTerms } from '../import/zipLookup';
import { expFindRule } from '../export/ruleLookup';

// ── Ocean terminal mapping ────────────────────────────────────────────────
// Maps the TMS "Port" field string to the tool's internal terminal codes.

interface OceanTerminal {
  termCode: string;
  termName: string;
  port: 'RTM' | 'ANR';
  yot: number;
}

const OCEAN_TERMINAL_MAP: Record<string, OceanTerminal> = {
  'NLROT - Hutchison Ports Delta II':     { termCode: 'NLROT01',  termName: 'Hutchison Ports Delta II',     port: 'RTM', yot: 8 },
  'NLROT - APM 2 Terminal Maasvlakte II': { termCode: 'NLROTTM',  termName: 'APM Terminals Rotterdam',      port: 'RTM', yot: 5 },
  'NLROT - Delta Container Terminal':     { termCode: 'NLROT21',  termName: 'ECT Delta Terminal',            port: 'RTM', yot: 8 },
  'NLROT - Rotterdam World Gateway':      { termCode: 'NLROTWG',  termName: 'Rotterdam World Gateway',      port: 'RTM', yot: 7 },
  'BEANT - PSA Antwerp K913 Noordzee':    { termCode: 'BEANT913', termName: 'PSA Noordzee Terminal',        port: 'ANR', yot: 7 },
  'BEANT - Europa Terminal Quay 869':     { termCode: 'BEANT869', termName: 'PSA Europa Terminal',          port: 'ANR', yot: 7 },
  'BEANT - Antwerp Container Terminal 730': { termCode: 'BEANT913', termName: 'Antwerp Container Terminal', port: 'ANR', yot: 7 },
};

// ── Equipment type mapping ─────────────────────────────────────────────────

const EQUIPMENT_MAP: Record<string, EquipmentInfo> = {
  'DRY96': { size: '40', type: 'standard', rawCode: 'DRY96' },
  'DRY86': { size: '20', type: 'standard', rawCode: 'DRY86' },
  'REEF96': { size: '40', type: 'reefer',  rawCode: 'REEF96' },
  'RMAG96': { size: '40', type: 'reefer',  rawCode: 'RMAG96' },
};

// Additional known inland depot names not in tool's main maps
const EXTRA_DEPOT_NAMES: Record<string, string> = {
  'DEKLN01': 'CTS Cologne',
  'DEDUSDC': 'DCH Düsseldorf',
  'DEFRMCF': 'Contargo Frankfurt Main',
  'DEWRT01': 'Contargo Wörth-Karlsruhe',
  'BEAAFTM': 'Antwerp Free Trade Zone',
  'DEFRM01': 'Frankfurt Depot',
  'NLROT22': 'Rotterdam Depot',
  'DEGRHM1': 'Germersheim DPW',
  'DENUEU2': 'Nuernberg CDN',
  'BEANTA1': 'Antwerp Depot',
  'NLROTTM': 'APM Terminals Rotterdam',
  'BEANT913': 'PSA Noordzee Terminal',
};

/** Resolve an inland depot code to a human-readable name */
export function resolveDepotName(code: string): string {
  return (
    IMP_TERM_NAMES[code] ||
    EXP_DEPOTS[code] ||
    EXTRA_DEPOT_NAMES[code] ||
    code
  );
}

/** Parse TMS date format "DD.MM.YYYY HH:MM:SS CET" → Date (local) */
export function parseTmsDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  // format: "09.04.2026 17:00:00 CET"
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, dd, mo, yyyy, hh, mm] = m;
  return new Date(
    parseInt(yyyy), parseInt(mo) - 1, parseInt(dd),
    parseInt(hh), parseInt(mm), 0, 0
  );
}

/** Extract ISO date string YYYY-MM-DD from a Date */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Extract HH:mm from a Date */
function toHHMM(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** Normalize ZIP to 4–5 digit string */
function normalizeZip(raw: string | number | undefined | null): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).trim().replace(/\D/g, '').padStart(5, '0');
  if (s.length !== 5) return null;
  return s;
}

/** Derive the inland terminal from TMS data + ZIP planner logic */
function deriveInlandTerminal(
  emptyDepotCode: string | null,
  zip: string | null,
  direction: TrafficDirection,
  portTerminal: PortTerminalInfo | null,
): InlandTerminalInfo {
  // Primary: use Empty depot RKST code directly — most reliable TMS source
  if (emptyDepotCode && emptyDepotCode.length >= 5) {
    return {
      code: emptyDepotCode,
      name: resolveDepotName(emptyDepotCode),
      source: 'tms',
    };
  }

  // Fallback: derive from ZIP + direction using planner logic
  if (zip) {
    try {
      if (direction === 'Export') {
        const port = portTerminal?.port || 'RTM';
        const rule = expFindRule(zip);
        const opts = port === 'ANR' ? (rule?.anr || rule?.rtm) : rule?.rtm;
        if (opts?.p1) {
          return {
            code: opts.p1,
            name: resolveDepotName(opts.p1),
            source: 'zip',
          };
        }
      } else if (direction === 'Import') {
        const port = portTerminal?.port || 'RTM';
        const portCode = port === 'ANR' ? 'ANR' : 'RTM';
        const terms = impLookupTerms(zip, portCode);
        const code = terms?.b || terms?.r;
        if (code) {
          return {
            code,
            name: resolveDepotName(code),
            source: 'zip',
          };
        }
      }
    } catch {
      // ZIP lookup failed — fall through to unknown
    }
  }

  return { code: 'UNKNOWN', name: 'Unknown', source: 'unknown' };
}

/** Parse a single TMS raw row into a NormalizedShipment */
export function parseTmsRow(row: TmsRawRow, index: number): NormalizedShipment {
  const direction = (row['Traffic Direction'] === 'Export' ? 'Export'
    : row['Traffic Direction'] === 'Import' ? 'Import'
    : 'Unknown') as TrafficDirection;

  const executionStatus = (row['Execution Status'] || 'Unknown') as ExecutionStatus;

  // Appointment date/time
  const apptDt = parseTmsDate(row['Appointment Date/Time']);
  const appointmentDate = apptDt ? toISODate(apptDt) : null;
  const appointmentTime = apptDt ? toHHMM(apptDt) : null;

  // Vessel dates
  const vesselEtaDate   = parseTmsDate(row['Vessel ETA Date']);
  const vesselEtdDate   = parseTmsDate(row['Vessel ETD Date']);
  const vesselCutoffDate = parseTmsDate(row['Vessel Cut-Off Date']);

  // Equipment
  const eqCode = String(row['Equipment Type'] || '').trim().toUpperCase();
  // Clone so IMO mutation below never modifies the shared EQUIPMENT_MAP constant
  const equipment = EQUIPMENT_MAP[eqCode]
    ? { ...EQUIPMENT_MAP[eqCode] }
    : (eqCode ? { size: '40', type: 'standard', rawCode: eqCode } : null);

  // Port/ocean terminal
  const portRaw = String(row['Port'] || '').trim();
  const oceanTerm = OCEAN_TERMINAL_MAP[portRaw];
  const portTerminal: PortTerminalInfo | null = oceanTerm
    ? {
        ...oceanTerm,
        terminalValue: `${oceanTerm.termCode}|${oceanTerm.yot}|${oceanTerm.port}`,
        raw: portRaw,
      }
    : portRaw
      ? {
          termCode: portRaw.split('-')[0]?.trim() || 'UNKNOWN',
          termName: portRaw.split('-')[1]?.trim() || portRaw,
          port: portRaw.startsWith('BEANT') ? 'ANR' : 'RTM',
          yot: 7,
          terminalValue: '',
          raw: portRaw,
        }
      : null;

  // ZIP
  const customerZip = normalizeZip(row['Customer Zip code']);

  // Empty depot
  const emptyDepotCode = String(row['Empty depot RKST code'] || '').trim() || null;
  const emptyDepotName = emptyDepotCode ? resolveDepotName(emptyDepotCode) : null;

  // Inland terminal
  const inlandTerminal = deriveInlandTerminal(emptyDepotCode, customerZip, direction, portTerminal);

  // Customer ref — normalise to string or null
  const refRaw = row['Customer Reference Number'];
  const customerRef = (refRaw !== null && refRaw !== undefined && String(refRaw).trim() !== '')
    ? String(refRaw).trim()
    : null;

  // Booking / container
  const bookingNumber = row['Booking Number'] ? String(row['Booking Number']).trim() : null;
  const containerId   = row['Container ID']   ? String(row['Container ID']).trim()   : null;

  // IMO flag
  const imoClass = row['IMO Class'] ? String(row['IMO Class']).trim() : null;
  const isImo = !!(imoClass && imoClass !== '');
  // Override equipment type if IMO class set
  if (isImo && equipment) {
    equipment.type = 'imo';
  }

  return {
    id: `row-${index}`,
    direction,
    executionStatus,
    subcontrStatus: row['Subcontr. Status'] ? String(row['Subcontr. Status']).trim() : null,
    delayStatus: row['Delay Status'] ? String(row['Delay Status']).trim() : null,
    customsStatus: row['Customs Status'] ? String(row['Customs Status']).trim() : null,
    bookingNumber,
    containerId,
    forwardingOrder: row['Forwarding Order'] ? String(row['Forwarding Order']).trim() : null,
    freightOrder: row['Freight Order'] ? String(row['Freight Order']).trim() : null,
    customerName: row['Customer Name'] ? String(row['Customer Name']).trim() : null,
    customerZip,
    customerCity: row['Customer City Name'] ? String(row['Customer City Name']).trim() : null,
    customerRef,
    consigneeName: row['Consignee Name'] ? String(row['Consignee Name']).trim() : null,
    bookedByName: row['Booked By Name'] ? String(row['Booked By Name']).trim() : null,
    appointmentDate,
    appointmentTime,
    appointmentDateTime: apptDt,
    vesselName: row['Vessel Name'] ? String(row['Vessel Name']).trim() : null,
    voyage: row['Voyage'] ? String(row['Voyage']).trim() : null,
    vesselEtaDate,
    vesselEtdDate,
    vesselCutoffDate,
    equipment,
    portTerminal,
    inlandTerminal,
    emptyDepotCode,
    emptyDepotName,
    carrierName: row['Carrier Name'] ? String(row['Carrier Name']).trim() : null,
    meansOfTransport: row['Means of Transport'] ? String(row['Means of Transport']).trim() : null,
    imoClass,
    commodityName: row['Commodity Name'] ? String(row['Commodity Name']).trim() : null,
    grossWeight: row['Gross Weight'] ? String(row['Gross Weight']).trim() : null,
    isMich: String(row['MICH'] || '').includes('MICH') && !String(row['MICH'] || '').includes('Non-MICH'),
  };
}

/** Parse a full sheet of TMS raw rows */
export function parseTmsSheet(rows: TmsRawRow[]): NormalizedShipment[] {
  return rows
    .filter(r => r['Traffic Direction'] === 'Import' || r['Traffic Direction'] === 'Export')
    .map((row, i) => parseTmsRow(row, i));
}
