import { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { CYCYRequest, ContainerType } from '../../types';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Settings2,
  Box,
  Navigation,
  History,
  Clock,
  ArrowRightLeft,
  Anchor
} from 'lucide-react';

export function CYCYForm() {
  const { cycyRequest, setCYCYRequest, setCYCYResult, resetCYCY } = usePlannerStore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      // Mock result for CY/CY
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
    <div className="bento-card w-full overflow-hidden group relative">
      <div className={cn(
        "absolute top-0 left-0 w-full h-2 z-10 transition-colors duration-700",
        cycyRequest.direction === 'Import' ? "bg-maersk-blue" : "bg-emerald-500"
      )} />
      
      <div className="pb-10 pt-12 px-10 border-b border-slate-100/50 bg-slate-50/50 relative overflow-hidden">
        <div className={cn(
          "absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl transition-colors duration-700",
          cycyRequest.direction === 'Import' ? "bg-maersk-blue/5" : "bg-emerald-500/5"
        )} />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-maersk-dark rounded-[1.5rem] shadow-2xl shadow-maersk-dark/30 ring-4 ring-white group-hover:scale-110 transition-transform duration-500">
              <ArrowRightLeft className={cn(
                "h-7 w-7 transition-colors duration-700",
                cycyRequest.direction === 'Import' ? "text-maersk-blue" : "text-emerald-500"
              )} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-maersk-dark tracking-tighter uppercase italic">CY/CY <span className={cn(
                "transition-colors duration-700",
                cycyRequest.direction === 'Import' ? "text-maersk-blue" : "text-emerald-500"
              )}>Config</span></h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Terminal-to-Terminal Optimization</p>
            </div>
          </div>
          <div className={cn(
            "flex items-center space-x-3 px-5 py-2 rounded-full border shadow-inner transition-all duration-700",
            cycyRequest.direction === 'Import' 
              ? "bg-maersk-blue/10 border-maersk-blue/20" 
              : "bg-emerald-500/10 border-emerald-500/20"
          )}>
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-colors duration-700",
              cycyRequest.direction === 'Import' ? "bg-maersk-blue" : "bg-emerald-500"
            )} />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest transition-colors duration-700",
              cycyRequest.direction === 'Import' ? "text-maersk-blue" : "text-emerald-600"
            )}>Active</span>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="relative z-10">
        <div className="space-y-12 px-10 py-12">
          {/* Section: Terminals */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-maersk-dark">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Navigation className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">Network Nodes</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent ml-6" />
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-4">
                <Label htmlFor="originTerminal" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Origin Terminal</Label>
                <Select
                  value={cycyRequest.originTerminal}
                  onValueChange={(val) => setCYCYRequest({ originTerminal: val })}
                >
                  <SelectTrigger id="originTerminal" className="bg-slate-50/50 border-slate-200/60 focus:ring-maersk-dark h-16 rounded-[1.25rem] hover:bg-white transition-all duration-300 font-black text-maersk-dark text-xs uppercase tracking-widest shadow-inner">
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 backdrop-blur-xl bg-white/90">
                    {originOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl focus:bg-slate-50 focus:text-maersk-blue">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label htmlFor="destinationTerminal" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Destination Terminal</Label>
                <Select
                  value={cycyRequest.destinationTerminal}
                  onValueChange={(val) => setCYCYRequest({ destinationTerminal: val })}
                >
                  <SelectTrigger id="destinationTerminal" className="bg-slate-50/50 border-slate-200/60 focus:ring-maersk-dark h-16 rounded-[1.25rem] hover:bg-white transition-all duration-300 font-black text-maersk-dark text-xs uppercase tracking-widest shadow-inner">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 backdrop-blur-xl bg-white/90">
                    {destinationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl focus:bg-slate-50 focus:text-maersk-blue">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Cargo */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-maersk-dark">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Box className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">Cargo Specs</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent ml-6" />
            </div>
            
            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-4">
                <Label htmlFor="cycy-containerType" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Container Type</Label>
                <Select
                  value={cycyRequest.containerType}
                  onValueChange={(val) => setCYCYRequest({ containerType: val as ContainerType })}
                >
                  <SelectTrigger id="cycy-containerType" className="bg-slate-50/50 border-slate-200/60 focus:ring-maersk-dark h-16 rounded-[1.25rem] hover:bg-white transition-all duration-300 font-black text-maersk-dark text-xs uppercase tracking-widest shadow-inner">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2 backdrop-blur-xl bg-white/90">
                    {['20DC', '40DC', '40HC', '20RF', '40RF', 'IMO'].map(type => (
                      <SelectItem key={type} value={type} className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] py-4 rounded-xl focus:bg-slate-50",
                        type === 'IMO' ? "text-rose-600 focus:text-rose-700" : "text-maersk-dark focus:text-maersk-blue"
                      )}>
                        {type} {type.includes('RF') ? 'Reefer' : type === 'IMO' ? 'Hazardous' : 'Dry'}
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
              <div className="flex items-center space-x-4 text-maersk-dark">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <History className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.4em]">Timeline</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-100 to-transparent ml-6" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="space-y-4">
                <Label htmlFor="cycy-date" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Date</Label>
                <div className="relative group/input">
                  <div className="absolute -inset-1 bg-gradient-to-r from-maersk-blue/20 to-emerald-500/20 rounded-[1.5rem] blur opacity-0 group-focus-within/input:opacity-100 transition duration-500" />
                  <div className="relative">
                    <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within/input:text-maersk-dark transition-colors duration-300" />
                    <Input
                      id="cycy-date"
                      type="date"
                      value={cycyRequest.date}
                      onChange={(e) => setCYCYRequest({ date: e.target.value })}
                      required
                      className="pl-14 bg-slate-50/50 border-slate-200/60 focus-visible:ring-maersk-dark h-16 rounded-[1.25rem] transition-all duration-300 hover:bg-white font-black text-xs uppercase tracking-widest shadow-inner"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <Label htmlFor="cycy-time" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target Time</Label>
                <div className="relative group/input">
                  <div className="absolute -inset-1 bg-gradient-to-r from-maersk-blue/20 to-emerald-500/20 rounded-[1.5rem] blur opacity-0 group-focus-within/input:opacity-100 transition duration-500" />
                  <div className="relative">
                    <Clock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within/input:text-maersk-dark transition-colors duration-300" />
                    <Input
                      id="cycy-time"
                      type="time"
                      value={cycyRequest.time}
                      onChange={(e) => setCYCYRequest({ time: e.target.value })}
                      required
                      className="pl-14 bg-slate-50/50 border-slate-200/60 focus-visible:ring-maersk-dark h-16 rounded-[1.25rem] transition-all duration-300 hover:bg-white font-black text-xs uppercase tracking-widest shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-8 px-10 py-12 bg-maersk-dark relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />
          <div className="flex items-center justify-between w-full relative z-10">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={resetCYCY} 
              className="text-white/30 hover:text-white hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] h-12 px-6 transition-all duration-300"
            >
              Reset System
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-white hover:bg-slate-50 text-maersk-dark shadow-[0_20px_50px_-10px_rgba(255,255,255,0.1)] px-12 h-20 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all duration-500 hover:scale-[1.05] active:scale-[0.95] group overflow-hidden relative"
            >
              <div className={cn(
                "absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out",
                cycyRequest.direction === 'Import' ? "bg-maersk-blue" : "bg-emerald-500"
              )} />
              <div className="relative z-10 flex items-center group-hover:text-white transition-colors duration-500">
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
            <div className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-colors duration-700",
              cycyRequest.direction === 'Import' ? "bg-maersk-blue" : "bg-emerald-500"
            )} />
            <span>CY/CY Network Optimization Active</span>
          </div>
        </div>
      </form>
    </div>
  );
}
