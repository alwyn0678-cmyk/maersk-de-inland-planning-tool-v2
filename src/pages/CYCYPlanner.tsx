import { useEffect, useState } from 'react';
import { CYCYForm } from '../components/planner/CYCYForm';
import { CYCYResultCard } from '../components/planner/CYCYResultCard';
import { ScheduleManager } from '../components/planner/ScheduleManager';
import { usePlannerStore } from '../store/usePlannerStore';
import { Calendar, ArrowRightLeft, Anchor, TrendingUp, Activity, Ship, Package, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const KPI_ITEMS = [
  { label: 'Port Terminals', value: '2', sub: 'RTM · ANR', icon: Anchor, color: 'text-maersk-blue', bg: 'bg-maersk-blue/10' },
  { label: 'Inland Hubs', value: '9', sub: 'DE network', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Connections', value: '24+', sub: 'Barge + Rail', icon: ArrowRightLeft, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'System Status', value: 'Live', sub: 'All connected', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
];

export function CYCYPlanner() {
  const { cycyResult, cycyRequest, setCYCYRequest } = usePlannerStore();
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (cycyResult) setShowForm(false);
  }, [cycyResult]);

  useEffect(() => {
    if (!cycyResult) setShowForm(true);
  }, [cycyResult]);

  if (!cycyRequest.direction) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-500 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[400px] h-[400px] bg-maersk-blue/5 rounded-full blur-[80px]" />

        <div className="text-center space-y-2 max-w-xl relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="inline-block p-3 bg-white rounded-xl mb-2 shadow-lg shadow-maersk-blue/10 ring-1 ring-slate-100"
          >
            <ArrowRightLeft className="h-6 w-6 text-maersk-blue" />
          </motion.div>
          <h2 className="text-3xl font-black tracking-tighter text-maersk-dark leading-tight uppercase italic">
            CY/CY <span className="text-maersk-blue not-italic">Planner</span>
          </h2>
          <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
            Select network flow direction to begin
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCYCYRequest({ direction: 'Import', originTerminal: 'Rotterdam', destinationTerminal: 'DUISBURG' })}
            className="group relative p-6 rounded-2xl bg-white border border-slate-100 hover:border-maersk-blue transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(66,176,213,0.2)] flex flex-col items-center text-center space-y-3 overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <Anchor className="h-24 w-24 text-maersk-blue" />
            </div>
            <div className="p-4 bg-maersk-blue/10 rounded-xl group-hover:bg-maersk-blue transition-all duration-300 relative z-10">
              <Anchor className="h-7 w-7 text-maersk-blue group-hover:text-white transition-colors" />
            </div>
            <div className="relative z-10 space-y-1">
              <h3 className="text-lg font-black text-maersk-dark uppercase tracking-tight group-hover:text-maersk-blue transition-colors italic">Import <span className="not-italic">Flow</span></h3>
              <p className="text-slate-400 text-xs font-bold">Port → Inland Terminal</p>
              <p className="text-[9px] opacity-50 font-black tracking-widest uppercase">Rotterdam → Duisburg</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCYCYRequest({ direction: 'Export', originTerminal: 'DUISBURG', destinationTerminal: 'Rotterdam' })}
            className="group relative p-6 rounded-2xl bg-white border border-slate-100 hover:border-emerald-500 transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.2)] flex flex-col items-center text-center space-y-3 overflow-hidden"
          >
            <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="h-24 w-24 text-emerald-500" />
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500 transition-all duration-300 relative z-10">
              <TrendingUp className="h-7 w-7 text-emerald-500 group-hover:text-white transition-colors" />
            </div>
            <div className="relative z-10 space-y-1">
              <h3 className="text-lg font-black text-maersk-dark uppercase tracking-tight group-hover:text-emerald-500 transition-colors italic">Export <span className="not-italic">Flow</span></h3>
              <p className="text-slate-400 text-xs font-bold">Inland Terminal → Port</p>
              <p className="text-[9px] opacity-50 font-black tracking-widest uppercase">Duisburg → Rotterdam</p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-10">
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-maersk-blue/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div className="relative pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative pl-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-maersk-blue to-emerald-500 rounded-full" />
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="text-4xl font-black tracking-tighter text-maersk-dark leading-tight uppercase italic">
                CY/CY <span className="text-maersk-blue not-italic">Planner</span>
              </h2>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-1.5">
                Terminal-to-Terminal Network Optimizer
              </p>
            </motion.div>
          </div>
          <div className="px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-md flex items-center space-x-3">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-maersk-blue animate-ping absolute inset-0" />
              <div className="h-2 w-2 rounded-full bg-maersk-blue relative" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-maersk-dark">Sync Active</span>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI_ITEMS.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <div className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className={cn("p-2 rounded-lg flex-none group-hover:scale-110 transition-transform duration-300", kpi.bg)}>
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

      {/* Direction switcher */}
      <div className="flex justify-center">
        <div className="bg-slate-100/60 backdrop-blur-md p-1.5 rounded-xl flex items-center gap-1 border border-slate-200/50 shadow-inner">
          <button
            onClick={() => setCYCYRequest({ direction: 'Import', originTerminal: 'Rotterdam', destinationTerminal: 'DUISBURG' })}
            className={cn(
              "px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2",
              cycyRequest.direction === 'Import' ? 'bg-white text-maersk-blue shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Anchor className="h-4 w-4" />
            Import Flow
          </button>
          <button
            onClick={() => setCYCYRequest({ direction: 'Export', originTerminal: 'DUISBURG', destinationTerminal: 'Rotterdam' })}
            className={cn(
              "px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2",
              cycyRequest.direction === 'Export' ? 'bg-white text-emerald-500 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <TrendingUp className="h-4 w-4" />
            Export Flow
          </button>
        </div>
      </div>

      {/* Parameters Panel — collapsible */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/60 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-1.5 rounded-lg",
              cycyRequest.direction === 'Import' ? "bg-maersk-blue/10" : "bg-emerald-500/10"
            )}>
              <Settings2 className={cn("h-4 w-4", cycyRequest.direction === 'Import' ? "text-maersk-blue" : "text-emerald-600")} />
            </div>
            <span className="text-sm font-black text-maersk-dark uppercase tracking-wide">Optimization Parameters</span>
            {cycyResult && !showForm && cycyRequest.originTerminal && (
              <div className="flex items-center gap-2 ml-2 flex-wrap">
                {[
                  cycyRequest.direction,
                  cycyRequest.originTerminal && `${cycyRequest.originTerminal} → ${cycyRequest.destinationTerminal}`,
                  cycyRequest.containerType,
                  cycyRequest.date,
                ].filter(Boolean).map((tag, i) => (
                  <span key={i} className={cn(
                    "text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide",
                    cycyRequest.direction === 'Import' ? "bg-maersk-blue/10 text-maersk-blue" : "bg-emerald-500/10 text-emerald-600"
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

      {/* Results */}
      <CYCYResultCard result={cycyResult} />

      {/* Schedules */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-maersk-dark rounded-xl shadow-lg ring-4 ring-slate-50">
            <Calendar className="h-4 w-4 text-maersk-blue" />
          </div>
          <div>
            <h3 className="text-xl font-black text-maersk-dark tracking-tighter uppercase">Network <span className="text-maersk-blue">Schedules</span></h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Barge & Rail Availability</p>
          </div>
          <div className="h-px flex-1 bg-slate-100 hidden md:block" />
        </div>
        <ScheduleManager direction={cycyRequest.direction || 'Import'} />
      </div>
    </div>
  );
}
