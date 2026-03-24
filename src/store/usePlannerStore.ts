import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ImportRequest, ExportRequest, ImportResult, ExportResult, CYCYRequest, CYCYResult } from '../types';
import { ImpRunResult } from '../logic/import/impRun';
import { ExpRunResult, ExpCard } from '../logic/export/expRun';
import { ImpInstance } from '../logic/import/computeInstances';

export interface CYCYImpRunResult {
  direction: 'Import';
  portCode: 'RTM' | 'ANR';
  portName: string;
  termCode: string;
  termName: string;
  vesselETD: Date;
  etdTime: string;
  instances: ImpInstance[];
  maxCards: number;
}

export interface CYCYExpRunResult {
  direction: 'Export';
  depotCode: string;
  depotName: string;
  termCode: string;
  termName: string;
  yot: number;
  port: 'RTM' | 'ANR';
  loadingDate: Date;
  loadTime: string;
  cards: ExpCard[];
  orderDL?: Date;
  orderDLPassed?: boolean;
  customsDeadline?: Date;
  skipped: { mod: string; etd: Date; reason: string }[];
}

export type CYCYRunResult = CYCYImpRunResult | CYCYExpRunResult;

interface PlannerState {
  activeTab: string;
  importRequest: Partial<ImportRequest>;
  exportRequest: Partial<ExportRequest>;
  cycyRequest: Partial<CYCYRequest>;
  importResult: ImportResult | null;
  exportResult: ExportResult | null;
  cycyResult: CYCYResult | null;
  impRunResult: ImpRunResult | null;
  expRunResult: ExpRunResult | null;
  cycyRunResult: CYCYRunResult | null;
  truckCapacityData: { location: string; forecast: number[] }[];
  terminalCongestionData: TerminalCongestion[];
  schedules: Schedule[];
  setActiveTab: (tab: string) => void;
  setImportRequest: (req: Partial<ImportRequest>) => void;
  setExportRequest: (req: Partial<ExportRequest>) => void;
  setCYCYRequest: (req: Partial<CYCYRequest>) => void;
  setImportResult: (res: ImportResult | null) => void;
  setExportResult: (res: ExportResult | null) => void;
  setCYCYResult: (res: CYCYResult | null) => void;
  setImpRunResult: (res: ImpRunResult | null) => void;
  setExpRunResult: (res: ExpRunResult | null) => void;
  setCycyRunResult: (res: CYCYRunResult | null) => void;
  setTruckCapacityData: (data: { location: string; forecast: number[] }[]) => void;
  setTerminalCongestionData: (data: TerminalCongestion[]) => void;
  setSchedules: (schedules: Schedule[]) => void;
  addSchedule: (schedule: Schedule) => void;
  resetImport: () => void;
  resetExport: () => void;
  resetCYCY: () => void;
}

export interface TerminalCongestion {
  id: string;
  port: 'Rotterdam' | 'Antwerp';
  terminal: string;
  waitingTime: number; // in hours
  status: 'Low' | 'Medium' | 'High';
  lastUpdated: string;
}

