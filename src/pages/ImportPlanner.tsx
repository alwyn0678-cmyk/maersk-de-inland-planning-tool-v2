import { useState } from 'react';
import { ImportForm } from '../components/planner/ImportForm';
import { ImportResultView } from '../components/planner/ImportResultView';
import { usePlannerStore } from '../store/usePlannerStore';
import { Anchor, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { fmtS } from '../logic/dateUtils';

export function ImportPlanner() {
  const { impRunResult } = usePlannerStore();
  const [filterOpen, setFilterOpen] = useState(!impRunResult);

  return (
    <div className="space-y-5 pb-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="relative pl-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-maersk-blue rounded-full shadow-[0_0_10px_rgba(66,176,213,0.6)]" />
          <h2 className="text-3xl font-black tracking-tighter text-maersk-dark uppercase italic leading-tight">
            Import <span className="text-maersk-blue not-italic">Booking</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Port → Inland Delivery</p>
        </div>

        <div className="flex items-center gap-3">
          {impRunResult && !impRunResult.error && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-500 shadow-sm">
              <span className="font-mono font-black text-maersk-dark">{impRunResult.zip}</span>
              <span className="text-slate-200">·</span>
              <span>{impRunResult.portName}</span>
              <span className="text-slate-200">·</span>
              <span>{fmtS(impRunResult.vesselETD)}</span>
            </div>
          )}
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200',
              impRunResult
                ? 'bg-white border border-slate-200 text-slate-600 hover:border-maersk-blue/40 hover:text-maersk-blue shadow-sm'
                : 'bg-maersk-blue text-white shadow-lg shadow-maersk-blue/30 hover:bg-maersk-blue/90'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {impRunResult ? 'Change Filters' : 'Configure Search'}
          </button>
        </div>
      </div>

      {/* Results or empty state */}
      {impRunResult ? (
        <ImportResultView result={impRunResult} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-24 text-center bg-white border border-slate-100 rounded-2xl shadow-sm"
        >
          <div className="inline-flex p-5 bg-maersk-blue/5 rounded-2xl mb-5">
            <Anchor className="h-12 w-12 text-maersk-blue/25" />
          </div>
          <p className="text-base font-black text-slate-400 uppercase tracking-widest mb-2">Import Booking Ready</p>
          <p className="text-sm text-slate-300 font-bold mb-7">Enter postcode, port &amp; vessel date to find the best inland route</p>
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 px-8 py-3 bg-maersk-blue text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-maersk-blue/30 hover:bg-maersk-blue/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Configure Search
          </button>
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
              onClick={() => impRunResult && setFilterOpen(false)}
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
                {impRunResult && (
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
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
