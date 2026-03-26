import { useState, useEffect, useCallback } from 'react';
import { CYCYForm } from '../components/planner/CYCYForm';
import { CYCYResultCard } from '../components/planner/CYCYResultCard';
import { usePlannerStore } from '../store/usePlannerStore';
import { ArrowRightLeft, Anchor, TrendingUp, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function CYCYPlanner() {
  const cycyRequest     = usePlannerStore(s => s.cycyRequest);
  const cycyRunResult   = usePlannerStore(s => s.cycyRunResult);
  const setCYCYRequest  = usePlannerStore(s => s.setCYCYRequest);
  const setCycyRunResult = usePlannerStore(s => s.setCycyRunResult);
  const resetCYCY       = usePlannerStore(s => s.resetCYCY);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && filterOpen) setFilterOpen(false);
  }, [filterOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const isImport = cycyRequest.direction === 'Import';

  function switchDirection(dir: 'Import' | 'Export') {
    // Clear previous results without wiping the direction we're about to set
    setCycyRunResult(null);
    if (dir === 'Import') {
      setCYCYRequest({ direction: 'Import', originTerminal: 'RTM', inlandTerminal: 'DEDUI01' });
    } else {
      setCYCYRequest({ direction: 'Export', originTerminal: 'DEDUI01', inlandTerminal: 'DEDUI01', destinationTerminal: 'NLROTTM|5|RTM' });
    }
    setFilterOpen(true);
  }

  // Direction selection splash
  if (!cycyRequest.direction) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2 max-w-md">
          <div className="inline-flex p-3 bg-white rounded-2xl mb-3 shadow-lg shadow-maersk-blue/10 ring-1 ring-slate-100">
            <ArrowRightLeft className="h-6 w-6 text-maersk-blue" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-maersk-dark uppercase italic">
            CY/CY <span className="text-maersk-blue not-italic">Booking</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Select network flow direction to begin
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 w-full max-w-xl px-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setCYCYRequest({ direction: 'Import', originTerminal: 'RTM', inlandTerminal: 'DEDUI01' }); setFilterOpen(true); }}
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
              <p className="text-[9px] opacity-70 font-black tracking-widest uppercase">Rotterdam → Duisburg</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setCYCYRequest({ direction: 'Export', inlandTerminal: 'DEDUI01', destinationTerminal: 'NLROTTM|5|RTM' }); setFilterOpen(true); }}
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

        {/* Modal for initial direction (opened immediately on card click via setFilterOpen) */}
        <AnimatePresence>
          {filterOpen && cycyRequest.direction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-maersk-dark/70 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="relative z-10 w-full max-w-lg"
              >
                <div className="flex items-center justify-between px-5 py-4 bg-maersk-dark rounded-t-2xl border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-1.5 rounded-lg', cycyRequest.direction === 'Import' ? 'bg-maersk-blue/20' : 'bg-emerald-500/20')}>
                      <ArrowRightLeft className={cn('h-4 w-4', cycyRequest.direction === 'Import' ? 'text-maersk-blue' : 'text-emerald-500')} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white uppercase tracking-widest leading-none">CY/CY {cycyRequest.direction} Booking</p>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">Terminal-to-Terminal Network</p>
                    </div>
                  </div>
                  <button onClick={() => setFilterOpen(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-b-2xl overflow-hidden shadow-2xl shadow-black/40 max-h-[80vh] overflow-y-auto">
                  <CYCYForm onSuccess={() => setFilterOpen(false)} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="relative pl-4">
          <div className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-full",
            isImport ? "bg-maersk-blue shadow-[0_0_10px_rgba(66,176,213,0.6)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
          )} />
          <h2 className="text-3xl font-black tracking-tighter text-maersk-dark uppercase italic leading-tight">
            CY/CY <span className={cn('not-italic', isImport ? 'text-maersk-blue' : 'text-emerald-500')}>Booking</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Terminal-to-Terminal Network</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Direction switcher */}
          <div className="bg-slate-100/70 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50">
            <button
              onClick={() => cycyRequest.direction !== 'Import' && switchDirection('Import')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-1.5',
                cycyRequest.direction === 'Import' ? 'bg-white text-maersk-blue shadow-md' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Anchor className="h-3 w-3" />Import
            </button>
            <button
              onClick={() => cycyRequest.direction !== 'Export' && switchDirection('Export')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-1.5',
                cycyRequest.direction === 'Export' ? 'bg-white text-emerald-500 shadow-md' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <TrendingUp className="h-3 w-3" />Export
            </button>
          </div>

          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200',
              cycyRunResult
                ? 'bg-white border border-slate-200 text-slate-600 hover:border-maersk-blue/40 shadow-sm'
                : isImport
                  ? 'bg-maersk-blue text-white shadow-lg shadow-maersk-blue/30 hover:bg-maersk-blue/90'
                  : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {cycyRunResult ? 'Change Filters' : 'Configure Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      {cycyRunResult ? (
        <CYCYResultCard />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-24 text-center bg-white border border-slate-100 rounded-2xl shadow-sm"
        >
          <div className={cn("inline-flex p-5 rounded-2xl mb-5", isImport ? "bg-maersk-blue/5" : "bg-emerald-500/5")}>
            {isImport
              ? <Anchor className="h-12 w-12 text-maersk-blue/25" />
              : <TrendingUp className="h-12 w-12 text-emerald-500/25" />
            }
          </div>
          <p className="text-base font-black text-slate-400 uppercase tracking-widest mb-2">
            {isImport ? 'Import Flow' : 'Export Flow'} Ready
          </p>
          <p className="text-sm text-slate-300 font-bold mb-7">
            {isImport ? 'Select port, inland terminal & vessel ETD to plan inland delivery' : 'Select depot, port terminal & loading date to plan export route'}
          </p>
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              "inline-flex items-center gap-2 px-8 py-3 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]",
              isImport
                ? "bg-maersk-blue shadow-lg shadow-maersk-blue/30 hover:bg-maersk-blue/90"
                : "bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
            )}
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
                  <div className={cn('p-1.5 rounded-lg', isImport ? 'bg-maersk-blue/20' : 'bg-emerald-500/20')}>
                    <ArrowRightLeft className={cn("h-4 w-4", isImport ? "text-maersk-blue" : "text-emerald-500")} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-widest leading-none">CY/CY {isImport ? 'Import' : 'Export'} Booking</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">Terminal-to-Terminal Network</p>
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
                <CYCYForm onSuccess={() => setFilterOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
