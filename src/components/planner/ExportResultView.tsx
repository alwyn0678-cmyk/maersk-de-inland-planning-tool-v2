import { useState, useCallback, memo } from 'react';
import { motion } from 'motion/react';
import { ExpRunResult, ExpCard } from '../../logic/export/expRun';
import { fmt, fmtS, fmtDateISO } from '../../logic/dateUtils';
import { Badge } from '../ui/badge';
import { AlertTriangle, Copy, Check, Info, Train, Anchor, Package, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 2000);
    }
  }, [text]);
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/15"
    >
      {copied ? <><Check className="h-2.5 w-2.5 text-emerald-400" />Copied</> : failed ? <><Copy className="h-2.5 w-2.5" />Failed</> : <><Copy className="h-2.5 w-2.5" />Copy</>}
    </button>
  );
}

function buildExportCopyText(card: ExpCard, result: ExpRunResult): string {
  const modName = card.mod.toLowerCase();
  const lines = [
    'MAERSK DE — EXPORT BOOKING SUMMARY',
    '─────────────────────────────────',
    `Customer ZIP (PLZ)  : ${result.zip}`,
    `Container           : ${result.size}' ${result.type}`,
    `Loading Date        : ${result.loadingDate.getDate().toString().padStart(2,'0')}/${(result.loadingDate.getMonth()+1).toString().padStart(2,'0')}/${result.loadingDate.getFullYear()}`,
    `Loading Time (CET)  : ${result.loadTime}`,
    '─────────────────────────────────',
    'INLAND TRANSPORT',
    `Depot               : ${card.depotCode} — ${card.depotName}`,
    `Modality            : ${card.mod}`,
    `Departure (ETD)     : ${fmt(card.etd)}`,
    '─────────────────────────────────',
    'VESSEL PLANNING WINDOW',
    `Terminal            : ${card.termCode} — ${card.termName}`,
    `Earliest Vessel CCO : ${fmt(card.earliestCCO)}`,
    `Latest Vessel ETA   : ${fmt(card.latestETA)}`,
    '─────────────────────────────────',
    `Order Deadline      : ${fmt(card.orderDL)}`,
    `Transport Order Remarks: Please plan on ${modName} departure with ETD ${card.etd.toLocaleDateString('en-GB',{weekday:'short'})} ${card.etd.getDate().toString().padStart(2,'0')}/${(card.etd.getMonth()+1).toString().padStart(2,'0')}`,
    '',
    '─────────────────────────────────',
    result.emptyDepot ? `EMPTY CONTAINER RELEASE (${result.emptyLabel})` : '',
    result.emptyDepot ? `Preferred       : ${result.emptyDepot.p1} — ${result.emptyDepot.p1n}` : '',
    result.emptyDepot?.p2 ? `2nd Option      : ${result.emptyDepot.p2} — ${result.emptyDepot.p2n}` : '',
    '─────────────────────────────────',
    `Generated           : ${new Date().toLocaleDateString('en-GB')} · Maersk DE Inland Ops v2.2`,
  ].filter(Boolean);
  return lines.join('\n');
}

