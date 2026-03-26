import { useState, useEffect, useCallback } from 'react';
import { ImportForm } from '../components/planner/ImportForm';
import { ImportResultView } from '../components/planner/ImportResultView';
import { usePlannerStore } from '../store/usePlannerStore';
import { Anchor, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { fmtS } from '../logic/dateUtils';

export function ImportPlanner() {
  // Selector: only re-renders when impRunResult changes, not on any other store update
  const impRunResult = usePlannerStore(s => s.impRunResult);
  const [filterOpen, setFilterOpen] = useState(!impRunResult);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && filterOpen) setFilterOpen(false);
  }, [filterOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="space-y-5 pb-10">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#001829] via-[#00243d] to-[#001829] border border-maersk-blue/20 shadow-lg mb-1">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 28px),repeating-linear-gradient(180deg,#fff 0,#fff 1px,transparent 0,transparent 28px)' }} />
        <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#42b0d5]/8 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-[#42b0d5]/15 rounded-xl border border-[#42b0d5]/20">
              <Anchor className="h-5 w-5 text-[#42b0d5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">
                  Import <span className="text-[#42b0d5]">Booking</span>
                </h2>
              </div>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em]">Port → Inland Depot → Customer Delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {impRunResult && !impRunResult.error && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/8 border border-white/10 rounded-xl text-xs font-bold text-white/60">
                <span className="font-mono font-black text-white/80">{impRunResult.zip}</span>
                <span className="text-white/20">·</span>
                <span>{impRunResult.portName}</span>
                <span className="text-white/20">·</span>
                <span>{fmtS(impRunResult.vesselETD)}</span>
              </div>
            )}
            <button
              onClick={() => setFilterOpen(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200',
                impRunResult
                  ? 'bg-white/10 border border-white/15 text-white/70 hover:bg-white/15 hover:text-white'
                  : 'bg-[#42b0d5] text-white shadow-lg shadow-[#42b0d5]/30 hover:bg-[#42b0d5]/90'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {impRunResult ? 'Change Filters' : 'Configure Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Results or empty state */}
      {impRunResult ? (
        <ImportResultView result={impRunResult} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-sm"
        >
          {/* subtle grid bg */}
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#0063a5 0,#0063a5 1px,transparent 0,transparent 32px),repeating-linear-gradient(180deg,#0063a5 0,#0063a5 1px,transparent 0,transparent 32px)' }} />
          <div className="absolute top-0 right-0 w-64 h-64 bg-maersk-blue/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-maersk-blue/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <div className="inline-flex p-5 bg-maersk-blue/8 rounded-2xl border border-maersk-blue/15 mb-5 shadow-inner">
              <Anchor className="h-10 w-10 text-maersk-blue/40" />
            </div>
            <p className="text-base font-black text-slate-500 uppercase tracking-widest mb-1.5">Import Booking</p>
            <p className="text-sm text-slate-300 font-bold mb-8 max-w-xs mx-auto">Enter postcode, port &amp; vessel ETD to calculate the best inland schedule</p>
            <button
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-3 bg-maersk-blue text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-maersk-blue/30 hover:bg-maersk-blue/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Configure Search
            </button>
          </div>
        </motion.div>
      )}

      {/* Filter Modal */}
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
              onClick={() => setFilterOpen(false)}
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
                  <div className="p-1.5 bg-maersk-blue/20 rounded-lg">
                    <Anchor className="h-4 w-4 text-maersk-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-widest leading-none">Import Booking</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">Port → Inland Delivery</p>
                  </div>
                </div>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-b-2xl overflow-hidden shadow-2xl shadow-black/40 max-h-[80vh] overflow-y-auto">
                <ImportForm onSuccess={() => setFilterOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
