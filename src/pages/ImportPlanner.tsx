import { ImportForm } from '../components/planner/ImportForm';
import { ImportResultView } from '../components/planner/ImportResultView';
import { ScheduleManager } from '../components/planner/ScheduleManager';
import { usePlannerStore } from '../store/usePlannerStore';
import { Info, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

export function ImportPlanner() {
  const { impRunResult } = usePlannerStore();

  return (
    <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative pb-20">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-maersk-blue/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      {/* Header Section */}
      <div className="relative pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="relative">
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-2 h-24 bg-maersk-blue rounded-full shadow-[0_0_30px_rgba(66,176,213,0.6)]" />
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-8xl font-black tracking-tighter text-maersk-dark drop-shadow-sm leading-[0.85] uppercase italic">
                Import<br />
                <span className="text-maersk-blue not-italic">Planner</span>
              </h2>
              <div className="flex items-center mt-8 space-x-4">
                <div className="h-px w-12 bg-maersk-blue" />
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[11px]">
                  Inland Delivery Optimization Engine
                </p>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center space-x-6"
          >
            <div className="px-8 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-2xl shadow-slate-200/50 flex items-center space-x-4 group hover:border-maersk-blue/30 transition-all duration-500">
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                <div className="h-3 w-3 rounded-full bg-emerald-500 relative" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Status</span>
                <span className="text-xs font-black uppercase tracking-widest text-maersk-dark">Network Online</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-16 items-start">
        {/* Left Column: Form */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-4 xl:col-span-3 sticky top-12"
        >
          <ImportForm />
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-12 bg-maersk-dark rounded-[3.5rem] border border-white/10 flex flex-col space-y-8 shadow-[0_40px_80px_-20px_rgba(0,36,61,0.4)] relative overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000 group-hover:rotate-12">
              <Info className="h-48 w-48 text-white" />
            </div>
            <div className="p-5 bg-maersk-blue/20 rounded-2xl w-fit border border-maersk-blue/30 shadow-inner">
              <Info className="h-7 w-7 text-maersk-blue" />
            </div>
            <div className="space-y-4">
              <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Planning Intelligence</p>
              <p className="text-xs text-slate-300 leading-relaxed font-bold opacity-80">
                Manual terminal selection overrides algorithmic mapping. 
                Use this for specific operational requirements or bypasses.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Advisory v4.2</span>
              <div className="h-2 w-2 rounded-full bg-maersk-blue shadow-[0_0_10px_rgba(66,176,213,0.8)]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Results & Schedules */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-24">
          {impRunResult
            ? <ImportResultView result={impRunResult} />
            : (
              <div className="p-12 text-center bg-slate-50/60 border border-slate-100 rounded-[3rem]">
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Enter ZIP code and vessel ETD, then run the optimizer</p>
              </div>
            )
          }
          
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="p-5 bg-maersk-dark rounded-3xl shadow-2xl shadow-maersk-dark/30 ring-8 ring-slate-50 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-maersk-blue opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                  <Calendar className="h-7 w-7 text-maersk-blue relative z-10" />
                </div>
                <div>
                  <h3 className="text-4xl font-black text-maersk-dark tracking-tighter uppercase italic">Network <span className="text-maersk-blue not-italic">Schedules</span></h3>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 flex items-center">
                    <span className="w-6 h-px bg-slate-200 mr-3" />
                    Real-time Barge & Rail Availability
                  </p>
                </div>
              </div>
              <div className="h-px flex-1 bg-slate-100 mx-12 hidden md:block" />
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-slate-50/50 rounded-[3rem] -z-10 border border-slate-100" />
              <ScheduleManager direction="Import" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
