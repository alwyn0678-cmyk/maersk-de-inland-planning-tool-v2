import { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { ContainerType } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Calendar as CalendarIcon, TrendingUp, Box, Navigation, History, Clock, ArrowRightLeft } from 'lucide-react';
import { impFindScheds } from '../../logic/import/scheduleFinder';
import { impComputeInst, ImpInstance } from '../../logic/import/computeInstances';
import { expGetNextDeps } from '../../logic/export/getNextDepartures';
import { ExpCard } from '../../logic/export/expRun';
import { EXP_DEPOTS, EXP_TERM_NAMES } from '../../data/export/depotNames';
import { IMP_TERM_NAMES } from '../../data/import/terminalNames';
import { parseDate, addDays, fmtDateISO } from '../../logic/dateUtils';
import { prevBizDay, holidaysInRange } from '../../logic/bizDayUtils';

const PORT_OPTIONS = [
  { value: 'RTM', label: 'Rotterdam' },
  { value: 'ANR', label: 'Antwerp' },
];

const INLAND_TERMINALS = [
  { value: 'DEDUI01', label: 'Duisburg — Hutchison Ports' },
  { value: 'DEGRH01', label: 'Germersheim — DPW' },
  { value: 'DEG4TG',  label: 'Gustavsburg — Contargo' },
  { value: 'DEBNX01', label: 'Bonn — AZS' },
  { value: 'NUE02',   label: 'Nuernberg — CDN' },
  { value: 'DEMHG02', label: 'Mannheim — DPW' },
  { value: 'DEAJHRA', label: 'Andernach — Rheinhafen' },
  { value: 'DEMNZ01', label: 'Mainz — Frankenbach' },
];

const PORT_TERMINALS = [
  { value: 'NLROTTM|5|RTM',  label: 'Rotterdam — APM Terminals' },
  { value: 'NLROTWG|7|RTM',  label: 'Rotterdam — World Gateway (RWG)' },
  { value: 'NLROT01|8|RTM',  label: 'Rotterdam — Hutchison Ports Delta II' },
  { value: 'NLROT21|8|RTM',  label: 'Rotterdam — ECT Delta' },
  { value: 'BEANT869|7|ANR', label: 'Antwerp — PSA Europa Terminal' },
  { value: 'BEANT913|7|ANR', label: 'Antwerp — PSA Noordzee Terminal' },
];

