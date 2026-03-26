import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, X, Anchor, Train, Truck, Send, ArrowRight, Zap } from 'lucide-react';
import { impLookupTerms } from '../logic/import/zipLookup';
import { expFindRule } from '../logic/export/ruleLookup';
import { IMP_TERM_NAMES } from '../data/import/terminalNames';
import { EXP_DEPOTS } from '../data/export/depotNames';
import { getRegion } from '../logic/regionLookup';
import { usePlannerStore } from '../store/usePlannerStore';
import { cn } from '../lib/utils';

interface ZipCoverage {
  region: string;
  import: {
    rtm: { barge: string | null; barge2?: string | null; rail: string | null; truck: string } | null;
    anr: { barge: string | null; barge2?: string | null; rail: string | null; truck: string } | null;
  };
  export: {
    rtm: { p1: string; p1name: string; p2?: string; p2name?: string } | null;
    anr: { p1: string; p1name: string; p2?: string; p2name?: string } | null;
  };
}

function lookupZip(zip: string): ZipCoverage | null {
  if (zip.length < 4) return null;
  const region = getRegion(zip);
  const rtmImp = impLookupTerms(zip, 'RTM');
  const anrImp = impLookupTerms(zip, 'ANR');
  const rule = expFindRule(zip);
  if (!rtmImp && !anrImp && !rule) return null;

  return {
    region,
    import: {
      rtm: rtmImp ? {
        barge: rtmImp.b ? (IMP_TERM_NAMES[rtmImp.b] ?? rtmImp.b) : null,
        barge2: rtmImp.b2 ? (IMP_TERM_NAMES[rtmImp.b2] ?? rtmImp.b2) : null,
        rail: rtmImp.r ? (IMP_TERM_NAMES[rtmImp.r] ?? rtmImp.r) : null,
        truck: rtmImp.t,
      } : null,
      anr: anrImp ? {
        barge: anrImp.b ? (IMP_TERM_NAMES[anrImp.b] ?? anrImp.b) : null,
        barge2: anrImp.b2 ? (IMP_TERM_NAMES[anrImp.b2] ?? anrImp.b2) : null,
        rail: anrImp.r ? (IMP_TERM_NAMES[anrImp.r] ?? anrImp.r) : null,
        truck: anrImp.t,
      } : null,
    },
    export: {
      rtm: rule?.rtm.p1 ? {
        p1: rule.rtm.p1,
        p1name: EXP_DEPOTS[rule.rtm.p1] ?? rule.rtm.p1,
        ...(rule.rtm.p2 ? { p2: rule.rtm.p2, p2name: EXP_DEPOTS[rule.rtm.p2] ?? rule.rtm.p2 } : {}),
      } : null,
      anr: rule?.anr.p1 ? {
        p1: rule.anr.p1,
        p1name: EXP_DEPOTS[rule.anr.p1] ?? rule.anr.p1,
        ...(rule.anr.p2 ? { p2: rule.anr.p2, p2name: EXP_DEPOTS[rule.anr.p2] ?? rule.anr.p2 } : {}),
      } : null,
    },
  };
}

