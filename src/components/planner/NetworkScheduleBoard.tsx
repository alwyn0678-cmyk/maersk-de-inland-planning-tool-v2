import { useMemo, useState } from 'react';
import { IMP_SCHEDULES } from '../../data/import/schedules';
import { EXP_SCHED } from '../../data/export/schedules';
import { EXP_DEPOTS } from '../../data/export/depotNames';
import { IMP_TERM_NAMES } from '../../data/import/terminalNames';
import { motion } from 'motion/react';
import { Anchor, Train, ArrowRight, Clock, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

const JS_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Next occurrence of a JS day-of-week (0=Sun..6=Sat), never today */
function nextJSDay(jsDow: number, fromDate: Date): Date {
  const result = new Date(fromDate);
  result.setHours(0, 0, 0, 0);
  let daysAhead = (jsDow - result.getDay() + 7) % 7;
  if (daysAhead === 0) daysAhead = 7;
  result.setDate(result.getDate() + daysAhead);
  return result;
}

/** Next occurrence of a named day ("Mon"…"Sun"), never today */
function nextNamedDay(dayName: string, fromDate: Date): Date {
  return nextJSDay(JS_DAY_NAMES.indexOf(dayName), fromDate);
}

/** ISO day (1=Mon…7=Sun) → JS day (0=Sun…6=Sat) */
function isoToJs(iso: number): number {
  return iso === 7 ? 0 : iso;
}

function daysFromNow(d: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
}

interface DepartureRow {
  mod: 'Barge' | 'Rail';
  origin: string;
  destination: string;
  etdDate: Date;
  etaDate: Date;
  daysAhead: number;
  transitDays: number;
}

function buildImportDepartures(today: Date): DepartureRow[] {
  return IMP_SCHEDULES.map(sched => {
    const etdDate = nextNamedDay(sched.etd, today);
    const etaDow = JS_DAY_NAMES.indexOf(sched.eta);
    let transitDays = (etaDow - etdDate.getDay() + 7) % 7;
    if (transitDays === 0) transitDays = 7;
    const etaDate = new Date(etdDate);
    etaDate.setDate(etdDate.getDate() + transitDays);
    return {
      mod: sched.mod,
      origin: sched.t === 'Antwerpen' ? 'Antwerp' : 'Rotterdam',
      destination: IMP_TERM_NAMES[sched.loc] || sched.loc,
      etdDate,
      etaDate,
      daysAhead: daysFromNow(etdDate),
      transitDays,
    };
  }).sort((a, b) => a.etdDate.getTime() - b.etdDate.getTime());
}

function buildExportDepartures(today: Date): DepartureRow[] {
  const rows: DepartureRow[] = [];
  for (const [depotCode, ports] of Object.entries(EXP_SCHED)) {
    const depotName = EXP_DEPOTS[depotCode] || depotCode;
    for (const [portKey, entries] of Object.entries(ports)) {
      if (!entries) continue;
      for (const entry of entries) {
        const jsDow = isoToJs(entry.dep);
        const etdDate = nextJSDay(jsDow, today);
        const etaDate = new Date(etdDate);
        etaDate.setDate(etdDate.getDate() + entry.transit);
        rows.push({
          mod: entry.mod,
          origin: depotName,
          destination: portKey === 'RTM' ? 'Rotterdam' : 'Antwerp',
          etdDate,
          etaDate,
          daysAhead: daysFromNow(etdDate),
          transitDays: entry.transit,
        });
      }
    }
  }
  return rows.sort((a, b) => a.etdDate.getTime() - b.etdDate.getTime());
}

interface Props {
  direction: 'Import' | 'Export';
}

export function NetworkScheduleBoard({ direction }: Props) {
  const [modFilter, setModFilter] = useState<'All' | 'Barge' | 'Rail'>('All');
  const today = useMemo(() => new Date(), []);

  const allDepartures = useMemo(() => {
    return direction === 'Import'
      ? buildImportDepartures(today)
      : buildExportDepartures(today);
  }, [direction, today]);

  const filtered = useMemo(() => {
    return allDepartures
      .filter(d => modFilter === 'All' || d.mod === modFilter)
      .slice(0, 14);
  }, [allDepartures, modFilter]);

  const urgencyColor = (days: number) => {
    if (days <= 1) return 'text-rose-400';
    if (days <= 3) return 'text-amber-400';
    return 'text-white/80';
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-md">
      {/* Header */}
      <div className="bg-[#0a1628] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-maersk-blue/20 rounded-xl">
            <Clock className="h-4 w-4 text-maersk-blue" />
          </div>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-widest">
              {direction} Network · Upcoming Departures
            </p>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">
              Live schedule · next 14 services
            </p>
          </div>
        </div>

        {/* Modality filter */}
        <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1">
          {(['All', 'Barge', 'Rail'] as const).map(f => (
            <button
              key={f}
              onClick={() => setModFilter(f)}
              className={cn(
                'px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200',
                modFilter === f
                  ? f === 'Barge' ? 'bg-maersk-blue text-white' : f === 'Rail' ? 'bg-purple-600 text-white' : 'bg-white/20 text-white'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              {f === 'Barge' && <Anchor className="inline h-2.5 w-2.5 mr-1" />}
              {f === 'Rail' && <Train className="inline h-2.5 w-2.5 mr-1" />}
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[80px_90px_1fr_60px_90px] gap-0 bg-[#0d1e35] px-5 py-2 border-b border-white/5">
        {['Mode', 'ETD', 'Route', 'T+', 'ETA'].map(h => (
          <span key={h} className="text-[9px] font-black text-white/30 uppercase tracking-widest">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="bg-[#0d1e35] divide-y divide-white/5">
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm font-black text-white/30 uppercase tracking-widest">No services found</p>
          </div>
        ) : (
          filtered.map((dep, i) => (
            <motion.div
              key={`${dep.origin}-${dep.destination}-${dep.mod}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.025, duration: 0.3 }}
              className="grid grid-cols-[80px_90px_1fr_60px_90px] gap-0 px-5 py-3 hover:bg-white/5 transition-colors duration-150 group"
            >
              {/* Mode badge */}
              <div className="flex items-center">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider',
                  dep.mod === 'Barge'
                    ? 'bg-maersk-blue/20 text-maersk-blue border border-maersk-blue/30'
                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                )}>
                  {dep.mod === 'Barge'
                    ? <Anchor className="h-2.5 w-2.5" />
                    : <Train className="h-2.5 w-2.5" />}
                  {dep.mod === 'Barge' ? 'BRG' : 'RAIL'}
                </span>
              </div>

              {/* ETD */}
              <div>
                <p className={cn('text-xs font-black', urgencyColor(dep.daysAhead))}>
                  {fmtShort(dep.etdDate)}
                </p>
                <p className="text-[9px] text-white/30 font-bold">
                  {dep.daysAhead === 1 ? 'Tomorrow' : dep.daysAhead === 0 ? 'Today' : `in ${dep.daysAhead}d`}
                </p>
              </div>

              {/* Route */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] font-bold text-white/60 truncate flex-none max-w-[100px]">{dep.origin}</span>
                <ArrowRight className="h-3 w-3 text-white/20 flex-none" />
                <span className="text-[11px] font-black text-white truncate">{dep.destination}</span>
              </div>

              {/* Transit */}
              <div>
                <p className="text-xs font-black text-emerald-400">{dep.transitDays}d</p>
              </div>

              {/* ETA */}
              <div>
                <p className="text-xs font-black text-white/60">{fmtShort(dep.etaDate)}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#0a1628] px-5 py-2.5 flex items-center justify-between border-t border-white/5">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
          {filtered.length} of {allDepartures.length} services shown
        </p>
        <div className="flex items-center gap-3 text-[9px] font-black text-white/20 uppercase tracking-widest">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-maersk-blue inline-block" /> Barge</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Rail</span>
        </div>
      </div>
    </div>
  );
}
