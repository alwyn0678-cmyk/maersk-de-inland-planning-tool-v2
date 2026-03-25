import { useEffect, useState } from 'react';
import { ExportForm } from '../components/planner/ExportForm';
import { ExportResultView } from '../components/planner/ExportResultView';
import { usePlannerStore } from '../store/usePlannerStore';
import { Settings2, ChevronDown, ChevronUp, Anchor, TrendingUp, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function ExportPlanner() {
  const { expRunResult, exportRequest } = usePlannerStore();
  const [showForm, setShowForm] = useState(true);

  useEffect(() => { if (expRunResult) setShowForm(false); }, [expRunResult]);
  useEffect(() => { if (!expRunResult) setShowForm(true); }, [expRunResult]);

  return (
    <div className="space-y-5 pb-10">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative pl-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
            <h2 className="text-3xl font-black tracking-tighter text-maersk-dark uppercase italic leading-tight">
              Export <span className="text-emerald-500 not-italic">Planner</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Inland Collection Optimizer
            </p>
          </div>
        </div>

        {/* Live status + quick stats */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-1.5">
              <Anchor className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">6 Terminals</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DE Network</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                <div className="h-2 w-2 rounded-full bg-emerald-500 relative" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Collapsible parameters panel ────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <Settings2 className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm font-black text-maersk-dark uppercase tracking-wide">Optimization Parameters</span>
            {expRunResult && !showForm && exportRequest.postcode && (
              <div className="flex items-center gap-1.5 ml-2 flex-wrap">
                {[
                  exportRequest.postcode && `ZIP ${exportRequest.postcode}`,
                  exportRequest.containerType,
                  exportRequest.loadingDate,
                  exportRequest.loadingTime,
                ].filter(Boolean).map((tag, i) => (
                  <span key={i} className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
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
                <ExportForm />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      {expRunResult ? (
        <ExportResultView result={expRunResult} />
      ) : (
        !showForm && (
          <div className="p-8 text-center bg-slate-50/60 border border-slate-100 rounded-2xl">
            <MapPin className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Enter ZIP, terminal and loading date — then run the optimizer
            </p>
          </div>
        )
      )}

    </div>
  );
}
