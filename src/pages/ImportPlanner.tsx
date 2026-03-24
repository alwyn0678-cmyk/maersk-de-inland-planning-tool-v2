import { useEffect, useState } from 'react';
import { ImportForm } from '../components/planner/ImportForm';
import { ImportResultView } from '../components/planner/ImportResultView';
import { NetworkScheduleBoard } from '../components/planner/NetworkScheduleBoard';
import { usePlannerStore } from '../store/usePlannerStore';
import { Settings2, ChevronDown, ChevronUp, Ship, Anchor, Train, Activity, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function ImportPlanner() {
  const { impRunResult, importRequest } = usePlannerStore();
  const [showForm, setShowForm] = useState(true);

  useEffect(() => { if (impRunResult) setShowForm(false); }, [impRunResult]);
  useEffect(() => { if (!impRunResult) setShowForm(true); }, [impRunResult]);

  return (
    <div className="space-y-5 pb-10">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative pl-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-maersk-blue rounded-full shadow-[0_0_10px_rgba(66,176,213,0.6)]" />
            <h2 className="text-3xl font-black tracking-tighter text-maersk-dark uppercase italic leading-tight">
              Import <span className="text-maersk-blue not-italic">Planner</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Port → Inland Delivery Optimizer
            </p>
          </div>
        </div>

        {/* Live status + quick stats */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-1.5">
              <Anchor className="h-3.5 w-3.5 text-maersk-blue" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RTM · ANR</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Train className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Barge + Rail</span>
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
            <div className="p-1.5 bg-maersk-blue/10 rounded-lg">
              <Settings2 className="h-4 w-4 text-maersk-blue" />
            </div>
            <span className="text-sm font-black text-maersk-dark uppercase tracking-wide">Optimization Parameters</span>
            {impRunResult && !showForm && importRequest.postcode && (
              <div className="flex items-center gap-1.5 ml-2 flex-wrap">
                {[
                  importRequest.postcode && `ZIP ${importRequest.postcode}`,
                  importRequest.dischargePort,
                  importRequest.containerType,
                  importRequest.vesselEtd,
                ].filter(Boolean).map((tag, i) => (
                  <span key={i} className="text-[10px] font-black bg-maersk-blue/10 text-maersk-blue px-2.5 py-0.5 rounded-full uppercase tracking-wide">
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
                <ImportForm />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      {impRunResult ? (
        <ImportResultView result={impRunResult} />
      ) : (
        !showForm && (
          <div className="p-8 text-center bg-slate-50/60 border border-slate-100 rounded-2xl">
            <MapPin className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
              Enter ZIP and vessel ETD, then run the optimizer
            </p>
          </div>
        )
      )}

      {/* ── Network Departure Board ──────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-maersk-dark rounded-xl shadow-md">
              <Ship className="h-4 w-4 text-maersk-blue" />
            </div>
            <div>
              <h3 className="text-base font-black text-maersk-dark uppercase tracking-tight">
                Network <span className="text-maersk-blue">Schedule</span>
              </h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                Barge & Rail · Upcoming Departures
              </p>
            </div>
          </div>
          <div className="h-px flex-1 bg-slate-100 hidden md:block" />
        </div>
        <NetworkScheduleBoard direction="Import" />
      </div>
    </div>
  );
}
