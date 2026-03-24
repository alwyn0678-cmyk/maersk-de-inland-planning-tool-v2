import { ExportRequest, ExportResult, Terminal, Schedule } from '../types';
import { POSTCODE_MAPPINGS, TERMINALS, SCHEDULES } from '../data/schedules';
import { addBusinessDays, subtractBusinessDays, getNextDepartureDate } from './dates';
import { addDays, parseISO, startOfDay, addHours, isBefore } from 'date-fns';

export function calculateExportPlan(request: ExportRequest): ExportResult {
  const prefix = request.postcode.substring(0, 2);
  const mapping = POSTCODE_MAPPINGS.find(m => m.prefix === prefix);
  
  if (!mapping && (!request.preferredTerminal || request.preferredTerminal === 'Auto')) {
    return { rankedDepots: [], feasibleDepartures: [], emptyReleaseDepot: '', warnings: ['No coverage for this postcode. Please select a specific terminal.'] };
  }

  let terminals: Terminal[] = [];
  if (request.preferredTerminal && request.preferredTerminal !== 'Auto') {
    const term = TERMINALS[request.preferredTerminal];
    if (term) terminals = [term];
  } else if (mapping) {
    terminals = mapping.terminals.map(id => TERMINALS[id]).filter(Boolean);
  }

  if (terminals.length === 0) {
    return { rankedDepots: [], feasibleDepartures: [], emptyReleaseDepot: '', warnings: ['Selected terminal is invalid or no coverage.'] };
  }

  const loadingDate = startOfDay(parseISO(request.loadingDate));
  const loadingTimeParts = request.loadingTime.split(':');
  const loadingDateTime = addHours(loadingDate, parseInt(loadingTimeParts[0], 10));

  const feasibleDepartures: ExportResult['feasibleDepartures'] = [];
  const warnings: string[] = [];

  // ISR Warning for IMO/Reefer via Duisburg
  const isDuisburg = terminals.some(t => t.id === 'DUISBURG');
  if ((request.containerType === 'IMO' || request.containerType === '20RF' || request.containerType === '40RF') && isDuisburg) {
    warnings.push('ISR Warning: Special handling required for IMO/Reefer via Duisburg.');
  }

  terminals.forEach(terminal => {
    const terminalSchedules = SCHEDULES.filter(s => s.terminalId === terminal.id && s.port === request.portTerminal && s.id.startsWith('S1') || s.id.startsWith('S2') || s.id.startsWith('S3') || s.id.startsWith('S7') || s.id.startsWith('S8') || s.id.startsWith('S11') || s.id.startsWith('S12')); // Mock filter for export schedules

    terminalSchedules.forEach(schedule => {
      // Find next 2 feasible departures after loading
      let currentDepartureDate = getNextDepartureDate(loadingDate, schedule.departureDay);
      
      // Exclude next-day departures if loading time is too late (e.g., after 14:00)
      if (currentDepartureDate.getTime() === addDays(loadingDate, 1).getTime() && loadingDateTime.getHours() >= 14) {
        currentDepartureDate = addDays(currentDepartureDate, 7);
      }

      for (let i = 0; i < 2; i++) {
        const arrivalDate = addDays(currentDepartureDate, schedule.transitDays);
        const earliestVesselCco = subtractBusinessDays(arrivalDate, 1); // CCO 1 day before arrival
        const latestVesselEta = addDays(arrivalDate, terminal.yotHours / 24); // YOT logic
        const orderDeadline = subtractBusinessDays(currentDepartureDate, 2); // Order 2 days before departure
        
        let customsDeadline;
        if (request.portTerminal === 'Rotterdam') {
          customsDeadline = subtractBusinessDays(currentDepartureDate, 1);
        }

        feasibleDepartures.push({
          terminal,
          schedule,
          departureDate: currentDepartureDate,
          arrivalDate,
          earliestVesselCco,
          latestVesselEta,
          orderDeadline,
          customsDeadline,
          isRecommended: i === 0 && schedule.mode === 'Barge', // Recommend first barge
        });

        currentDepartureDate = addDays(currentDepartureDate, 7); // Next week
      }
    });
  });

  // Sort by departure date
  feasibleDepartures.sort((a, b) => a.departureDate.getTime() - b.departureDate.getTime());

  // Ranked depots logic
  const rankedDepots = mapping ? mapping.depots.map((depot, index) => ({
    depot,
    distance: (index + 1) * 25, // Mock distance
  })) : [];

  // Empty release depot logic
  let emptyReleaseDepot = 'Default Empty Depot';
  if (mapping && mapping.depots.length > 0) {
    emptyReleaseDepot = mapping.depots[0];
  }

  return {
    rankedDepots,
    feasibleDepartures: feasibleDepartures.slice(0, 5), // Top 5 options
    emptyReleaseDepot,
    warnings,
  };
}
