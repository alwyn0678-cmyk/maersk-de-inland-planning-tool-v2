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
      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#001a0e] via-[#002d1a] to-[#001a0e] border border-emerald-500/20 shadow-lg mb-1">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 28px),repeating-linear-gradient(180deg,#fff 0,#fff 1px,transparent 0,transparent 28px)' }} />
        <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-emerald-500/8 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-500/15 rounded-xl border border-emerald-500/20">
              <Send className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">
                  Export <span className="text-emerald-400">Booking</span>
                </h2>
                <span className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest border border-emerald-500/20 px-1.5 py-0.5 rounded">Beta</span>
              </div>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em]">Inland Collection → Depot → Port Terminal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {expRunResult && !expRunResult.error && !expRunResult.isrRequired && !expRunResult.notServicedAntwerp && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/8 border border-white/10 rounded-xl text-xs font-bold text-white/60">
                <span className="font-mono font-black text-white/80">{expRunResult.zip}</span>
                <span className="text-white/20">·</span>
                <span>{expRunResult.termCode}</span>
                <span className="text-white/20">·</span>
                <span>{fmtS(expRunResult.loadingDate)}</span>
              </div>
            )}
            <button
              onClick={() => setFilterOpen(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200',
                expRunResult
                  ? 'bg-white/10 border border-white/15 text-white/70 hover:bg-white/15 hover:text-white'
                  : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {expRunResult ? 'Change Filters' : 'Configure Search'}
            </button>
          </div>
        </div>
      </div>

      {expRunResult ? (
        <ExportResultView result={expRunResult} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-sm"
        >
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#10b981 0,#10b981 1px,transparent 0,transparent 32px),repeating-linear-gradient(180deg,#10b981 0,#10b981 1px,transparent 0,transparent 32px)' }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex p-5 bg-emerald-500/8 rounded-2xl border border-emerald-500/15 mb-5 shadow-inner">
              <Send className="h-10 w-10 text-emerald-500/40" />
            </div>
            <p className="text-base font-black text-slate-500 uppercase tracking-widest mb-1.5">Export Booking</p>
            <p className="text-sm text-slate-300 font-bold mb-8 max-w-xs mx-auto">Enter postcode, terminal &amp; loading date to find the earliest vessel window</p>
            <button
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Configure Search
            </button>
          </div>
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
