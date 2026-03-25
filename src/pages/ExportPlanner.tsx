import { useState } from 'react';
import { ExportForm } from '../components/planner/ExportForm';
import { ExportResultView } from '../components/planner/ExportResultView';
import { usePlannerStore } from '../store/usePlannerStore';
import { Send, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { fmtS } from '../logic/dateUtils';

export function ExportPlanner() {
  const { expRunResult } = usePlannerStore();
  const [filterOpen, setFilterOpen] = useState(!expRunResult);

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div className="relative pl-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
          <h2 className="text-3xl font-black tracking-tighter text-maersk-dark uppercase italic leading-tight">
            Export <span className="text-emerald-500 not-italic">Booking</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Inland Collection → Port</p>
        </div>

        <div className="flex items-center gap-3">
          {expRunResult && !expRunResult.error && !expRunResult.isrRequired && !expRunResult.notServicedAntwerp && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-500 shadow-sm">
              <span className="font-mono font-black text-maersk-dark">{expRunResult.zip}</span>
              <span className="text-slate-200">·</span>
              <span>{expRunResult.termCode}</span>
              <span className="text-slate-200">·</span>
              <span>{fmtS(expRunResult.loadingDate)}</span>
            </div>
          )}
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200',
              expRunResult
                ? 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-500/40 hover:text-emerald-600 shadow-sm'
                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {expRunResult ? 'Change Filters' : 'Configure Search'}
          </button>
        </div>
      </div>

      {expRunResult ? (
        <ExportResultView result={expRunResult} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-24 text-center bg-white border border-slate-100 rounded-2xl shadow-sm"
        >
          <div className="inline-flex p-5 bg-emerald-500/5 rounded-2xl mb-5">
            <Send className="h-12 w-12 text-emerald-500/25" />
          </div>
          <p className="text-base font-black text-slate-400 uppercase tracking-widest mb-2">Export Booking Ready</p>
          <p className="text-sm text-slate-300 font-bold mb-7">Enter postcode, terminal &amp; loading date to find the best export route</p>
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Configure Search
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-maersk-dark/70 backdrop-blur-sm"
              onClick={() => expRunResult && setFilterOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="relative z-10 w-full max-w-lg"
            >
              <div className="flex items-center justify-between px-5 py-4 bg-maersk-dark rounded-t-2xl border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                    <Send className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-widest leading-none">Export Booking</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">Inland Collection → Port</p>
                  </div>
                </div>
                {expRunResult && (
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="rounded-b-2xl overflow-hidden shadow-2xl shadow-black/40 max-h-[80vh] overflow-y-auto">
                <ExportForm onSuccess={() => setFilterOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
