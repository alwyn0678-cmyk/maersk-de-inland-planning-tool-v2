import { useEffect, useState } from 'react';
import { CYCYForm } from '../components/planner/CYCYForm';
import { CYCYResultCard } from '../components/planner/CYCYResultCard';
import { NetworkScheduleBoard } from '../components/planner/NetworkScheduleBoard';
import { usePlannerStore } from '../store/usePlannerStore';
import { ArrowRightLeft, Anchor, TrendingUp, Settings2, ChevronDown, ChevronUp, Ship } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function CYCYPlanner() {
  const { cycyResult, cycyRequest, setCYCYRequest } = usePlannerStore();
  const [showForm, setShowForm] = useState(true);

  useEffect(() => { if (cycyResult) setShowForm(false); }, [cycyResult]);
  useEffect(() => { if (!cycyResult) setShowForm(true); }, [cycyResult]);

  // Direction selection splash
  if (!cycyRequest.direction) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2 max-w-md">
          <div className="inline-flex p-3 bg-white rounded-2xl mb-3 shadow-lg shadow-maersk-blue/10 ring-1 ring-slate-100">
            <ArrowRightLeft className="h-6 w-6 text-maersk-blue" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-maersk-dark uppercase italic">
            CY/CY <span className="text-maersk-blue not-italic">Planner</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Select network flow direction to begin
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 w-full max-w-xl px-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCYCYRequest({ direction: 'Import', originTerminal: 'Rotterdam', destinationTerminal: 'DUISBURG' })}
            className="group relative p-6 rounded-2xl bg-white border border-slate-100 hover:border-maersk-blue/40 transition-all duration-300 hover:shadow-[0_16px_32px_-8px_rgba(66,176,213,0.2)] flex flex-col items-center text-center space-y-3 overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <Anchor className="h-20 w-20 text-maersk-blue" />
            </div>
            <div className="p-4 bg-maersk-blue/10 rounded-xl group-hover:bg-maersk-blue transition-all duration-300">
              <Anchor className="h-7 w-7 text-maersk-blue group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-maersk-dark uppercase tracking-tight group-hover:text-maersk-blue transition-colors italic">
                Import <span className="not-italic">Flow</span>
              </h3>
              <p className="text-slate-400 text-xs font-bold">Port → Inland Terminal</p>
              <p className="text-[9px] opacity-40 font-black tracking-widest uppercase">Rotterdam → Duisburg</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCYCYRequest({ direction: 'Export', originTerminal: 'DUISBURG', destinationTerminal: 'Rotterdam' })}
            className="group relative p-6 rounded-2xl bg-white border border-slate-100 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_16px_32px_-8px_rgba(16,185,129,0.2)] flex flex-col items-center text-center space-y-3 overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="h-20 w-20 text-emerald-500" />
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500 transition-all duration-300">
              <TrendingUp className="h-7 w-7 text-emerald-500 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-maersk-dark uppercase tracking-tight group-hover:text-emerald-500 transition-colors italic">
                Export <span className="not-italic">Flow</span>
              </h3>
              <p className="text-slate-400 text-xs font-bold">Inland Terminal → Port</p>
              <p className="text-[9px] opacity-40 font-black tracking-widest uppercase">Duisburg → Rotterdam</p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  const isImport = cycyRequest.direction === 'Import';

  return (
    <div className="space-y-5 pb-10">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="relative pl-4">
          <div className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-full",
            isImport
              ? "bg-maersk-blue shadow-[0_0_10px_rgba(66,176,213,0.6)]"
              : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
          )} />
          <h2 className="text-3xl font-black tracking-tighter text-maersk-dark uppercase italic leading-tight">
            CY/CY <span className={cn('not-italic', isImport ? 'text-maersk-blue' : 'text-emerald-500')}>Planner</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Terminal-to-Terminal Network Optimizer
          </p>
        </div>

        {/* Direction switcher */}
        <div className="bg-slate-100/70 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50">
          <button
            onClick={() => setCYCYRequest({ direction: 'Import', originTerminal: 'Rotterdam', destinationTerminal: 'DUISBURG' })}
            className={cn(
              'px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-1.5',
              cycyRequest.direction === 'Import'
                ? 'bg-white text-maersk-blue shadow-md'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Anchor className="h-3.5 w-3.5" />
            Import
          </button>
          <button
            onClick={() => setCYCYRequest({ direction: 'Export', originTerminal: 'DUISBURG', destinationTerminal: 'Rotterdam' })}
            className={cn(
              'px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-1.5',
              cycyRequest.direction === 'Export'
                ? 'bg-white text-emerald-500 shadow-md'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* ── Collapsible parameters panel ────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <div className={cn('p-1.5 rounded-lg', isImport ? 'bg-maersk-blue/10' : 'bg-emerald-500/10')}>
              <Settings2 className={cn('h-4 w-4', isImport ? 'text-maersk-blue' : 'text-emerald-600')} />
            </div>
            <span className="text-sm font-black text-maersk-dark uppercase tracking-wide">Optimization Parameters</span>
            {cycyResult && !showForm && cycyRequest.originTerminal && (
              <div className="flex items-center gap-1.5 ml-2 flex-wrap">
                {[
                  cycyRequest.direction,
                  `${cycyRequest.originTerminal} → ${cycyRequest.destinationTerminal}`,
                  cycyRequest.containerType,
                  cycyRequest.date,
                ].filter(Boolean).map((tag, i) => (
                  <span key={i} className={cn(
                    'text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide',
                    isImport ? 'bg-maersk-blue/10 text-maersk-blue' : 'bg-emerald-500/10 text-emerald-600'
                  )}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">{showForm ? 'Hide' : 'Edit'}</span>
            {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {showForm && (
            <motion.div
              key="form"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-4">
                <CYCYForm />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      <CYCYResultCard result={cycyResult} />

      {/* ── Network Departure Board ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-maersk-dark rounded-xl shadow-md">
              <Ship className={cn('h-4 w-4', isImport ? 'text-maersk-blue' : 'text-emerald-500')} />
            </div>
            <div>
              <h3 className="text-base font-black text-maersk-dark uppercase tracking-tight">
                Network <span className={isImport ? 'text-maersk-blue' : 'text-emerald-500'}>Schedule</span>
              </h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                Barge & Rail · Upcoming Departures
              </p>
            </div>
          </div>
          <div className="h-px flex-1 bg-slate-100 hidden md:block" />
        </div>
        <NetworkScheduleBoard direction={isImport ? 'Import' : 'Export'} />
      </div>
    </div>
  );
}
