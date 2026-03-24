import { CYCYResult } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info, AlertTriangle, CheckCircle2, Copy, Train, Ship as ShipIcon, Clock, ArrowRightLeft, Box } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface CYCYResultCardProps {
  result: CYCYResult | null;
}

export function CYCYResultCard({ result }: CYCYResultCardProps) {
  if (!result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full text-slate-400 p-16 bento-card bg-white/40 backdrop-blur-md relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-dot-grid opacity-10" />
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-maersk-blue/5 rounded-full blur-3xl group-hover:bg-maersk-blue/10 transition-colors duration-700" />
        
        <div className="p-8 bg-white rounded-[2rem] mb-8 shadow-2xl shadow-slate-200/50 relative z-10 group-hover:scale-110 transition-transform duration-500">
          <Info className="h-14 w-14 text-maersk-blue animate-pulse" />
        </div>
        <h3 className="text-3xl font-black text-maersk-dark tracking-tighter uppercase italic relative z-10">Awaiting <span className="text-maersk-blue">Parameters</span></h3>
        <p className="text-sm text-slate-500 text-center max-w-xs mt-4 leading-relaxed font-medium relative z-10">
          Configure the CY/CY parameters on the left and calculate to generate feasible inland routing options.
        </p>
      </motion.div>
    );
  }

  const handleCopy = () => {
    const text = `CY/CY Plan Summary\nOptions:\n${result.feasibleDepartures.map(d => `- ${d.origin} to ${d.destination} via ${d.type}: Departs ${format(d.departure, 'dd.MM.yyyy')}, Arrives ${format(d.arrival, 'dd.MM.yyyy')}`).join('\n')}`;
    navigator.clipboard.writeText(text);
  };

  if (result.warnings.length > 0 && result.feasibleDepartures.length === 0) {
    return (
      <div className="bento-card bg-rose-50/50 border-rose-100/50 p-10 relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl" />
        <div className="flex items-start space-x-6 relative z-10">
          <div className="p-4 bg-rose-500 rounded-2xl shadow-xl shadow-rose-500/20 group-hover:scale-110 transition-transform duration-500">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-black text-rose-900 tracking-tighter uppercase italic mb-4">No Feasible <span className="text-rose-600">Options</span> Found</h4>
            <ul className="space-y-3">
              {result.warnings.map((w, i) => (
                <li key={i} className="flex items-center space-x-3 text-rose-700/80 font-bold text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pb-6 border-b border-slate-100/50">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-1 w-8 bg-maersk-blue rounded-full" />
            <span className="text-[10px] font-black text-maersk-blue uppercase tracking-[0.4em]">Optimization Results</span>
          </div>
          <h3 className="text-4xl font-black text-maersk-dark tracking-tighter uppercase italic">
            Feasible <span className="text-maersk-blue">Network</span> Options
          </h3>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mt-2">Found {result.feasibleDepartures.length} optimal routes for your request.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy} 
          className="bg-white border-slate-200/60 text-maersk-dark hover:bg-slate-50 rounded-2xl px-6 h-14 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group"
        >
          <Copy className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform" />
          Copy Summary
        </Button>
      </div>

      <div className="grid gap-8">
        {result.feasibleDepartures.map((dep, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15, duration: 0.8, ease: "easeOut" }}
          >
            <div className={cn(
              "bento-card group overflow-hidden transition-all duration-500 border-none relative",
              dep.isRecommended ? "ring-2 ring-maersk-blue ring-offset-4" : "hover:shadow-2xl hover:-translate-y-2"
            )}>
              <div className="flex flex-col lg:flex-row">
                {/* Left Column: Mode & Route */}
                <div className={cn(
                  "p-10 lg:w-2/5 flex flex-col justify-center relative overflow-hidden transition-all duration-500",
                  dep.isRecommended ? "bg-maersk-dark text-white" : "bg-slate-50/80 text-maersk-dark"
                )}>
                  {/* Decorative Background Icon */}
                  <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    {dep.type === 'Rail' ? <Train className="h-48 w-48" /> : <ShipIcon className="h-48 w-48" />}
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-8">
                      <div className={cn(
                        "p-3 rounded-2xl shadow-xl transition-transform duration-500 group-hover:scale-110",
                        dep.isRecommended ? "bg-white/10 shadow-black/20" : "bg-white shadow-slate-200/50"
                      )}>
                        {dep.type === 'Rail' ? <Train className="h-6 w-6" /> : <ShipIcon className="h-6 w-6" />}
                      </div>
                      <span className={cn(
                        "font-black text-[10px] uppercase tracking-[0.3em]",
                        dep.isRecommended ? "text-maersk-blue" : "text-slate-400"
                      )}>{dep.type}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-3xl font-black tracking-tighter uppercase italic">{dep.origin}</div>
                      <div className="flex items-center space-x-4">
                        <div className="h-px w-12 bg-maersk-blue/30" />
                        <ArrowRightLeft className="h-5 w-5 text-maersk-blue animate-pulse" />
                        <div className="h-px w-12 bg-maersk-blue/30" />
                      </div>
                      <div className="text-3xl font-black tracking-tighter uppercase italic">{dep.destination}</div>
                    </div>
                  </div>
                  
                  {dep.isRecommended && (
                    <div className="absolute top-6 right-6">
                      <div className="bg-maersk-blue text-white text-[9px] font-black px-4 py-2 rounded-full shadow-2xl shadow-maersk-blue/40 tracking-[0.2em] animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/20 to-transparent">
                        RECOMMENDED
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Dates & Capacity */}
                <div className="p-10 lg:w-3/5 grid grid-cols-1 sm:grid-cols-2 gap-10 bg-white/40 relative">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-slate-300" />
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Departure</div>
                    </div>
                    <div className="text-xl font-black text-maersk-dark font-mono tracking-tight">{format(dep.departure, 'EEE, dd MMM yyyy')}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Arrival</div>
                    </div>
                    <div className="text-xl font-black text-emerald-600 font-mono tracking-tight flex items-center">
                      {format(dep.arrival, 'EEE, dd MMM yyyy')}
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 pt-10 mt-2 border-t border-slate-100/50 flex flex-wrap gap-x-16 gap-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-white transition-colors duration-300">
                        <Box className="h-5 w-5 text-slate-400 group-hover:text-maersk-blue transition-colors duration-300" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Available Capacity</p>
                        <div className="flex items-center space-x-3">
                          <p className="text-lg font-black text-maersk-dark italic">{dep.capacity}%</p>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-maersk-blue transition-all duration-1000 ease-out" 
                              style={{ width: `${dep.capacity}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-white transition-colors duration-300">
                        <Clock className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors duration-300" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">System Status</p>
                        <p className="text-lg font-black text-emerald-600 italic uppercase tracking-tighter">{dep.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
