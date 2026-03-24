import { useState } from 'react';
import { motion } from 'motion/react';
import { ExpRunResult, ExpCard } from '../../logic/export/expRun';
import { fmt, fmtS, fmtDateISO } from '../../logic/dateUtils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, Copy, Check, Info, Train, Anchor, Package, ShieldAlert, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

function dFromNow(d: Date): number {
  const n = new Date(); n.setHours(0, 0, 0, 0);
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - n.getTime()) / 86400000);
}

function UrgencyBadge({ date }: { date: Date }) {
  const dl = dFromNow(date);
  if (dl < 0)  return <Badge className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest">PASSED</Badge>;
  if (dl === 0) return <Badge className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest">TODAY</Badge>;
  if (dl <= 2)  return <Badge className="bg-red-500 text-white text-[9px] font-black">{dl}d left</Badge>;
  if (dl <= 5)  return <Badge className="bg-amber-500 text-white text-[9px] font-black">{dl}d left</Badge>;
  return <Badge className="bg-emerald-600 text-white text-[9px] font-black">{dl}d</Badge>;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" onClick={copy} className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all">
      {copied ? <><Check className="h-3 w-3 mr-1" />Copied</> : <><Copy className="h-3 w-3 mr-1" />Copy</>}
    </Button>
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
        "overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-3xl",
        card.isRecommended ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
      )}>
        <div className={cn("h-1.5 w-full", isBarge ? "bg-gradient-to-r from-maersk-blue to-blue-400" : "bg-gradient-to-r from-purple-700 to-purple-500")} />
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {isBarge ? <Anchor className="h-4 w-4 text-maersk-blue" /> : <Train className="h-4 w-4 text-purple-600" />}
              <span className={cn("text-xs font-black uppercase tracking-widest", isBarge ? "text-maersk-blue" : "text-purple-600")}>{card.mod}</span>
              <span className="mx-1 text-slate-300">·</span>
              <span className="text-xs font-black text-maersk-dark">{card.depotName}</span>
            </div>
            <div className="flex items-center gap-2">
              {card.isRecommended && <Badge className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest">Recommended</Badge>}
              {card.nextDayCutoff && <Badge className="bg-amber-500 text-white text-[9px] font-black">Next-day cutoff</Badge>}
              <CopyButton text={buildExportCopyText(card, result)} />
            </div>
          </div>

          {/* Transport section */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Inland Transport</p>
            <div className="grid grid-cols-2 gap-px bg-slate-100 rounded-xl overflow-hidden">
              {[
                { label: 'Departure (ETD)', value: fmtS(card.etd) },
                { label: 'Arrival at Terminal', value: fmtS(card.eat) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white p-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="text-sm font-black text-maersk-dark">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Vessel planning window */}
          <div className="px-5 pt-3 pb-3 border-b border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Vessel Planning Window</p>
            <div className="grid grid-cols-2 gap-px bg-slate-100 rounded-xl overflow-hidden">
              {[
                { label: 'Earliest CCO', value: fmtS(card.earliestCCO) },
                { label: 'Latest ETA', value: fmtS(card.latestETA) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white p-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                  <p className="text-sm font-black text-maersk-dark">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order deadline */}
          <div className="px-5 pt-3 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Deadline</p>
                <p className="text-sm font-black text-maersk-dark">{fmtS(card.orderDL)}</p>
              </div>
              <UrgencyBadge date={card.orderDL} />
            </div>

            {/* Holidays in transit */}
            {card.holidaysInTransit.length > 0 && (
              <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="text-[10px] font-black text-amber-700">
                  Public holiday in transit: {card.holidaysInTransit.map(d => fmtS(d)).join(', ')} — verify with depot
                </span>
              </div>
            )}

            <p className="mt-3 text-[10px] font-black text-maersk-dark">
              Transport Order: Please plan on {card.mod.toLowerCase()} departure with ETD {card.etd.toLocaleDateString('en-GB',{weekday:'short'})} {card.etd.getDate().toString().padStart(2,'0')}/{(card.etd.getMonth()+1).toString().padStart(2,'0')}
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
      <div className="p-8 bg-amber-50 border-2 border-amber-300 rounded-3xl text-center space-y-3">
        <ShieldAlert className="h-12 w-12 text-amber-600 mx-auto" />
        <p className="text-xl font-black text-amber-800 uppercase tracking-tight">ISR Required</p>
        <p className="text-sm font-bold text-amber-700">
          IMO and Reefer containers via Duisburg (DEDUI01) are on request only.<br />
          CX must raise an ISR before any booking can be made.
        </p>
      </div>
    );
  }

  if (result.notServicedAntwerp) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-3xl flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-blue-700">
          This ZIP code area is not serviced via Antwerp by barge. Please select a Rotterdam terminal.
        </p>
      </div>
    );
  }

  if (result.noSchedule) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-amber-700">
          Schedule not yet available for <strong>{result.noScheduleDepotName}</strong>. Please raise an ISR.
        </p>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-red-700">{result.error}</p>
      </div>
    );
  }

  if (result.orderDLPassed) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-black text-red-700">Order deadline has passed</p>
          {result.orderDL && <p className="text-xs text-red-600 mt-1">Deadline was: {fmt(result.orderDL)}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context bar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        {[
          { label: 'PLZ', value: `${result.zip} · ${result.region}` },
          { label: 'Container', value: `${result.size}' ${result.type.toUpperCase()}` },
          { label: 'Loading', value: `${fmtS(result.loadingDate)} ${result.loadTime}` },
          { label: 'Terminal', value: result.termCode },
          { label: 'YOT', value: `${result.yot}d` },
          { label: 'Depot', value: result.depotName },
        ].map(({ label, value }, i, arr) => (
          <div key={label} className="flex items-center gap-3">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              <p className="text-xs font-black text-maersk-dark">{value}</p>
            </div>
            {i < arr.length - 1 && <div className="h-8 w-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* RTM customs deadline banner */}
      {result.customsDeadline && (
        <div className="px-5 py-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Rotterdam Customs Deadline: </span>
            <span className="text-sm font-black text-amber-800">{fmt(result.customsDeadline)} {result.customsDeadline.getHours().toString().padStart(2,'0')}:{result.customsDeadline.getMinutes().toString().padStart(2,'0')}</span>
          </div>
        </div>
      )}

      {/* Skipped next-day warning */}
      {result.skipped.length > 0 && (
        <div className="px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-[10px] font-black text-amber-700">
            Next-day departure excluded — loading time after 12:00 (cutoff missed)
          </p>
        </div>
      )}

      {/* Departure cards */}
      {result.cards.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl">
          <p className="text-sm font-black text-slate-500">No departures found.</p>
          <p className="text-xs text-slate-400 mt-1">Contact inland team.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
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
        <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Empty Container Release ({result.emptyLabel})</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black">PREFERRED</Badge>
              <span className="font-mono text-xs font-black text-maersk-dark">{result.emptyDepot.p1}</span>
              <span className="text-xs text-slate-600 font-bold">— {result.emptyDepot.p1n}</span>
            </div>
            {result.emptyDepot.p2 && (
              <div className="flex items-center gap-3">
                <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-black">2ND OPTION</Badge>
                <span className="font-mono text-xs font-black text-maersk-dark">{result.emptyDepot.p2}</span>
                <span className="text-xs text-slate-600 font-bold">— {result.emptyDepot.p2n}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-500 font-bold pt-1 leading-snug">
              We always highly recommend the preferred depot to optimize our transports. If not available, please delay transport or reach out to <strong>INLAND OPS</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
