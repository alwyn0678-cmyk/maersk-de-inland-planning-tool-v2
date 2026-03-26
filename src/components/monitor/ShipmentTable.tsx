// ── Shipment Table ─────────────────────────────────────────────────────────

import { motion, AnimatePresence } from 'motion/react';
import { ScoredShipment, RiskLevel } from '../../types/monitor';
import { fmt, fmtS } from '../../logic/dateUtils';
import { cn } from '../../lib/utils';
import { ChevronRight, Download } from 'lucide-react';

// ── Risk badge ────────────────────────────────────────────────────────────

const RISK_STYLES: Record<RiskLevel, string> = {
  Critical: 'bg-rose-100 text-rose-700 border-rose-200',
  High:     'bg-orange-100 text-orange-700 border-orange-200',
  Medium:   'bg-amber-100 text-amber-700 border-amber-200',
  Low:      'bg-sky-100 text-sky-700 border-sky-200',
  OK:       'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const RISK_DOT: Record<RiskLevel, string> = {
  Critical: 'bg-rose-500',
  High:     'bg-orange-500',
  Medium:   'bg-amber-500',
  Low:      'bg-sky-500',
  OK:       'bg-emerald-500',
};

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wide',
      RISK_STYLES[level]
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', RISK_DOT[level])} />
      {level}
    </span>
  );
}

function DirectionBadge({ dir }: { dir: string }) {
  return (
    <span className={cn(
      'inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide',
      dir === 'Export'
        ? 'bg-violet-100 text-violet-700'
        : 'bg-blue-100 text-blue-700'
    )}>
      {dir}
    </span>
  );
}

function FeasibilityBadge({ status }: { status: string | undefined }) {
  if (!status) return <span className="text-slate-300 text-xs">—</span>;
  const styles: Record<string, string> = {
    'Feasible':        'text-emerald-600 font-bold',
    'Tight':           'text-amber-600 font-bold',
    'Not Feasible':    'text-rose-600 font-bold',
    'Cannot Validate': 'text-slate-400',
  };
  return <span className={cn('text-xs', styles[status] || 'text-slate-500')}>{status}</span>;
}

// ── Export CSV ─────────────────────────────────────────────────────────────

function exportCSV(shipments: ScoredShipment[]) {
  const headers = [
    'Risk Level', 'Customer', 'Inland Terminal', 'Direction', 'Booking No.',
    'Container ID', 'Appointment', 'Vessel', 'Voyage', 'Vessel Cut-Off / ETA',
    'Buffer to CCO (days)', 'Execution Status', 'Feasibility', 'Main Issue', 'Recommended Action',
  ];

  const rows = shipments.map(s => [
    s.risk.riskLevel,
    s.customerName || '',
    s.inlandTerminal.name,
    s.direction,
    s.bookingNumber || '',
    s.containerId || '',
    s.appointmentDate ? `${s.appointmentDate} ${s.appointmentTime || ''}` : '',
    s.vesselName || '',
    s.voyage || '',
    s.direction === 'Export'
      ? (s.vesselCutoffDate ? fmt(s.vesselCutoffDate) : '')
      : (s.vesselEtaDate ? fmt(s.vesselEtaDate) : ''),
    s.risk.bufferToCCO !== null ? String(s.risk.bufferToCCO) : '',
    s.executionStatus,
    s.risk.feasibility?.status || '',
    s.risk.mainIssue,
    s.risk.recommendedAction,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `maersk-ops-monitor-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main table ─────────────────────────────────────────────────────────────

interface ShipmentTableProps {
  shipments: ScoredShipment[];
  onSelect: (s: ScoredShipment) => void;
}

export function ShipmentTable({ shipments, onSelect }: ShipmentTableProps) {
  if (shipments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
        <p className="text-sm font-bold text-slate-400">No shipments match the current filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      {/* Table header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest">
          {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => exportCSV(shipments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          Export Flagged
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100">
              {[
                'Risk', 'Customer', 'Inland Terminal', 'Dir',
                'Booking No.', 'Container', 'Appointment',
                'Vessel / Voyage', 'CCO / ETA', 'Buffer',
                'Exec. Status', 'Feasibility', 'Main Issue', '',
              ].map(col => (
                <th key={col} className="text-left px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {shipments.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  onClick={() => onSelect(s)}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <RiskBadge level={s.risk.riskLevel} />
                  </td>
                  <td className="px-3 py-2.5 max-w-[140px]">
                    <span className="font-bold text-slate-700 line-clamp-1 leading-tight">
                      {s.customerName || <span className="text-slate-300">—</span>}
                    </span>
                    {s.customerCity && (
                      <span className="text-[10px] text-slate-400 block">{s.customerCity}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={cn(
                      'font-bold',
                      s.inlandTerminal.source === 'unknown' ? 'text-slate-400 italic' : 'text-slate-700'
                    )}>
                      {s.inlandTerminal.name}
                    </span>
                    {s.inlandTerminal.source === 'zip' && (
                      <span className="ml-1 text-[9px] text-amber-500 font-bold">(derived)</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <DirectionBadge dir={s.direction} />
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-600">
                    {s.bookingNumber || <span className="text-rose-400 font-bold">Missing</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-slate-600">
                    {s.containerId || <span className="text-rose-400 font-bold">Missing</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {s.appointmentDateTime ? (
                      <>
                        <span className="font-bold text-slate-700">{fmtS(s.appointmentDateTime)}</span>
                        <span className="text-slate-400 ml-1">{s.appointmentTime}</span>
                      </>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5 max-w-[130px]">
                    <span className="font-bold text-slate-700 block truncate">{s.vesselName || <span className="text-slate-300">—</span>}</span>
                    <span className="text-slate-400 text-[10px]">{s.voyage || ''}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {s.direction === 'Export'
                      ? s.vesselCutoffDate
                        ? <span className="font-bold text-slate-700">{fmtS(s.vesselCutoffDate)}</span>
                        : <span className="text-rose-400 font-bold text-[10px]">MISSING</span>
                      : s.vesselEtaDate
                        ? <span className="font-bold text-slate-700">{fmtS(s.vesselEtaDate)}</span>
                        : <span className="text-slate-300">—</span>
                    }
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-center">
                    {s.risk.bufferToCCO !== null ? (
                      <span className={cn(
                        'font-black',
                        s.risk.bufferToCCO < 0 ? 'text-rose-600' :
                        s.risk.bufferToCCO < 2 ? 'text-amber-600' :
                        'text-emerald-600'
                      )}>
                        {s.risk.bufferToCCO}d
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={cn(
                      'text-xs font-bold',
                      s.executionStatus === 'Not Started' ? 'text-rose-600' :
                      s.executionStatus === 'In Execution' ? 'text-amber-600' :
                      s.executionStatus === 'Executed' ? 'text-emerald-600' :
                      'text-slate-500'
                    )}>
                      {s.executionStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <FeasibilityBadge status={s.risk.feasibility?.status} />
                  </td>
                  <td className="px-3 py-2.5 max-w-[180px]">
                    <span className={cn(
                      'text-xs font-bold line-clamp-2 leading-tight',
                      s.risk.riskLevel === 'Critical' ? 'text-rose-700' :
                      s.risk.riskLevel === 'High' ? 'text-orange-700' :
                      s.risk.riskLevel === 'Medium' ? 'text-amber-700' :
                      'text-slate-500'
                    )}>
                      {s.risk.mainIssue}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
