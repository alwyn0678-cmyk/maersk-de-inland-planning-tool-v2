import { CYCYForm } from '../components/planner/CYCYForm';
import { CYCYResultCard } from '../components/planner/CYCYResultCard';
import { ScheduleManager } from '../components/planner/ScheduleManager';
import { usePlannerStore } from '../store/usePlannerStore';
import { Info, Calendar, ArrowRightLeft, Anchor, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export function CYCYPlanner() {
  const { cycyResult, cycyRequest, setCYCYRequest } = usePlannerStore();

  if (!cycyRequest.direction) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-24 animate-in fade-in zoom-in-95 duration-1000 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[800px] h-[800px] bg-maersk-blue/5 rounded-full blur-[150px]" />
        
        <div className="text-center space-y-8 max-w-3xl relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "backOut" }}
            className="inline-block p-6 bg-white rounded-[2.5rem] mb-6 shadow-2xl shadow-maersk-blue/20 ring-1 ring-slate-100"
          >
            <ArrowRightLeft className="h-12 w-12 text-maersk-blue" />
          </motion.div>
          <h2 className="text-9xl font-black tracking-tighter text-maersk-dark leading-[0.85] uppercase italic">
            CY/CY<br />
            <span className="text-maersk-blue not-italic">Planner</span>
          </h2>
          <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-xs flex items-center justify-center">
            <span className="w-12 h-px bg-slate-200 mr-4" />
            Select network flow direction to begin optimization
            <span className="w-12 h-px bg-slate-200 ml-4" />
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 w-full max-w-6xl px-8">
          <motion.button
            whileHover={{ scale: 1.02, y: -15 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCYCYRequest({ 
              direction: 'Import',
              originTerminal: 'Rotterdam',
              destinationTerminal: 'DUISBURG'
            })}
            className="group relative p-20 rounded-[5rem] bg-white border border-slate-100 hover:border-maersk-blue transition-all duration-700 hover:shadow-[0_60px_100px_-20px_rgba(66,176,213,0.25)] flex flex-col items-center text-center space-y-10 overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 p-12 opacity-5 group-hover:scale-125 transition-transform duration-1000 group-hover:rotate-12">
              <Anchor className="h-64 w-64 text-maersk-blue" />
            </div>
            <div className="p-10 bg-maersk-blue/10 rounded-[3rem] group-hover:bg-maersk-blue group-hover:text-white transition-all duration-700 shadow-2xl shadow-maersk-blue/10 relative z-10">
              <Anchor className="h-20 w-20" />
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-4xl font-black text-maersk-dark uppercase tracking-tight group-hover:text-maersk-blue transition-colors duration-500 italic">Import <span className="not-italic">Flow</span></h3>
              <p className="text-slate-400 text-base font-bold leading-relaxed max-w-[240px]">Port to Inland Terminal<br /><span className="text-xs opacity-60 font-black tracking-widest mt-2 block uppercase">(Rotterdam → Duisburg)</span></p>
            </div>
            <div className="pt-10 flex items-center space-x-4 text-maersk-blue opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-6 group-hover:translate-y-0">
              <span className="text-xs font-black uppercase tracking-[0.3em]">Initialize Engine</span>
              <div className="p-2 bg-maersk-blue/10 rounded-full">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -15 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCYCYRequest({ 
              direction: 'Export',
              originTerminal: 'DUISBURG',
              destinationTerminal: 'Rotterdam'
            })}
            className="group relative p-20 rounded-[5rem] bg-white border border-slate-100 hover:border-emerald-500 transition-all duration-700 hover:shadow-[0_60px_100px_-20px_rgba(16,185,129,0.25)] flex flex-col items-center text-center space-y-10 overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 p-12 opacity-5 group-hover:scale-125 transition-transform duration-1000 group-hover:rotate-12">
              <TrendingUp className="h-64 w-64 text-emerald-500" />
            </div>
            <div className="p-10 bg-emerald-500/10 rounded-[3rem] group-hover:bg-emerald-500 group-hover:text-white transition-all duration-700 shadow-2xl shadow-emerald-500/10 relative z-10">
              <TrendingUp className="h-20 w-20" />
            </div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-4xl font-black text-maersk-dark uppercase tracking-tight group-hover:text-emerald-500 transition-colors duration-500 italic">Export <span className="not-italic">Flow</span></h3>
              <p className="text-slate-400 text-base font-bold leading-relaxed max-w-[240px]">Inland to Port Terminal<br /><span className="text-xs opacity-60 font-black tracking-widest mt-2 block uppercase">(Duisburg → Rotterdam)</span></p>
            </div>
            <div className="pt-10 flex items-center space-x-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-6 group-hover:translate-y-0">
              <span className="text-xs font-black uppercase tracking-[0.3em]">Initialize Engine</span>
              <div className="p-2 bg-emerald-500/10 rounded-full">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 relative pb-20">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-maersk-blue/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      {/* Header Section */}
      <div className="relative pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="relative">
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-2 h-24 bg-gradient-to-b from-maersk-blue to-emerald-500 rounded-full shadow-[0_0_30px_rgba(66,176,213,0.4)]" />
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-8xl font-black tracking-tighter text-maersk-dark drop-shadow-sm leading-[0.85] uppercase italic">
                CY/CY<br />
                <span className="text-maersk-blue not-italic">Planner</span>
              </h2>
              <div className="flex items-center mt-8 space-x-4">
                <div className="h-px w-12 bg-maersk-blue" />
                <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[11px]">
                  Terminal-to-Terminal Network Optimizer
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
                <div className="h-3 w-3 rounded-full bg-maersk-blue animate-ping absolute inset-0" />
                <div className="h-3 w-3 rounded-full bg-maersk-blue relative" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network Status</span>
                <span className="text-xs font-black uppercase tracking-widest text-maersk-dark">Sync Active</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Direction Selection Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="bg-slate-100/50 backdrop-blur-md p-2 rounded-[3.5rem] flex items-center shadow-inner border border-slate-200/50">
          <button
            onClick={() => {
              setCYCYRequest({ 
                direction: 'Import',
                originTerminal: 'Rotterdam',
                destinationTerminal: 'DUISBURG'
              });
            }}
            className={`px-20 py-6 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-700 flex items-center space-x-5 ${
              cycyRequest.direction === 'Import'
                ? 'bg-white text-maersk-blue shadow-2xl shadow-maersk-blue/30 scale-105 ring-1 ring-maersk-blue/10 italic'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Anchor className={`h-5 w-5 transition-all duration-700 ${cycyRequest.direction === 'Import' ? 'scale-110 rotate-12' : ''}`} />
            <span>Import Flow</span>
          </button>
          <button
            onClick={() => {
              setCYCYRequest({ 
                direction: 'Export',
                originTerminal: 'DUISBURG',
                destinationTerminal: 'Rotterdam'
              });
            }}
            className={`px-20 py-6 rounded-[3rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-700 flex items-center space-x-5 ${
              cycyRequest.direction === 'Export'
                ? 'bg-white text-emerald-500 shadow-2xl shadow-emerald-500/20 scale-105 ring-1 ring-emerald-500/10 italic'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <TrendingUp className={`h-5 w-5 transition-all duration-700 ${cycyRequest.direction === 'Export' ? 'scale-110 -rotate-12' : ''}`} />
            <span>Export Flow</span>
          </button>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-12 gap-16 items-start">
        {/* Left Column: Form */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-4 xl:col-span-3 sticky top-12"
        >
          <CYCYForm />
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-12 bg-maersk-dark rounded-[3.5rem] border border-white/10 flex flex-col space-y-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] relative overflow-hidden group"
          >
            <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000 group-hover:rotate-12">
              <ArrowRightLeft className="h-48 w-48 text-white" />
            </div>
            <div className="p-5 bg-maersk-blue/20 rounded-2xl w-fit border border-maersk-blue/30 shadow-inner">
              <Info className="h-7 w-7 text-maersk-blue" />
            </div>
            <div className="space-y-4">
              <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Network Intelligence</p>
              <p className="text-xs text-slate-300 leading-relaxed font-bold opacity-80">
                CY/CY planning focuses on the core intermodal leg. 
                Ensure both origin and destination terminals are correctly mapped for optimal routing.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Network v2.1</span>
              <div className="h-2 w-2 rounded-full bg-maersk-blue shadow-[0_0_10px_rgba(66,176,213,0.8)]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column: Results & Schedules */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-24">
          <CYCYResultCard result={cycyResult} />
          
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
              <ScheduleManager direction={cycyRequest.direction || 'Import'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
