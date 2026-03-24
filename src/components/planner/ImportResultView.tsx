import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ImpRunResult, impTName, impTruck, impHasSc } from '../../logic/import/impRun';
import { ImpInstance } from '../../logic/import/computeInstances';
import { impScCode } from '../../logic/import/zipLookup';
import { fmt, fmtS, fmtDateISO } from '../../logic/dateUtils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, CheckCircle2, Copy, Check, Info, Train, Anchor, Package, MapPin, Ship } from 'lucide-react';
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
        "overflow-hidden border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl group",
        inst.rec ? "border-maersk-blue/40 shadow-lg shadow-maersk-blue/10" : "border-slate-200 shadow-sm"
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
                <p className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-none">{inst.mod}</p>
                <p className="text-sm font-black text-white leading-tight truncate">{impTName(inst.loc)}</p>
              </div>
              <span className="font-mono text-[9px] text-white/40 ml-0.5 self-end pb-0.5 flex-none">{inst.loc}</span>
            </div>
            <div className="flex items-center gap-1.5 flex-none ml-2">
              {inst.rec && (
                <span className="bg-white/15 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border border-white/20">
                  ★ Best
                </span>
              )}
              <CopyButton text={buildCopyText(inst, result)} />
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Journey Timeline */}
          <div className="px-4 pt-4 pb-3">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-1">
              <span className="w-3 h-px bg-slate-200 inline-block" />Journey
            </p>
            <div className="flex items-start">
              {/* Terminal ETD */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shadow-md mb-1.5 flex-none",
                  isBarge ? "bg-maersk-blue" : "bg-purple-600"
                )}>
                  {isBarge ? <Anchor className="h-3.5 w-3.5 text-white" /> : <Train className="h-3.5 w-3.5 text-white" />}
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase leading-tight text-center">ETD</p>
                <p className="text-xs font-black text-maersk-dark text-center leading-tight">{fmtS(inst.etd)}</p>
                <p className="text-[9px] text-slate-400 text-center">{inst.etdDay}</p>
              </div>

              {/* Connector */}
              <div className="flex-1 flex items-start pt-3 mx-1">
                <div className="w-full h-px bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300" />
              </div>

              {/* Depot Arrival */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-500 flex items-center justify-center shadow-md mb-1.5 flex-none">
                  <Package className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase leading-tight text-center">Depot</p>
                <p className="text-xs font-black text-maersk-dark text-center leading-tight">{fmtS(inst.eta)}</p>
                <p className="text-[9px] text-slate-400 text-center">{inst.etaDay}</p>
              </div>

              {/* Connector */}
              <div className="flex-1 flex items-start pt-3 mx-1">
                <div className="w-full h-px bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300" />
              </div>

              {/* Customer Delivery */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-md mb-1.5 flex-none">
                  <MapPin className="h-3.5 w-3.5 text-white" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase leading-tight text-center">Delivery</p>
                <p className="text-xs font-black text-maersk-dark text-center leading-tight">{fmtS(inst.custDel)}</p>
                {isDui && <p className="text-[9px] text-amber-600 font-bold text-center">after 12:00</p>}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-slate-100" />

          {/* Order deadline row */}
          <div className="mx-4 my-3 flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Order Deadline</p>
              <p className="text-xs font-black text-maersk-dark">{fmtS(inst.orderDL)}</p>
            </div>
            <UrgencyBadge date={inst.orderDL} />
          </div>

          {/* Customs deadline */}
          {inst.custDL && (
            <div className="mx-4 mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />
              <span className="text-[9px] font-black text-amber-700">
                Customs: {fmt(inst.custDL)} {inst.custDL.getHours().toString().padStart(2,'0')}:{inst.custDL.getMinutes().toString().padStart(2,'0')}
              </span>
            </div>
          )}

          {/* Reminders + transport order */}
          <div className="mx-4 mb-4 px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Info className="h-2.5 w-2.5" />Transport Order
            </p>
            <p className="text-[9px] font-black text-maersk-dark">
              Plan {inst.mod.toLowerCase()} ETD {inst.etdDay} {inst.etd.getDate().toString().padStart(2,'0')}/{(inst.etd.getMonth()+1).toString().padStart(2,'0')}
            </p>
            <p className="text-[9px] text-slate-400 leading-snug">
              Customs doc → <span className="font-black text-maersk-dark">nlaopsinlrbc@maersk.com</span>
            </p>
            <p className="text-[9px] text-slate-400 leading-snug">ATA 2d before delivery for multistop</p>
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
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-red-700">{result.error}</p>
      </div>
    );
  }

  const filtered = result.hasB2 && selectedDepot
    ? result.all.filter(i => impScCode(i.loc) === impScCode(selectedDepot))
    : result.all;
  const show = filtered.slice(0, result.maxCards);

  const termSet = new Set<string>();
  if (result.terms?.b) termSet.add(result.terms.b);
  if (result.terms?.b2) termSet.add(result.terms.b2);
  if (result.terms?.r && !termSet.has(result.terms.r)) termSet.add(result.terms.r);

  return (
    <div className="space-y-4">
      {/* Summary strip — grid layout to avoid wrapping */}
      <div className="grid grid-cols-3 gap-px bg-slate-100 rounded-2xl overflow-hidden shadow-sm">
        {[
          { label: 'PLZ / Region', value: `${result.zip} · ${result.region}` },
          { label: 'Container', value: `${result.size}' ${result.type.toUpperCase()}` },
          { label: 'Port', value: result.portName },
          { label: 'Vessel ETD', value: fmtS(result.vesselETD) + ' ' + result.etdTime },
          { label: 'Booking Status', value: result.isFuture ? 'Future Booking' : 'Discharged' },
          { label: 'Options Found', value: `${show.length}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white px-4 py-3">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{label}</p>
            <p className="text-xs font-black text-maersk-dark leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Terminal info bar */}
      {result.terms && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white border border-slate-100 rounded-xl">
          {result.terms.b && (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-black uppercase bg-maersk-blue/10 text-maersk-blue px-2 py-0.5 rounded-md">Barge</span>
              <span className="text-xs font-black text-maersk-dark">{impTName(result.terms.b)}</span>
              <span className="font-mono text-[9px] text-slate-400">{result.terms.b}</span>
              {!impHasSc(result.terms.b) && <span className="text-[9px] text-red-500 font-bold">No schedule</span>}
            </div>
          )}
          {result.terms.b2 && (
            <>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase bg-maersk-blue/10 text-maersk-blue px-2 py-0.5 rounded-md">Barge 2</span>
                <span className="text-xs font-black text-maersk-dark">{impTName(result.terms.b2)}</span>
                {!impHasSc(result.terms.b2) && <span className="text-[9px] text-red-500 font-bold">No schedule</span>}
              </div>
            </>
          )}
          {result.terms.r && impScCode(result.terms.r) !== impScCode(result.terms.b || '') && (
            <>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">Rail</span>
                <span className="text-xs font-black text-maersk-dark">{impTName(result.terms.r)}</span>
                {!impHasSc(result.terms.r) && <span className="text-[9px] text-red-500 font-bold">No schedule</span>}
              </div>
            </>
          )}
          {result.terms.t && (
            <>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black text-slate-400 uppercase">Truck:</span>
                <span className="text-xs font-black text-maersk-dark">{impTruck(result.terms.b || '')}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Depot selector (prefix 56) */}
      {result.hasB2 && result.terms && (
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Depot:</span>
          {[result.terms.b!, result.terms.b2!].map((code, rank) => (
            <button
              key={code}
              onClick={() => setSelectedDepot(selectedDepot === code ? null : code)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border transition-all",
                selectedDepot === code
                  ? "bg-maersk-blue text-white border-maersk-blue shadow"
                  : "bg-white text-maersk-dark border-slate-200 hover:border-maersk-blue/50"
              )}
            >
              <span className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black", rank === 0 ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>{rank + 1}</span>
              <span>{code}</span>
            </button>
          ))}
        </div>
      )}

      {/* Result cards */}
      {show.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
          <p className="text-sm font-black text-slate-500">No plannable departures found.</p>
          <p className="text-xs text-slate-400 mt-1">Contact inland operations.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {show.map((inst, idx) => (
            <ImportCard key={`${fmtDateISO(inst.etd)}-${inst.mod}-${inst.loc}`} inst={inst} result={result} idx={idx} />
          ))}
        </div>
      )}

      {/* Empty return depot */}
      {result.emptyDepot && (
        <div className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-3.5 w-3.5 text-maersk-blue" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Empty Return Depot ({result.emptyLabel})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">Preferred</span>
            <span className="font-mono text-xs font-black text-maersk-dark">{result.emptyDepot.p1}</span>
            <span className="text-xs text-slate-600 font-bold">— {result.emptyDepot.p1n}</span>
          </div>
        </div>
      )}
    </div>
  );
}
