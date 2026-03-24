import { CYCYResult } from '../../types';
import { Badge } from '../ui/badge';
import { Info, AlertTriangle, CheckCircle2, Copy, Train, Ship as ShipIcon, Clock, ArrowRight, Box } from 'lucide-react';
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
      <div className="p-8 text-center bg-slate-50/60 border border-slate-100 rounded-2xl">
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Configure terminals, cargo & date — then run the optimizer</p>
      </div>
    );
  }

  const handleCopy = () => {
    const text = `CY/CY Plan Summary\nOptions:\n${result.feasibleDepartures.map(d => `- ${d.origin} to ${d.destination} via ${d.type}: Departs ${format(d.departure, 'dd.MM.yyyy')}, Arrives ${format(d.arrival, 'dd.MM.yyyy')}`).join('\n')}`;
    navigator.clipboard.writeText(text);
  };

  if (result.warnings.length > 0 && result.feasibleDepartures.length === 0) {
    return (
      <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-4">
        <div className="p-2 bg-rose-500 rounded-xl shadow-md">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-black text-rose-900 tracking-tight uppercase mb-2">No Feasible Options Found</h4>
          <ul className="space-y-1.5">
            {result.warnings.map((w, i) => (
              <li key={i} className="flex items-center space-x-2 text-rose-700/80 font-bold text-sm">
                <div className="h-1 w-1 rounded-full bg-rose-400" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-maersk-dark tracking-tight uppercase">
            Feasible <span className="text-maersk-blue">Network</span> Options
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            {result.feasibleDepartures.length} optimal routes found
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-4 h-9 font-black text-[10px] uppercase tracking-widest"
        >
          <Copy className="h-3.5 w-3.5 mr-2" />
          Copy
        </Button>
      </div>

      <div className="grid gap-3">
        {result.feasibleDepartures.map((dep, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.4 }}
          >
            <div className={cn(
              "rounded-2xl overflow-hidden border transition-all duration-300",
              dep.isRecommended
                ? "border-maersk-blue/30 shadow-md shadow-maersk-blue/10"
                : "border-slate-100 shadow-sm hover:shadow-md"
            )}>
              {/* Header gradient */}
              <div className={cn(
                "px-5 py-3 flex items-center justify-between",
                dep.type === 'Barge'
                  ? "bg-gradient-to-r from-[#00243d] via-[#00315a] to-maersk-blue/80"
                  : "bg-gradient-to-r from-purple-950 via-purple-900 to-purple-700"
              )}>
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 bg-white/10 rounded-lg">
                    {dep.type === 'Barge' ? <ShipIcon className="h-4 w-4 text-white" /> : <Train className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{dep.type}</p>
                    <div className="flex items-center space-x-2 text-sm font-black text-white tracking-tight">
                      <span>{dep.origin}</span>
                      <ArrowRight className="h-3 w-3 text-white/50" />
                      <span>{dep.destination}</span>
                    </div>
                  </div>
                </div>
                {dep.isRecommended && (
                  <Badge className="bg-white/20 text-white border-none text-[9px] font-black uppercase tracking-widest px-2 py-1">
                    Recommended
                  </Badge>
                )}
              </div>

              {/* Body */}
              <div className="bg-white px-5 py-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Departure</p>
                  <p className="text-sm font-black text-maersk-dark">{format(dep.departure, 'EEE, dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Arrival</p>
                  <p className="text-sm font-black text-emerald-600">{format(dep.arrival, 'EEE, dd MMM yyyy')}</p>
                </div>
                <div className="col-span-2 pt-3 border-t border-slate-100 flex items-center gap-6">
                  <div className="flex items-center space-x-3">
                    <Box className="h-4 w-4 text-slate-300" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capacity</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-maersk-dark">{dep.capacity}%</p>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-maersk-blue rounded-full" style={{ width: `${dep.capacity}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                      <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">{dep.status}</p>
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
