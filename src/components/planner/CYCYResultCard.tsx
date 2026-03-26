import { useState } from 'react';
import { usePlannerStore, CYCYImpRunResult, CYCYExpRunResult } from '../../store/usePlannerStore';
import { ImpInstance } from '../../logic/import/computeInstances';
import { ExpCard } from '../../logic/export/expRun';
import { fmt, fmtS } from '../../logic/dateUtils';
import { Badge } from '../ui/badge';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import {
  AlertTriangle, CheckCircle2, Copy, Check, Train, Anchor, Ship,
  ArrowRight, Info, Mail
} from 'lucide-react';

function dFromNow(d: Date): number {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - n.getTime()) / 86400000);
}

function UrgencyBadge({ date }: { date: Date }) {
  const dl = dFromNow(date);
  if (dl < 0)  return <Badge className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">PASSED</Badge>;
  if (dl === 0) return <Badge className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">TODAY</Badge>;
  if (dl <= 2)  return <Badge className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5">{dl}d</Badge>;
  if (dl <= 5)  return <Badge className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5">{dl}d</Badge>;
  return <Badge className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5">{dl}d</Badge>;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 2000);
    }
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/15"
    >
      {copied ? <><Check className="h-2.5 w-2.5 text-emerald-400" />Copied</> : failed ? <><Copy className="h-2.5 w-2.5" />Failed</> : <><Copy className="h-2.5 w-2.5" />Copy</>}
    </button>
  );
}

function buildImpCopyText(inst: ImpInstance, result: CYCYImpRunResult): string {
  const modName = inst.mod.toLowerCase();
  const lines = [
    'CY/CY IMPORT PLAN',
    `Vessel ETD   : ${fmt(result.vesselETD)}`,
    `Port         : ${result.portName}`,
    `Direction    : Port → Inland`,
    '',
    'INLAND TRANSPORT',
    `Terminal     : ${result.termCode} — ${result.termName}`,
    `Modality     : ${inst.mod} (${inst.etdDay} schedule)`,
    `Terminal ETD : ${fmt(inst.etd)}`,
    `Depot Arrival: ${fmt(inst.eta)}`,
    `Container Pick-Up Date: ${fmt(inst.custDel)}${result.termCode === 'DEDUI01' ? ' (after 12:00)' : ''}`,
    `Order Deadline: ${fmt(inst.orderDL)}`,
    inst.custDL ? `Customs Deadline: ${fmt(inst.custDL)} ${inst.custDL.getHours().toString().padStart(2,'0')}:${inst.custDL.getMinutes().toString().padStart(2,'0')}` : '',
    '',
    `Transport Order Remarks: Please plan on ${modName} departure with ETD ${inst.etdDay} ${inst.etd.getDate().toString().padStart(2,'0')}/${(inst.etd.getMonth()+1).toString().padStart(2,'0')}`,
    'Upon receipt of this transport order, please confirm acceptance and return the TIR to us by email.',
    '',
    '⚠ REMINDERS',
    '- Always send copy of Customs document to nlaopsinlrbc@maersk.com (DO NOT send this to us)',
    '- When multistop is needed, send ATA at least 2 days before customer Delivery date',
  ].filter(Boolean);
  return lines.join('\n');
}

