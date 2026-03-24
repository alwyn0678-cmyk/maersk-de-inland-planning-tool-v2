import { ImportForm } from '../components/planner/ImportForm';
import { ImportResultView } from '../components/planner/ImportResultView';
import { ScheduleManager } from '../components/planner/ScheduleManager';
import { usePlannerStore } from '../store/usePlannerStore';
import { Info, Calendar, Ship, Anchor, Activity, GitBranch, Train } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const KPI_ITEMS = [
  { label: 'Discharge Ports', value: '2', sub: 'RTM · ANR', icon: Ship, color: 'text-maersk-blue', bg: 'bg-maersk-blue/10' },
  { label: 'Inland Terminals', value: '9', sub: 'Active depots', icon: Anchor, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Modalities', value: '2', sub: 'Barge + Rail', icon: Train, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'System Status', value: 'Live', sub: 'All connected', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
];

export function ImportPlanner() {
  const { impRunResult } = usePlannerStore();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-10">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-maersk-blue/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div className="relative pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative pl-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-maersk-blue rounded-full shadow-[0_0_12px_rgba(66,176,213,0.5)]" />
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-black tracking-tighter text-maersk-dark leading-tight uppercase italic">
                Import <span className="text-maersk-blue not-italic">Planner</span>
              </h2>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-1.5">
                Inland Delivery Optimization Engine
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-md flex items-center space-x-3 hover:border-maersk-blue/30 transition-all duration-300">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                <div className="h-2 w-2 rounded-full bg-emerald-500 relative" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-maersk-dark">Network Online</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI_ITEMS.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.4 }}
          >
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

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form — wider to prevent bunching */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-5 xl:col-span-4 sticky top-6"
        >
          <ImportForm />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 p-4 bg-maersk-dark rounded-2xl border border-white/10 flex flex-col space-y-3 shadow-lg relative overflow-hidden group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-maersk-blue/20 rounded-lg border border-maersk-blue/30">
                <Info className="h-4 w-4 text-maersk-blue" />
              </div>
              <p className="text-xs font-black text-white uppercase tracking-[0.15em]">Planning Intelligence</p>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed opacity-80">
              Manual terminal selection overrides algorithmic mapping.
              Use this for specific operational requirements or bypasses.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Advisory v4.2</span>
              <div className="h-1.5 w-1.5 rounded-full bg-maersk-blue shadow-[0_0_8px_rgba(66,176,213,0.8)]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Results & Schedules */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {impRunResult
            ? <ImportResultView result={impRunResult} />
            : (
              <div className="p-8 text-center bg-slate-50/60 border border-slate-100 rounded-2xl">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Enter ZIP code and vessel ETD, then run the optimizer</p>
              </div>
            )
          }

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-maersk-dark rounded-xl shadow-lg ring-4 ring-slate-50 relative group overflow-hidden">
                <div className="absolute inset-0 bg-maersk-blue opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                <Calendar className="h-4 w-4 text-maersk-blue relative z-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-maersk-dark tracking-tighter uppercase">Network <span className="text-maersk-blue">Schedules</span></h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Barge & Rail Availability</p>
              </div>
              <div className="h-px flex-1 bg-slate-100 hidden md:block" />
            </div>
            <ScheduleManager direction="Import" />
          </div>
        </div>
      </div>
    </div>
  );
}