export interface Schedule {
  id: string;
  type: 'Barge' | 'Rail';
  direction: 'Import' | 'Export';
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  capacity: number;
  status: 'On Time' | 'Delayed' | 'Cancelled';
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      activeTab: 'dashboard',
      importRequest: {
        postcode: '',
        containerType: '40HC',
        dischargePort: 'Rotterdam',
        vesselEtd: new Date().toISOString().split('T')[0],
        isDischarged: false,
        preferredTerminal: 'Auto',
      },
      exportRequest: {
        postcode: '',
        containerType: '40HC',
        loadingDate: new Date().toISOString().split('T')[0],
        loadingTime: '08:00',
        portTerminal: 'Rotterdam',
        preferredTerminal: 'Auto',
      },
      cycyRequest: {
        direction: undefined,
        zip: '',
        originTerminal: 'RTM',
        destinationTerminal: 'NLROTTM|5|RTM',
        containerType: '40HC',
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
      },
      importResult: null,
      exportResult: null,
      cycyResult: null,
      impRunResult: null,
      expRunResult: null,
      cycyRunResult: null,
      truckCapacityData: [
        { location: 'Duisburg', forecast: [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1] },
        { location: 'Mainz', forecast: [1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1] },
        { location: 'Germersheim', forecast: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1] },
      ],
      terminalCongestionData: [
        { id: 'r1', port: 'Rotterdam', terminal: 'APM Terminals (NLROTTM)', waitingTime: 12, status: 'Medium', lastUpdated: new Date().toISOString() },
        { id: 'r2', port: 'Rotterdam', terminal: 'Hutchison Ports Delta II (NLROT01)', waitingTime: 4, status: 'Low', lastUpdated: new Date().toISOString() },
        { id: 'r3', port: 'Rotterdam', terminal: 'ECT Delta (NLROT21)', waitingTime: 24, status: 'High', lastUpdated: new Date().toISOString() },
        { id: 'r4', port: 'Rotterdam', terminal: 'Rotterdam World Gateway (NLROTWG)', waitingTime: 8, status: 'Low', lastUpdated: new Date().toISOString() },
        { id: 'a1', port: 'Antwerp', terminal: 'PSA Noordzee Terminal (BEANT913)', waitingTime: 16, status: 'Medium', lastUpdated: new Date().toISOString() },
        { id: 'a2', port: 'Antwerp', terminal: 'PSA Europa Terminal (BEANT869)', waitingTime: 6, status: 'Low', lastUpdated: new Date().toISOString() },
      ],
      schedules: [
        { id: '1', type: 'Barge', direction: 'Import', origin: 'Rotterdam', destination: 'Duisburg', departure: '2026-03-25T10:00', arrival: '2026-03-26T14:00', capacity: 120, status: 'On Time' },
        { id: '2', type: 'Rail', direction: 'Import', origin: 'Antwerp', destination: 'Mainz', departure: '2026-03-25T22:00', arrival: '2026-03-26T06:00', capacity: 80, status: 'On Time' },
        { id: '3', type: 'Barge', direction: 'Export', origin: 'Germersheim', destination: 'Rotterdam', departure: '2026-03-27T08:00', arrival: '2026-03-28T18:00', capacity: 150, status: 'On Time' },
      ],
      setActiveTab: (tab) => set({ activeTab: tab }),
      setImportRequest: (req) => set((state) => ({ importRequest: { ...state.importRequest, ...req } })),
      setExportRequest: (req) => set((state) => ({ exportRequest: { ...state.exportRequest, ...req } })),
      setCYCYRequest: (req) => set((state) => ({ cycyRequest: { ...state.cycyRequest, ...req } })),
      setImportResult: (res) => set({ importResult: res }),
      setExportResult: (res) => set({ exportResult: res }),
      setCYCYResult: (res) => set({ cycyResult: res }),
      setImpRunResult: (res) => set({ impRunResult: res }),
      setExpRunResult: (res) => set({ expRunResult: res }),
      setCycyRunResult: (res) => set({ cycyRunResult: res }),
      setTruckCapacityData: (data) => set({ truckCapacityData: data }),
      setTerminalCongestionData: (data) => set({ terminalCongestionData: data }),
      setSchedules: (schedules) => set({ schedules }),
      addSchedule: (schedule) => set((state) => ({ schedules: [...state.schedules, schedule] })),
      resetImport: () => set({
        importRequest: {
          postcode: '',
          containerType: '40HC',
          dischargePort: 'Rotterdam',
          vesselEtd: new Date().toISOString().split('T')[0],
          isDischarged: false,
          preferredTerminal: 'Auto',
        },
        importResult: null,
      }),
      resetExport: () => set({
        exportRequest: {
          postcode: '',
          containerType: '40HC',
          loadingDate: new Date().toISOString().split('T')[0],
          loadingTime: '08:00',
          portTerminal: 'Rotterdam',
          preferredTerminal: 'Auto',
        },
        exportResult: null,
      }),
      resetCYCY: () => set({
        cycyRequest: {
          direction: undefined,
          zip: '',
          originTerminal: 'RTM',
          destinationTerminal: 'NLROTTM|5|RTM',
          containerType: '40HC',
          date: new Date().toISOString().split('T')[0],
          time: '12:00',
        },
        cycyResult: null,
        cycyRunResult: null,
      }),
    }),
    {
      name: 'maersk-planner-storage',
      partialize: (state) => ({
        activeTab: state.activeTab,
        importRequest: state.importRequest,
        exportRequest: state.exportRequest,
        cycyRequest: state.cycyRequest,
        truckCapacityData: state.truckCapacityData,
        terminalCongestionData: state.terminalCongestionData,
        schedules: state.schedules,
        // Computed run results intentionally excluded — contain Date objects
        // that would be serialised to strings and crash on reload
      }),
    }
  )
);