const ExportCard = memo(function ExportCard({ card, result, idx }: { card: ExpCard; result: ExpRunResult; idx: number }) {
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
              <CopyButton text={buildExportCopyText(card, result)} />
            </div>
          </div>

          {/* Right: info panel */}
          <div className="flex-1 min-w-0">
            {/* Timeline: Loading → Depot ETD → Terminal EAT */}
            <div className="px-5 pt-5 pb-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-2 w-2 rounded-full bg-white/30 shrink-0" />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Loading</p>
                  </div>
                  <p className="text-base font-black text-white font-mono leading-tight">{fmtS(result.loadingDate)}</p>
                  <p className="text-[10px] text-white/30 font-bold mt-0.5">{result.loadTime}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", isBarge ? "bg-[#42b0d5] shadow-sm shadow-[#42b0d5]/60" : "bg-purple-400 shadow-sm shadow-purple-400/60")} />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Depot ETD</p>
                  </div>
                  <p className="text-base font-black text-white font-mono leading-tight">{fmtS(card.etd)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60 shrink-0" />
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Terminal EAT</p>
                  </div>
                  <p className="text-base font-black text-emerald-400 font-mono leading-tight">{fmtS(card.eat)}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/8 mx-5" />

            {/* Vessel window + deadlines */}
            <div className="px-5 py-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Vessel Window · {card.termCode}</p>
                  <div className="flex gap-5">
                    <div>
                      <p className="text-[9px] text-white/30 font-black uppercase mb-0.5">Earliest CCO</p>
                      <p className="text-base font-black text-white font-mono">{fmtS(card.earliestCCO)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/30 font-black uppercase mb-0.5">Latest ETA</p>
                      <p className="text-base font-black text-white font-mono">{fmtS(card.latestETA)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Order Deadline</p>
                    <p className="text-sm font-black text-white">{fmtS(card.orderDL)}</p>
                  </div>
                  <UrgencyBadge date={card.orderDL} />
                </div>

                <div className="ml-auto text-right hidden sm:block">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Transport Remarks</p>
                  <p className="text-xs font-black text-white/50 font-mono">
                    {card.mod.toLowerCase()} ETD {card.etd.toLocaleDateString('en-GB',{weekday:'short'})} {card.etd.getDate().toString().padStart(2,'0')}/{(card.etd.getMonth()+1).toString().padStart(2,'0')}
                  </p>
                </div>
              </div>
            </div>

            {card.holidaysInTransit.length > 0 && (
              <div className="mx-5 mb-3 px-3 py-2 bg-amber-400/10 border border-amber-400/20 rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-[10px] font-black text-amber-300">
                  Holiday in transit: {card.holidaysInTransit.map(d => fmtS(d)).join(', ')} — verify with depot
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export function ExportResultView({ result }: { result: ExpRunResult }) {
  if (result.isrRequired) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-rose-900/40 shadow-2xl shadow-rose-900/20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0008] via-[#2d0010] to-[#1a0008]" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '16px 16px' }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 rounded-full bg-rose-600/20 blur-3xl" />
        </div>
        <div className="relative z-10 px-8 py-12 flex flex-col items-center text-center gap-5">
          <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 shadow-inner">
            <ShieldAlert className="h-10 w-10 text-rose-400" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-rose-400/70 uppercase tracking-[0.35em]">Action Required Before Booking</p>
            <p className="text-2xl font-black text-white uppercase tracking-tight">ISR Required</p>
          </div>
          <div className="max-w-md space-y-1.5">
            <p className="text-sm font-black text-rose-200 leading-relaxed">
              IMO and Reefer containers via <span className="text-white">Duisburg (DEDUI01)</span> are on request only.
            </p>
            <p className="text-sm text-rose-300/70 font-bold">CX must raise an ISR before any booking can be made.</p>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 mt-2">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400 flex-none" />
            <span className="text-[11px] font-black text-rose-300 uppercase tracking-wider">Contact Inland Ops to raise an ISR</span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />
      </div>
    );
  }

  if (result.notServicedAntwerp) {
    return (
      <div className="p-6 bg-[#001e33] border border-maersk-blue/20 rounded-2xl flex items-start gap-4 shadow-xl">
        <div className="p-2.5 bg-maersk-blue/20 rounded-xl border border-maersk-blue/30 shrink-0">
          <Info className="h-5 w-5 text-[#42b0d5]" />
        </div>
        <div>
          <p className="text-sm font-black text-white mb-1">Not Serviced via Antwerp</p>
          <p className="text-sm font-bold text-white/60">This ZIP code area is not serviced via Antwerp by barge. Please select a Rotterdam terminal.</p>
        </div>
      </div>
    );
  }

  if (result.noSchedule) {
    return (
      <div className="p-6 bg-amber-950/30 border border-amber-500/25 rounded-2xl flex items-start gap-4 shadow-xl">
        <div className="p-2.5 bg-amber-500/15 rounded-xl border border-amber-500/25 shrink-0">
          <Info className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-black text-white mb-1">Schedule Not Yet Available</p>
          <p className="text-sm font-bold text-amber-200/70">
            <strong className="text-amber-200">{result.noScheduleDepotName}</strong> — Please raise an ISR with Inland Ops.
          </p>
        </div>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="p-6 bg-rose-950/40 border border-rose-500/25 rounded-2xl flex items-start gap-3 shadow-xl">
        <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-rose-300">{result.error}</p>
      </div>
    );
  }

  if (result.orderDLPassed) {
    return (
      <div className="p-6 bg-red-950/30 border border-red-500/25 rounded-2xl flex items-start gap-4 shadow-xl">
        <div className="p-2.5 bg-red-500/15 rounded-xl border border-red-500/25 shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <p className="text-sm font-black text-white mb-1">Order Deadline Has Passed</p>
          {result.orderDL && <p className="text-xs text-red-300/70 font-bold mt-1">Deadline was: {fmt(result.orderDL)}</p>}
          <p className="text-xs text-red-200/50 font-bold mt-0.5">Contact Inland Ops immediately if a booking is still needed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Context bar — dark glass */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5 bg-gradient-to-r from-[#001829] via-[#002040] to-[#001829] border border-white/10 rounded-2xl shadow-xl max-w-5xl mx-auto">
        {[
          { label: 'PLZ / Region', value: `${result.zip} · ${result.region}` },
          { label: 'Container', value: `${result.size}' ${result.type.toUpperCase()}` },
          { label: 'Loading', value: `${fmtS(result.loadingDate)} ${result.loadTime}` },
          { label: 'Terminal', value: result.termCode },
          { label: 'YOT', value: `${result.yot} days` },
          { label: 'Depot', value: result.depotName },
        ].map(({ label, value }, i, arr) => (
          <div key={label} className="flex items-center gap-5">
            <div>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{label}</p>
              <p className="text-base font-black text-white">{value}</p>
            </div>
            {i < arr.length - 1 && <div className="h-9 w-px bg-white/10" />}
          </div>
        ))}
      </div>

      {result.customsDeadline && (
        <div className="relative overflow-hidden px-5 py-4 bg-gradient-to-r from-orange-900 via-amber-800 to-orange-900 border-2 border-amber-400/80 rounded-xl flex items-center gap-4 max-w-5xl mx-auto shadow-xl shadow-amber-900/50">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 20px)' }} />
          <div className="relative z-10 p-2.5 rounded-lg bg-white/15 border border-white/30 shrink-0">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <div className="relative z-10 flex-1 min-w-0">
            <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.25em] mb-0.5">Rotterdam Customs Document Deadline</p>
            <p className="text-base font-black text-white">
              {fmt(result.customsDeadline)}{' '}
              <span className="font-mono text-amber-200 text-lg">
                {result.customsDeadline.getHours().toString().padStart(2,'0')}:{result.customsDeadline.getMinutes().toString().padStart(2,'0')}
              </span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      )}

      {result.skipped.length > 0 && (
        <div className="px-4 py-3 bg-amber-400/8 border border-amber-400/15 rounded-xl flex items-center gap-2 max-w-5xl mx-auto">
          <Info className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-[10px] font-black text-amber-300">Next-day departure excluded — loading time after 12:00 (cutoff missed)</p>
        </div>
      )}

      {result.emptyDepot && (
        <div className="px-5 py-4 bg-[#001829] border border-white/10 rounded-xl shadow-xl max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2.5">
            <Package className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Empty Container Release ({result.emptyLabel})</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">Preferred</span>
              <span className="font-mono text-xs font-black text-white">{result.emptyDepot.p1}</span>
              <span className="text-xs text-white/50 font-bold">— {result.emptyDepot.p1n}</span>
            </div>
            {result.emptyDepot.p2 && (
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">2nd Option</span>
                <span className="font-mono text-xs font-black text-white">{result.emptyDepot.p2}</span>
                <span className="text-xs text-white/50 font-bold">— {result.emptyDepot.p2n}</span>
              </div>
            )}
            <p className="text-[9px] text-white/30 font-bold leading-snug pt-0.5">
              Always recommend preferred depot. If unavailable, delay transport or contact <strong className="text-white/50">INLAND OPS</strong>.
            </p>
          </div>
        </div>
      )}

      {result.cards.length === 0 ? (
        <div className="p-10 text-center bg-[#001829] border border-white/10 rounded-2xl shadow-xl max-w-5xl mx-auto">
          <div className="inline-flex p-4 bg-white/5 rounded-2xl mb-4">
            <AlertTriangle className="h-7 w-7 text-white/20" />
          </div>
          <p className="text-sm font-black text-white/50 uppercase tracking-widest mb-1">No Departures Found</p>
          <p className="text-xs text-white/30 font-bold">No schedulable departures within the planning window.</p>
          <p className="text-xs text-white/30 font-bold mt-0.5">Contact Inland Operations for alternatives.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-5xl mx-auto">
          {result.cards.map((card, idx) => (
            <ExportCard
              key={`${fmtDateISO(card.etd)}-${card.mod}-${card.depotCode}`}
              card={card} result={result} idx={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
