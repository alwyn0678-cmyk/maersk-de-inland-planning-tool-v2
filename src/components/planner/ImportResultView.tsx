import { useState, useCallback, memo } from 'react';
import { motion } from 'motion/react';
import { ImpRunResult, impTName, impTruck, impHasSc } from '../../logic/import/impRun';
import { ImpInstance } from '../../logic/import/computeInstances';
import { impScCode } from '../../logic/import/zipLookup';
import { fmt, fmtS, fmtDateISO } from '../../logic/dateUtils';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle2, Copy, Check, Train, Anchor, Package, Mail } from 'lucide-react';
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

const ImportCard = memo(function ImportCard({ inst, result, idx }: { inst: ImpInstance; result: ImpRunResult; idx: number }) {
  const isBarge = inst.mod === 'Barge';
  const isDui = impScCode(inst.loc) === 'DEDUI01';

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
        {/* Recommended top accent */}
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

              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Terminal</p>
              <p className="text-sm font-black text-white leading-snug">{impTName(inst.loc)}</p>
              <p className="font-mono text-[9px] text-white/25 mt-0.5">{inst.loc}</p>

              {inst.rec && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 mt-3 rounded-xl bg-amber-400/12 border border-amber-400/30">
                  <CheckCircle2 className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">Best Option</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <CopyButton text={buildCopyText(inst, result)} />
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
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Customer Delivery</p>
                  </div>
                  <p className="text-base font-black text-white font-mono leading-tight">{fmtS(inst.custDel)}</p>
                  {isDui && <p className="text-[10px] text-amber-400 font-black mt-0.5">after 12:00</p>}
                </div>
              </div>
            </div>

            <div className="h-px bg-white/8 mx-5" />

            {/* Deadlines row */}
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
                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-0">Customs DL</p>
                    <p className="text-sm font-black text-amber-200">
                      {fmtS(inst.custDL)} {inst.custDL.getHours().toString().padStart(2,'0')}:{inst.custDL.getMinutes().toString().padStart(2,'0')}
                    </p>
                  </div>
                  <UrgencyBadge date={inst.custDL} />
                </div>
              )}

              <div className="ml-auto text-right hidden sm:block">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Transport Remarks</p>
                <p className="text-xs font-black text-white/50 font-mono">
                  {inst.mod.toLowerCase()} ETD {inst.etdDay} {inst.etd.getDate().toString().padStart(2,'0')}/{(inst.etd.getMonth()+1).toString().padStart(2,'0')}
                </p>
              </div>
            </div>

            {/* Customs email banner */}
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
});

export function ImportResultView({ result }: { result: ImpRunResult }) {
  const [selectedDepot, setSelectedDepot] = useState<string | null>(null);

  if (result.error) {
    return (
      <div className="p-6 bg-rose-950/40 border border-rose-500/25 rounded-2xl flex items-start gap-3 shadow-xl">
        <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-rose-300">{result.error}</p>
      </div>
    );
  }

  const filtered = result.hasB2 && selectedDepot
    ? result.all.filter(i => impScCode(i.loc) === impScCode(selectedDepot))
    : result.all;
  const show = filtered.slice(0, result.maxCards);

  return (
    <div className="space-y-4">
      {/* Summary strip — dark glass */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-5 bg-gradient-to-r from-[#001829] via-[#002040] to-[#001829] border border-white/10 rounded-2xl shadow-xl max-w-5xl mx-auto">
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
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{label}</p>
              <p className="text-base font-black text-white">{value}</p>
            </div>
            {i < arr.length - 1 && <div className="h-9 w-px bg-white/10" />}
          </div>
        ))}
      </div>

      {/* Terminal info bar — dark */}
      {result.terms && (
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-3.5 bg-[#001829] border border-white/10 rounded-xl max-w-5xl mx-auto">
          {result.terms.b && (
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-black uppercase bg-[#42b0d5]/15 text-[#42b0d5] border border-[#42b0d5]/20 px-2 py-0.5 rounded-md">Barge</span>
              <span className="text-xs font-black text-white">{impTName(result.terms.b)}</span>
              <span className="font-mono text-[9px] text-white/30">{result.terms.b}</span>
              {!impHasSc(result.terms.b) && <span className="text-[9px] text-rose-400 font-bold">No schedule</span>}
            </div>
          )}
          {result.terms.b2 && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase bg-[#42b0d5]/15 text-[#42b0d5] border border-[#42b0d5]/20 px-2 py-0.5 rounded-md">Barge 2</span>
                <span className="text-xs font-black text-white">{impTName(result.terms.b2)}</span>
                {!impHasSc(result.terms.b2) && <span className="text-[9px] text-rose-400 font-bold">No schedule</span>}
              </div>
            </>
          )}
          {result.terms.r && impScCode(result.terms.r) !== impScCode(result.terms.b || '') && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase bg-purple-400/15 text-purple-300 border border-purple-400/20 px-2 py-0.5 rounded-md">Rail</span>
                <span className="text-xs font-black text-white">{impTName(result.terms.r)}</span>
                {!impHasSc(result.terms.r) && <span className="text-[9px] text-rose-400 font-bold">No schedule</span>}
              </div>
            </>
          )}
          {result.terms.t && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black text-white/30 uppercase">Truck:</span>
                <span className="text-xs font-black text-white">{impTruck(result.terms.b || '')}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Depot selector (prefix 56) */}
      {result.hasB2 && result.terms && (
        <div className="flex items-center gap-2 max-w-5xl mx-auto">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Select Depot:</span>
          {[result.terms.b!, result.terms.b2!].map((code, rank) => (
            <button
              key={code}
              onClick={() => setSelectedDepot(selectedDepot === code ? null : code)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border transition-all",
                selectedDepot === code
                  ? "bg-maersk-blue text-white border-maersk-blue shadow"
                  : "bg-white/8 text-white border-white/15 hover:border-[#42b0d5]/50 hover:bg-white/12"
              )}
            >
              <span className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black", rank === 0 ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>{rank + 1}</span>
              <span>{code}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty return depot */}
      {result.emptyDepot && (
        <div className="px-5 py-4 bg-[#001829] border border-white/10 rounded-xl shadow-xl max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2.5">
            <Package className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Empty Return Depot ({result.emptyLabel})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">Preferred</span>
            <span className="font-mono text-xs font-black text-white">{result.emptyDepot.p1}</span>
            <span className="text-xs text-white/50 font-bold">— {result.emptyDepot.p1n}</span>
          </div>
        </div>
      )}

      {/* Result cards */}
      {show.length === 0 ? (
        <div className="p-10 text-center bg-[#001829] border border-white/10 rounded-2xl shadow-xl max-w-5xl mx-auto">
          <div className="inline-flex p-4 bg-white/5 rounded-2xl mb-4">
            <AlertTriangle className="h-7 w-7 text-white/20" />
          </div>
          <p className="text-sm font-black text-white/50 uppercase tracking-widest mb-1">No Plannable Departures</p>
          <p className="text-xs text-white/30 font-bold">All options are outside the booking window or customs deadline has passed.</p>
          <p className="text-xs text-white/30 font-bold mt-0.5">Contact Inland Operations for alternatives.</p>
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
