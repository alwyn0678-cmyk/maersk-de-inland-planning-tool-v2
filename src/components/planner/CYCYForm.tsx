import { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { ContainerType } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Loader2, Calendar as CalendarIcon, TrendingUp, Box, MapPin, Clock, ArrowRightLeft } from 'lucide-react';
import { impFindScheds } from '../../logic/import/scheduleFinder';
import { impComputeInst, ImpInstance } from '../../logic/import/computeInstances';
import { impLookupTerms } from '../../logic/import/zipLookup';
import { expGetNextDeps } from '../../logic/export/getNextDepartures';
import { expFindRule } from '../../logic/export/ruleLookup';
import { ExpCard } from '../../logic/export/expRun';
import { EXP_DEPOTS, EXP_TERM_NAMES } from '../../data/export/depotNames';
import { IMP_TERM_NAMES } from '../../data/import/terminalNames';
import { parseDate, addDays, fmtDateISO } from '../../logic/dateUtils';
import { prevBizDay, holidaysInRange } from '../../logic/bizDayUtils';

const PORT_OPTIONS = [
  { value: 'RTM', label: 'Rotterdam' },
  { value: 'ANR', label: 'Antwerp' },
];

const PORT_TERMINALS = [
  { value: 'NLROTTM|5|RTM',  label: 'APM Terminals Rotterdam',       port: 'RTM' },
  { value: 'NLROTWG|7|RTM',  label: 'Rotterdam World Gateway (RWG)', port: 'RTM' },
  { value: 'NLROT01|8|RTM',  label: 'Hutchison Ports Delta II',      port: 'RTM' },
  { value: 'NLROT21|8|RTM',  label: 'ECT Delta Terminal',            port: 'RTM' },
  { value: 'BEANT869|7|ANR', label: 'PSA Europa Terminal (ANR)',     port: 'ANR' },
  { value: 'BEANT913|7|ANR', label: 'PSA Noordzee Terminal (ANR)',   port: 'ANR' },
];

export function CYCYForm() {
  const { cycyRequest, setCYCYRequest, setCycyRunResult, resetCYCY } = usePlannerStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isImport = cycyRequest.direction === 'Import';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const zip = cycyRequest.zip || '';
      if (!zip || zip.length < 4) {
        setError('Enter a valid German postcode (4–5 digits)');
        setLoading(false);
        return;
      }
      if (!cycyRequest.date) {
        setError('Date is required');
        setLoading(false);
        return;
      }

      if (isImport) {
        const portCode = (cycyRequest.originTerminal || 'RTM') as 'RTM' | 'ANR';

        // Auto-determine inland terminal from ZIP
        const terms = impLookupTerms(zip, portCode);
        if (!terms || !terms.b) {
          setError(`No barge terminal found for postcode ${zip} via ${portCode === 'RTM' ? 'Rotterdam' : 'Antwerp'}`);
          setLoading(false);
          return;
        }
        const termCode = terms.b;
        const termName = IMP_TERM_NAMES[termCode] || termCode;
        const portName = portCode === 'RTM' ? 'Rotterdam' : 'Antwerp';

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
        const terminalValue = cycyRequest.destinationTerminal || 'NLROTTM|5|RTM';
        const [termCode, yotStr, portStr] = terminalValue.split('|');
        const yot = parseInt(yotStr, 10);
        const port = portStr as 'RTM' | 'ANR';

        // Auto-determine inland depot from ZIP
        const rule = expFindRule(zip);
        if (!rule) {
          setError(`Postcode ${zip} is not in the depot matrix`);
          setLoading(false);
          return;
        }
        const portRule = port === 'ANR' ? rule.anr : rule.rtm;
        if (!portRule?.p1) {
          setError(`Postcode ${zip} is not serviced via ${port === 'ANR' ? 'Antwerp' : 'Rotterdam'}`);
          setLoading(false);
          return;
        }
        const depotCode = portRule.p1;
        const depotName = EXP_DEPOTS[depotCode] || depotCode;
        const termName = EXP_TERM_NAMES[termCode] || termCode;

        const loadingDate = parseDate(cycyRequest.date);
        const loadTime = cycyRequest.time || '08:00';

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
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {isImport ? 'Port → Inland — ZIP auto-assigns terminal' : 'Inland → Port — ZIP auto-assigns depot'}
              </p>
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

          {/* ZIP + Port/Port Terminal */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                {isImport ? 'Customer ZIP & Origin Port' : 'Customer ZIP & Destination Terminal'}
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Postcode</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 z-10" />
                  <Input
                    type="text"
                    placeholder="e.g. 47051"
                    value={cycyRequest.zip || ''}
                    onChange={(e) => setCYCYRequest({ zip: e.target.value })}
                    maxLength={5}
                    pattern="\d{4,5}"
                    required
                    className="pl-9 bg-slate-50 border-slate-200 h-10 rounded-xl font-mono font-black text-sm tracking-widest"
                  />
                </div>
              </div>

              {isImport ? (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin Port</Label>
                  <Select
                    value={cycyRequest.originTerminal || 'RTM'}
                    onValueChange={(val) => setCYCYRequest({ originTerminal: val })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs text-maersk-dark">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      {PORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Port Terminal</Label>
                  <Select
                    value={cycyRequest.destinationTerminal || 'NLROTTM|5|RTM'}
                    onValueChange={(val) => setCYCYRequest({ destinationTerminal: val })}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs text-maersk-dark">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl min-w-[300px]">
                      <div className="px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Rotterdam</div>
                      {PORT_TERMINALS.filter(t => t.port === 'RTM').map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">{opt.label}</SelectItem>
                      ))}
                      <div className="px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Antwerp</div>
                      {PORT_TERMINALS.filter(t => t.port === 'ANR').map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