export function QuickZipLookup() {
  const [isOpen, setIsOpen] = useState(false);
  const [zip, setZip] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const setActiveTab = usePlannerStore(s => s.setActiveTab);

  const result = zip.length >= 4 ? lookupZip(zip) : null;

  // Open via keyboard shortcut or custom event
  useEffect(() => {
    const handler = () => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 80); };
    document.addEventListener('open-quick-zip', handler);
    return () => document.removeEventListener('open-quick-zip', handler);
  }, []);

  // Outside click to close
  useEffect(() => {
    if (!isOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 80);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(v => !v);
    if (!isOpen) setZip('');
  };

  const goImport = () => { setIsOpen(false); setActiveTab('import'); };
  const goExport = () => { setIsOpen(false); setActiveTab('export'); };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-24 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.15 }}
      >
        <button
          onClick={handleOpen}
          title="Quick ZIP Lookup (Ctrl+K)"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center border-2",
            isOpen
              ? "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
              : "bg-[#001829] text-white border-[#42b0d5]/30 hover:bg-[#001829]/90"
          )}
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <div className="relative">
              <MapPin className="h-5 w-5" />
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2.4 }}
              >
                <Zap className="h-2.5 w-2.5 text-[#42b0d5] fill-[#42b0d5]" />
              </motion.div>
            </div>
          )}
        </button>
      </motion.div>

      {/* Lookup Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-32px)]"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-[#0a1628]">
              {/* Header */}
              <div className="bg-[#00243d] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-[#42b0d5]/20 rounded-lg border border-[#42b0d5]/30">
                    <MapPin className="h-3.5 w-3.5 text-[#42b0d5]" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">Quick ZIP Lookup</p>
                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Instant coverage check</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ZIP Input */}
              <div className="px-4 pt-3 pb-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#42b0d5]/60" />
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="Type ZIP code (e.g. 47119)"
                    value={zip}
                    onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold placeholder-white/25 focus:outline-none focus:border-[#42b0d5]/50 focus:bg-white/8 transition-all"
                  />
                  {zip && (
                    <button
                      onClick={() => setZip('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Results */}
              <AnimatePresence mode="wait">
                {zip.length >= 4 && (
                  <motion.div
                    key={zip}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="px-4 pb-4 space-y-3"
                  >
                    {result ? (
                      <>
                        {/* Region */}
                        {result.region && (
                          <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/8">
                            <MapPin className="h-3 w-3 text-[#42b0d5] shrink-0" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{result.region}</span>
                          </div>
                        )}

                        {/* Import Coverage */}
                        <div className="space-y-1.5">
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest px-0.5">Import Coverage</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['rtm', 'anr'] as const).map(port => {
                              const imp = result.import[port];
                              return (
                                <div key={port} className={cn(
                                  "rounded-xl p-2.5 border",
                                  imp ? "bg-white/5 border-white/10" : "bg-white/2 border-white/5 opacity-50"
                                )}>
                                  <div className="text-[8px] font-black text-[#42b0d5] uppercase tracking-widest mb-2">
                                    {port === 'rtm' ? '🇳🇱 Rotterdam' : '🇧🇪 Antwerp'}
                                  </div>
                                  {imp ? (
                                    <div className="space-y-1">
                                      {imp.barge && (
                                        <div className="flex items-center gap-1">
                                          <Anchor className="h-2.5 w-2.5 text-[#42b0d5] shrink-0" />
                                          <span className="text-[9px] text-white/70 font-bold truncate">{imp.barge}</span>
                                        </div>
                                      )}
                                      {imp.barge2 && (
                                        <div className="flex items-center gap-1">
                                          <Anchor className="h-2.5 w-2.5 text-[#42b0d5]/60 shrink-0" />
                                          <span className="text-[9px] text-white/50 font-bold truncate">{imp.barge2}</span>
                                        </div>
                                      )}
                                      {imp.rail && (
                                        <div className="flex items-center gap-1">
                                          <Train className="h-2.5 w-2.5 text-purple-400 shrink-0" />
                                          <span className="text-[9px] text-white/70 font-bold truncate">{imp.rail}</span>
                                        </div>
                                      )}
                                      {!imp.barge && !imp.rail && (
                                        <div className="flex items-center gap-1">
                                          <Truck className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                                          <span className="text-[9px] text-amber-300/70 font-bold truncate">Truck only</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-white/30 font-bold">Not covered</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Export Coverage */}
                        <div className="space-y-1.5">
                          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest px-0.5">Export Coverage</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {(['rtm', 'anr'] as const).map(port => {
                              const exp = result.export[port];
                              return (
                                <div key={port} className={cn(
                                  "rounded-xl p-2.5 border",
                                  exp ? "bg-white/5 border-white/10" : "bg-white/2 border-white/5 opacity-50"
                                )}>
                                  <div className="text-[8px] font-black text-[#42b0d5] uppercase tracking-widest mb-2">
                                    {port === 'rtm' ? '🇳🇱 Rotterdam' : '🇧🇪 Antwerp'}
                                  </div>
                                  {exp ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        <ArrowRight className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                                        <span className="text-[9px] text-white/80 font-black truncate">{exp.p1name}</span>
                                      </div>
                                      {exp.p2name && (
                                        <div className="flex items-center gap-1">
                                          <ArrowRight className="h-2.5 w-2.5 text-emerald-400/50 shrink-0" />
                                          <span className="text-[9px] text-white/50 font-bold truncate">{exp.p2name}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-white/30 font-bold">Not covered</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={goImport}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#42b0d5]/15 border border-[#42b0d5]/25 text-[10px] font-black text-[#42b0d5] uppercase tracking-widest hover:bg-[#42b0d5]/25 transition-colors"
                          >
                            <Anchor className="h-3 w-3" />
                            Import Planner
                          </button>
                          <button
                            onClick={goExport}
                            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
                          >
                            <Send className="h-3 w-3" />
                            Export Planner
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                          No coverage found for ZIP {zip}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {zip.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 pb-4 pt-1"
                  >
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center">
                      Type a ZIP to instantly see import & export coverage
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
