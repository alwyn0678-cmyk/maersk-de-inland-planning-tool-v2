// ── Operations Shipment Monitor — TypeScript Types ──────────────────────────
// All interfaces for TMS row parsing, risk scoring, and feasibility checking.

// ── Raw TMS row (as returned by XLSX) ─────────────────────────────────────

export interface TmsRawRow {
  'Traffic Direction'?: string;
  'Appointment Date/Time'?: string;
  'Booking Number'?: string | number;
  'Container ID'?: string;
  'Document Type'?: string;
  'Forwarding Order'?: string | number;
  'Freight Order'?: string | number;
  'Linked FRO'?: string | number;
  'Customer Name'?: string;
  'Internal Notes'?: string;
  'Port'?: string;
  'Carrier Name'?: string;
  'Customer Zip code'?: string | number;
  'Empty depot desc. name'?: string;
  'Customer Reference Number'?: string | number;
  'Empty depot RKST code'?: string;
  'Equipment Type'?: string;
  'Subcontr. Status'?: string;
  'IMO Class'?: string;
  'Customer City Name'?: string;
  'MICH'?: string;
  'Vessel Name'?: string;
  'Voyage'?: string;
  'Service Mode'?: string | number;
  'Vessel ETA Date'?: string;
  'Vessel ETD Date'?: string;
  'Vessel Cut-Off Date'?: string;
  'Gross Weight'?: string | number;
  'Commodity Name'?: string;
  'Customs Status'?: string;
  'Document Check Status'?: string;
  'Delay Status'?: string;
  'Delay Reason'?: string;
  'Vendor Comments'?: string;
  'Profitability Status'?: string;
  'Customs Release Stat'?: string;
  'Execution Status'?: string;
  'Custom Clearance Status'?: string;
  'Consignee Name'?: string;
  'Booked By Name'?: string;
  'Means of Transport'?: string;
  'Transport Type'?: string;
}

// ── Normalized shipment (after parsing + mapping) ─────────────────────────

export type TrafficDirection = 'Import' | 'Export' | 'Unknown';
export type ExecutionStatus =
  | 'Not Started'
  | 'In Execution'
  | 'Ready for Transportation Execution'
  | 'Executed'
  | 'Unknown';

export interface EquipmentInfo {
  /** '20' or '40' */
  size: string;
  /** 'standard' | 'reefer' | 'imo' */
  type: string;
  /** Raw TMS code e.g. DRY96 */
  rawCode: string;
}

export interface PortTerminalInfo {
  /** Internal code: NLROTTM, NLROT01, BEANT913 etc. */
  termCode: string;
  termName: string;
  /** RTM or ANR */
  port: 'RTM' | 'ANR';
  /** Yard Opening Time in days */
  yot: number;
  /** "NLROTTM|5|RTM" — expRun format */
  terminalValue: string;
  /** Raw TMS field */
  raw: string;
}

export interface InlandTerminalInfo {
  /** Code from Empty depot RKST code or ZIP-derived */
  code: string;
  /** Human-readable name */
  name: string;
  /** 'tms' = from TMS field | 'zip' = derived from ZIP logic | 'unknown' */
  source: 'tms' | 'zip' | 'unknown';
}

export interface NormalizedShipment {
  /** Unique row identifier (index in parsed array) */
  id: string;

  // ── Direction & status
  direction: TrafficDirection;
  executionStatus: ExecutionStatus;
  subcontrStatus: string | null;
  delayStatus: string | null;
  customsStatus: string | null;

  // ── Key identifiers
  bookingNumber: string | null;
  containerId: string | null;
  forwardingOrder: string | null;
  freightOrder: string | null;

  // ── Customer
  customerName: string | null;
  customerZip: string | null;
  customerCity: string | null;
  customerRef: string | null;
  consigneeName: string | null;
  bookedByName: string | null;

  // ── Appointment (loading date for export, delivery for import)
  appointmentDate: string | null;   // ISO YYYY-MM-DD
  appointmentTime: string | null;   // HH:mm
  appointmentDateTime: Date | null;

  // ── Vessel
  vesselName: string | null;
  voyage: string | null;
  vesselEtaDate: Date | null;       // Import
  vesselEtdDate: Date | null;       // Export
  vesselCutoffDate: Date | null;    // Export CCO

  // ── Equipment
  equipment: EquipmentInfo | null;

  // ── Port terminal (ocean terminal)
  portTerminal: PortTerminalInfo | null;

  // ── Inland terminal (barge/rail depot)
  inlandTerminal: InlandTerminalInfo;

  // ── Empty depot
  emptyDepotCode: string | null;
  emptyDepotName: string | null;

  // ── Carrier / transporter
  carrierName: string | null;
  meansOfTransport: string | null;

  // ── Additional
  imoClass: string | null;
  commodityName: string | null;
  grossWeight: string | null;
  isMich: boolean;
}

// ── Feasibility ────────────────────────────────────────────────────────────

export type FeasibilityStatus = 'Feasible' | 'Tight' | 'Not Feasible' | 'Cannot Validate';

export interface FeasibilityResult {
  status: FeasibilityStatus;
  /** Days between earliest CCO from schedule and Vessel Cut-Off Date */
  bufferDays: number | null;
  /** Earliest CCO calculated from planner schedule */
  earliestCCO: Date | null;
  /** Which departure from expRun was used */
  departureMod: string | null;
  departureEtd: Date | null;
  reason: string | null;
  /** Full expRun result cards for detail drawer (typed as any to avoid circular dep) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plannerCards: any[] | null;
}

// ── Issue flags ────────────────────────────────────────────────────────────

export type IssueCategory =
  | 'vessel-feasibility'
  | 'missing-data'
  | 'not-started-urgency'
  | 'missing-customer-ref'
  | 'terminal-schedule'
  | 'better-option'
  | 'ok';

export interface IssueFlag {
  category: IssueCategory;
  severity: 'critical' | 'high' | 'medium' | 'low';
  label: string;
  detail: string;
}

// ── Risk output ────────────────────────────────────────────────────────────

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'OK';
export type ValidationStatus = 'Fully Validated' | 'Partially Validated' | 'Cannot Validate';

export interface RiskAssessment {
  riskScore: number;           // 0–100
  riskLevel: RiskLevel;
  mainIssue: string;
  issueCategory: IssueCategory;
  recommendedAction: string;
  validationStatus: ValidationStatus;
  flags: IssueFlag[];
  feasibility: FeasibilityResult | null;  // export only
  bufferToCCO: number | null;             // days, export only
}

// ── Final scored shipment ─────────────────────────────────────────────────

export interface ScoredShipment extends NormalizedShipment {
  risk: RiskAssessment;
}

// ── KPI summary ───────────────────────────────────────────────────────────

export interface MonitorKPIs {
  total: number;
  critical: number;
  high: number;
  exportsAtRiskOfMissingCCO: number;
  missingCustomerRefs: number;
  notStartedWithin24h: number;
  noFeasiblePlan: number;
  betterOptionAvailable: number;
}

// ── Filter state ──────────────────────────────────────────────────────────

export interface MonitorFilters {
  riskLevel: string;
  customer: string;
  inlandTerminal: string;
  direction: string;
  executionStatus: string;
  carrier: string;
  issueCategory: string;
  search: string;
}
