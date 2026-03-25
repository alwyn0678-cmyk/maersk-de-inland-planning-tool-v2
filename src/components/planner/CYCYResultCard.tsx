import { useState } from 'react';
import { usePlannerStore, CYCYImpRunResult, CYCYExpRunResult } from '../../store/usePlannerStore';
import { ImpInstance } from '../../logic/import/computeInstances';
import { ExpCard } from '../../logic/export/expRun';
import { fmt, fmtS } from '../../logic/dateUtils';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
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
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/20"
    >
      {copied ? <><Check className="h-2.5 w-2.5" />Done</> : failed ? <><Copy className="h-2.5 w-2.5" />Failed</> : <><Copy className="h-2.5 w-2.5" />Copy</>}
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
    '⚠ IMPORTANT: TIR documentation MUST be included with the transport order.',
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
    '⚠ IMPORTANT: TIR documentation MUST be included with the transport order.',
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
      <Card className={cn(
        'overflow-hidden border rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5',
        inst.rec
          ? 'border-amber-300 shadow-lg shadow-amber-400/15 ring-1 ring-amber-200/50'
          : 'border-slate-200 shadow-sm'
      )}>
        {inst.rec && (
          <div className="bg-amber-400 px-5 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-900" />
            <span className="text-[11px] font-black text-amber-900 uppercase tracking-[0.2em]">★ Recommended — Best Available Option</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row">
          {/* Left: dark modality panel */}
          <div className={cn(
            "sm:w-52 flex-none flex flex-col justify-between p-4",
            isBarge
              ? "bg-gradient-to-br from-[#001e33] to-[#00375c]"
              : "bg-gradient-to-br from-purple-950 to-purple-800"
          )}>
            <div>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-3 border",
                isBarge ? "bg-[#42b0d5]/20 border-[#42b0d5]/30" : "bg-purple-400/20 border-purple-400/30"
              )}>
                {isBarge
                  ? <Anchor className="h-4 w-4 text-[#42b0d5]" />
                  : <Train className="h-4 w-4 text-purple-300" />
                }
                <span className={cn(
                  "text-sm font-black uppercase tracking-wider",
                  isBarge ? "text-[#42b0d5]" : "text-purple-300"
                )}>{inst.mod}</span>
              </div>
              {/* Route: port → terminal */}
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Route</p>
                <div className="flex items-center gap-1.5 text-sm font-black text-white flex-wrap">
                  <span className="text-white/70">{result.portName}</span>
                  <ArrowRight className="h-3 w-3 text-white/30 flex-none" />
                  <span>{result.termName}</span>
                </div>
                <p className="font-mono text-[10px] text-white/30 mt-0.5">{result.termCode}</p>
              </div>
            </div>
            <div className="mt-4">
              <CopyBtn text={buildImpCopyText(inst, result)} />
            </div>
          </div>

          {/* Right: info panel */}
          <CardContent className="flex-1 p-0">
            {/* Journey row */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Terminal ETD</p>
                  <p className="text-base font-black text-maersk-dark leading-tight">{fmtS(inst.etd)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 flex-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Depot Arrival</p>
                  <p className="text-base font-black text-emerald-600 leading-tight">{fmtS(inst.eta)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 flex-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Container Pick-Up Date</p>
                  <p className="text-base font-black text-maersk-dark leading-tight">{fmtS(inst.custDel)}</p>
                  {isDui && <p className="text-[10px] text-amber-500 font-black mt-0.5">after 12:00</p>}
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 mx-5" />

            {/* Deadlines */}
            <div className="px-5 py-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Order Deadline</p>
                  <p className="text-base font-black text-maersk-dark">{fmtS(inst.orderDL)}</p>
                </div>
                <UrgencyBadge date={inst.orderDL} />
              </div>
              {inst.custDL && (
                <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-none" />
                  <div>
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Customs DL ({result.portCode})</p>
                    <p className="text-sm font-black text-amber-800">
                      {fmtS(inst.custDL)} {inst.custDL.getHours().toString().padStart(2,'0')}:{inst.custDL.getMinutes().toString().padStart(2,'0')}
                    </p>
                  </div>
                  <UrgencyBadge date={inst.custDL} />
                </div>
              )}
            </div>

            {/* Customs doc reminder — prominent banner */}
            <div className="mx-5 mb-4 px-3 py-2.5 bg-maersk-blue/8 border border-maersk-blue/25 rounded-xl flex items-center gap-2.5">
              <Mail className="h-3.5 w-3.5 text-maersk-blue shrink-0" />
              <p className="text-[10px] font-black text-maersk-blue leading-snug">
                Customs doc → <span className="underline underline-offset-1">nlaopsinlrbc@maersk.com</span>
                <span className="font-bold text-slate-500 ml-2">· ATA 2d before delivery for multistop</span>
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
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
      <Card className={cn(
        'overflow-hidden border rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5',
        card.isRecommended
          ? 'border-amber-300 shadow-lg shadow-amber-400/15 ring-1 ring-amber-200/50'
          : 'border-slate-200 shadow-sm'
      )}>
        {card.isRecommended && (
          <div className="bg-amber-400 px-5 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-900" />
            <span className="text-[11px] font-black text-amber-900 uppercase tracking-[0.2em]">★ Recommended — Best Available Option</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row">
          {/* Left: dark modality panel */}
          <div className={cn(
            "sm:w-56 flex-none flex flex-col justify-between p-4",
            isBarge
              ? "bg-gradient-to-br from-[#001e33] to-[#00375c]"
              : "bg-gradient-to-br from-purple-950 to-purple-800"
          )}>
            <div>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-3 border",
                isBarge ? "bg-[#42b0d5]/20 border-[#42b0d5]/30" : "bg-purple-400/20 border-purple-400/30"
              )}>
                {isBarge
                  ? <Anchor className="h-4 w-4 text-[#42b0d5]" />
                  : <Train className="h-4 w-4 text-purple-300" />
                }
                <span className={cn(
                  "text-sm font-black uppercase tracking-wider",
                  isBarge ? "text-[#42b0d5]" : "text-purple-300"
                )}>{card.mod}</span>
              </div>
              {/* Route: depot → terminal */}
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">From</p>
                <p className="text-sm font-black text-white leading-snug">{card.depotName}</p>
                <p className="font-mono text-[10px] text-white/30">{card.depotCode}</p>
                <ArrowRight className="h-3 w-3 text-white/30 my-1.5" />
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">To</p>
                <p className="text-sm font-black text-white leading-snug">{card.termName}</p>
                <p className="font-mono text-[10px] text-white/30">{card.termCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {card.nextDayCutoff && (
                <span className="text-[9px] font-black bg-amber-400/30 text-amber-200 px-2 py-0.5 rounded-lg border border-amber-400/30">Cutoff</span>
              )}
              <CopyBtn text={buildExpCopyText(card, result)} />
            </div>
          </div>

          {/* Right: info panel */}
          <CardContent className="flex-1 p-0">
            {/* 4-step timeline: ETD → EAT → CCO → Latest ETA */}
            <div className="px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Depot ETD</p>
                  <p className="text-base font-black text-maersk-dark leading-tight">{fmtS(card.etd)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 flex-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Terminal EAT</p>
                  <p className="text-base font-black text-maersk-dark leading-tight">{fmtS(card.eat)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 flex-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Earliest CCO</p>
                  <p className="text-base font-black text-emerald-700 leading-tight">{fmtS(card.earliestCCO)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 flex-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-1">Latest ETA</p>
                  <p className="text-base font-black text-sky-700 leading-tight">{fmtS(card.latestETA)}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 mx-5" />

            {/* Deadlines */}
            <div className="px-5 py-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Order Deadline</p>
                  <p className="text-base font-black text-maersk-dark">{fmtS(card.orderDL)}</p>
                </div>
                <UrgencyBadge date={card.orderDL} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Buffer</p>
                <p className="text-sm font-black text-maersk-dark">{card.buffer}d after EAT</p>
              </div>
              <div className="ml-auto text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Transport Remarks</p>
                <p className="text-sm font-black text-maersk-dark">
                  {card.mod.toLowerCase()} ETD {card.etd.toLocaleDateString('en-GB',{weekday:'short'})} {card.etd.getDate().toString().padStart(2,'0')}/{(card.etd.getMonth()+1).toString().padStart(2,'0')}
                </p>
              </div>
            </div>

            {/* Holidays warning */}
            {card.holidaysInTransit.length > 0 && (
              <div className="mx-5 mb-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-[10px] font-black text-amber-700">
                  Holiday in transit: {card.holidaysInTransit.map(d => fmtS(d)).join(', ')} — verify with depot
                </span>
              </div>
            )}

            {/* Next day cutoff */}
            {card.nextDayCutoff && (
              <div className="mx-5 mb-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="text-[10px] font-bold text-blue-700">
                  Next-day departure — ensure loading before 12:00
                </span>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
}

function ImportResults({ result }: { result: CYCYImpRunResult }) {
  const cards = result.instances.slice(0, result.maxCards);

  if (cards.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50/60 border border-slate-100 rounded-2xl">
        <Ship className="h-8 w-8 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
          No departures found for {result.portName} → {result.termName}
        </p>
        <p className="text-xs text-slate-300 mt-1">Try a later vessel ETD or contact the inland team</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-maersk-dark tracking-tight uppercase">
            {result.portName} <span className="text-maersk-blue">→</span> {result.termName}
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
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
      <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-rose-500 rounded-xl shadow-md">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h4 className="text-base font-black text-rose-900 tracking-tight uppercase mb-1">Order Deadline Passed</h4>
          <p className="text-sm text-rose-700 font-bold">
            The transport order deadline for this loading date has already passed.
            {result.orderDL && ` Deadline was ${fmt(result.orderDL)}.`}
          </p>
          <p className="text-xs text-rose-500 mt-1">Please contact inland operations or select a later loading date.</p>
        </div>
      </div>
    );
  }

  if (result.cards.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50/60 border border-slate-100 rounded-2xl">
        <Ship className="h-8 w-8 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
          No departures found for {result.depotName} → {result.termName}
        </p>
        <p className="text-xs text-slate-300 mt-1">This route may not be available or schedules are not yet configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Customs deadline banner (RTM only) */}
      {result.customsDeadline && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-none" />
          <div>
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Rotterdam Customs Deadline</p>
            <p className="text-sm font-black text-amber-800">
              {fmt(result.customsDeadline)} {result.customsDeadline.getHours().toString().padStart(2,'0')}:{result.customsDeadline.getMinutes().toString().padStart(2,'0')} CET
              <span className="text-[10px] font-bold ml-2 text-amber-600">(Loading time + 3h)</span>
            </p>
          </div>
          <UrgencyBadge date={result.customsDeadline} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-maersk-dark tracking-tight uppercase">
            {result.depotName} <span className="text-emerald-500">→</span> {result.termName}
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            {result.cards.length} departure option{result.cards.length !== 1 ? 's' : ''} · YOT {result.yot}d
          </p>
        </div>
      </div>

      <div className="space-y-3 max-w-5xl mx-auto">
        {result.cards.map((card, i) => (
          <ExportCard key={`${card.mod}-${card.etd.getTime()}`} card={card} result={result} idx={i} />
        ))}
      </div>

      {/* Skipped departures */}
      {result.skipped.length > 0 && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Excluded Departures</p>
          {result.skipped.map((s, i) => (
            <p key={i} className="text-[10px] font-bold text-slate-500">
              {s.mod} {fmtS(s.etd)} — {s.reason === 'next-day-cutoff' ? 'Next-day loading after 12:00 not eligible' : s.reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function CYCYResultCard() {
  const { cycyRunResult } = usePlannerStore();

  if (!cycyRunResult) {
    return (
      <div className="p-8 text-center bg-slate-50/60 border border-slate-100 rounded-2xl">
        <Ship className="h-8 w-8 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Configure terminals, cargo &amp; date — then run the optimizer</p>
      </div>
    );
  }

  if (cycyRunResult.direction === 'Import') {
    return <ImportResults result={cycyRunResult} />;
  } else {
    return <ExportResults result={cycyRunResult} />;
  }
}