export function CYCYForm() {
  const { cycyRequest, setCYCYRequest, setCycyRunResult, resetCYCY } = usePlannerStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImport = cycyRequest.direction === 'Import';
  const originOptions = isImport ? PORT_OPTIONS : INLAND_TERMINALS;
  const destinationOptions = isImport ? INLAND_TERMINALS : PORT_TERMINALS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!cycyRequest.date) {
        setError('Target date is required');
        setLoading(false);
        return;
      }

      if (isImport) {
        const portCode = (cycyRequest.originTerminal || 'RTM') as 'RTM' | 'ANR';
        const termCode = cycyRequest.destinationTerminal || 'DEDUI01';
        const vesselETD = parseDate(cycyRequest.date);
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const isFuture = vesselETD > now;
        const etdTime = cycyRequest.time || '12:00';

        const scheds = impFindScheds(termCode, portCode);
        let all: ImpInstance[] = [];
        for (const s of scheds) {
          all = all.concat(impComputeInst(s, vesselETD, etdTime, portCode, isFuture, 8));
        }
        all.sort((a, b) => a.etd.getTime() - b.etd.getTime());
        const seen: Record<string, boolean> = {};
        const deduped: ImpInstance[] = [];
        for (const m of all) {
          const k = `${fmtDateISO(m.etd)}-${m.mod}-${m.loc}`;
          if (!seen[k]) { seen[k] = true; deduped.push(m); }
        }

        const maxCards = termCode === 'DEDUI01' ? 3 : 2;
        const termName = IMP_TERM_NAMES[termCode] || termCode;
        const portName = portCode === 'RTM' ? 'Rotterdam' : 'Antwerp';

        setCycyRunResult({
          direction: 'Import',
          portCode,
          portName,
          termCode,
          termName,
          vesselETD,
          etdTime,
          instances: deduped,
          maxCards,
        });
      } else {
        const depotCode = cycyRequest.originTerminal || 'DEDUI01';
        const terminalValue = cycyRequest.destinationTerminal || 'NLROTTM|5|RTM';
        const [termCode, yotStr, portStr] = terminalValue.split('|');
        const yot = parseInt(yotStr, 10);
        const port = portStr as 'RTM' | 'ANR';
        const loadingDate = parseDate(cycyRequest.date);
        const loadTime = cycyRequest.time || '08:00';

        const depotName = EXP_DEPOTS[depotCode] || depotCode;
        const termName = EXP_TERM_NAMES[termCode] || termCode;

        const result = expGetNextDeps(depotCode, port, loadingDate, loadTime, 3, termCode);

        if (result.orderDLPassed) {
          setCycyRunResult({
            direction: 'Export',
            depotCode, depotName, termCode, termName, yot, port,
            loadingDate, loadTime,
            cards: [],
            orderDLPassed: true,
            orderDL: result.orderDL,
            skipped: result.skipped,
          });
        } else {
          const sorted = [...result.deps].sort((a, b) => {
            if (a.mod !== b.mod) return a.mod === 'Rail' ? -1 : 1;
            return a.etd.getTime() - b.etd.getTime();
          });

          let customsDeadline: Date | undefined;
          if (port === 'RTM') {
            const [lh, lm] = loadTime.split(':').map(Number);
            customsDeadline = new Date(loadingDate);
            customsDeadline.setHours(lh + 3, lm, 0, 0);
          }

          const cards: ExpCard[] = sorted.map((dep, idx) => ({
            ...dep,
            depotCode, depotName, termCode, termName, yot, port,
            earliestCCO: addDays(dep.eat, dep.buffer),
            latestETA: addDays(dep.eat, yot - 1),
            orderDL: result.orderDL || prevBizDay(addDays(loadingDate, -2)),
            holidaysInTransit: holidaysInRange(dep.etd, dep.eat),
            isRecommended: idx === 0,
          }));

          setCycyRunResult({
            direction: 'Export',
            depotCode, depotName, termCode, termName, yot, port,
            loadingDate, loadTime,
            cards,
            orderDL: result.orderDL,
            customsDeadline,
            skipped: result.skipped,
          });
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
      <div className={cn('h-1 w-full transition-colors duration-700', isImport ? 'bg-maersk-blue' : 'bg-emerald-500')} />

      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-maersk-dark rounded-xl shadow-md">
              <ArrowRightLeft className={cn('h-4 w-4 transition-colors duration-700', isImport ? 'text-maersk-blue' : 'text-emerald-500')} />
            </div>
            <div>
              <h3 className="text-base font-black text-maersk-dark tracking-tight uppercase italic">
                CY/CY <span className={cn('transition-colors duration-700', isImport ? 'text-maersk-blue' : 'text-emerald-500')}>Config</span>
              </h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Terminal-to-Terminal · Live Schedule Data</p>
            </div>
          </div>
          <div className={cn(
            'flex items-center space-x-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all duration-700',
            isImport ? 'bg-maersk-blue/10 border-maersk-blue/20 text-maersk-blue' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
          )}>
            <div className={cn('h-1.5 w-1.5 rounded-full animate-pulse', isImport ? 'bg-maersk-blue' : 'bg-emerald-500')} />
            Active
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-5 py-4 space-y-4">

          {/* Network Nodes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Navigation className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Network Nodes</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isImport ? 'Origin Port' : 'Origin Depot'}
                </Label>
                <Select
                  value={cycyRequest.originTerminal || ''}
                  onValueChange={(val) => setCYCYRequest({ originTerminal: val })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs text-maersk-dark">
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {originOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {isImport ? 'Destination Terminal' : 'Destination Port Terminal'}
                </Label>
                <Select
                  value={cycyRequest.destinationTerminal || ''}
                  onValueChange={(val) => setCYCYRequest({ destinationTerminal: val })}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs text-maersk-dark">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {destinationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cargo + Timeline */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Box className="h-3 w-3" />Container
              </Label>
              <Select
                value={cycyRequest.containerType}
                onValueChange={(val) => setCYCYRequest({ containerType: val as ContainerType })}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs text-maersk-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {['20DC', '40DC', '40HC', '20RF', '40RF', 'IMO'].map(type => (
                    <SelectItem key={type} value={type} className={cn('text-xs font-bold', type === 'IMO' ? 'text-rose-600' : '')}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />{isImport ? 'Vessel ETD' : 'Loading Date'}
              </Label>
              <Input
                type="date"
                value={cycyRequest.date || ''}
                onChange={(e) => setCYCYRequest({ date: e.target.value })}
                required
                className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3 w-3" />Time (CET)
              </Label>
              <Input
                type="time"
                value={cycyRequest.time || '12:00'}
                onChange={(e) => setCYCYRequest({ time: e.target.value })}
                required
                className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="px-5 py-4 bg-maersk-dark flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={resetCYCY}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-4"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className={cn(
              'text-white px-6 h-9 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all duration-300 hover:scale-[1.02]',
              isImport
                ? 'bg-maersk-blue hover:bg-maersk-blue/90 shadow-maersk-blue/30'
                : 'bg-emerald-500 hover:bg-emerald-500/90 shadow-emerald-500/30'
            )}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TrendingUp className="mr-2 h-4 w-4" />}
            Run Optimizer
          </Button>
        </div>
      </form>
    </div>
  );
}
