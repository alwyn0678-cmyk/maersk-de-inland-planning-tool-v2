import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImpRunResult, impTName, impTruck, impHasSc } from '../../logic/import/impRun';
import { ImpInstance } from '../../logic/import/computeInstances';
import { impScCode } from '../../logic/import/zipLookup';
import { fmt, fmtS, fmtDateISO } from '../../logic/dateUtils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, CheckCircle2, Copy, Check, Info, Train, Anchor, Package } from 'lucide-react';
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
    <Button variant="outline" size="sm" onClick={copy} className="h-8 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 hover:border-maersk-blue hover:text-maersk-blue transition-all">
      {copied ? <><Check className="h-3 w-3 mr-1" />Copied</> : <><Copy className="h-3 w-3 mr-1" />Copy</>}
    </Button>
  );
}

function buildCopyText(inst: ImpInstance, result: ImpRunResult): string {
  const modName = inst.mod.toLowerCase();
  const lines = [
    'IMPORT INLAND PLAN',
    `Status: PLANNABLE${inst.rec ? ' - RECOMMENDED' : ''}`,
    `Port: ${result.portName}`,
    `Terminal: ${impTName(inst.loc)} (${inst.loc})`,
    `Mode: ${inst.mod} (${inst.etdDay} schedule)`,
    `Terminal ETD: ${fmt(inst.etd)}`,
    `Depot Arrival: ${fmt(inst.eta)}`,
    `Customer Delivery: ${fmt(inst.custDel)}${inst.loc === 'DEDUI01' ? ' (after 12:00)' : ''}`,
    `Order Deadline: ${fmt(inst.orderDL)}`,
    inst.custDL ? `Customs Deadline: ${fmt(inst.custDL)} ${inst.custDL.getHours().toString().padStart(2,'0')}:${inst.custDL.getMinutes().toString().padStart(2,'0')}` : '',
    '',
    'EMPTY RETURN DEPOT',
    result.emptyDepot ? `Preferred: ${result.emptyDepot.p1} — ${result.emptyDepot.p1n}` : '',
    '',
    `Transport Order Remarks: Please plan on ${modName} departure with ETD ${inst.etdDay} ${inst.etd.getDate().toString().padStart(2,'0')}/${(inst.etd.getMonth()+1).toString().padStart(2,'0')}`,
    '',
    '⚠ REMINDERS',
    '- Always send copy of Customs document to nlaopsinlrbc@maersk.com (DO NOT send this to us)',
    '- When multistop is needed, send ATA at least 2 days before customer Delivery date',
  ].filter(l => l !== null && l !== undefined);
  return lines.join('\n');
}

