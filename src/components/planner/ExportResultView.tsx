import { useState } from 'react';
import { motion } from 'motion/react';
import { ExpRunResult, ExpCard } from '../../logic/export/expRun';
import { fmt, fmtS, fmtDateISO } from '../../logic/dateUtils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, Copy, Check, Info, Train, Anchor, Package, ShieldAlert, Calendar, MapPin, Ship } from 'lucide-react';
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

function ExportCard({ card, result, idx }: { card: ExpCard; result: ExpRunResult; idx: number }) {
  const isBarge = card.mod === 'Barge';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.4 }}
    >
      <Card className={cn(
        "overflow-hidden border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl group",
        card.isRecommended ? "border-emerald-300 shadow-lg shadow-emerald-500/10" : "border-slate-200 shadow-sm"
      )}>
        {/* Gradient mode header */}
        <div className={cn(
          "px-4 py-3 relative overflow-hidden",
          isBarge
            ? "bg-gradient-to-r from-[#00243d] via-[#00315a] to-maersk-blue/80"
            : "bg-gradient-to-r from-purple-950 via-purple-900 to-purple-700"
        )}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.07),transparent)] pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md flex-none", isBarge ? "bg-maersk-blue/40" : "bg-purple-500/40")}>
                {isBarge ? <Anchor className="h-3.5 w-3.5 text-white" /> : <Train className="h-3.5 w-3.5 text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">{card.mod}</p>
                <p className="text-sm font-black text-white leading-tight truncate">{card.depotName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-none ml-2">
              {card.isRecommended && (
                <span className="bg-emerald-500/30 text-emerald-200 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-emerald-400/30">
                  ★ Best
                </span>
              )}
              {card.nextDayCutoff && (
                <span className="bg-amber-400/30 text-amber-200 text-[9px] font-black px-1.5 py-0.5 rounded-md">Cutoff</span>
              )}
              <CopyButton text={buildExportCopyText(card, result)} />
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Journey Timeline: Loading → Depot ETD → Terminal EAT */}
          <div className="px-4 pt-4 pb-3">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-1">
              <span className="w-3 h-px bg-slate-200 inline-block" />Route
            </p>
            <div className="flex items-start">
              {/* Loading */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md mb-1.5 flex-none">
                  <MapPin className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase leading-tight text-center">Loading</p>
                <p className="text-xs font-black text-maersk-dark text-center leading-tight">{fmtS(result.loadingDate)}</p>
                <p className="text-[9px] text-slate-400 text-center">{result.loadTime}</p>
              </div>

              {/* Connector */}
              <div className="flex-1 flex items-start pt-3 mx-1">
                <div className="w-full h-px bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300" />
              </div>

              {/* Depot ETD */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shadow-md mb-1.5 flex-none",
                  isBarge ? "bg-maersk-blue" : "bg-purple-600"
                )}>
                  {isBarge ? <Anchor className="h-3.5 w-3.5 text-white" /> : <Train className="h-3.5 w-3.5 text-white" />}
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase leading-tight text-center">ETD</p>
                <p className="text-xs font-black text-maersk-dark text-center leading-tight">{fmtS(card.etd)}</p>
                <p className="text-[9px] text-slate-400 text-center">{card.depotCode}</p>
              </div>

              {/* Connector */}
              <div className="flex-1 flex items-start pt-3 mx-1">
                <div className="w-full h-px bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300" />
              </div>

              {/* Terminal EAT */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-500 flex items-center justify-center shadow-md mb-1.5 flex-none">
                  <Ship className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase leading-tight text-center">Terminal</p>
                <p className="text-xs font-black text-maersk-dark text-center leading-tight">{fmtS(card.eat)}</p>
                <p className="text-[9px] text-slate-400 text-center">{card.termCode}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-slate-100" />

          {/* Vessel Planning Window */}
          <div className="mx-4 my-3 px-3 py-2.5 bg-maersk-dark/5 border border-maersk-dark/10 rounded-xl">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Vessel Window · {card.termCode}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-black leading-none mb-0.5">Earliest CCO</p>
                <p className="text-xs font-black text-maersk-dark">{fmtS(card.earliestCCO)}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase font-black leading-none mb-0.5">Latest ETA</p>
                <p className="text-xs font-black text-maersk-dark">{fmtS(card.latestETA)}</p>
              </div>
            </div>
          </div>

          {/* Order deadline */}
          <div className="mx-4 mb-3 flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Order Deadline</p>
              <p className="text-xs font-black text-maersk-dark">{fmtS(card.orderDL)}</p>
            </div>
            <UrgencyBadge date={card.orderDL} />
          </div>

          {/* Holidays in transit */}
          {card.holidaysInTransit.length > 0 && (
            <div className="mx-4 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
              <span className="text-[9px] font-black text-amber-700">
                Holiday in transit: {card.holidaysInTransit.map(d => fmtS(d)).join(', ')}
              </span>
            </div>
          )}

          {/* Transport order */}
          <div className="mx-4 mb-4 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 flex items-center gap-1">
              <Info className="h-2.5 w-2.5" />Transport Order
            </p>
            <p className="text-[9px] font-black text-maersk-dark">
              Plan {card.mod.toLowerCase()} ETD {card.etd.toLocaleDateString('en-GB',{weekday:'short'})} {card.etd.getDate().toString().padStart(2,'0')}/{(card.etd.getMonth()+1).toString().padStart(2,'0')}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ExportResultView({ result }: { result: ExpRunResult }) {
  if (result.isrRequired) {
    return (
      <div className="p-8 bg-amber-50 border-2 border-amber-300 rounded-2xl text-center space-y-3">
        <ShieldAlert className="h-10 w-10 text-amber-600 mx-auto" />
        <p className="text-lg font-black text-amber-800 uppercase tracking-tight">ISR Required</p>
        <p className="text-sm font-bold text-amber-700">
          IMO and Reefer containers via Duisburg (DEDUI01) are on request only.<br />
          CX must raise an ISR before any booking can be made.
        </p>
      </div>
    );
  }

  if (result.notServicedAntwerp) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-blue-700">
          This ZIP code area is not serviced via Antwerp by barge. Please select a Rotterdam terminal.
        </p>
      </div>
    );
  }

  if (result.noSchedule) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-amber-700">
          Schedule not yet available for <strong>{result.noScheduleDepotName}</strong>. Please raise an ISR.
        </p>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-red-700">{result.error}</p>
      </div>
    );
  }

  if (result.orderDLPassed) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-black text-red-700">Order deadline has passed</p>
          {result.orderDL && <p className="text-xs text-red-600 mt-1">Deadline was: {fmt(result.orderDL)}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Context bar — grid to prevent wrapping */}
      <div className="grid grid-cols-3 gap-px bg-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {[
          { label: 'PLZ / Region', value: `${result.zip} · ${result.region}` },
          { label: 'Container', value: `${result.size}' ${result.type.toUpperCase()}` },
          { label: 'Loading', value: `${fmtS(result.loadingDate)} ${result.loadTime}` },
          { label: 'Terminal', value: result.termCode },
          { label: 'YOT', value: `${result.yot} days` },
          { label: 'Depot', value: result.depotName },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white px-4 py-3">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
            <p className="text-xs font-black text-maersk-dark leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* RTM customs deadline banner */}
      {result.customsDeadline && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">Rotterdam Customs Deadline: </span>
            <span className="text-sm font-black text-amber-800">{fmt(result.customsDeadline)} {result.customsDeadline.getHours().toString().padStart(2,'0')}:{result.customsDeadline.getMinutes().toString().padStart(2,'0')}</span>
          </div>
        </div>
      )}

      {/* Next-day warning */}
      {result.skipped.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-[10px] font-black text-amber-700">
            Next-day departure excluded — loading time after 12:00 (cutoff missed)
          </p>
        </div>
      )}

      {/* Departure cards */}
      {result.cards.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
          <p className="text-sm font-black text-slate-500">No departures found.</p>
          <p className="text-xs text-slate-400 mt-1">Contact inland team.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {result.cards.map((card, idx) => (
            <ExportCard
              key={`${fmtDateISO(card.etd)}-${card.mod}-${card.depotCode}`}
              card={card} result={result} idx={idx}
            />
          ))}
        </div>
      )}

      {/* Empty depot */}
      {result.emptyDepot && (
        <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Empty Container Release ({result.emptyLabel})</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">Preferred</span>
              <span className="font-mono text-xs font-black text-maersk-dark">{result.emptyDepot.p1}</span>
              <span className="text-xs text-slate-600 font-bold">— {result.emptyDepot.p1n}</span>
            </div>
            {result.emptyDepot.p2 && (
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">2nd Option</span>
                <span className="font-mono text-xs font-black text-maersk-dark">{result.emptyDepot.p2}</span>
                <span className="text-xs text-slate-600 font-bold">— {result.emptyDepot.p2n}</span>
              </div>
            )}
            <p className="text-[9px] text-slate-500 font-bold leading-snug pt-0.5">
              Always recommend preferred depot. If unavailable, delay transport or contact <strong>INLAND OPS</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
