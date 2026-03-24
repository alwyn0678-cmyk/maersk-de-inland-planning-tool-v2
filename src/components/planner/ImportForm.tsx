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

export function ImportForm() {
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
      setLoading(false);
    }, 400);
  };

  const quickPostcodes = ['40210', '47051', '68159', '80331'];

  return (
    <div className="bento-card p-0 overflow-hidden group relative">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-maersk-blue via-maersk-dark to-maersk-blue opacity-80" />
      
      <div className="p-10 border-b border-slate-100 bg-slate-50/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-maersk-dark rounded-2xl shadow-2xl shadow-maersk-dark/30 ring-4 ring-white relative group-hover:scale-110 transition-transform duration-500">
              <Settings2 className="h-6 w-6 text-maersk-blue" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-maersk-dark tracking-tighter uppercase italic">Import <span className="text-maersk-blue not-italic">Config</span></h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Optimization Parameters</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 px-5 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-inner">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative">
        <div className="space-y-12 p-10">
          {/* Section: Location */}
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-maersk-blue/10 rounded-xl border border-maersk-blue/20">
                <Navigation className="h-4 w-4 text-maersk-blue" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Geographic Data</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-4">
                <Label htmlFor="postcode" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Delivery Postcode</Label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-maersk-blue/5 rounded-2xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within/input:text-maersk-blue transition-all duration-300 z-10" />
                  <Input
                    id="postcode"
                    placeholder="00000"
                    value={importRequest.postcode}
                    onChange={(e) => setImportRequest({ postcode: e.target.value })}
                    required
                    maxLength={5}
                    pattern="\d{5}"
                    className="pl-14 font-mono text-xl font-black tracking-[0.4em] bg-slate-50/50 border-slate-200 focus-visible:ring-maersk-blue/30 h-16 rounded-2xl transition-all hover:bg-white focus:bg-white relative z-0 shadow-inner focus:shadow-2xl focus:shadow-maersk-blue/5"
                  />
                </div>
                <div className="flex flex-wrap gap-2.5 mt-4">
                  {quickPostcodes.map(pc => (
                    <button
                      key={pc}
                      type="button"
                      onClick={() => setImportRequest({ postcode: pc })}
                      className="text-[10px] font-black px-4 py-2 rounded-xl bg-slate-100/80 text-slate-500 hover:bg-maersk-blue hover:text-white transition-all hover:scale-105 active:scale-95 border border-transparent hover:border-maersk-blue/20 shadow-sm"
                    >
                      {pc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="preferredTerminal" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Inland Terminal</Label>
                <Select
                  value={importRequest.preferredTerminal || 'Auto'}
                  onValueChange={(val) => setImportRequest({ preferredTerminal: val })}
                >
                  <SelectTrigger id="preferredTerminal" className="bg-slate-50/50 border-slate-200 focus:ring-maersk-blue/30 h-16 rounded-2xl hover:bg-white transition-all font-black text-slate-700 shadow-inner px-6">
                    <SelectValue placeholder="Auto-assign" />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-slate-100 shadow-2xl p-3 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="Auto" className="text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl focus:bg-maersk-blue/10">Auto-assign via Postcode</SelectItem>
                    <SelectItem value="DUISBURG" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">Duisburg D3T</SelectItem>
                    <SelectItem value="KORNWESTHEIM" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">Kornwestheim DUSS</SelectItem>
                    <SelectItem value="NUREMBERG" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">Nuremberg TriCon</SelectItem>
                    <SelectItem value="MUNICH" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">Munich DUSS</SelectItem>
                    <SelectItem value="LEIPZIG" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">Leipzig DUSS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Cargo */}
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-maersk-blue/10 rounded-xl border border-maersk-blue/20">
                <Box className="h-4 w-4 text-maersk-blue" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Cargo Specs</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-4">
                <Label htmlFor="containerType" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Container Type</Label>
                <Select
                  value={importRequest.containerType}
                  onValueChange={(val) => setImportRequest({ containerType: val as ContainerType })}
                >
                  <SelectTrigger id="containerType" className="bg-slate-50/50 border-slate-200 focus:ring-maersk-blue/30 h-16 rounded-2xl hover:bg-white transition-all font-black text-slate-700 shadow-inner px-6">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-slate-100 shadow-2xl p-3 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="20DC" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">20' DC</SelectItem>
                    <SelectItem value="40DC" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">40' DC</SelectItem>
                    <SelectItem value="40HC" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">40' HC</SelectItem>
                    <SelectItem value="20RF" className="text-[11px] font-black py-4 rounded-xl focus:bg-blue-50 text-blue-600">20' Reefer</SelectItem>
                    <SelectItem value="40RF" className="text-[11px] font-black py-4 rounded-xl focus:bg-blue-50 text-blue-600">40' Reefer</SelectItem>
                    <SelectItem value="IMO" className="text-[11px] font-black py-4 rounded-xl focus:bg-rose-50 text-rose-600 uppercase tracking-widest">IMO / DG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="dischargePort" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Discharge Port</Label>
                <Select
                  value={importRequest.dischargePort}
                  onValueChange={(val) => setImportRequest({ dischargePort: val as 'Rotterdam' | 'Antwerp' })}
                >
                  <SelectTrigger id="dischargePort" className="bg-slate-50/50 border-slate-200 focus:ring-maersk-blue/30 h-16 rounded-2xl hover:bg-white transition-all font-black text-slate-700 shadow-inner px-6">
                    <SelectValue placeholder="Select port" />
                  </SelectTrigger>
                  <SelectContent className="rounded-3xl border-slate-100 shadow-2xl p-3 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="Rotterdam" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">Rotterdam</SelectItem>
                    <SelectItem value="Antwerp" className="text-[11px] font-black py-4 rounded-xl focus:bg-maersk-blue/10">Antwerp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Timeline */}
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="p-2.5 bg-maersk-blue/10 rounded-xl border border-maersk-blue/20">
                <History className="h-4 w-4 text-maersk-blue" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Timeline</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="vesselEtd" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Vessel ETD</Label>
              <div className="relative group/input">
                <div className="absolute inset-0 bg-maersk-blue/5 rounded-2xl blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500" />
                <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within/input:text-maersk-blue transition-all duration-300 z-10" />
                <Input
                  id="vesselEtd"
                  type="date"
                  value={importRequest.vesselEtd}
                  onChange={(e) => setImportRequest({ vesselEtd: e.target.value })}
                  required
                  className="pl-14 bg-slate-50/50 border-slate-200 focus-visible:ring-maersk-blue/30 h-16 rounded-2xl transition-all hover:bg-white font-black relative z-0 shadow-inner focus:shadow-2xl focus:shadow-maersk-blue/5"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label htmlFor="etdTime" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Vessel ETD Time (CET)</Label>
              <div className="relative group/input">
                <Clock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within/input:text-maersk-blue transition-all duration-300 z-10" />
                <Input
                  id="etdTime"
                  type="time"
                  value={etdTime}
                  onChange={(e) => setEtdTime(e.target.value)}
                  className="pl-14 bg-slate-50/50 border-slate-200 focus-visible:ring-maersk-blue/30 h-16 rounded-2xl transition-all hover:bg-white font-black relative z-0 shadow-inner"
                />
              </div>
            </div>

            <div
              className="flex items-center space-x-5 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 transition-all duration-500 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 group/check cursor-pointer relative overflow-hidden"
              onClick={() => setImportRequest({ isDischarged: !importRequest.isDischarged })}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/check:scale-110 transition-transform duration-700">
                <Box className="h-16 w-16 text-maersk-dark" />
              </div>
              <Checkbox
                id="isDischarged"
                checked={importRequest.isDischarged}
                onCheckedChange={(checked) => setImportRequest({ isDischarged: checked as boolean })}
                className="h-7 w-7 rounded-xl border-slate-300 data-[state=checked]:bg-maersk-blue data-[state=checked]:border-maersk-blue transition-all duration-300 group-hover/check:scale-110 shadow-sm"
              />
              <div className="space-y-1 relative z-10">
                <Label htmlFor="isDischarged" className="text-sm font-black text-maersk-dark cursor-pointer select-none uppercase tracking-tight">
                  Container Discharged
                </Label>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Available at port terminal</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-8 p-10 bg-maersk-dark relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-white/10" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-maersk-blue/10 rounded-full blur-[80px]" />
          
          <div className="flex items-center justify-between w-full relative z-10">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={resetImport} 
              className="text-white/30 hover:text-white hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] px-6"
            >
              Reset System
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !importRequest.postcode || importRequest.postcode.length < 2} 
              className="bg-maersk-blue hover:bg-maersk-blue/90 text-white shadow-[0_20px_50px_-10px_rgba(66,176,213,0.5)] px-14 h-18 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 hover:scale-[1.05] active:scale-[0.95] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <div className="flex items-center relative z-10">
                {loading ? (
                  <Loader2 className="mr-4 h-5 w-5 animate-spin" />
                ) : (
                  <TrendingUp className="mr-4 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" />
                )}
                Run Optimizer
              </div>
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 text-[9px] text-white/20 font-black uppercase tracking-[0.3em] justify-center relative z-10">
            <div className="h-1.5 w-1.5 rounded-full bg-maersk-blue shadow-[0_0_8px_rgba(66,176,213,0.8)]" />
            <span>Real-time Barge Congestion Data Integrated</span>
          </div>
        </div>
      </form>
    </div>
  );
}

