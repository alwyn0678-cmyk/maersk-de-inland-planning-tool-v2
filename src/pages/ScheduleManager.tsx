import { useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { usePlannerStore, TerminalCongestion } from '../store/usePlannerStore';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database, Download, Upload, CheckCircle2, AlertTriangle,
  RefreshCw, FileSpreadsheet, ChevronDown, ChevronUp,
  Anchor, Send, Info, X, Truck,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { IMP_SCHEDULES } from '../data/import/schedules';
import { EXP_SCHED } from '../data/export/schedules';
import { IMP_TERM_NAMES } from '../data/import/terminalNames';
import { EXP_DEPOTS } from '../data/export/depotNames';
import {
  getImpOverrides,
  getExpOverrides,
  getOverrideMeta,
  applyScheduleOverrides,
  resetAllOverrides,
  ScheduleOverrideMeta,
} from '../logic/scheduleOverrides';
import {
  downloadSchedulesExcel,
  parseScheduleFile,
  ParseResult,
} from '../logic/scheduleExcel';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

function terminalName(code: string): string {
  return IMP_TERM_NAMES[code] ?? EXP_DEPOTS[code] ?? code;
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBanner({ meta, impOverrides, expOverrides, onReset }: {
  meta: ScheduleOverrideMeta | null;
  impOverrides: Record<string, unknown> | null;
  expOverrides: Record<string, unknown> | null;
  onReset: () => void;
}) {
  const hasOverrides = !!(
    (impOverrides && Object.keys(impOverrides).length > 0) ||
    (expOverrides && Object.keys(expOverrides).length > 0)
  );

  if (!hasOverrides) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
        <Info className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-slate-500 font-medium">
          Using <span className="font-bold text-slate-700">built-in schedules</span>. No custom uploads applied.
        </span>
      </div>
    );
  }

  const impCount = impOverrides ? Object.keys(impOverrides).length : 0;
  const expCount = expOverrides ? Object.keys(expOverrides).length : 0;

  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-emerald-800">
            Custom schedules active
            {meta?.lastUploadDate && (
              <span className="font-normal text-emerald-600 ml-2">
                · Last updated {fmtDate(meta.lastUploadDate)}
              </span>
            )}
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            {impCount > 0 && (
              <span>
                <span className="font-bold">{impCount}</span> import terminal{impCount !== 1 ? 's' : ''} overridden
                {meta?.updatedImpTerminals?.length ? `: ${meta.updatedImpTerminals.join(', ')}` : ''}
              </span>
            )}
            {impCount > 0 && expCount > 0 && <span className="mx-2 text-emerald-400">·</span>}
            {expCount > 0 && (
              <span>
                <span className="font-bold">{expCount}</span> export depot{expCount !== 1 ? 's' : ''} overridden
                {meta?.updatedExpDepots?.length ? `: ${meta.updatedExpDepots.join(', ')}` : ''}
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
      >
        <RefreshCw className="h-3 w-3" />
        Reset to defaults
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function UploadPreview({ result, onApply, onCancel }: {
  result: ParseResult;
  onApply: () => void;
  onCancel: () => void;
}) {
  const hasImp = result.updatedImpTerminals.length > 0;
  const hasExp = result.updatedExpDepots.length > 0;
  const hasWarnings = result.warnings.length > 0;
  const hasData = hasImp || hasExp;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Summary */}
      <div className={cn(
        'px-4 py-3 rounded-xl border text-sm',
        hasData ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'
      )}>
        <div className="flex items-start gap-2">
          {hasData
            ? <FileSpreadsheet className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            : <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          }
          <div>
            <p className={cn('font-bold', hasData ? 'text-blue-800' : 'text-amber-800')}>
              {hasData ? 'Ready to apply' : 'No valid data found'}
            </p>
            {hasImp && (
              <p className="text-blue-700 mt-0.5">
                Import: <span className="font-bold">{result.updatedImpTerminals.length}</span> terminal{result.updatedImpTerminals.length !== 1 ? 's' : ''}
                {' '}({result.impRowCount} schedule row{result.impRowCount !== 1 ? 's' : ''})
                — {result.updatedImpTerminals.map(c => terminalName(c)).join(', ')}
              </p>
            )}
            {hasExp && (
              <p className="text-blue-700 mt-0.5">
                Export: <span className="font-bold">{result.updatedExpDepots.length}</span> depot{result.updatedExpDepots.length !== 1 ? 's' : ''}
                {' '}({result.expRowCount} schedule row{result.expRowCount !== 1 ? 's' : ''})
                — {result.updatedExpDepots.map(c => terminalName(c)).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            {result.warnings.length} warning{result.warnings.length !== 1 ? 's' : ''} — rows skipped
          </p>
          <ul className="space-y-0.5">
            {result.warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700">· {w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onApply}
          disabled={!hasData}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all',
            hasData
              ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Apply Updates
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function ImpScheduleTable() {
  const overrides = getImpOverrides();

  // Build merged: overridden terminals first, then remaining built-ins
  type Row = {
    port: string;
    code: string;
    name: string;
    mode: string;
    etd: string;
    eta: string;
    overridden: boolean;
  };

  const overriddenSet = new Set(overrides ? Object.keys(overrides) : []);
  const rows: Row[] = IMP_SCHEDULES.filter(s => !overriddenSet.has(s.loc)).map(s => ({
    port: s.t, code: s.loc, name: IMP_TERM_NAMES[s.loc] ?? s.loc,
    mode: s.mod, etd: s.etd, eta: s.eta, overridden: false,
  }));

  if (overrides) {
    for (const [code, scheds] of Object.entries(overrides)) {
      for (const s of scheds) {
        rows.push({
          port: s.t, code, name: IMP_TERM_NAMES[code] ?? code,
          mode: s.mod, etd: s.etd, eta: s.eta, overridden: true,
        });
      }
    }
  }

  rows.sort((a, b) => a.code.localeCompare(b.code) || a.port.localeCompare(b.port));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {['Port', 'Terminal Code', 'Terminal Name', 'Mode', 'Dep. Day', 'Arr. Day', ''].map(h => (
              <th key={h} className="px-3 py-2.5 text-left font-black text-slate-500 uppercase tracking-wider text-[10px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={i} className={cn('hover:bg-slate-50', r.overridden && 'bg-violet-50/60')}>
              <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{r.port === 'Rotterdam' ? 'RTM' : 'ANR'}</td>
              <td className="px-3 py-2 font-mono font-bold text-slate-700 text-[11px]">{r.code}</td>
              <td className="px-3 py-2 text-slate-700">{r.name}</td>
              <td className="px-3 py-2">
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-bold',
                  r.mode === 'Rail' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                )}>{r.mode}</span>
              </td>
              <td className="px-3 py-2 font-mono text-slate-700">{r.etd}</td>
              <td className="px-3 py-2 font-mono text-slate-700">{r.eta}</td>
              <td className="px-3 py-2">
                {r.overridden && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-violet-200 text-violet-700 uppercase tracking-wider">
                    Custom
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const ISO_TO_DAY: Record<number, string> = {
  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun',
};

function ExpScheduleTable() {
  const overrides = getExpOverrides();

  type Row = {
    port: string;
    code: string;
    name: string;
    mode: string;
    dep: string;
    transit: number;
    buffer: number;
    terms: string;
    overridden: boolean;
  };

  const rows: Row[] = [];

  const overriddenSet = new Set(overrides ? Object.keys(overrides) : []);

  // Built-ins not overridden
  for (const [code, ports] of Object.entries(EXP_SCHED)) {
    if (overriddenSet.has(code)) continue;
    for (const [port, entries] of Object.entries(ports)) {
      if (!entries) continue;
      for (const e of entries) {
        rows.push({
          port, code, name: EXP_DEPOTS[code] ?? code,
          mode: e.mod, dep: ISO_TO_DAY[e.dep] ?? String(e.dep),
          transit: e.transit, buffer: e.buffer,
          terms: e.terms ? e.terms.join(', ') : '—',
          overridden: false,
        });
      }
    }
  }

  // Overrides
  if (overrides) {
    for (const [code, ports] of Object.entries(overrides)) {
      for (const [port, entries] of Object.entries(ports)) {
        if (!entries) continue;
        for (const e of entries) {
          rows.push({
            port, code, name: EXP_DEPOTS[code] ?? code,
            mode: e.mod, dep: ISO_TO_DAY[e.dep] ?? String(e.dep),
            transit: e.transit, buffer: e.buffer,
            terms: e.terms ? e.terms.join(', ') : '—',
            overridden: true,
          });
        }
      }
    }
  }

  rows.sort((a, b) => a.code.localeCompare(b.code) || a.port.localeCompare(b.port));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {['Port', 'Depot Code', 'Depot Name', 'Mode', 'Dep. Day', 'Transit', 'Buffer', 'Terminal Filter', ''].map(h => (
              <th key={h} className="px-3 py-2.5 text-left font-black text-slate-500 uppercase tracking-wider text-[10px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={i} className={cn('hover:bg-slate-50', r.overridden && 'bg-violet-50/60')}>
              <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{r.port}</td>
              <td className="px-3 py-2 font-mono font-bold text-slate-700 text-[11px]">{r.code}</td>
              <td className="px-3 py-2 text-slate-700">{r.name}</td>
              <td className="px-3 py-2">
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-bold',
                  r.mode === 'Rail' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                )}>{r.mode}</span>
              </td>
              <td className="px-3 py-2 font-mono text-slate-700">{r.dep}</td>
              <td className="px-3 py-2 font-mono text-slate-600">{r.transit}d</td>
              <td className="px-3 py-2 font-mono text-slate-600">{r.buffer}d</td>
              <td className="px-3 py-2 text-slate-500 text-[10px]">{r.terms}</td>
              <td className="px-3 py-2">
                {r.overridden && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-violet-200 text-violet-700 uppercase tracking-wider">
                    Custom
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export function ScheduleManager() {
  // Force re-render after override changes
  const [, setRefresh] = useState(0);
  const refresh = useCallback(() => setRefresh(n => n + 1), []);

  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showImpTable, setShowImpTable] = useState(false);
  const [showExpTable, setShowExpTable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meta = getOverrideMeta();
  const impOverrides = getImpOverrides();
  const expOverrides = getExpOverrides();

  // ── file handling ──────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setParseError('Only .xlsx files are supported.');
      return;
    }
    setIsParsingFile(true);
    setParseError(null);
    setParseResult(null);
    setSuccessMsg(null);
    try {
      const result = await parseScheduleFile(file);
      setParseResult(result);
    } catch (err) {
      setParseError(String(err));
    } finally {
      setIsParsingFile(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  // ── apply / reset ──────────────────────────────────────────────────────────

  async function handleApply() {
    if (!parseResult) return;
    const merged = applyScheduleOverrides(
      parseResult.impOverrides,
      parseResult.expOverrides,
      {
        impTerminals: parseResult.updatedImpTerminals,
        expDepots:    parseResult.updatedExpDepots,
      },
    );

    // Persist to Supabase so all users get the updated schedules
    await supabase.from('schedule_overrides').upsert([
      { id: 'imp',  data: merged.imp,  updated_at: new Date().toISOString() },
      { id: 'exp',  data: merged.exp,  updated_at: new Date().toISOString() },
      { id: 'meta', data: merged.meta, updated_at: new Date().toISOString() },
    ]);

    const parts: string[] = [];
    if (parseResult.updatedImpTerminals.length) {
      parts.push(`${parseResult.updatedImpTerminals.length} import terminal${parseResult.updatedImpTerminals.length !== 1 ? 's' : ''}`);
    }
    if (parseResult.updatedExpDepots.length) {
      parts.push(`${parseResult.updatedExpDepots.length} export depot${parseResult.updatedExpDepots.length !== 1 ? 's' : ''}`);
    }
    setSuccessMsg(`Schedules updated: ${parts.join(' and ')} — all users now use the new data.`);
    setParseResult(null);
    refresh();
  }

  async function handleReset() {
    resetAllOverrides();
    // Delete overrides from Supabase — all users revert to built-in data
    await supabase.from('schedule_overrides').delete().in('id', ['imp', 'exp', 'meta']);
    setSuccessMsg('Schedules reset to built-in defaults for all users.');
    setParseResult(null);
    refresh();
  }

  // ── download ───────────────────────────────────────────────────────────────

  function handleDownload() {
    // Build merged imp schedules if overrides exist
    const impOv = getImpOverrides();
    let impScheds = IMP_SCHEDULES;
    if (impOv && Object.keys(impOv).length > 0) {
      const overriddenSet = new Set(Object.keys(impOv));
      const base = IMP_SCHEDULES.filter(s => !overriddenSet.has(s.loc));
      impScheds = [...base, ...Object.values(impOv).flat()];
    }

    const expOv = getExpOverrides();
    let expSched = EXP_SCHED;
    if (expOv && Object.keys(expOv).length > 0) {
      expSched = { ...EXP_SCHED, ...expOv };
    }

    downloadSchedulesExcel(impScheds, expSched);
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-10">

      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#150a2e] via-[#210d45] to-[#150a2e] border border-violet-500/20 shadow-lg mb-1">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 28px),repeating-linear-gradient(180deg,#fff 0,#fff 1px,transparent 0,transparent 28px)' }} />
        <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-violet-500/8 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-violet-500/15 rounded-xl border border-violet-500/20">
              <Database className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">
                  Schedule <span className="text-violet-400">Manager</span>
                </h2>
              </div>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em]">
                Export · Upload · Override Barge &amp; Rail Schedules
              </p>
            </div>
          </div>

          {(impOverrides && Object.keys(impOverrides).length > 0) || (expOverrides && Object.keys(expOverrides).length > 0) ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-xl text-xs font-bold text-violet-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Custom schedules active
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/8 border border-white/10 rounded-xl text-xs font-bold text-white/40">
              <Database className="h-3.5 w-3.5" />
              Built-in defaults
            </div>
          )}
        </div>
      </div>

      {/* Status banner */}
      <StatusBanner
        meta={meta}
        impOverrides={impOverrides}
        expOverrides={expOverrides}
        onReset={handleReset}
      />

      {/* Success message */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-green-800 font-medium">{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-green-500 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Download card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
              <Download className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Export Schedules</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Download as Excel</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Download the current schedule data as an Excel file. Edit only the ETD Day and ETA Day columns —
              transit and buffer are calculated automatically. Upload back to apply changes.
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <Anchor className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                <span><span className="font-bold">Import Schedules</span> — {IMP_SCHEDULES.length} rows · Port · Terminal Code · Mode · ETD Day · ETA Day</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <Send className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span><span className="font-bold">Export Schedules</span> — {Object.values(EXP_SCHED).flatMap(p => [...(p.RTM ?? []), ...(p.ANR ?? [])]).length} rows · Port · Depot Code · Mode · ETD Day · ETA Day</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Transit days are auto-calculated from ETD→ETA. Buffer defaults: Rail = 2d, Barge = 1d.</span>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download Schedules (.xlsx)
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              The file reflects currently active schedules (including any custom uploads).
            </p>
          </div>
        </div>

        {/* Upload card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-xl border border-violet-100">
              <Upload className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Upload Updated Schedules</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Apply new schedule data</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload an edited schedule file to update the planning logic. Only terminals or depots
              included in the file will be updated — all others remain unchanged.
            </p>

            {/* Dropzone */}
            {!parseResult && !isParsingFile && (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'relative border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-all',
                  isDragging
                    ? 'border-violet-400 bg-violet-50'
                    : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/40'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Upload className="h-8 w-8 text-violet-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-600">
                  Drop your .xlsx file here
                </p>
                <p className="text-xs text-slate-400 mt-1">or click to browse</p>
              </div>
            )}

            {/* Parsing state */}
            {isParsingFile && (
              <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-500">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="h-5 w-5 text-violet-500" />
                </motion.div>
                Parsing schedule file…
              </div>
            )}

            {/* Parse error */}
            {parseError && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-red-700">Failed to parse file</p>
                  <p className="text-red-600 text-xs mt-0.5">{parseError}</p>
                  <button
                    onClick={() => { setParseError(null); fileInputRef.current?.click(); }}
                    className="mt-2 text-xs font-bold text-red-600 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Preview before applying */}
            {parseResult && (
              <UploadPreview
                result={parseResult}
                onApply={handleApply}
                onCancel={() => setParseResult(null)}
              />
            )}

            {!parseResult && !isParsingFile && !parseError && (
              <p className="text-[10px] text-slate-400 text-center">
                Only <span className="font-bold">.xlsx</span> files are supported. Use the download button above to get the correct template.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-slate-400" />
          <p className="text-xs font-black text-slate-600 uppercase tracking-widest">How schedule updates work</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              title: 'Download',
              desc: 'Export the current schedules as an Excel file. Each sheet has clearly labelled columns.',
              color: 'blue',
            },
            {
              step: '2',
              title: 'Edit in Excel',
              desc: 'Update departure days, arrival days, or transit times. Delete rows you want to remove. Only include the terminals that have changed.',
              color: 'amber',
            },
            {
              step: '3',
              title: 'Upload & Apply',
              desc: 'Drop the file back here. The tool will preview what will change, then apply it — only updating terminals in your file.',
              color: 'violet',
            },
          ].map(({ step, title, desc, color }) => (
            <div key={step} className="flex gap-3">
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5',
                color === 'blue'   && 'bg-blue-100 text-blue-700',
                color === 'amber'  && 'bg-amber-100 text-amber-700',
                color === 'violet' && 'bg-violet-100 text-violet-700',
              )}>
                {step}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collapsible schedule reference tables */}
      <div className="space-y-3">

        {/* Import schedules */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowImpTable(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Anchor className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Import Schedules</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {IMP_SCHEDULES.length} entries
                {impOverrides && Object.keys(impOverrides).length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded text-[9px]">
                    {Object.keys(impOverrides).length} overridden
                  </span>
                )}
              </span>
            </div>
            {showImpTable ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showImpTable && (
            <div className="px-5 pb-5">
              <ImpScheduleTable />
            </div>
          )}
        </div>

        {/* Export schedules */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setShowExpTable(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Send className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-black text-slate-700 uppercase tracking-tight">Export Schedules</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {Object.values(EXP_SCHED).flatMap(p => [...(p.RTM ?? []), ...(p.ANR ?? [])]).length} entries
                {expOverrides && Object.keys(expOverrides).length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded text-[9px]">
                    {Object.keys(expOverrides).length} overridden
                  </span>
                )}
              </span>
            </div>
            {showExpTable ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showExpTable && (
            <div className="px-5 pb-5">
              <ExpScheduleTable />
            </div>
          )}
        </div>

      </div>

      {/* ── Truck Capacity Manager ─────────────────────────────────────── */}
      <TruckCapacityManager />

      {/* ── Terminal Congestion Manager ────────────────────────────────── */}
      <CongestionManager />

    </div>
  );
}

// ─── Truck Capacity Manager ───────────────────────────────────────────────────

function TruckCapacityManager() {
  const truckCapacityData    = usePlannerStore(s => s.truckCapacityData);
  const setTruckCapacityData = usePlannerStore(s => s.setTruckCapacityData);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build the same 15-day working-day headers used by the dashboard chart
  function buildDays() {
    const days: { dayName: string; date: string }[] = [];
    const d = new Date();
    while (days.length < 15) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        days.push({
          dayName: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow],
          date: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
        });
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  const CAPACITY_LABELS: Record<number, string> = {
    0: 'Not possible',
    1: 'All possible',
    2: 'From 1100hrs',
    3: 'From 1300hrs',
    4: 'From 1600hrs',
    5: 'On request',
  };

  function parseCapacityLabel(val: string | undefined): number {
    if (!val) return 0;
    const v = val.trim().toLowerCase();
    if (v === 'all possible' || v === 'available') return 1;
    if (v === 'from 1100hrs' || v === '1100hrs') return 2;
    if (v === 'from 1300hrs' || v === '1300hrs') return 3;
    if (v === 'from 1600hrs' || v === '1600hrs') return 4;
    if (v === 'on request' || v === 'request') return 5;
    return 0; // 'not possible', 'booked out', or anything unrecognised
  }

  function handleDownload() {
    const days = buildDays();
    const data = truckCapacityData.map(hub => {
      const row: Record<string, string> = { Hub: hub.location };
      days.forEach((day, i) => {
        row[`${day.dayName} ${day.date}`] = CAPACITY_LABELS[hub.forecast[i] ?? 0] ?? 'Not possible';
      });
      return row;
    });
    // Legend sheet so colleagues know which values to use
    const legendData = Object.entries(CAPACITY_LABELS).map(([val, label]) => ({
      Value: label,
      Description: val === '0' ? 'No truck capacity — leave as is or mark Not possible'
        : val === '1' ? 'Full day availability — all loading times possible'
        : val === '2' ? 'Loading only possible from 1100hrs onwards'
        : val === '3' ? 'Loading only possible from 1300hrs onwards'
        : val === '4' ? 'Loading only possible from 1600hrs onwards'
        : 'Available on request only — contact inland ops',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wsLegend = XLSX.utils.json_to_sheet(legendData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Capacity Forecast');
    XLSX.utils.book_append_sheet(wb, wsLegend, 'Status Guide');
    XLSX.writeFile(wb, 'Maersk_Truck_Capacity_Forecast.xlsx');
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadSuccess(false);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const days = buildDays();
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as Record<string, string>[];
        const updated = rows.map(row => ({
          location: String(row.Hub ?? ''),
          forecast: days.map(day => parseCapacityLabel(row[`${day.dayName} ${day.date}`])),
        })).filter(r => r.location);
        if (updated.length > 0) {
          setTruckCapacityData(updated);
          // Persist to Supabase — await so we know if it succeeded before showing success
          const { error } = await supabase.from('schedule_overrides').upsert([
            { id: 'truck_capacity', data: updated, updated_at: new Date().toISOString() },
          ]);
          if (error) {
            setUploadError(`Data updated locally but failed to sync to server: ${error.message}. Other users may not see the change.`);
          } else {
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 4000);
          }
        } else {
          setUploadError('No valid rows found. Make sure the Hub column and date headers match the template.');
        }
      } catch {
        setUploadError('Could not read file. Make sure it is a valid .xlsx file.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
          <Truck className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Export Truck Capacity Forecast</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Download · Edit · Re-upload to update the dashboard chart</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Download the current 15-day capacity grid, mark hubs as <strong>Available</strong> or <strong>Booked Out</strong> in Excel, then upload to instantly reflect changes on the dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
          >
            <Download className="h-4 w-4" />
            Extract Excel Template
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors shadow-md shadow-violet-500/20 cursor-pointer">
            <Upload className="h-4 w-4" />
            Upload Updated Capacity
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              Capacity updated — dashboard chart now reflects the new data.
            </motion.div>
          )}
          {uploadError && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {uploadError}
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-[10px] text-slate-400 text-center">
          Only <span className="font-bold">.xlsx</span> files are supported. Use the extract button to get the correct column headers.
        </p>
      </div>
    </div>
  );
}

// ─── Terminal Congestion Manager ──────────────────────────────────────────────

function classifyStatus(hours: number): 'Low' | 'Medium' | 'High' {
  if (hours <= 8)  return 'Low';
  if (hours <= 24) return 'Medium';
  return 'High';
}

function CongestionManager() {
  const terminalCongestionData    = usePlannerStore(s => s.terminalCongestionData);
  const setTerminalCongestionData = usePlannerStore(s => s.setTerminalCongestionData);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  function handleDownload() {
    const data = terminalCongestionData.map(item => ({
      Port: item.port,
      Terminal: item.terminal,
      'Waiting Hours': item.waitingTime,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Congestion');
    XLSX.writeFile(wb, 'Terminal_Congestion_Update.xlsx');
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadSuccess(false);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
        const updated: TerminalCongestion[] = rows
          .filter(row => row.Terminal && (row['Waiting Hours'] !== undefined || row['Waiting Time (Hours)'] !== undefined))
          .map((row, idx) => {
            const hours = Number(row['Waiting Hours'] ?? row['Waiting Time (Hours)'] ?? 0);
            return {
              id: `upd-${idx}`,
              port: (row.Port ?? 'Rotterdam') as 'Rotterdam' | 'Antwerp',
              terminal: String(row.Terminal),
              waitingTime: hours,
              status: classifyStatus(hours),
              lastUpdated: new Date().toISOString(),
            };
          });
        if (updated.length > 0) {
          setTerminalCongestionData(updated);
          // Persist to Supabase — await so we know if it succeeded before showing success
          const { error } = await supabase.from('schedule_overrides').upsert([
            { id: 'congestion', data: updated, updated_at: new Date().toISOString() },
          ]);
          if (error) {
            setUploadError(`Data updated locally but failed to sync to server: ${error.message}. Other users may not see the change.`);
          } else {
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 4000);
          }
        } else {
          setUploadError('No valid rows found. Ensure the Terminal and Waiting Hours columns are present.');
        }
      } catch {
        setUploadError('Could not read file. Make sure it is a valid .xlsx file.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
          <Anchor className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Terminal Barge Congestion</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Download · Edit · Re-upload to update the dashboard congestion table</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          Download the current congestion data, update the <strong>Waiting Hours</strong> column per terminal in Excel, then upload. Status (Low / Medium / High) is auto-classified on import.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
          >
            <Download className="h-4 w-4" />
            Extract Excel Template
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors shadow-md shadow-violet-500/20 cursor-pointer">
            <Upload className="h-4 w-4" />
            Upload Updated Congestion
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
        <AnimatePresence>
          {uploadSuccess && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              Congestion data updated — dashboard table now reflects the new data.
            </motion.div>
          )}
          {uploadError && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {uploadError}
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-[10px] text-slate-400 text-center">
          Columns required: <span className="font-bold">Port · Terminal · Waiting Hours</span>. Status is auto-calculated — do not include it in the upload.
        </p>
      </div>
    </div>
  );
}