function buildExpCopyText(card: ExpCard, result: CYCYExpRunResult): string {
  const modName = card.mod.toLowerCase();
  const lines = [
    'CY/CY EXPORT PLAN',
    `Full Drop Off Date : ${fmt(result.loadingDate)} ${result.loadTime} CET`,
    `Direction    : Inland → Port`,
    '',
    'INLAND TRANSPORT',
    `Depot        : ${card.depotCode} — ${card.depotName}`,
    `Modality     : ${card.mod}`,
    `ETD          : ${fmt(card.etd)}`,
    '',
    'PORT TERMINAL',
    `Terminal     : ${card.termCode} — ${card.termName}`,
    `EAT          : ${fmt(card.eat)}`,
    `YOT          : ${card.yot} days`,
    '',
    'VESSEL BOOKING WINDOW',
    `Earliest CCO : ${fmt(card.earliestCCO)}`,
    `Latest ETA   : ${fmt(card.latestETA)}`,
    '',
    `Order Deadline: ${fmt(card.orderDL)}`,
    `Transport Order Remarks: Please plan on ${modName} departure with ETD ${card.etd.toLocaleDateString('en-GB', { weekday: 'short' })} ${card.etd.getDate().toString().padStart(2,'0')}/${(card.etd.getMonth()+1).toString().padStart(2,'0')}`,
    'Upon receipt of this transport order, please confirm acceptance and return the TIR to us by email.',
  ].filter(Boolean);
  return lines.join('\n');
}

