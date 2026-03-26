// ── Risk Scorer ──────────────────────────────────────────────────────────────
// Runs all issue checks on a NormalizedShipment and returns a full RiskAssessment.
// Checks are run in order of severity. The highest-severity flag becomes mainIssue.

import {
  NormalizedShipment,
  RiskAssessment,
  RiskLevel,
  IssueFlag,
  IssueCategory,
  ValidationStatus,
  ScoredShipment,
  MonitorKPIs,
} from '../../types/monitor';
import { checkExportFeasibility } from './feasibilityChecker';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Hours between now and a Date (negative = in the past) */
function hoursUntil(d: Date): number {
  return (d.getTime() - Date.now()) / (1000 * 60 * 60);
}

/** Days between now and a Date (negative = in the past) */
function daysUntil(d: Date): number {
  return (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  if (score >= 20) return 'Low';
  return 'OK';
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual checks — each returns zero or more IssueFlags
// ─────────────────────────────────────────────────────────────────────────────

/** Check 1: Missing planning data */
function checkMissingData(s: NormalizedShipment): IssueFlag[] {
  const flags: IssueFlag[] = [];

  if (!s.customerZip) {
    flags.push({
      category: 'missing-data',
      severity: 'medium',
      label: 'Missing Customer ZIP',
      detail: 'Cannot run planner logic without ZIP. Planner and terminal derivation unavailable.',
    });
  }
  if (!s.containerId) {
    flags.push({
      category: 'missing-data',
      severity: 'medium',
      label: 'Missing Container Number',
      detail: 'Container ID is blank in TMS.',
    });
  }
  if (!s.bookingNumber) {
    flags.push({
      category: 'missing-data',
      severity: 'medium',
      label: 'Missing Booking Number',
      detail: 'Booking Number is blank in TMS.',
    });
  }
  if (!s.emptyDepotCode) {
    flags.push({
      category: 'missing-data',
      severity: 'low',
      label: 'Missing Empty Depot',
      detail: 'Empty depot RKST code is not set in TMS.',
    });
  }
  if (!s.vesselName) {
    flags.push({
      category: 'missing-data',
      severity: 'medium',
      label: 'Missing Vessel Name',
      detail: 'Vessel name is blank in TMS.',
    });
  }
  if (!s.voyage) {
    flags.push({
      category: 'missing-data',
      severity: 'medium',
      label: 'Missing Voyage',
      detail: 'Voyage number is blank in TMS.',
    });
  }

  if (s.direction === 'Export') {
    if (!s.vesselCutoffDate) {
      flags.push({
        category: 'missing-data',
        severity: 'high',
        label: 'Missing Vessel Cut-Off Date',
        detail: 'Vessel Cut-Off Date is required for export CCO feasibility checks.',
      });
    }
  }
  if (s.direction === 'Import') {
    if (!s.vesselEtaDate) {
      flags.push({
        category: 'missing-data',
        severity: 'medium',
        label: 'Missing Vessel ETA Date',
        detail: 'Vessel ETA Date is missing for this import shipment.',
      });
    }
  }

  return flags;
}

/** Check 2: Missing customer reference (export, time-sensitive) */
function checkMissingCustomerRef(s: NormalizedShipment): IssueFlag[] {
  if (s.direction !== 'Export') return [];
  if (s.customerRef) return [];
  if (!s.appointmentDateTime) return [];

  const hours = hoursUntil(s.appointmentDateTime);
  if (hours > 48) return [];

  if (hours <= 0) {
    return [{
      category: 'missing-customer-ref',
      severity: 'critical',
      label: 'Missing Customer Reference — Overdue',
      detail: `Appointment has passed (${Math.abs(Math.floor(hours))}h ago) and no Customer Reference is set.`,
    }];
  }
  if (hours <= 24) {
    return [{
      category: 'missing-customer-ref',
      severity: 'high',
      label: 'Missing Customer Reference — Within 24h',
      detail: `Appointment in ${Math.floor(hours)}h and no Customer Reference is set.`,
    }];
  }
  return [{
    category: 'missing-customer-ref',
    severity: 'medium',
    label: 'Missing Customer Reference — Within 48h',
    detail: `Appointment in ${Math.floor(hours)}h and no Customer Reference is set.`,
  }];
}

/** Check 3: Not Started urgency */
function checkNotStartedUrgency(s: NormalizedShipment): IssueFlag[] {
  if (s.executionStatus !== 'Not Started') return [];
  if (!s.appointmentDateTime) return [];

  const hours = hoursUntil(s.appointmentDateTime);

  // Overdue
  if (hours < 0) {
    return [{
      category: 'not-started-urgency',
      severity: 'critical',
      label: 'Not Started — Overdue',
      detail: `Appointment was ${Math.abs(Math.floor(hours))}h ago and execution has not started.`,
    }];
  }
  if (hours <= 12) {
    return [{
      category: 'not-started-urgency',
      severity: 'critical',
      label: 'Not Started — Appointment in < 12h',
      detail: `Execution not started and appointment is in ${Math.floor(hours)}h.`,
    }];
  }
  if (hours <= 24) {
    return [{
      category: 'not-started-urgency',
      severity: 'high',
      label: 'Not Started — Appointment in < 24h',
      detail: `Execution not started and appointment is in ${Math.floor(hours)}h.`,
    }];
  }
  return [];
}

/** Check 4: Export vessel feasibility (calls expRun via feasibilityChecker) */
function checkVesselFeasibility(s: NormalizedShipment): IssueFlag[] {
  if (s.direction !== 'Export') return [];

  const feas = checkExportFeasibility(s);

  if (feas.status === 'Not Feasible') {
    return [{
      category: 'vessel-feasibility',
      severity: 'critical',
      label: 'Not Feasible — Will Miss Vessel CCO',
      detail: feas.reason || 'No valid departure found that meets the vessel cut-off date.',
    }];
  }
  if (feas.status === 'Tight') {
    return [{
      category: 'vessel-feasibility',
      severity: 'high',
      label: 'Tight — Close to Missing Vessel CCO',
      detail: feas.reason || 'Very little buffer between earliest CCO and vessel cut-off.',
    }];
  }

  return [];
}

/** Check 5: Terminal schedule mismatch */
function checkTerminalSchedule(s: NormalizedShipment): IssueFlag[] {
  if (s.inlandTerminal.source === 'unknown') {
    return [{
      category: 'terminal-schedule',
      severity: 'medium',
      label: 'Inland Terminal Unknown',
      detail: 'Could not derive inland terminal from TMS data or ZIP lookup. Manual review required.',
    }];
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Score compiler
// ─────────────────────────────────────────────────────────────────────────────

const SEVERITY_SCORES: Record<string, number> = {
  critical: 85,
  high: 65,
  medium: 45,
  low: 20,
};

function pickMainFlag(flags: IssueFlag[]): IssueFlag | null {
  if (flags.length === 0) return null;
  const order = ['critical', 'high', 'medium', 'low'];
  return flags.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))[0];
}

function determineValidationStatus(s: NormalizedShipment): ValidationStatus {
  const hasZip = !!s.customerZip;
  const hasAppt = !!s.appointmentDate;
  const hasTerm = !!s.portTerminal?.terminalValue;
  const hasTerminal = s.inlandTerminal.source !== 'unknown';

  if (hasZip && hasAppt && hasTerm && hasTerminal) return 'Fully Validated';
  if (hasZip || hasAppt || hasTerminal) return 'Partially Validated';
  return 'Cannot Validate';
}

/** Score a single shipment — runs all checks and returns a RiskAssessment */
export function scoreShipment(s: NormalizedShipment): RiskAssessment {
  // Run all checks
  const missingDataFlags   = checkMissingData(s);
  const missingRefFlags    = checkMissingCustomerRef(s);
  const notStartedFlags    = checkNotStartedUrgency(s);
  const feasibilityFlags   = checkVesselFeasibility(s);
  const terminalFlags      = checkTerminalSchedule(s);

  const allFlags = [
    ...feasibilityFlags,   // highest priority
    ...notStartedFlags,
    ...missingRefFlags,
    ...missingDataFlags,
    ...terminalFlags,
  ];

  const mainFlag = pickMainFlag([...allFlags]);

  const riskScore = mainFlag ? (SEVERITY_SCORES[mainFlag.severity] ?? 0) : 0;
  const riskLevel = riskLevelFromScore(riskScore);

  const issueCategory: IssueCategory = mainFlag?.category ?? 'ok';
  const mainIssue = mainFlag?.label ?? 'No Issues';
  const validationStatus = determineValidationStatus(s);

  // Recommended action based on main issue
  let recommendedAction = 'No action required.';
  if (mainFlag) {
    switch (mainFlag.category) {
      case 'vessel-feasibility':
        recommendedAction = 'Review departure schedule with inland team. Consider alternative terminal or departure day.';
        break;
      case 'not-started-urgency':
        recommendedAction = 'Contact transporter immediately to confirm execution has started.';
        break;
      case 'missing-customer-ref':
        recommendedAction = 'Chase customer/agent for Customer Reference Number before cutoff.';
        break;
      case 'missing-data':
        recommendedAction = 'Update missing TMS fields. Planner logic cannot run without complete data.';
        break;
      case 'terminal-schedule':
        recommendedAction = 'Verify inland terminal manually. Check ZIP routing and carrier assignment.';
        break;
      default:
        recommendedAction = 'Review shipment manually.';
    }
  }

  // Run feasibility check for exports (already done in feasibilityFlags but we need full result)
  const feasibility = s.direction === 'Export' ? checkExportFeasibility(s) : null;
  const bufferToCCO = feasibility?.bufferDays ?? null;

  return {
    riskScore,
    riskLevel,
    mainIssue,
    issueCategory,
    recommendedAction,
    validationStatus,
    flags: allFlags,
    feasibility,
    bufferToCCO,
  };
}

/** Score all shipments in a batch */
export function scoreAllShipments(shipments: NormalizedShipment[]): ScoredShipment[] {
  return shipments.map(s => ({ ...s, risk: scoreShipment(s) }));
}

/** Calculate KPI summary from scored shipments */
export function calculateKPIs(shipments: ScoredShipment[]): MonitorKPIs {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;

  return {
    total: shipments.length,
    critical: shipments.filter(s => s.risk.riskLevel === 'Critical').length,
    high: shipments.filter(s => s.risk.riskLevel === 'High').length,
    exportsAtRiskOfMissingCCO: shipments.filter(s =>
      s.direction === 'Export' &&
      (s.risk.feasibility?.status === 'Not Feasible' || s.risk.feasibility?.status === 'Tight')
    ).length,
    missingCustomerRefs: shipments.filter(s =>
      s.risk.flags.some(f => f.category === 'missing-customer-ref')
    ).length,
    notStartedWithin24h: shipments.filter(s => {
      if (s.executionStatus !== 'Not Started') return false;
      if (!s.appointmentDateTime) return false;
      const ms = s.appointmentDateTime.getTime() - now;
      return ms > 0 && ms <= h24;
    }).length,
    noFeasiblePlan: shipments.filter(s =>
      s.risk.feasibility?.status === 'Not Feasible'
    ).length,
    betterOptionAvailable: 0, // Phase 2 — requires alternative routing comparison
  };
}
