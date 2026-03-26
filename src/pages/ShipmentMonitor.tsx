// ── Operations Shipment Monitor ──────────────────────────────────────────────
// Hidden team-only page. Accessible from Help → Ops Monitor button only.
// Upload TMS Excel → parse → score → display risk dashboard.

import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'motion/react';
import {
  Activity,
  RefreshCw,
  AlertCircle,
  Shield,
  ChevronLeft,
} from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';

import { TmsRawRow, ScoredShipment, MonitorFilters } from '../types/monitor';
import { parseTmsSheet } from '../logic/monitor/tmsParser';
import { scoreAllShipments, calculateKPIs } from '../logic/monitor/riskScorer';
import { UploadArea } from '../components/monitor/UploadArea';
import { KPICards } from '../components/monitor/KPICards';
import { FilterBar } from '../components/monitor/FilterBar';
import { ShipmentTable } from '../components/monitor/ShipmentTable';
import { DetailDrawer } from '../components/monitor/DetailDrawer';

const EMPTY_FILTERS: MonitorFilters = {
  riskLevel: '',
  customer: '',
  inlandTerminal: '',
  direction: '',
  executionStatus: '',
  carrier: '',
  issueCategory: '',
  search: '',
};

function applyFilters(shipments: ScoredShipment[], f: MonitorFilters): ScoredShipment[] {
  return shipments.filter(s => {
    if (f.riskLevel && s.risk.riskLevel !== f.riskLevel) return false;
    if (f.direction && s.direction !== f.direction) return false;
    if (f.executionStatus && s.executionStatus !== f.executionStatus) return false;
    if (f.inlandTerminal && s.inlandTerminal.name !== f.inlandTerminal) return false;
    if (f.customer && s.customerName !== f.customer) return false;
    if (f.carrier && s.carrierName !== f.carrier) return false;
    if (f.issueCategory && s.risk.issueCategory !== f.issueCategory) return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = [
        s.bookingNumber, s.containerId, s.customerName, s.vesselName, s.voyage,
        s.customerCity, s.carrierName, s.inlandTerminal.name,
      ].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function ShipmentMonitor() {
  const setActiveTab = usePlannerStore(s => s.setActiveTab);

  const [shipments, setShipments]     = useState<ScoredShipment[]>([]);
  const [filters, setFilters]         = useState<MonitorFilters>(EMPTY_FILTERS);
  const [selected, setSelected]       = useState<ScoredShipment | null>(null);
  const [isProcessing, setProcessing] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [fileName, setFileName]       = useState<string | null>(null);
  const [processedAt, setProcessedAt] = useState<Date | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setProcessing(true);
    setShipments([]);
    setFilters(EMPTY_FILTERS);
    setSelected(null);

    // Use FileReader to avoid blocking the main thread for large files
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        // Find the data sheet
        const sheetName = wb.SheetNames.find(n =>
          n.toLowerCase() === 'data' || n.toLowerCase().includes('sheet')
        ) || wb.SheetNames[0];

        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<TmsRawRow>(ws);

        if (rows.length === 0) {
          setError('The file appears to be empty or has no recognizable rows.');
          setProcessing(false);
          return;
        }

        const firstRow = rows[0] as Record<string, unknown>;
        if (!('Traffic Direction' in firstRow) && !('Booking Number' in firstRow)) {
          setError('File does not look like a TMS extract. Expected columns like "Traffic Direction" and "Booking Number".');
          setProcessing(false);
          return;
        }

        const parsed = parseTmsSheet(rows as TmsRawRow[]);
        const scored = scoreAllShipments(parsed);

        // Sort by risk score desc
        scored.sort((a, b) => b.risk.riskScore - a.risk.riskScore);

        setShipments(scored);
        setFileName(file.name);
        setProcessedAt(new Date());
      } catch (err) {
        setError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setProcessing(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const filtered = useMemo(
    () => applyFilters(shipments, filters),
    [shipments, filters]
  );

  const kpis = useMemo(
    () => calculateKPIs(shipments),
    [shipments]
  );

  const updateFilters = useCallback((patch: Partial<MonitorFilters>) => {
    setFilters(prev => ({ ...prev, ...patch }));
  }, []);

  const hasData = shipments.length > 0;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('help')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Help
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="h-8 w-8 rounded-xl bg-[#00243d] flex items-center justify-center shadow-lg">
            <Activity className="h-4 w-4 text-[#42b0d5]" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-800 leading-none">Operations Shipment Monitor</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Team Use Only · TMS Extract Analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Internal-only badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00243d]/10 border border-[#00243d]/20">
            <Shield className="h-3 w-3 text-[#00243d]" />
            <span className="text-[10px] font-black text-[#00243d] uppercase tracking-widest">Internal Only</span>
          </div>

          {hasData && (
            <button
              onClick={() => {
                setShipments([]);
                setFilters(EMPTY_FILTERS);
                setSelected(null);
                setFileName(null);
                setProcessedAt(null);
                setError(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              New Upload
            </button>
          )}
        </div>
      </motion.div>

      {/* Status bar (when data loaded) */}
      {hasData && fileName && processedAt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#00243d]/5 border border-[#00243d]/10 text-xs font-bold text-slate-600"
        >
          <AlertCircle className="h-3.5 w-3.5 text-[#42b0d5] flex-none" />
          <span>
            Loaded: <span className="font-black text-slate-800">{fileName}</span>
            &nbsp;·&nbsp;{shipments.length} shipments parsed
            &nbsp;·&nbsp;Processed at {processedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} CET
          </span>
        </motion.div>
      )}

      {/* Upload (shown when no data) */}
      {!hasData && (
        <UploadArea onFile={handleFile} isProcessing={isProcessing} error={error} />
      )}

      {/* Dashboard */}
      {hasData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* KPI cards */}
          <KPICards kpis={kpis} />

          {/* Filters + table */}
          <FilterBar
            filters={filters}
            onChange={updateFilters}
            shipments={shipments}
            visibleCount={filtered.length}
          />

          <ShipmentTable
            shipments={filtered}
            onSelect={setSelected}
          />
        </motion.div>
      )}

      {/* Detail drawer */}
      <DetailDrawer
        shipment={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
