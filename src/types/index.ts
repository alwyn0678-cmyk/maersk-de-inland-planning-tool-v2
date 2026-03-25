export type Port = 'Rotterdam' | 'Antwerp';
export type TransportMode = 'Barge' | 'Rail' | 'Truck';
export type ContainerType = '20DC' | '40DC' | '40HC' | '20RF' | '40RF' | 'IMO';

export interface PostcodeMapping {
  prefix: string;
  terminals: string[];
  depots: string[];
}

export interface Terminal {
  id: string;
  name: string;
  city: string;
  yotHours: number; // Yard Opening Time in hours before ETA
}

export interface Schedule {
  id: string;
  port: Port;
  terminalId: string;
  mode: TransportMode;
  departureDay: number; // 0 = Sunday, 1 = Monday, etc.
  arrivalDay: number;
  transitDays: number;
}

export interface ImportRequest {
  postcode: string;
  containerType: ContainerType;
  dischargePort: Port;
  vesselEtd: string; // ISO Date
  vesselEtdTime: string; // HH:mm
  isDischarged: boolean;
  preferredTerminal?: string; // 'Auto' or terminal ID
}

export interface ExportRequest {
  postcode: string;
  containerType: ContainerType;
  loadingDate: string; // ISO Date
  loadingTime: string; // HH:mm
  portTerminal: string; // "CODE|YOT|PORT" e.g. "NLROTTM|5|RTM"
  preferredTerminal?: string; // 'Auto' or terminal ID
}

export interface ImportResult {
  feasibleDepartures: {
    terminal: Terminal;
    schedule: Schedule;
    departureDate: Date;
    arrivalDate: Date;
    deliveryDate: Date;
    orderDeadline: Date;
    customsDeadline?: Date;
    isRecommended: boolean;
  }[];
  emptyReturnDepot: string;
  warnings: string[];
}

export interface ExportResult {
  rankedDepots: {
    depot: string;
    distance: number; // Mock distance for ranking
  }[];
  feasibleDepartures: {
    terminal: Terminal;
    schedule: Schedule;
    departureDate: Date;
    arrivalDate: Date;
    earliestVesselCco: Date;
    latestVesselEta: Date;
    orderDeadline: Date;
    customsDeadline?: Date;
    isRecommended: boolean;
  }[];
  emptyReleaseDepot: string;
  warnings: string[];
}

export interface CYCYRequest {
  direction: 'Import' | 'Export';
  zip?: string;                // customer postcode — drives auto terminal/depot lookup
  originTerminal: string;      // Import: port code (RTM|ANR)
  destinationTerminal: string; // Export: port terminal value (CODE|YOT|PORT)
  containerType: ContainerType;
  date: string;
  time: string;
}

export interface CYCYResult {
  feasibleDepartures: {
    type: 'Barge' | 'Rail';
    origin: string;
    destination: string;
    departure: Date;
    arrival: Date;
    capacity: number;
    status: string;
    isRecommended: boolean;
  }[];
  warnings: string[];
}