function ImportCard({ inst, result, idx }: { inst: ImpInstance; result: ImpRunResult; idx: number }) {
  const isBarge = inst.mod === 'Barge';
  const isDui = impScCode(inst.loc) === 'DEDUI01';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.4 }}
    >
      <Card className={cn(
        "overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-3xl",
        inst.rec ? "border-maersk-blue/30 ring-1 ring-maersk-blue/20" : "border-slate-200"
      )}>
        {/* Mode banner */}
        <div className={cn(
          "h-1.5 w-full",
          isBarge ? "bg-gradient-to-r from-maersk-blue to-blue-400" : "bg-gradient-to-r from-purple-700 to-purple-500"
        )} />

        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {isBarge
                ? <Anchor className="h-4 w-4 text-maersk-blue" />
                : <Train className="h-4 w-4 text-purple-600" />}
              <span className={cn("text-xs font-black uppercase tracking-widest", isBarge ? "text-maersk-blue" : "text-purple-600")}>
                {inst.mod}
              </span>
              <span className="mx-1 text-slate-300">·</span>
              <span className="text-xs font-black text-maersk-dark">{impTName(inst.loc)}</span>
              <span className="font-mono text-[10px] text-slate-400 ml-1">{inst.loc}</span>
            </div>
            <div className="flex items-center gap-2">
              {inst.rec && <Badge className="bg-maersk-blue text-white text-[9px] font-black uppercase tracking-widest">Recommended</Badge>}
              <CopyButton text={buildCopyText(inst, result)} />
            </div>
          </div>

          {/* Dates grid */}
          <div className="grid grid-cols-2 gap-px bg-slate-100 mx-5 mt-4 rounded-2xl overflow-hidden">
            {[
              { label: 'Terminal ETD', value: fmtS(inst.etd), sub: inst.etdDay },
              { label: 'Depot Arrival', value: fmtS(inst.eta), sub: inst.etaDay },
              { label: 'Customer Delivery', value: fmtS(inst.custDel), sub: isDui ? 'after 12:00' : undefined },
              { label: 'Order Deadline', value: fmtS(inst.orderDL), urgency: inst.orderDL },
            ].map(({ label, value, sub, urgency }) => (
              <div key={label} className="bg-white p-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className="text-sm font-black text-maersk-dark">{value}</p>
                {sub && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{sub}</p>}
                {urgency && <div className="mt-1"><UrgencyBadge date={urgency} /></div>}
              </div>
            ))}
          </div>

          {/* Customs deadline (RTM only) */}
          {inst.custDL && (
            <div className="mx-5 mt-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-[10px] font-black text-amber-700">
                Customs deadline: {fmt(inst.custDL)} {inst.custDL.getHours().toString().padStart(2,'0')}:{inst.custDL.getMinutes().toString().padStart(2,'0')}
              </span>
            </div>
          )}

          {/* Reminders */}
          <div className="mx-5 mt-3 mb-4 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Info className="h-3 w-3" />Reminders</p>
            <p className="text-[10px] text-slate-500 font-bold leading-snug">
              Always send copy of Customs document to <span className="font-black text-maersk-dark">nlaopsinlrbc@maersk.com</span> (DO NOT send this to us)
            </p>
            <p className="text-[10px] text-slate-500 font-bold leading-snug">
              When multistop is needed, send ATA at least 2 days before customer Delivery date
            </p>
            <p className="text-[10px] font-black text-maersk-dark mt-1">
              Transport Order: Please plan on {inst.mod.toLowerCase()} departure with ETD {inst.etdDay} {inst.etd.getDate().toString().padStart(2,'0')}/{(inst.etd.getMonth()+1).toString().padStart(2,'0')}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ImportResultView({ result }: { result: ImpRunResult }) {
  const [selectedDepot, setSelectedDepot] = useState<string | null>(null);

  if (result.error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-red-700">{result.error}</p>
      </div>
    );
  }

  const filtered = result.hasB2 && selectedDepot
    ? result.all.filter(i => impScCode(i.loc) === impScCode(selectedDepot))
    : result.all;
  const show = filtered.slice(0, result.maxCards);

  // Get unique terminals for info bar
  const termSet = new Set<string>();
  if (result.terms?.b) termSet.add(result.terms.b);
  if (result.terms?.b2) termSet.add(result.terms.b2);
  if (result.terms?.r && !termSet.has(result.terms.r)) termSet.add(result.terms.r);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        {[
          { label: 'PLZ', value: `${result.zip} · ${result.region}` },
          { label: 'Container', value: `${result.size}' ${result.type.toUpperCase()}` },
          { label: 'Port', value: result.portName },
          { label: 'Vessel ETD', value: fmtS(result.vesselETD) + ' ' + result.etdTime },
          { label: 'Status', value: result.isFuture ? 'Future Booking' : 'Already Discharged' },
          { label: 'Options', value: `${show.length} found` },
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

      {/* Terminal info */}
      {result.terms && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-2xl">
          {result.terms.b && (
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700 border-none text-[9px] font-black uppercase">Barge</Badge>
              <span className="text-xs font-black text-maersk-dark">{impTName(result.terms.b)}</span>
              <span className="font-mono text-[10px] text-slate-400">{result.terms.b}</span>
              {!impHasSc(result.terms.b) && <span className="text-[10px] text-red-500 font-bold">No schedule yet</span>}
            </div>
          )}
          {result.terms.b2 && (
            <>
              <div className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-none text-[9px] font-black uppercase">Barge 2</Badge>
                <span className="text-xs font-black text-maersk-dark">{impTName(result.terms.b2)}</span>
                {!impHasSc(result.terms.b2) && <span className="text-[10px] text-red-500 font-bold">No schedule yet</span>}
              </div>
            </>
          )}
          {result.terms.r && impScCode(result.terms.r) !== impScCode(result.terms.b || '') && (
            <>
              <div className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-700 border-none text-[9px] font-black uppercase">Rail</Badge>
                <span className="text-xs font-black text-maersk-dark">{impTName(result.terms.r)}</span>
                {!impHasSc(result.terms.r) && <span className="text-[10px] text-red-500 font-bold">No schedule yet</span>}
              </div>
            </>
          )}
          {result.terms.t && (
            <>
              <div className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Truck:</span>
                <span className="text-xs font-black text-maersk-dark">{impTruck(result.terms.b || '')}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Depot selector (for prefix 56 ZIP with two barges) */}
      {result.hasB2 && result.terms && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Depot:</span>
          {[result.terms.b!, result.terms.b2!].map((code, rank) => (
            <button
              key={code}
              onClick={() => setSelectedDepot(selectedDepot === code ? null : code)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all",
                selectedDepot === code
                  ? "bg-maersk-blue text-white border-maersk-blue shadow-lg"
                  : "bg-white text-maersk-dark border-slate-200 hover:border-maersk-blue/50"
              )}
            >
              <span className={cn("h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black", rank === 0 ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>{rank + 1}</span>
              <span>{code}</span>
              <span className="text-[10px] opacity-70">{impTName(code)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Result cards */}
      {show.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl">
          <p className="text-sm font-black text-slate-500">No plannable departures found.</p>
          <p className="text-xs text-slate-400 mt-1">Contact inland operations.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {show.map((inst, idx) => (
            <ImportCard key={`${fmtDateISO(inst.etd)}-${inst.mod}-${inst.loc}`} inst={inst} result={result} idx={idx} />
          ))}
        </div>
      )}

      {/* Empty return depot */}
      {result.emptyDepot && (
        <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-maersk-blue" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Empty Return Depot ({result.emptyLabel})</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black">PREFERRED</Badge>
            <span className="font-mono text-xs font-black text-maersk-dark">{result.emptyDepot.p1}</span>
            <span className="text-xs text-slate-600 font-bold">— {result.emptyDepot.p1n}</span>
          </div>
        </div>
      )}
    </div>
  );
}