function ImportCard({ inst, result, idx }: { inst: ImpInstance; result: CYCYImpRunResult; idx: number }) {
  const isBarge = inst.mod === 'Barge';
  const isDui = result.termCode === 'DEDUI01';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.4 }}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5",
        "bg-gradient-to-br from-[#001829] via-[#002040] to-[#001829]",
        inst.rec
          ? "border-amber-400/40 shadow-[0_8px_40px_-8px_rgba(251,191,36,0.22)] ring-1 ring-amber-400/20"
          : "border-white/10 shadow-xl shadow-black/40"
      )}>
        {inst.rec && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
        )}

        <div className="flex flex-col sm:flex-row">
          {/* Left: modality panel */}
          <div className={cn(
            "sm:w-52 flex-none flex flex-col justify-between p-5 border-b sm:border-b-0 sm:border-r border-white/8",
            isBarge
              ? "bg-gradient-to-br from-[#001e33] to-[#00375c]/60"
              : "bg-gradient-to-br from-purple-950/90 to-purple-900/50"
          )}>
            <div>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-4 border",
                isBarge ? "bg-[#42b0d5]/15 border-[#42b0d5]/25" : "bg-purple-400/15 border-purple-400/25"
              )}>
                {isBarge
                  ? <Anchor className="h-4 w-4 text-[#42b0d5]" />
                  : <Train className="h-4 w-4 text-purple-300" />
                }
                <span className={cn("text-sm font-black uppercase tracking-wider", isBarge ? "text-[#42b0d5]" : "text-purple-300")}>
                  {inst.mod}
                </span>
              </div>

              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Route</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-white/60">{result.portName}</span>
                <ArrowRight className="h-3 w-3 text-white/25 flex-none" />
                <span className="text-sm font-black text-white">{result.termName}</span>
              </div>
              <p className="font-mono text-[9px] text-white/25 mt-0.5">{result.termCode}</p>

              {inst.rec && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 mt-3 rounded-xl bg-amber-400/12 border border-amber-400/30">
                  <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">Best Option</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <CopyBtn text={buildImpCopyText(inst, result)} />
            </div>
          </div>

          {/* Right: info panel */}
          <div className="flex-1 min-w-0">
            {/* Journey timeline */}
            <div className="px-5 pt-5 pb-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", isBarge ? "bg-[#42b0d5] shadow-sm shadow-[#42b0d5]/60" : "bg-purple-400 shadow-sm shadow-purple-400/60")} />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Terminal ETD</p>
                  </div>
                  <p className="text-base font-black text-white font-mono leading-tight">{fmtS(inst.etd)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60 shrink-0" />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Depot Arrival</p>
                  </div>
                  <p className="text-base font-black text-emerald-400 font-mono leading-tight">{fmtS(inst.eta)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-2 w-2 rounded-full bg-white/40 shrink-0" />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Pick-Up Date</p>
                  </div>
                  <p className="text-base font-black text-white font-mono leading-tight">{fmtS(inst.custDel)}</p>
                  {isDui && <p className="text-[10px] text-amber-400 font-black mt-0.5">after 12:00</p>}
                </div>
              </div>
            </div>

            <div className="h-px bg-white/8 mx-5" />

            {/* Deadlines */}
            <div className="px-5 py-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Order Deadline</p>
                  <p className="text-sm font-black text-white">{fmtS(inst.orderDL)}</p>
                </div>
                <UrgencyBadge date={inst.orderDL} />
              </div>
              {inst.custDL && (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-400/10 border border-amber-400/20 rounded-xl">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-none" />
                  <div>
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-0">Customs DL ({result.portCode})</p>
                    <p className="text-sm font-black text-amber-200">
                      {fmtS(inst.custDL)} {inst.custDL.getHours().toString().padStart(2,'0')}:{inst.custDL.getMinutes().toString().padStart(2,'0')}
                    </p>
                  </div>
                  <UrgencyBadge date={inst.custDL} />
                </div>
              )}
            </div>

            {/* Customs reminder */}
            <div className="mx-5 mb-4 px-3 py-2.5 bg-maersk-blue/10 border border-maersk-blue/20 rounded-xl flex items-center gap-2.5">
              <Mail className="h-3.5 w-3.5 text-[#42b0d5] shrink-0" />
              <p className="text-[10px] font-black text-[#42b0d5] leading-snug">
                Customs doc → <span className="underline underline-offset-1">nlaopsinlrbc@maersk.com</span>
                <span className="font-bold text-white/30 ml-2">· ATA 2d before delivery for multistop</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ExportCard({ card, result, idx }: { card: ExpCard; result: CYCYExpRunResult; idx: number }) {
  const isBarge = card.mod === 'Barge';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.4 }}
    >
      <div className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5",
        "bg-gradient-to-br from-[#001829] via-[#002040] to-[#001829]",
        card.isRecommended
          ? "border-amber-400/40 shadow-[0_8px_40px_-8px_rgba(251,191,36,0.22)] ring-1 ring-amber-400/20"
          : "border-white/10 shadow-xl shadow-black/40"
      )}>
        {card.isRecommended && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
        )}

        <div className="flex flex-col sm:flex-row">
          {/* Left: modality + route panel */}
          <div className={cn(
            "sm:w-56 flex-none flex flex-col justify-between p-5 border-b sm:border-b-0 sm:border-r border-white/8",
            isBarge
              ? "bg-gradient-to-br from-[#001e33] to-[#00375c]/60"
              : "bg-gradient-to-br from-purple-950/90 to-purple-900/50"
          )}>
            <div>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-4 border",
                isBarge ? "bg-[#42b0d5]/15 border-[#42b0d5]/25" : "bg-purple-400/15 border-purple-400/25"
              )}>
                {isBarge
                  ? <Anchor className="h-4 w-4 text-[#42b0d5]" />
                  : <Train className="h-4 w-4 text-purple-300" />
                }
                <span className={cn("text-sm font-black uppercase tracking-wider", isBarge ? "text-[#42b0d5]" : "text-purple-300")}>
                  {card.mod}
                </span>
              </div>

              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">From</p>
                <p className="text-sm font-black text-white leading-snug">{card.depotName}</p>
                <p className="font-mono text-[9px] text-white/25">{card.depotCode}</p>
                <div className="flex items-center gap-1 my-1.5">
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="h-1 w-1 rounded-full bg-white/20" />
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">To</p>
                <p className="text-sm font-black text-white leading-snug">{card.termName}</p>
                <p className="font-mono text-[9px] text-white/25">{card.termCode}</p>
              </div>

              {card.isRecommended && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 mt-3 rounded-xl bg-amber-400/12 border border-amber-400/30">
                  <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">Best Option</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3">
              {card.nextDayCutoff && (
                <span className="text-[9px] font-black bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-400/30">Cutoff</span>
              )}
              <CopyBtn text={buildExpCopyText(card, result)} />
            </div>
          </div>

          {/* Right: info panel */}
          <div className="flex-1 min-w-0">
            {/* 4-step timeline: ETD → EAT → CCO → Latest ETA */}
            <div className="px-5 pt-5 pb-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", isBarge ? "bg-[#42b0d5] shadow-sm shadow-[#42b0d5]/60" : "bg-purple-400 shadow-sm shadow-purple-400/60")} />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Depot ETD</p>
                  </div>
                  <p className="text-sm font-black text-white font-mono leading-tight">{fmtS(card.etd)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60 shrink-0" />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Terminal EAT</p>
                  </div>
                  <p className="text-sm font-black text-emerald-400 font-mono leading-tight">{fmtS(card.eat)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-2 w-2 rounded-full bg-sky-400 shadow-sm shadow-sky-400/60 shrink-0" />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Earliest CCO</p>
                  </div>
                  <p className="text-sm font-black text-sky-400 font-mono leading-tight">{fmtS(card.earliestCCO)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-2 w-2 rounded-full bg-white/40 shrink-0" />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Latest ETA</p>
                  </div>
                  <p className="text-sm font-black text-white font-mono leading-tight">{fmtS(card.latestETA)}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/8 mx-5" />

            {/* Deadlines */}
            <div className="px-5 py-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Order Deadline</p>
                  <p className="text-sm font-black text-white">{fmtS(card.orderDL)}</p>
                </div>
                <UrgencyBadge date={card.orderDL} />
              </div>
              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Buffer</p>
                <p className="text-sm font-black text-white/70">{card.buffer}d after EAT</p>
              </div>
              <div className="ml-auto text-right hidden sm:block">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Transport Remarks</p>
                <p className="text-xs font-black text-white/50 font-mono">
                  {card.mod.toLowerCase()} ETD {card.etd.toLocaleDateString('en-GB',{weekday:'short'})} {card.etd.getDate().toString().padStart(2,'0')}/{(card.etd.getMonth()+1).toString().padStart(2,'0')}
                </p>
                <p className="text-[9px] font-bold text-amber-400/70 mt-0.5">Upon receipt, please return TIR by email</p>
              </div>
            </div>

            {card.holidaysInTransit.length > 0 && (
              <div className="mx-5 mb-2 px-3 py-2 bg-amber-400/10 border border-amber-400/20 rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-[10px] font-black text-amber-300">
                  Holiday in transit: {card.holidaysInTransit.map(d => fmtS(d)).join(', ')} — verify with depot
                </span>
              </div>
            )}

            {card.nextDayCutoff && (
              <div className="mx-5 mb-2 px-3 py-2 bg-sky-400/10 border border-sky-400/20 rounded-xl flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span className="text-[10px] font-bold text-sky-300">
                  Next-day departure — ensure loading before 12:00
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ImportResults({ result }: { result: CYCYImpRunResult }) {
  const cards = result.instances.slice(0, result.maxCards);

  if (cards.length === 0) {
    return (
      <div className="p-8 text-center bg-[#001829] border border-white/10 rounded-2xl shadow-xl">
        <Ship className="h-8 w-8 text-white/10 mx-auto mb-3" />
        <p className="text-sm font-black text-white/40 uppercase tracking-widest">
          No departures found for {result.portName} → {result.termName}
        </p>
        <p className="text-xs text-white/20 mt-1">Try a later vessel ETD or contact the inland team</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-black text-white tracking-tight uppercase">
            {result.portName} <span className="text-[#42b0d5]">→</span> {result.termName}
          </h3>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-0.5">
            {cards.length} departure{cards.length !== 1 ? 's' : ''} · Vessel ETD {fmtS(result.vesselETD)}
          </p>
        </div>
      </div>
      <div className="space-y-3 max-w-5xl mx-auto">
        {cards.map((inst, i) => (
          <ImportCard key={`${inst.mod}-${inst.etd.getTime()}`} inst={inst} result={result} idx={i} />
        ))}
      </div>
    </div>
  );
}

function ExportResults({ result }: { result: CYCYExpRunResult }) {
  if (result.orderDLPassed) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-500/25 rounded-2xl flex items-start gap-4 shadow-xl">
        <div className="p-2 bg-red-500/20 rounded-xl border border-red-500/25">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h4 className="text-base font-black text-white tracking-tight uppercase mb-1">Order Deadline Passed</h4>
          <p className="text-sm text-red-300/70 font-bold">
            The transport order deadline for this loading date has already passed.
            {result.orderDL && ` Deadline was ${fmt(result.orderDL)}.`}
          </p>
          <p className="text-xs text-red-400/50 mt-1">Please contact inland operations or select a later loading date.</p>
        </div>
      </div>
    );
  }

  if (result.cards.length === 0) {
    return (
      <div className="p-8 text-center bg-[#001829] border border-white/10 rounded-2xl shadow-xl">
        <Ship className="h-8 w-8 text-white/10 mx-auto mb-3" />
        <p className="text-sm font-black text-white/40 uppercase tracking-widest">
          No departures found for {result.depotName} → {result.termName}
        </p>
        <p className="text-xs text-white/20 mt-1">This route may not be available or schedules are not yet configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Customs deadline banner (RTM only) */}
      {result.customsDeadline && (
        <div className="relative overflow-hidden px-4 py-3.5 bg-gradient-to-r from-orange-900 via-amber-800 to-orange-900 border-2 border-amber-400/80 rounded-xl flex items-center gap-3 shadow-xl shadow-amber-900/50">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 20px)' }} />
          <div className="relative z-10 p-2 rounded-lg bg-white/15 border border-white/30 shrink-0">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div className="relative z-10 flex-1 min-w-0">
            <p className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-0.5">Rotterdam Customs Deadline</p>
            <p className="text-sm font-black text-white">
              {fmt(result.customsDeadline)}{' '}
              <span className="font-mono text-amber-200">
                {result.customsDeadline.getHours().toString().padStart(2,'0')}:{result.customsDeadline.getMinutes().toString().padStart(2,'0')} CET
              </span>
              <span className="text-[10px] font-bold ml-2 text-white/50">(Loading time + 3h)</span>
            </p>
          </div>
          <div className="relative z-10">
            <UrgencyBadge date={result.customsDeadline} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-base font-black text-white tracking-tight uppercase">
            {result.depotName} <span className="text-emerald-400">→</span> {result.termName}
          </h3>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-0.5">
            {result.cards.length} departure option{result.cards.length !== 1 ? 's' : ''} · YOT {result.yot}d
          </p>
        </div>
      </div>

      <div className="space-y-3 max-w-5xl mx-auto">
        {result.cards.map((card, i) => (
          <ExportCard key={`${card.mod}-${card.etd.getTime()}`} card={card} result={result} idx={i} />
        ))}
      </div>

      {result.skipped.length > 0 && (
        <div className="bg-[#001829] border border-white/10 rounded-xl px-4 py-3">
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Excluded Departures</p>
          {result.skipped.map((s, i) => (
            <p key={i} className="text-[10px] font-bold text-white/40">
              {s.mod} {fmtS(s.etd)} — {s.reason === 'next-day-cutoff' ? 'Next-day loading after 12:00 not eligible' : s.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function CYCYResultCard() {
  const cycyRunResult = usePlannerStore(s => s.cycyRunResult);

  if (!cycyRunResult) {
    return (
      <div className="p-8 text-center bg-[#001829] border border-white/10 rounded-2xl shadow-xl">
        <Ship className="h-8 w-8 text-white/10 mx-auto mb-3" />
        <p className="text-sm font-black text-white/40 uppercase tracking-widest">Configure terminals, cargo &amp; date — then run the optimizer</p>
      </div>
    );
  }

  if (cycyRunResult.direction === 'Import') {
    return <ImportResults result={cycyRunResult} />;
  } else {
    return <ExportResults result={cycyRunResult} />;
  }
}
