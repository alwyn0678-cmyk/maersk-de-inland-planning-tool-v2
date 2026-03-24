import { CYCYForm } from '../components/planner/CYCYForm';
import { CYCYResultCard } from '../components/planner/CYCYResultCard';
import { ScheduleManager } from '../components/planner/ScheduleManager';
import { usePlannerStore } from '../store/usePlannerStore';
import { Info, Calendar, ArrowRightLeft, Anchor, TrendingUp, Activity, Ship, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const KPI_ITEMS = [
  { label: 'Port Terminals', value: '2', sub: 'RTM · ANR', icon: Anchor, color: 'text-maersk-blue', bg: 'bg-maersk-blue/10' },
  { label: 'Inland Hubs', value: '9', sub: 'DE network', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Connections', value: '24+', sub: 'Barge + Rail', icon: ArrowRightLeft, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'System Status', value: 'Live', sub: 'All connected', icon: Activity, color: 'text-rose-500', bg: 'bg-rose-50' },
];

export function CYCYPlanner() {
  const { cycyResult, cycyRequest, setCYCYRequest } = usePlannerStore();

  if (!cycyRequest.direction) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-700 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[600px] h-[600px] bg-maersk-blue/5 rounded-full blur-[120px]" />

        <div className="text-center space-y-4 max-w-2xl relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="inline-block p-4 bg-white rounded-2xl mb-3 shadow-xl shadow-maersk-blue/15 ring-1 ring-slate-100"
          >
            <ArrowRightLeft className="h-8 w-8 text-maersk-blue" />
          </motion.div>
          <h2 className="text-5xl font-black tracking-tighter text-maersk-dark leading-tight uppercase italic">
            CY/CY <span className="text-maersk-blue not-italic">Planner</span>
          </h2>
          <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">
            Select network flow direction to begin optimization
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl px-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -6 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCYCYRequest({
              direction: 'Import',
              originTerminal: 'Rotterdam',
              destinationTerminal: 'DUISBURG'
            })}
            className="group relative p-10 rounded-2xl bg-white border border-slate-100 hover:border-maersk-blue transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(66,176,213,0.2)] flex flex-col items-center text-center space-y-5 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Anchor className="h-40 w-40 text-maersk-blue" />
            </div>
            <div className="p-6 bg-maersk-blue/10 rounded-2xl group-hover:bg-maersk-blue group-hover:text-white transition-all duration-500 relative z-10">
              <Anchor className="h-10 w-10 text-maersk-blue group-hover:text-white transition-colors" />
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl font-black text-maersk-dark uppercase tracking-tight group-hover:text-maersk-blue transition-colors duration-300 italic">Import <span className="not-italic">Flow</span></h3>
              <p className="text-slate-400 text-sm font-bold">Port → Inland Terminal</p>
              <p className="text-[10px] opacity-50 font-black tracking-widest uppercase">Rotterdam → Duisburg</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -6 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCYCYRequest({
              direction: 'Export',
              originTerminal: 'DUISBURG',
              destinationTerminal: 'Rotterdam'
            })}
            className="group relative p-10 rounded-2xl bg-white border border-slate-100 hover:border-emerald-500 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.2)] flex flex-col items-center text-center space-y-5 overflow-hidden"
          >
            <div className="absolute -top-6 -right-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <TrendingUp className="h-40 w-40 text-emerald-500" />
            </div>
            <div className="p-6 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500 transition-all duration-500 relative z-10">
              <TrendingUp className="h-10 w-10 text-emerald-500 group-hover:text-white transition-colors" />
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl font-black text-maersk-dark uppercase tracking-tight group-hover:text-emerald-500 transition-colors duration-300 italic">Export <span className="not-italic">Flow</span></h3>
              <p className="text-slate-400 text-sm font-bold">Inland Terminal → Port</p>
              <p className="text-[10px] opacity-50 font-black tracking-widest uppercase">Duisburg → Rotterdam</p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-10">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-maersk-blue/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

      {/* Header */}
      <div className="relative pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative pl-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-maersk-blue to-emerald-500 rounded-full" />
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h2 className="text-4xl font-black tracking-tighter text-maersk-dark leading-tight uppercase italic">
                CY/CY <span className="text-maersk-blue not-italic">Planner</span>
              </h2>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px] mt-1.5">
                Terminal-to-Terminal Network Optimizer
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-md flex items-center space-x-3">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-maersk-blue animate-ping absolute inset-0" />
                <div className="h-2 w-2 rounded-full bg-maersk-blue relative" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-maersk-dark">Sync Active</span>
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
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="bg-slate-100/60 backdrop-blur-md p-1.5 rounded-xl flex items-center gap-1 border border-slate-200/50 shadow-inner">
          <button
            onClick={() => setCYCYRequest({ direction: 'Import', originTerminal: 'Rotterdam', destinationTerminal: 'DUISBURG' })}
            className={cn(
              "px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2",
              cycyRequest.direction === 'Import'
                ? 'bg-white text-maersk-blue shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Anchor className="h-4 w-4" />
            <span>Import Flow</span>
          </button>
          <button
            onClick={() => setCYCYRequest({ direction: 'Export', originTerminal: 'DUISBURG', destinationTerminal: 'Rotterdam' })}
            className={cn(
              "px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2",
              cycyRequest.direction === 'Export'
                ? 'bg-white text-emerald-500 shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Export Flow</span>
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 xl:col-span-4 sticky top-6"
        >
          <CYCYForm />

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
              <p className="text-xs font-black text-white uppercase tracking-[0.15em]">Network Intelligence</p>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed opacity-80">
              CY/CY planning focuses on the core intermodal leg.
              Ensure both origin and destination terminals are correctly mapped for optimal routing.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Network v2.1</span>
              <div className="h-1.5 w-1.5 rounded-full bg-maersk-blue shadow-[0_0_8px_rgba(66,176,213,0.8)]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <CYCYResultCard result={cycyResult} />

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
            <ScheduleManager direction={cycyRequest.direction || 'Import'} />
          </div>
        </div>
      </div>
    </div>
  );
}
