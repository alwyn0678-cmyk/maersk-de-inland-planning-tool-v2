import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NetworkScheduleBoard, DepartureRow } from '../components/planner/NetworkScheduleBoard';
import {
  CalendarDays, Ship, Anchor, Train, ArrowRight, Send,
  Clock, X, Info, AlertTriangle, CheckCircle2, Package, MapPin,
  Zap, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

function fmtFull(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
}

function getIntelTips(dep: DepartureRow, direction: 'Import' | 'Export'): { icon: React.ReactNode; text: string; type: 'info' | 'warn' | 'ok' }[] {
  const tips: { icon: React.ReactNode; text: string; type: 'info' | 'warn' | 'ok' }[] = [];

  if (dep.daysAhead <= 1) {
    tips.push({ icon: <AlertTriangle className="h-3.5 w-3.5" />, text: 'Departure is imminent — contact inland ops immediately if a booking is needed.', type: 'warn' });
  } else if (dep.daysAhead <= 3) {
    tips.push({ icon: <Zap className="h-3.5 w-3.5" />, text: `Only ${dep.daysAhead} day${dep.daysAhead > 1 ? 's' : ''} until departure — prioritize ordering if not yet booked.`, type: 'warn' });
  } else {
    tips.push({ icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: `${dep.daysAhead} days until departure — sufficient lead time for standard booking.`, type: 'ok' });
  }

  if (dep.mod === 'Barge') {
    tips.push({ icon: <Info className="h-3.5 w-3.5" />, text: direction === 'Import' ? 'Order cutoff is typically 7 business days before barge ETD. Ensure customs documents are submitted to nlaopsinlrbc@maersk.com.' : 'Place transport order at least 2 business days before loading. Container must be available at depot the day before ETD.', type: 'info' });
    tips.push({ icon: <Info className="h-3.5 w-3.5" />, text: 'Barge services are subject to river conditions and bunching delays — monitor terminal congestion for live waiting times.', type: 'info' });
  } else {
    tips.push({ icon: <Info className="h-3.5 w-3.5" />, text: direction === 'Import' ? 'Rail services have earlier order cutoffs — confirm slot availability with the depot before booking.' : 'Rail is the recommended modality for time-sensitive cargo. Earlier order cutoffs apply — confirm slot availability.', type: 'info' });
    tips.push({ icon: <CheckCircle2 className="h-3.5 w-3.5" />, text: 'Rail transit is not affected by waterway conditions — reliable schedule adherence in most weather conditions.', type: 'ok' });
  }

  if (dep.transitDays <= 1) {
    tips.push({ icon: <Zap className="h-3.5 w-3.5" />, text: `Express transit: ${dep.transitDays} day — ideal for urgent shipments close to vessel cutoff.`, type: 'ok' });
  } else if (dep.transitDays >= 4) {
    tips.push({ icon: <Clock className="h-3.5 w-3.5" />, text: `Longer transit (${dep.transitDays} days) — plan vessel booking window accordingly.`, type: 'info' });
  }

  return tips;
}

export function NetworkSchedules() {
  const [direction, setDirection] = useState<'Import' | 'Export'>('Import');
  const [selectedDep, setSelectedDep] = useState<DepartureRow | null>(null);

  const handleRowClick = (dep: DepartureRow) => {
    setSelectedDep(prev => (prev === dep ? null : dep));
  };

  const tips = selectedDep ? getIntelTips(selectedDep, direction) : [];

  return (
    <div className="space-y-6 pb-10">

      {/* ── DISCLAIMER ──────────────────────────────────────────────────── */}
      <motion.div
        animate={{ boxShadow: ['0 0 0px rgba(220,38,38,0)', '0 0 18px rgba(220,38,38,0.45)', '0 0 0px rgba(220,38,38,0)'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        className="relative overflow-hidden flex items-start gap-4 px-5 py-4 bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-2 border-red-500/70 rounded-2xl shadow-lg shadow-red-900/40"
      >
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 18px),repeating-linear-gradient(180deg,#fff 0,#fff 1px,transparent 0,transparent 18px)' }} />
        {/* Pulsing left accent bar */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-l-2xl"
        />
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 p-2 rounded-xl bg-red-500/25 border border-red-400/40 shrink-0"
        >
          <AlertTriangle className="h-5 w-5 text-red-300" />
        </motion.div>
        <div className="relative z-10">
          <p className="text-sm font-black text-red-100 uppercase tracking-widest mb-1.5">
            ⚠ For Visibility Only — Do Not Use for Booking
          </p>
          <p className="text-sm font-bold text-red-200/80 leading-relaxed">
            These schedules are displayed <span className="text-red-100 font-black">for reference only</span>.
            They <span className="text-white font-black underline decoration-red-400 underline-offset-2">must NOT be used to make inland planning bookings</span>.
            Always use the <span className="text-red-100 font-black">Import or Export Planner</span> to calculate exact dates and generate a valid transport order.
          </p>
        </div>
        {/* Bottom glow line */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent"
        />
      </motion.div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative pl-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-maersk-blue rounded-full shadow-[0_0_10px_rgba(0,99,165,0.6)]" />
            <h2 className="text-3xl font-black tracking-tighter text-maersk-dark uppercase italic leading-tight">
              Network <span className="text-maersk-blue not-italic">Schedules</span>
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Barge & Rail · Live Departure Board
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
            <div className="flex items-center gap-1.5">
              <Anchor className="h-3.5 w-3.5 text-maersk-blue" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Barge Network</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <Train className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rail Network</span>
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

      {/* Direction Toggle */}
      <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1 w-fit shadow-sm">
        {(['Import', 'Export'] as const).map(d => (
          <button
            key={d}
            onClick={() => { setDirection(d); setSelectedDep(null); }}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200',
              direction === d
                ? d === 'Import'
                  ? 'bg-maersk-dark text-white shadow-md'
                  : 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            {d === 'Import' ? <Anchor className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
            {d}
          </button>
        ))}
      </div>

      {/* Click hint */}
      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <Info className="h-3 w-3 text-maersk-blue/60" />
        Click any row to view service intel &amp; booking tips
      </div>

      {/* Main content: Board + Detail Panel (overlay — no layout shift) */}
      <div className="relative">

        {/* Schedule Board — always full width */}
        <div className={cn("transition-[padding] duration-300", selectedDep ? "pr-[356px]" : "")}>
          <NetworkScheduleBoard direction={direction} onRowClick={handleRowClick} />
        </div>

        {/* Detail Panel — absolute overlay, no layout reflow */}
        <AnimatePresence>
          {selectedDep && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 right-0 w-[340px]"
            >
              <div className="bg-[#0a1628] rounded-2xl border border-white/10 overflow-hidden">
                {/* Panel header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl",
                      selectedDep.mod === 'Barge' ? 'bg-maersk-blue/20' : 'bg-purple-500/20'
                    )}>
                      {selectedDep.mod === 'Barge'
                        ? <Anchor className="h-4 w-4 text-maersk-blue" />
                        : <Train className="h-4 w-4 text-purple-400" />
                      }
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Service Intel</p>
                      <p className="text-sm font-black text-white">{selectedDep.mod} Service</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDep(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors mt-0.5"
                  >
                    <X className="h-3.5 w-3.5 text-white/40" />
                  </button>
                </div>

                {/* Route summary */}
                <div className="px-5 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-bold text-white/60">{selectedDep.origin}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-white/30 flex-none" />
                    <span className="text-sm font-black text-white">{selectedDep.destination}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Departure (ETD)</p>
                      <p className="text-xs font-black text-white leading-snug">{fmtShort(selectedDep.etdDate)}</p>
                      <p className={cn(
                        "text-[9px] font-black mt-1 uppercase tracking-wider",
                        selectedDep.daysAhead <= 1 ? 'text-rose-400' : selectedDep.daysAhead <= 3 ? 'text-amber-400' : 'text-emerald-400'
                      )}>
                        {selectedDep.daysAhead === 0 ? 'Today' : selectedDep.daysAhead === 1 ? 'Tomorrow' : `In ${selectedDep.daysAhead} days`}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Arrival (ETA)</p>
                      <p className="text-xs font-black text-white leading-snug">{fmtShort(selectedDep.etaDate)}</p>
                      <p className="text-[9px] font-black text-emerald-400 mt-1 uppercase tracking-wider">{selectedDep.transitDays}d transit</p>
                    </div>
                  </div>
                </div>

                {/* Full dates */}
                <div className="px-5 py-3 border-b border-white/10 space-y-2">
                  <div className="flex items-start gap-2 text-[10px]">
                    <Clock className="h-3 w-3 text-maersk-blue/60 mt-0.5 flex-none" />
                    <div>
                      <span className="font-black text-white/40 uppercase tracking-wider">ETD: </span>
                      <span className="font-bold text-white/70">{fmtFull(selectedDep.etdDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <MapPin className="h-3 w-3 text-emerald-500/60 mt-0.5 flex-none" />
                    <div>
                      <span className="font-black text-white/40 uppercase tracking-wider">ETA: </span>
                      <span className="font-bold text-white/70">{fmtFull(selectedDep.etaDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Intel tips */}
                <div className="px-5 py-4 space-y-2.5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Booking Intel</p>
                  {tips.map((tip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className={cn(
                        "flex items-start gap-2.5 p-2.5 rounded-xl border text-[10px] font-bold leading-relaxed",
                        tip.type === 'warn' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                        tip.type === 'ok'   ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                                              'bg-white/5 border-white/10 text-white/60'
                      )}
                    >
                      <span className="flex-none mt-0.5">{tip.icon}</span>
                      <span>{tip.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center pt-2 border-t border-white/10">
                    Use Import or Export Planner to calculate exact dates
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
