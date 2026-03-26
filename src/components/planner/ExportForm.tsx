import { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { expRun } from '../../logic/export/expRun';
import { ContainerType } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  Settings2,
  Box,
  Navigation,
  History,
} from 'lucide-react';
import { cn } from '../../lib/utils';

function containerToSizeType(ct: string): { size: string; type: string } {
  if (ct === '20DC') return { size: '20', type: 'dc' };
  if (ct === '40DC') return { size: '40', type: 'dc' };
  if (ct === '40HC') return { size: '40', type: 'hc' };
  if (ct === '20RF') return { size: '20', type: 'reefer' };
  if (ct === '40RF') return { size: '40', type: 'reefer' };
  if (ct === 'IMO')  return { size: '40', type: 'imo' };
  return { size: '40', type: 'hc' };
}

// Terminal options: "CODE|YOT|PORT"
const TERMINAL_OPTIONS = [
  { value: 'NLROTTM|5|RTM',  label: 'APM Terminals Rotterdam',    port: 'RTM' },
  { value: 'NLROTWG|7|RTM',  label: 'Rotterdam World Gateway',    port: 'RTM' },
  { value: 'NLROT01|8|RTM',  label: 'Hutchison Ports Delta II',   port: 'RTM' },
  { value: 'NLROT21|8|RTM',  label: 'ECT Delta Terminal',         port: 'RTM' },
  { value: 'BEANT869|7|ANR', label: 'PSA Europa Terminal (ANR)',  port: 'ANR' },
  { value: 'BEANT913|7|ANR', label: 'PSA Noordzee Terminal (ANR)', port: 'ANR' },
];

