// ── Export CCO Feasibility Checker ──────────────────────────────────────────
// Calls the existing expRun planner logic to determine whether a vessel can
// realistically still be reached given the loading (appointment) date/time.

import { NormalizedShipment, FeasibilityResult } from '../../types/monitor';
import { expRun } from '../export/expRun';
import { fmt } from '../dateUtils';

/** Run expRun for a single export shipment and return a FeasibilityResult */
export function checkExportFeasibility(shipment: NormalizedShipment): FeasibilityResult {
  const empty: FeasibilityResult = {
    status: 'Cannot Validate',
    bufferDays: null,
    earliestCCO: null,
    departureMod: null,
    departureEtd: null,
    reason: null,
    plannerCards: null,
  };

  if (shipment.direction !== 'Export') {
    return { ...empty, reason: 'Not an export shipment' };
  }

  const { customerZip, appointmentDate, appointmentTime, portTerminal, vesselCutoffDate, equipment } = shipment;

  // Need at minimum: ZIP, appointment date, and port terminal with a valid terminalValue
  if (!customerZip) return { ...empty, reason: 'Missing customer ZIP' };
  if (!appointmentDate) return { ...empty, reason: 'Missing appointment date' };
  if (!portTerminal?.terminalValue) return { ...empty, reason: 'Port terminal not mapped' };

  const size = equipment?.size || '40';
  const type = equipment?.type || 'standard';
  const loadTime = appointmentTime || '08:00';

  let result;
  try {
    result = expRun({
      zip: customerZip,
      size,
      type,
      loadDate: appointmentDate,
      loadTime,
      terminalValue: portTerminal.terminalValue,
    });
  } catch {
    return { ...empty, reason: 'Planner logic error' };
  }

  // Hard blocks from planner
  if (result.error) {
    return { ...empty, status: 'Not Feasible', reason: result.error };
  }
  if (result.notServicedAntwerp) {
    return { ...empty, status: 'Not Feasible', reason: 'ZIP not serviced via Antwerp' };
  }
  if (result.isrRequired) {
    return { ...empty, status: 'Not Feasible', reason: 'IMO/Reefer via Duisburg requires ISR' };
  }
  if (result.noSchedule) {
    return { ...empty, status: 'Cannot Validate', reason: `No schedule for ${result.noScheduleDepotName || 'this depot'}` };
  }
  if (result.orderDLPassed) {
    return { ...empty, status: 'Not Feasible', reason: 'Order deadline has already passed' };
  }
  if (!result.cards || result.cards.length === 0) {
    return { ...empty, status: 'Not Feasible', reason: 'No valid departure found in next 25 days' };
  }

  const bestCard = result.cards[0];
  const earliestCCO = bestCard.earliestCCO;

  // If we have no vessel CCO to compare against, we can still show the planned CCO
  if (!vesselCutoffDate) {
    return {
      status: 'Cannot Validate',
      bufferDays: null,
      earliestCCO,
      departureMod: bestCard.mod,
      departureEtd: bestCard.etd,
      reason: 'No Vessel Cut-Off Date in TMS data',
      plannerCards: result.cards,
    };
  }

  const bufferMs = vesselCutoffDate.getTime() - earliestCCO.getTime();
  const bufferDays = Math.floor(bufferMs / (1000 * 60 * 60 * 24));

  let status: FeasibilityResult['status'];
  let reason: string;

  if (bufferDays < 0) {
    status = 'Not Feasible';
    reason = `Earliest CCO (${fmt(earliestCCO)}) is ${Math.abs(bufferDays)}d AFTER vessel cut-off (${fmt(vesselCutoffDate)})`;
  } else if (bufferDays < 2) {
    status = 'Tight';
    reason = `Only ${bufferDays}d buffer between earliest CCO and vessel cut-off — tight`;
  } else {
    status = 'Feasible';
    reason = `${bufferDays}d buffer between earliest CCO (${fmt(earliestCCO)}) and vessel cut-off`;
  }

  return {
    status,
    bufferDays,
    earliestCCO,
    departureMod: bestCard.mod,
    departureEtd: bestCard.etd,
    reason,
    plannerCards: result.cards,
  };
}
