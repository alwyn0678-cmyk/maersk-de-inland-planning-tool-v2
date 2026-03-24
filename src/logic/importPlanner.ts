import { ImportRequest, ImportResult, Terminal, Schedule } from '../types';
import { POSTCODE_MAPPINGS, TERMINALS, SCHEDULES } from '../data/schedules';
import { addBusinessDays, subtractBusinessDays, getNextDepartureDate } from './dates';
import { addDays, parseISO, startOfDay } from 'date-fns';

export function calculateImportPlan(request: ImportRequest): ImportResult {
  const prefix = request.postcode.substring(0, 2);
  const mapping = POSTCODE_MAPPINGS.find(m => m.prefix === prefix);
  
  if (!mapping && (!request.preferredTerminal || request.preferredTerminal === 'Auto')) {
    return { feasibleDepartures: [], emptyReturnDepot: '', warnings: ['No coverage for this postcode. Please select a specific terminal.'] };
  }

  let terminals: Terminal[] = [];
  if (request.preferredTerminal && request.preferredTerminal !== 'Auto') {
    const term = TERMINALS[request.preferredTerminal];
    if (term) terminals = [term];
  } else if (mapping) {
    terminals = mapping.terminals.map(id => TERMINALS[id]).filter(Boolean);
  }

  if (terminals.length === 0) {
    return { feasibleDepartures: [], emptyReturnDepot: '', warnings: ['Selected terminal is invalid or no coverage.'] };
  }

  const vesselEtd = startOfDay(parseISO(request.vesselEtd));
  
  // Cargo is available 2 days after ETD if not discharged yet, else available today
  const availableDate = request.isDischarged ? new Date() : addDays(vesselEtd, 2);

  const feasibleDepartures: ImportResult['feasibleDepartures'] = [];
  const warnings: string[] = [];

  terminals.forEach(terminal => {
    const terminalSchedules = SCHEDULES.filter(s => s.terminalId === terminal.id && s.port === request.dischargePort && s.id.startsWith('S4') || s.id.startsWith('S5') || s.id.startsWith('S6') || s.id.startsWith('S9') || s.id.startsWith('S10') || s.id.startsWith('S13') || s.id.startsWith('S14')); // Mock filter for import schedules

    terminalSchedules.forEach(schedule => {
      // Find next 2 feasible departures
      let currentDepartureDate = getNextDepartureDate(availableDate, schedule.departureDay);
      
      for (let i = 0; i < 2; i++) {
        const arrivalDate = addDays(currentDepartureDate, schedule.transitDays);
        const deliveryDate = addBusinessDays(arrivalDate, 1); // Next business day delivery
        const orderDeadline = subtractBusinessDays(currentDepartureDate, 2); // Order 2 days before departure
        
        let customsDeadline;
        if (request.dischargePort === 'Rotterdam') {
          customsDeadline = subtractBusinessDays(currentDepartureDate, 1);
        }

        feasibleDepartures.push({
          terminal,
          schedule,
          departureDate: currentDepartureDate,
          arrivalDate,
          deliveryDate,
          orderDeadline,
          customsDeadline,
          isRecommended: i === 0 && schedule.mode === 'Barge', // Recommend first barge
        });

        currentDepartureDate = addDays(currentDepartureDate, 7); // Next week
      }
    });
  });

  // Sort by delivery date
  feasibleDepartures.sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime());

  // Empty return depot logic
  let emptyReturnDepot = 'Default Empty Depot';
  if (mapping && mapping.depots.length > 0) {
    emptyReturnDepot = mapping.depots[0];
  }

  return {
    feasibleDepartures: feasibleDepartures.slice(0, 5), // Top 5 options
    emptyReturnDepot,
    warnings,
  };
}
