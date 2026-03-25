import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { ImpRunResult, impTName, impTruck, impHasSc } from '../../logic/import/impRun';
import { ImpInstance } from '../../logic/import/computeInstances';
import { impScCode } from '../../logic/import/zipLookup';
import { fmt, fmtS, fmtDateISO } from '../../logic/dateUtils';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, CheckCircle2, Copy, Check, Info, Train, Anchor, Package, ArrowRight, Mail } from 'lucide-react';
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
      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/20"
    >
      {copied ? <><Check className="h-2.5 w-2.5" />Done</> : failed ? <><Copy className="h-2.5 w-2.5" />Failed</> : <><Copy className="h-2.5 w-2.5" />Copy</>}
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08, duration: 0.4 }}
    >
      <Card className={cn(
        "overflow-hidden border rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
        inst.rec
          ? "border-amber-300 shadow-lg shadow-amber-400/15 ring-1 ring-amber-200/50"
          : "border-slate-200 shadow-sm"
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
              <p className="text-sm font-black text-white leading-snug">{impTName(inst.loc)}</p>
              <p className="font-mono text-[10px] text-white/30 mt-0.5">{inst.loc}</p>
            </div>
            <div className="mt-4">
              <CopyButton text={buildCopyText(inst, result)} />
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
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Delivery</p>
                  <p className="text-base font-black text-maersk-dark leading-tight">{fmtS(inst.custDel)}</p>
                  {isDui && <p className="text-[10px] text-amber-500 font-black mt-0.5">after 12:00</p>}
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 mx-5" />

            {/* Deadlines & transport */}
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
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0">Customs DL</p>
                    <p className="text-sm font-black text-amber-800">
                      {fmtS(inst.custDL)} {inst.custDL.getHours().toString().padStart(2,'0')}:{inst.custDL.getMinutes().toString().padStart(2,'0')}
                    </p>
                  </div>
                  <UrgencyBadge date={inst.custDL} />
                </div>
              )}

              <div className="ml-auto text-right hidden sm:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Transport Remarks</p>
                <p className="text-sm font-black text-maersk-dark">
                  {inst.mod.toLowerCase()} ETD {inst.etdDay} {inst.etd.getDate().toString().padStart(2,'0')}/{(inst.etd.getMonth()+1).toString().padStart(2,'0')}
                </p>
              </div>
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

  return (
    <div className="space-y-4">
      {/* Summary strip — horizontal flex */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm max-w-5xl mx-auto">
        {[
          { label: 'PLZ / Region', value: `${result.zip} · ${result.region}` },
          { label: 'Container', value: `${result.size}' ${result.type.toUpperCase()}` },
          { label: 'Port', value: result.portName },
          { label: 'Vessel ETD', value: fmtS(result.vesselETD) + ' ' + result.etdTime },
          { label: 'Status', value: result.isFuture ? 'Future Booking' : 'Discharged' },
          { label: 'Options', value: `${show.length} found` },
        ].map(({ label, value }, i, arr) => (
          <div key={label} className="flex items-center gap-5">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
              <p className="text-base font-black text-maersk-dark">{value}</p>
            </div>
            {i < arr.length - 1 && <div className="h-9 w-px bg-slate-100" />}
          </div>
        ))}
      </div>

      {/* Terminal info bar */}
      {result.terms && (
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 bg-white border border-slate-200 rounded-xl max-w-5xl mx-auto">
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
        <div className="flex items-center gap-2 max-w-5xl mx-auto">
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

      {/* Empty return depot — shown ABOVE schedules (same as Export) */}
      {result.emptyDepot && (
        <div className="px-5 py-4 bg-white border border-slate-200 rounded-xl shadow-sm max-w-5xl mx-auto">
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

      {/* Result cards — vertical stack, full width */}
      {show.length === 0 ? (
        <div className="p-10 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="inline-flex p-4 bg-slate-100 rounded-2xl mb-4">
            <AlertTriangle className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-sm font-black text-slate-600 uppercase tracking-widest mb-1">No Plannable Departures</p>
          <p className="text-xs text-slate-400 font-bold">All options are outside the booking window or customs deadline has passed.</p>
          <p className="text-xs text-slate-400 font-bold mt-0.5">Contact Inland Operations for alternatives.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-5xl mx-auto">
          {show.map((inst, idx) => (
            <ImportCard key={`${fmtDateISO(inst.etd)}-${inst.mod}-${inst.loc}`} inst={inst} result={result} idx={idx} />
          ))}
        </div>
      )}
    </div>
  );
}
