import { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { CYCYRequest, ContainerType } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Loader2,
  Calendar as CalendarIcon,
  TrendingUp,
  Box,
  Navigation,
  History,
  Clock,
  ArrowRightLeft,
} from 'lucide-react';

export function CYCYForm() {
  const { cycyRequest, setCYCYRequest, setCYCYResult, resetCYCY } = usePlannerStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setCYCYResult({
        feasibleDepartures: [
          {
            type: 'Barge',
            origin: cycyRequest.originTerminal || 'Rotterdam',
            destination: cycyRequest.destinationTerminal || 'DUISBURG',
            departure: new Date(),
            arrival: new Date(Date.now() + 86400000),
            capacity: 85,
            status: 'On Time',
            isRecommended: true
          },
          {
            type: 'Rail',
            origin: cycyRequest.originTerminal || 'Rotterdam',
            destination: cycyRequest.destinationTerminal || 'DUISBURG',
            departure: new Date(Date.now() + 43200000),
            arrival: new Date(Date.now() + 129600000),
            capacity: 92,
            status: 'On Time',
            isRecommended: false
          }
        ],
        warnings: []
      });
      setLoading(false);
    }, 800);
  };

  const portTerminals = [
    { value: 'Rotterdam', label: 'Rotterdam (Port)' },
    { value: 'Antwerp', label: 'Antwerp (Port)' },
  ];

  const inlandTerminals = [
    { value: 'DUISBURG', label: 'Duisburg D3T' },
    { value: 'KORNWESTHEIM', label: 'Kornwestheim DUSS' },
  ];

  const originOptions = cycyRequest.direction === 'Import' ? portTerminals : inlandTerminals;
  const destinationOptions = cycyRequest.direction === 'Import' ? inlandTerminals : portTerminals;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
      <div className={cn(
        "h-1 w-full transition-colors duration-700",
        cycyRequest.direction === 'Import' ? "bg-maersk-blue" : "bg-emerald-500"
      )} />

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-maersk-dark rounded-xl shadow-md">
              <ArrowRightLeft className={cn(
                "h-4 w-4 transition-colors duration-700",
                cycyRequest.direction === 'Import' ? "text-maersk-blue" : "text-emerald-500"
              )} />
            </div>
            <div>
              <h3 className="text-base font-black text-maersk-dark tracking-tight uppercase italic">
                CY/CY <span className={cn(
                  "transition-colors duration-700",
                  cycyRequest.direction === 'Import' ? "text-maersk-blue" : "text-emerald-500"
                )}>Config</span>
              </h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Terminal-to-Terminal</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center space-x-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all duration-700",
            cycyRequest.direction === 'Import'
              ? "bg-maersk-blue/10 border-maersk-blue/20 text-maersk-blue"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
          )}>
            <div className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse",
              cycyRequest.direction === 'Import' ? "bg-maersk-blue" : "bg-emerald-500"
            )} />
            Active
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-5 py-4 space-y-5">
          {/* Network Nodes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-maersk-dark">
              <Navigation className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Network Nodes</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="originTerminal" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin Terminal</Label>
                <Select
                  value={cycyRequest.originTerminal}
                  onValueChange={(val) => setCYCYRequest({ originTerminal: val })}
                >
                  <SelectTrigger id="originTerminal" className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs text-maersk-dark">
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {originOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="destinationTerminal" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination Terminal</Label>
                <Select
                  value={cycyRequest.destinationTerminal}
                  onValueChange={(val) => setCYCYRequest({ destinationTerminal: val })}
                >
                  <SelectTrigger id="destinationTerminal" className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs text-maersk-dark">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {destinationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Cargo */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-maersk-dark">
              <Box className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Cargo Specs</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cycy-containerType" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Container Type</Label>
              <Select
                value={cycyRequest.containerType}
                onValueChange={(val) => setCYCYRequest({ containerType: val as ContainerType })}
              >
                <SelectTrigger id="cycy-containerType" className="bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs text-maersk-dark">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {['20DC', '40DC', '40HC', '20RF', '40RF', 'IMO'].map(type => (
                    <SelectItem key={type} value={type} className={cn(
                      "text-xs font-bold",
                      type === 'IMO' ? "text-rose-600" : ""
                    )}>
                      {type} {type.includes('RF') ? 'Reefer' : type === 'IMO' ? 'Hazardous' : 'Dry'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-maersk-dark">
              <History className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Timeline</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cycy-date" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="cycy-date"
                    type="date"
                    value={cycyRequest.date}
                    onChange={(e) => setCYCYRequest({ date: e.target.value })}
                    required
                    className="pl-9 bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cycy-time" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="cycy-time"
                    type="time"
                    value={cycyRequest.time}
                    onChange={(e) => setCYCYRequest({ time: e.target.value })}
                    required
                    className="pl-9 bg-slate-50 border-slate-200 h-10 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
              "text-white px-6 h-9 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all duration-300 hover:scale-[1.02]",
              cycyRequest.direction === 'Import'
                ? "bg-maersk-blue hover:bg-maersk-blue/90 shadow-maersk-blue/30"
                : "bg-emerald-500 hover:bg-emerald-500/90 shadow-emerald-500/30"
            )}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            Run Optimizer
          </Button>
        </div>
      </form>
    </div>
  );
}
