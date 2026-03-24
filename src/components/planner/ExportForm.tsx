import { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { expRun } from '../../logic/export/expRun';
import { ContainerType } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { 
  Loader2, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  TrendingUp, 
  Upload,
  Settings2,
  Box,
  Navigation,
  History,
  Info
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

export function ExportForm() {
  const { exportRequest, setExportRequest, setExpRunResult, resetExport } = usePlannerStore();
  const [loading, setLoading] = useState(false);
  const [terminalValue, setTerminalValue] = useState('NLROTTM|5|RTM');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportRequest.postcode || !exportRequest.loadingDate) return;
    setLoading(true);
    setTimeout(() => {
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
      setLoading(false);
    }, 400);
  };

  const quickPostcodes = ['70173', '60311', '50667', '20095'];

  return (
    <div className="bento-card w-full overflow-hidden group relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 z-10" />
      
      <div className="pb-10 pt-12 px-10 border-b border-slate-100/50 bg-slate-50/50 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-maersk-dark rounded-[1.5rem] shadow-2xl shadow-maersk-dark/30 ring-4 ring-white group-hover:scale-110 transition-transform duration-500">
              <Settings2 className="h-7 w-7 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-maersk-dark tracking-tighter uppercase italic">Export <span className="text-emerald-500 not-italic">Config</span></h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Optimization Parameters</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-inner">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="space-y-12 px-10 py-12">
          {/* Section: Location */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-emerald-600">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Navigation className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">Geographic Data</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent ml-6" />
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-4">
                <Label htmlFor="export-postcode" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Collection Postcode</Label>
                <div className="relative group/input">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-maersk-blue/20 rounded-[1.5rem] blur opacity-0 group-focus-within/input:opacity-100 transition duration-500" />
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors duration-300" />
                    <Input
                      id="export-postcode"
                      placeholder="00000"
                      value={exportRequest.postcode}
                      onChange={(e) => setExportRequest({ postcode: e.target.value })}
                      required
                      maxLength={5}
                      pattern="\d{5}"
                      className="pl-14 font-mono text-2xl font-black tracking-[0.4em] bg-slate-50/50 border-slate-200/60 focus-visible:ring-emerald-500 h-16 rounded-[1.25rem] transition-all duration-300 hover:bg-white focus:bg-white shadow-inner focus:shadow-2xl focus:shadow-emerald-500/10"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {quickPostcodes.map(pc => (
                    <button
                      key={pc}
                      type="button"
                      onClick={() => setExportRequest({ postcode: pc })}
                      className={cn(
                        "text-[10px] font-black px-4 py-2 rounded-xl transition-all duration-300 uppercase tracking-widest border",
                        exportRequest.postcode === pc 
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/30 scale-105" 
                          : "bg-white text-slate-500 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50"
                      )}
                    >
                      {pc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="export-preferredTerminal" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Inland Terminal</Label>
                <Select
                  value={exportRequest.preferredTerminal || 'Auto'}
                  onValueChange={(val) => setExportRequest({ preferredTerminal: val })}
                >
                  <SelectTrigger id="export-preferredTerminal" className="bg-slate-50/50 border-slate-200/60 focus:ring-emerald-500 h-16 rounded-[1.25rem] hover:bg-white transition-all duration-300 font-black text-maersk-dark text-xs uppercase tracking-widest shadow-inner">
                    <SelectValue placeholder="Auto-assign" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 backdrop-blur-xl bg-white/90">
                    <SelectItem value="Auto" className="text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl focus:bg-emerald-50 focus:text-emerald-700">Auto-assign via Postcode</SelectItem>
                    {['DUISBURG', 'KORNWESTHEIM', 'NUREMBERG', 'MUNICH', 'LEIPZIG'].map(t => (
                      <SelectItem key={t} value={t} className="text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl focus:bg-emerald-50 focus:text-emerald-700">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Cargo */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-emerald-600">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Box className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">Cargo Specs</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent ml-6" />
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-4">
                <Label htmlFor="export-containerType" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Container Type</Label>
                <Select
                  value={exportRequest.containerType}
                  onValueChange={(val) => setExportRequest({ containerType: val as ContainerType })}
                >
                  <SelectTrigger id="export-containerType" className="bg-slate-50/50 border-slate-200/60 focus:ring-emerald-500 h-16 rounded-[1.25rem] hover:bg-white transition-all duration-300 font-black text-maersk-dark text-xs uppercase tracking-widest shadow-inner">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 backdrop-blur-xl bg-white/90">
                    {['20DC', '40DC', '40HC', '20RF', '40RF', 'IMO'].map(type => (
                      <SelectItem key={type} value={type} className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl focus:bg-emerald-50",
                        type === 'IMO' ? "text-rose-600 focus:text-rose-700" : "text-maersk-dark focus:text-emerald-700"
                      )}>
                        {type} {type.includes('RF') ? 'Reefer' : type === 'IMO' ? 'Hazardous' : 'Dry'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="export-portTerminal" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Port Terminal</Label>
                <Select
                  value={terminalValue}
                  onValueChange={setTerminalValue}
                >
                  <SelectTrigger id="export-portTerminal" className="bg-slate-50/50 border-slate-200/60 focus:ring-emerald-500 h-16 rounded-[1.25rem] hover:bg-white transition-all duration-300 font-black text-maersk-dark text-xs uppercase tracking-widest shadow-inner">
                    <SelectValue placeholder="Select terminal" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 backdrop-blur-xl bg-white/90">
                    {TERMINAL_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl focus:bg-emerald-50 focus:text-emerald-700">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Timeline */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-emerald-600">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <History className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">Timeline</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent ml-6" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-4">
                <Label htmlFor="loadingDate" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Loading Date</Label>
                <div className="relative group/input">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-maersk-blue/20 rounded-[1.5rem] blur opacity-0 group-focus-within/input:opacity-100 transition duration-500" />
                  <div className="relative">
                    <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors duration-300" />
                    <Input
                      id="loadingDate"
                      type="date"
                      value={exportRequest.loadingDate}
                      onChange={(e) => setExportRequest({ loadingDate: e.target.value })}
                      required
                      className="pl-14 bg-slate-50/50 border-slate-200/60 focus-visible:ring-emerald-500 h-16 rounded-[1.25rem] transition-all duration-300 hover:bg-white font-black text-xs uppercase tracking-widest shadow-inner"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Label htmlFor="loadingTime" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Loading Time</Label>
                <div className="relative group/input">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-maersk-blue/20 rounded-[1.5rem] blur opacity-0 group-focus-within/input:opacity-100 transition duration-500" />
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within/input:text-emerald-500 transition-colors duration-300" />
                    <Input
                      id="loadingTime"
                      type="time"
                      value={exportRequest.loadingTime}
                      onChange={(e) => setExportRequest({ loadingTime: e.target.value })}
                      required
                      className="pl-14 bg-slate-50/50 border-slate-200/60 focus-visible:ring-emerald-500 h-16 rounded-[1.25rem] transition-all duration-300 hover:bg-white font-black text-xs uppercase tracking-widest shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-8 px-10 py-12 bg-maersk-dark relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
          <div className="flex items-center justify-between w-full relative z-10">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={resetExport} 
              className="text-white/30 hover:text-white hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] h-12 px-6 transition-all duration-300"
            >
              Reset System
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !exportRequest.postcode || exportRequest.postcode.length < 2} 
              className="bg-emerald-600 hover:bg-emerald-50 text-white hover:text-emerald-700 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)] px-12 h-20 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all duration-500 hover:scale-[1.05] active:scale-[0.95] group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <div className="relative z-10 flex items-center">
                {loading ? (
                  <Loader2 className="mr-4 h-6 w-6 animate-spin" />
                ) : (
                  <TrendingUp className="mr-4 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                )}
                Run Optimizer
              </div>
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 text-[10px] text-white/20 font-black uppercase tracking-[0.3em] justify-center relative z-10">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
            <span>Real-time Barge Congestion Data Integrated</span>
          </div>
        </div>
      </form>
    </div>
  );
}
