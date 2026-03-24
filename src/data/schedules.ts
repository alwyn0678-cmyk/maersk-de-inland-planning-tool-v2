import { Port, Schedule, Terminal, PostcodeMapping } from '../types';

export const TERMINALS: Record<string, Terminal> = {
  'DUISBURG': { id: 'DUISBURG', name: 'Duisburg D3T', city: 'Duisburg', yotHours: 120 },
  'KORNWESTHEIM': { id: 'KORNWESTHEIM', name: 'Kornwestheim DUSS', city: 'Kornwestheim', yotHours: 96 },
  'NUREMBERG': { id: 'NUREMBERG', name: 'Nuremberg TriCon', city: 'Nuremberg', yotHours: 96 },
  'MUNICH': { id: 'MUNICH', name: 'Munich DUSS', city: 'Munich', yotHours: 96 },
  'LEIPZIG': { id: 'LEIPZIG', name: 'Leipzig DUSS', city: 'Leipzig', yotHours: 120 },
};

export const POSTCODE_MAPPINGS: PostcodeMapping[] = [
  { prefix: '40', terminals: ['DUISBURG'], depots: ['Duisburg Depot A', 'Dusseldorf Depot B'] },
  { prefix: '41', terminals: ['DUISBURG'], depots: ['Duisburg Depot A'] },
  { prefix: '42', terminals: ['DUISBURG'], depots: ['Duisburg Depot A'] },
  { prefix: '43', terminals: ['DUISBURG'], depots: ['Duisburg Depot A'] },
  { prefix: '44', terminals: ['DUISBURG'], depots: ['Duisburg Depot A'] },
  { prefix: '45', terminals: ['DUISBURG'], depots: ['Duisburg Depot A'] },
  { prefix: '46', terminals: ['DUISBURG'], depots: ['Duisburg Depot A'] },
  { prefix: '47', terminals: ['DUISBURG'], depots: ['Duisburg Depot A'] },
  { prefix: '48', terminals: ['DUISBURG'], depots: ['Duisburg Depot A'] },
  { prefix: '49', terminals: ['DUISBURG'], depots: ['Duisburg Depot A'] },
  { prefix: '50', terminals: ['DUISBURG'], depots: ['Cologne Depot C'] },
  { prefix: '70', terminals: ['KORNWESTHEIM'], depots: ['Stuttgart Depot S'] },
  { prefix: '71', terminals: ['KORNWESTHEIM'], depots: ['Stuttgart Depot S'] },
  { prefix: '80', terminals: ['MUNICH'], depots: ['Munich Depot M'] },
  { prefix: '81', terminals: ['MUNICH'], depots: ['Munich Depot M'] },
  { prefix: '90', terminals: ['NUREMBERG'], depots: ['Nuremberg Depot N'] },
  { prefix: '04', terminals: ['LEIPZIG'], depots: ['Leipzig Depot L'] },
];

export const SCHEDULES: Schedule[] = [
  // Duisburg -> Rotterdam (Export)
  { id: 'S1', port: 'Rotterdam', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 1, arrivalDay: 3, transitDays: 2 },
  { id: 'S2', port: 'Rotterdam', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 3, arrivalDay: 5, transitDays: 2 },
  { id: 'S3', port: 'Rotterdam', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 5, arrivalDay: 0, transitDays: 2 },
  // Rotterdam -> Duisburg (Import)
  { id: 'S4', port: 'Rotterdam', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 2, arrivalDay: 4, transitDays: 2 },
  { id: 'S5', port: 'Rotterdam', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 4, arrivalDay: 6, transitDays: 2 },
  { id: 'S6', port: 'Rotterdam', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 6, arrivalDay: 1, transitDays: 2 },
  // Kornwestheim -> Rotterdam (Export)
  { id: 'S7', port: 'Rotterdam', terminalId: 'KORNWESTHEIM', mode: 'Rail', departureDay: 2, arrivalDay: 4, transitDays: 2 },
  { id: 'S8', port: 'Rotterdam', terminalId: 'KORNWESTHEIM', mode: 'Rail', departureDay: 5, arrivalDay: 0, transitDays: 2 },
  // Rotterdam -> Kornwestheim (Import)
  { id: 'S9', port: 'Rotterdam', terminalId: 'KORNWESTHEIM', mode: 'Rail', departureDay: 1, arrivalDay: 3, transitDays: 2 },
  { id: 'S10', port: 'Rotterdam', terminalId: 'KORNWESTHEIM', mode: 'Rail', departureDay: 4, arrivalDay: 6, transitDays: 2 },
  // Antwerp Schedules
  { id: 'S11', port: 'Antwerp', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 2, arrivalDay: 4, transitDays: 2 },
  { id: 'S12', port: 'Antwerp', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 5, arrivalDay: 0, transitDays: 2 },
  { id: 'S13', port: 'Antwerp', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 1, arrivalDay: 3, transitDays: 2 },
  { id: 'S14', port: 'Antwerp', terminalId: 'DUISBURG', mode: 'Barge', departureDay: 4, arrivalDay: 6, transitDays: 2 },
];
