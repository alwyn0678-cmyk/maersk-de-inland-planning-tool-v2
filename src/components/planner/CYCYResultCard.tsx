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
  Calendar, Clock, Package, ArrowRight, MapPin, Info
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
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/20"
    >
      {copied ? <><Check className="h-2.5 w-2.5" />Done</> : <><Copy className="h-2.5 w-2.5" />Copy</>}
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
    `Customer Delivery: ${fmt(inst.custDel)}${result.termCode === 'DEDUI01' ? ' (after 12:00)' : ''}`,
    `Order Deadline: ${fmt(inst.orderDL)}`,
    inst.custDL ? `Customs Deadline: ${fmt(inst.custDL)} ${inst.custDL.getHours().toString().padStart(2,'0')}:${inst.custDL.getMinutes().toString().padStart(2,'0')}` : '',
    '',
    `Transport Order Remarks: Please plan on ${modName} departure with ETD ${inst.etdDay} ${inst.etd.getDate().toString().padStart(2,'0')}/${(inst.etd.getMonth()+1).toString().padStart(2,'0')}`,
    '',
    '⚠ REMINDERS',
    '- Always send copy of Customs document to nlaopsinlrbc@maersk.com (DO NOT send this to us)',
    '- When multistop is needed, send ATA at least 2 days before customer Delivery date',
  ].filter(l => l !== undefined && l !== null);
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
      className={cn(
        'rounded-2xl overflow-hidden border shadow-md transition-all duration-300 hover:shadow-lg',
        inst.rec ? 'border-maersk-blue/30' : 'border-slate-100'
      )}
    >
      {/* Card header */}
      <div className={cn(
        'px-5 py-3 flex items-center justify-between',
        isBarge
          ? 'bg-gradient-to-r from-[#00243d] via-[#00315a] to-maersk-blue/80'
          : 'bg-gradient-to-r from-purple-950 via-purple-900 to-purple-700'
      )}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/10 rounded-lg">
            {isBarge ? <Anchor className="h-4 w-4 text-white" /> : <Train className="h-4 w-4 text-white" />}
          </div>
          <div>
            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">{inst.mod}</p>
            <div className="flex items-center gap-2 text-sm font-black text-white tracking-tight">
              <span>{result.portName}</span>
              <ArrowRight className="h-3 w-3 text-white/40" />
              <span>{result.termName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {inst.rec && (
            <Badge className="bg-white/20 text-white border-none text-[9px] font-black uppercase tracking-widest px-2 py-1">
              ★ Best
            </Badge>
          )}
          <CopyBtn text={buildImpCopyText(inst, result)} />
        </div>
      </div>

      {/* Card body */}
      <div className="bg-white px-5 py-4 space-y-3">
        {/* Journey timeline */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2.5 bg-slate-50 rounded-xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Terminal ETD</p>
            <p className="text-xs font-black text-maersk-dark">{fmtS(inst.etd)}</p>
            <p className="text-[9px] text-slate-400">{inst.etdDay}</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Depot Arrival</p>
            <p className="text-xs font-black text-emerald-600">{fmtS(inst.eta)}</p>
            <p className="text-[9px] text-slate-400">{inst.etaDay}</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Customer Delivery</p>
            <p className="text-xs font-black text-maersk-dark">{fmtS(inst.custDel)}</p>
            {isDui && <p className="text-[9px] text-amber-500 font-bold">after 12:00</p>}
          </div>
        </div>

        {/* Deadlines */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Deadline</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-maersk-dark">{fmtS(inst.orderDL)}</p>
              <UrgencyBadge date={inst.orderDL} />
            </div>
          </div>
          {inst.custDL && (
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Customs Deadline ({result.portCode})
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-black text-maersk-dark">
                  {fmtS(inst.custDL)} {inst.custDL.getHours().toString().padStart(2,'0')}:{inst.custDL.getMinutes().toString().padStart(2,'0')}
                </p>
                <UrgencyBadge date={inst.custDL} />
              </div>
            </div>
          )}
        </div>

        {/* Reminders */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 space-y-1">
          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Reminders</p>
          <p className="text-[10px] font-bold text-amber-700">Always send copy of Customs doc to <span className="font-black">nlaopsinlrbc@maersk.com</span></p>
          <p className="text-[10px] font-bold text-amber-700">Multistop: send ATA at least 2 days before customer delivery</p>
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
      className={cn(
        'rounded-2xl overflow-hidden border shadow-md transition-all duration-300 hover:shadow-lg',
        card.isRecommended ? 'border-emerald-500/30' : 'border-slate-100'
      )}
    >
      {/* Header */}
      <div className={cn(
        'px-5 py-3 flex items-center justify-between',
        isBarge
          ? 'bg-gradient-to-r from-[#00243d] via-[#00315a] to-maersk-blue/80'
          : 'bg-gradient-to-r from-purple-950 via-purple-900 to-purple-700'
      )}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/10 rounded-lg">
            {isBarge ? <Anchor className="h-4 w-4 text-white" /> : <Train className="h-4 w-4 text-white" />}
          </div>
          <div>
            <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">{card.mod}</p>
            <div className="flex items-center gap-2 text-sm font-black text-white tracking-tight">
              <span>{card.depotName}</span>
              <ArrowRight className="h-3 w-3 text-white/40" />
              <span>{card.termName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {card.isRecommended && (
            <Badge className="bg-white/20 text-white border-none text-[9px] font-black uppercase tracking-widest px-2 py-1">
              ★ Best
            </Badge>
          )}
          <CopyBtn text={buildExpCopyText(card, result)} />
        </div>
      </div>

      {/* Body */}
      <div className="bg-white px-5 py-4 space-y-3">
        {/* Timeline row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 bg-slate-50 rounded-xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Depot ETD</p>
            <p className="text-xs font-black text-maersk-dark">{fmtS(card.etd)}</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Terminal EAT</p>
            <p className="text-xs font-black text-maersk-dark">{fmtS(card.eat)}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl">
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Earliest CCO</p>
            <p className="text-xs font-black text-emerald-700">{fmtS(card.earliestCCO)}</p>
          </div>
          <div className="p-2.5 bg-sky-50 rounded-xl">
            <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest mb-0.5">Latest ETA</p>
            <p className="text-xs font-black text-sky-700">{fmtS(card.latestETA)}</p>
          </div>
        </div>

        {/* Deadlines */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Order Deadline</p>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-maersk-dark">{fmtS(card.orderDL)}</p>
              <UrgencyBadge date={card.orderDL} />
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Buffer Days</p>
            <p className="text-xs font-black text-maersk-dark">{card.buffer}d after EAT</p>
          </div>
        </div>

        {/* Holidays warning */}
        {card.holidaysInTransit.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">
              <AlertTriangle className="inline h-3 w-3 mr-1" />Public Holiday in Transit
            </p>
            <p className="text-[10px] font-bold text-amber-700">
              {card.holidaysInTransit.map(d => fmtS(d)).join(', ')} — verify schedule with depot
            </p>
          </div>
        )}

        {/* Next day cutoff */}
        {card.nextDayCutoff && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-blue-700">
              <Info className="inline h-3 w-3 mr-1" />Next-day departure — ensure loading before 12:00
            </p>
          </div>
        )}
      </div>
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
      <div className="space-y-3">
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

      <div className="space-y-3">
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
        <ArrowRightIcon className="h-8 w-8 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Configure terminals, cargo & date — then run the optimizer</p>
      </div>
    );
  }

  if (cycyRunResult.direction === 'Import') {
    return <ImportResults result={cycyRunResult} />;
  } else {
    return <ExportResults result={cycyRunResult} />;
  }
}

// Icon alias to avoid re-import
function ArrowRightIcon({ className }: { className?: string }) {
  return <Ship className={className} />;
}
