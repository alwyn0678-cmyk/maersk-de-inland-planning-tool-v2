import { useEffect, useState } from 'react';
import { ExportForm } from '../components/planner/ExportForm';
import { ExportResultView } from '../components/planner/ExportResultView';
import { ScheduleManager } from '../components/planner/ScheduleManager';
import { usePlannerStore } from '../store/usePlannerStore';
import { Calendar, Anchor, Activity, Package, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const KPI_ITEMS = [
  { label: 'Load Terminals', value: '6', sub: 'RTM · ANR', icon: Anchor, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Inland Depots', value: '10', sub: 'Rhine network', icon: Package, color: 'text-maersk-blue', bg: 'bg-maersk-blue/10' },
  { label: 'Container Types', value: '6', sub: 'DC · HC · RF · IMO', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'System Status', value: 'Live', sub: 'All connected', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
];

export function ExportPlanner() {
  const { expRunResult, exportRequest } = usePlannerStore();
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (expRunResult) setShowForm(false);
  }, [expRunResult]);

  useEffect(() => {
    if (!expRunResult) setShowForm(true);
  }, [expRunResult]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-10">
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div className="relative pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative pl-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-4xl font-black tracking-tighter text-maersk-dark leading-tight uppercase italic">
                Export <span className="text-emerald-500 not-italic">Planner</span>
              </h2>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-1.5">
                Inland Collection Optimization Engine
              </p>
            </motion.div>
          </div>
          <div className="px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-md flex items-center space-x-3 hover:border-emerald-500/30 transition-all duration-300">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
              <div className="h-2 w-2 rounded-full bg-emerald-500 relative" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-maersk-dark">Network Online</span>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI_ITEMS.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 group">
              <div className={cn("p-2 rounded-lg flex-none transition-transform group-hover:scale-110 duration-300", kpi.bg)}>
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 truncate">{kpi.label}</p>
                <p className="text-lg font-black text-maersk-dark leading-none">{kpi.value}</p>
                <p className="text-[9px] text-slate-400 font-bold leading-tight">{kpi.sub}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Parameters Panel — collapsible */}
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
              <div className="flex items-center gap-2 ml-2 flex-wrap">
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

      {/* Results */}
      {expRunResult ? (
        <ExportResultView result={expRunResult} />
      ) : (
        !showForm && (
          <div className="p-8 text-center bg-slate-50/60 border border-slate-100 rounded-2xl">
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Enter ZIP code, select terminal, loading date — then run the optimizer</p>
          </div>
        )
      )}

      {/* Schedules */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-maersk-dark rounded-xl shadow-lg ring-4 ring-slate-50">
            <Calendar className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-maersk-dark tracking-tighter uppercase">Network <span className="text-emerald-500">Schedules</span></h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Barge & Rail Availability</p>
          </div>
          <div className="h-px flex-1 bg-slate-100 hidden md:block" />
        </div>
        <ScheduleManager direction="Export" />
      </div>
    </div>
  );
}
