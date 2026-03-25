import { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { impRun } from '../../logic/import/impRun';
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

export function ImportForm({ onSuccess }: { onSuccess?: () => void }) {
  const { importRequest, setImportRequest, setImpRunResult, resetImport } = usePlannerStore();
  const [loading, setLoading] = useState(false);
  const [etdTime, setEtdTime] = useState('08:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importRequest.postcode || !importRequest.vesselEtd) return;
    setLoading(true);
    setTimeout(() => {
      const { size, type } = containerToSizeType(importRequest.containerType || '40HC');
      const port = importRequest.dischargePort === 'Antwerp' ? 'ANR' : 'RTM';
      const result = impRun({
        zip: importRequest.postcode!,
        size,
        type,
        port,
        etdDate: importRequest.vesselEtd!,
        etdTime,
      });
      setImpRunResult(result);
      onSuccess?.();
      setLoading(false);
    }, 400);
  };

  const quickPostcodes = ['40210', '47051', '68159', '80331'];

  return (
    <div className="bento-card p-0 overflow-hidden group relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-maersk-blue via-maersk-dark to-maersk-blue opacity-80" />
      
      <div className="p-5 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-maersk-dark rounded-xl shadow-lg ring-2 ring-white relative group-hover:scale-110 transition-transform duration-500">
              <Settings2 className="h-4 w-4 text-maersk-blue" />
            </div>
            <div>
              <h2 className="text-lg font-black text-maersk-dark tracking-tighter uppercase italic">Import <span className="text-maersk-blue not-italic">Booking</span></h2>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.25em]">Search Configuration</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="space-y-6 p-5">
          {/* Section: Location */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-maersk-blue/10 rounded-lg border border-maersk-blue/20">
                <Navigation className="h-3.5 w-3.5 text-maersk-blue" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Geographic Data</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="postcode" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Delivery Postcode</Label>
                <div className="relative group/input">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-maersk-blue transition-all duration-300 z-10" />
                  <Input
                    id="postcode"
                    placeholder="00000"
                    value={importRequest.postcode}
                    onChange={(e) => setImportRequest({ postcode: e.target.value })}
                    required
                    maxLength={5}
                    pattern="\d{5}"
                    className="pl-9 font-mono text-base font-black tracking-[0.3em] bg-slate-50/50 border-slate-200 focus-visible:ring-maersk-blue/30 h-10 rounded-xl transition-all hover:bg-white focus:bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickPostcodes.map(pc => (
                    <button
                      key={pc}
                      type="button"
                      onClick={() => setImportRequest({ postcode: pc })}
                      className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-100/80 text-slate-500 hover:bg-maersk-blue hover:text-white transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-maersk-blue/20"
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
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-maersk-blue/10 rounded-lg border border-maersk-blue/20">
                <Box className="h-3.5 w-3.5 text-maersk-blue" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Cargo Specs</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="containerType" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Container</Label>
                <Select
                  value={importRequest.containerType}
                  onValueChange={(val) => setImportRequest({ containerType: val as ContainerType })}
                >
                  <SelectTrigger id="containerType" className="bg-slate-50/50 border-slate-200 focus:ring-maersk-blue/30 h-10 rounded-xl hover:bg-white transition-all font-black text-slate-700 text-xs px-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="20DC" className="text-xs font-bold py-2 rounded-lg focus:bg-maersk-blue/10">20' DC</SelectItem>
                    <SelectItem value="40DC" className="text-xs font-bold py-2 rounded-lg focus:bg-maersk-blue/10">40' DC</SelectItem>
                    <SelectItem value="40HC" className="text-xs font-bold py-2 rounded-lg focus:bg-maersk-blue/10">40' HC</SelectItem>
                    <SelectItem value="20RF" className="text-xs font-bold py-2 rounded-lg focus:bg-blue-50 text-blue-600">20' Reefer</SelectItem>
                    <SelectItem value="40RF" className="text-xs font-bold py-2 rounded-lg focus:bg-blue-50 text-blue-600">40' Reefer</SelectItem>
                    <SelectItem value="IMO" className="text-xs font-bold py-2 rounded-lg focus:bg-rose-50 text-rose-600 uppercase">IMO / DG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dischargePort" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Port</Label>
                <Select
                  value={importRequest.dischargePort}
                  onValueChange={(val) => setImportRequest({ dischargePort: val as 'Rotterdam' | 'Antwerp' })}
                >
                  <SelectTrigger id="dischargePort" className="bg-slate-50/50 border-slate-200 focus:ring-maersk-blue/30 h-10 rounded-xl hover:bg-white transition-all font-black text-slate-700 text-xs px-3">
                    <SelectValue placeholder="Select port" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="Rotterdam" className="text-xs font-bold py-2 rounded-lg focus:bg-maersk-blue/10">Rotterdam</SelectItem>
                    <SelectItem value="Antwerp" className="text-xs font-bold py-2 rounded-lg focus:bg-maersk-blue/10">Antwerp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Timeline */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-maersk-blue/10 rounded-lg border border-maersk-blue/20">
                <History className="h-3.5 w-3.5 text-maersk-blue" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Timeline</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vesselEtd" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Vessel ETD</Label>
                <div className="relative group/input">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-maersk-blue transition-all duration-300 z-10" />
                  <Input
                    id="vesselEtd"
                    type="date"
                    value={importRequest.vesselEtd}
                    onChange={(e) => setImportRequest({ vesselEtd: e.target.value })}
                    required
                    className="pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-maersk-blue/30 h-10 rounded-xl transition-all hover:bg-white font-black text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="etdTime" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">ETD Time (CET)</Label>
                <div className="relative group/input">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within/input:text-maersk-blue transition-all duration-300 z-10" />
                  <Input
                    id="etdTime"
                    type="time"
                    value={etdTime}
                    onChange={(e) => setEtdTime(e.target.value)}
                    className="pl-9 bg-slate-50/50 border-slate-200 focus-visible:ring-maersk-blue/30 h-10 rounded-xl transition-all hover:bg-white font-black text-xs"
                  />
                </div>
              </div>
            </div>

            <div
              className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all cursor-pointer group/check"
              onClick={() => setImportRequest({ isDischarged: !importRequest.isDischarged })}
            >
              <Checkbox
                id="isDischarged"
                checked={importRequest.isDischarged}
                onCheckedChange={(checked) => setImportRequest({ isDischarged: checked as boolean })}
                className="h-4 w-4 rounded-md border-slate-300 data-[state=checked]:bg-maersk-blue data-[state=checked]:border-maersk-blue"
              />
              <div className="space-y-0.5">
                <Label htmlFor="isDischarged" className="text-xs font-black text-maersk-dark cursor-pointer select-none uppercase tracking-tight">
                  Container Discharged
                </Label>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em]">Available at port terminal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-maersk-dark relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-white/10" />
          <Button
            type="button"
            variant="ghost"
            onClick={resetImport}
            className="text-white/30 hover:text-white hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] px-4 h-8"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={loading || !importRequest.postcode || importRequest.postcode.length < 2}
            className="bg-maersk-blue hover:bg-maersk-blue/90 text-white px-6 h-9 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-[0.97] group relative overflow-hidden shadow-lg shadow-maersk-blue/30"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="flex items-center relative z-10 space-x-2">
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <TrendingUp className="h-3.5 w-3.5" />
              )}
              <span>Run Optimizer</span>
            </div>
          </Button>
        </div>
      </form>
    </div>
  );
}