export function ExportForm({ onSuccess }: { onSuccess?: () => void }) {
  const exportRequest  = usePlannerStore(s => s.exportRequest);
  const setExportRequest = usePlannerStore(s => s.setExportRequest);
  const setExpRunResult  = usePlannerStore(s => s.setExpRunResult);
  const resetExport      = usePlannerStore(s => s.resetExport);
  const [zipError, setZipError] = useState('');
  const terminalValue = exportRequest.portTerminal || 'NLROTTM|5|RTM';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportRequest.postcode || !exportRequest.loadingDate) return;
    const { size, type } = containerToSizeType(exportRequest.containerType || '40HC');
    const result = expRun({
      zip: exportRequest.postcode!,
      size,
      type,
      loadDate: exportRequest.loadingDate!,
      loadTime: exportRequest.loadingTime || '08:00',
      terminalValue,
    });
    setExpRunResult(result);
    onSuccess?.();
  };

  const quickPostcodes = ['70173', '60311', '50667', '20095'];

  return (
    <div className="bento-card w-full overflow-hidden group relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 z-10" />
      
      <div className="p-5 border-b border-slate-100/50 bg-slate-50/50 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-maersk-dark rounded-xl shadow-lg ring-2 ring-white group-hover:scale-110 transition-transform duration-500">
              <Settings2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-maersk-dark tracking-tighter uppercase italic">Export <span className="text-emerald-500 not-italic">Booking</span></h3>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.25em]">Search Configuration</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="space-y-6 p-5">
          {/* Section: Location */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <Navigation className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">Geographic Data</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="export-postcode" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Collection Postcode</Label>
                <div className="relative group/input">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" />
                  <Input
                    id="export-postcode"
                    placeholder="00000"
                    value={exportRequest.postcode}
                    onChange={(e) => { setExportRequest({ postcode: e.target.value }); setZipError(''); }}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v && (v.length < 4 || !/^\d+$/.test(v))) setZipError('Enter a valid German ZIP (4–5 digits)');
                    }}
                    required
                    maxLength={5}
                    className={cn("pl-9 font-mono text-base font-black tracking-[0.3em] bg-slate-50/50 border-slate-200/60 focus-visible:ring-emerald-500 h-10 rounded-xl transition-all hover:bg-white focus:bg-white", zipError && "border-red-400 focus-visible:ring-red-400/30")}
                  />
                  {zipError && <p className="text-[10px] font-bold text-red-500 mt-1 ml-1">{zipError}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickPostcodes.map(pc => (
                    <button
                      key={pc}
                      type="button"
                      onClick={() => setExportRequest({ postcode: pc })}
                      className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-lg transition-all duration-200 uppercase tracking-wide border",
                        exportRequest.postcode === pc
                          ? "bg-emerald-600 text-white border-emerald-600 scale-105"
                          : "bg-white text-slate-500 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50"
                      )}
                    >
                      {pc}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Section: Cargo */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <Box className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">Cargo Specs</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="export-containerType" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Container Type</Label>
                <Select
                  value={exportRequest.containerType}
                  onValueChange={(val) => setExportRequest({ containerType: val as ContainerType })}
                >
                  <SelectTrigger id="export-containerType" className="bg-slate-50/50 border-slate-200/60 focus:ring-emerald-500 h-10 rounded-xl hover:bg-white transition-all font-black text-maersk-dark text-xs px-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1 backdrop-blur-xl bg-white/90">
                    {['20DC', '40DC', '40HC', '20RF', '40RF', 'IMO'].map(type => (
                      <SelectItem key={type} value={type} className={cn(
                        "text-xs font-bold py-2 rounded-lg focus:bg-emerald-50",
                        type === 'IMO' ? "text-rose-600 focus:text-rose-700" : "text-maersk-dark focus:text-emerald-700"
                      )}>
                        {type} {type.includes('RF') ? 'Reefer' : type === 'IMO' ? 'Hazardous' : 'Dry'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="export-portTerminal" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Port Terminal</Label>
                <Select
                  value={terminalValue}
                  onValueChange={(v) => setExportRequest({ portTerminal: v })}
                >
                  <SelectTrigger id="export-portTerminal" className="w-full bg-slate-50/50 border-slate-200/60 focus:ring-emerald-500 h-10 rounded-xl hover:bg-white transition-all font-black text-maersk-dark text-xs px-3">
                    <SelectValue placeholder="Select terminal" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1 backdrop-blur-xl bg-white/90 min-w-[320px]">
                    <div className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Rotterdam</div>
                    {TERMINAL_OPTIONS.filter(t => t.port === 'RTM').map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-xs font-bold py-2 rounded-lg focus:bg-emerald-50 focus:text-emerald-700">
                        {t.label} <span className="text-[10px] text-slate-400 ml-1">YOT {t.value.split('|')[1]}d</span>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Antwerp</div>
                    {TERMINAL_OPTIONS.filter(t => t.port === 'ANR').map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-xs font-bold py-2 rounded-lg focus:bg-emerald-50 focus:text-emerald-700">
                        {t.label} <span className="text-[10px] text-slate-400 ml-1">YOT {t.value.split('|')[1]}d</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Timeline */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <History className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">Timeline</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="loadingDate" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Loading Date</Label>
                <div className="relative group/input">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" />
                  <Input
                    id="loadingDate"
                    type="date"
                    value={exportRequest.loadingDate}
                    onChange={(e) => setExportRequest({ loadingDate: e.target.value })}
                    required
                    className="pl-9 bg-slate-50/50 border-slate-200/60 focus-visible:ring-emerald-500 h-10 rounded-xl transition-all hover:bg-white font-black text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loadingTime" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Loading Time</Label>
                <div className="relative group/input">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors duration-300 z-10" />
                  <Input
                    id="loadingTime"
                    type="time"
                    value={exportRequest.loadingTime}
                    onChange={(e) => setExportRequest({ loadingTime: e.target.value })}
                    required
                    className="pl-9 bg-slate-50/50 border-slate-200/60 focus-visible:ring-emerald-500 h-10 rounded-xl transition-all hover:bg-white font-black text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-maersk-dark relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
          <Button
            type="button"
            variant="ghost"
            onClick={resetExport}
            className="text-white/30 hover:text-white hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] h-8 px-4 relative z-10"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={!exportRequest.postcode || exportRequest.postcode.length < 4}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-9 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-[0.97] group overflow-hidden relative z-10 shadow-lg shadow-emerald-600/30"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10 flex items-center space-x-2">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Run Optimizer</span>
            </div>
          </Button>
        </div>
      </form>
    </div>
  );
}
