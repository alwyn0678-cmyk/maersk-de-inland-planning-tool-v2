import { ImportResult, ExportResult } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Info, AlertTriangle, CheckCircle2, Copy, Train, Ship as ShipIcon, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface ResultCardProps {
  type: 'import' | 'export';
  result: ImportResult | ExportResult | null;
}

export function ResultCard({ type, result }: ResultCardProps) {
  if (!result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full text-slate-400 p-20 border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/30 backdrop-blur-xl relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-dot-grid opacity-50" />
        <div className="p-8 bg-white rounded-3xl mb-8 shadow-2xl shadow-slate-200/50 relative z-10 group-hover:scale-110 transition-transform duration-700">
          <Info className="h-12 w-12 text-maersk-blue" />
        </div>
        <p className="text-3xl font-black text-maersk-dark tracking-tighter uppercase italic relative z-10">Awaiting <span className="text-maersk-blue not-italic">Parameters</span></p>
        <p className="text-xs font-black text-slate-400 text-center max-w-xs mt-4 leading-relaxed uppercase tracking-[0.2em] relative z-10 opacity-70">
          Configure the {type} parameters on the left and calculate to generate feasible inland routing options.
        </p>
      </motion.div>
    );
  }

  const isImport = type === 'import';
  const importRes = result as ImportResult;
  const exportRes = result as ExportResult;

  const handleCopy = () => {
    const text = isImport
      ? `Import Plan Summary\nEmpty Return: ${importRes.emptyReturnDepot}\nOptions:\n${importRes.feasibleDepartures.map(d => `- ${d.terminal.name} via ${d.schedule.mode}: Arrives ${format(d.arrivalDate, 'dd.MM.yyyy')}, Delivers ${format(d.deliveryDate, 'dd.MM.yyyy')}`).join('\n')}`
      : `Export Plan Summary\nEmpty Release: ${exportRes.emptyReleaseDepot}\nOptions:\n${exportRes.feasibleDepartures.map(d => `- ${d.terminal.name} via ${d.schedule.mode}: Departs ${format(d.departureDate, 'dd.MM.yyyy')}, CCO ${format(d.earliestVesselCco, 'dd.MM.yyyy')}`).join('\n')}`;
    
    navigator.clipboard.writeText(text);
  };

  if (result.warnings.length > 0 && result.feasibleDepartures.length === 0) {
    return (
      <Alert variant="destructive" className="bg-rose-50 border-rose-100 text-rose-900 rounded-[2.5rem] p-10 shadow-2xl shadow-rose-500/10 border-2">
        <div className="flex items-start space-x-6">
          <div className="p-4 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/30">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <div>
            <AlertTitle className="text-3xl font-black mb-4 tracking-tighter uppercase italic">No Feasible <span className="text-rose-500 not-italic">Options</span></AlertTitle>
            <AlertDescription className="text-rose-700">
              <ul className="space-y-3 font-bold text-sm">
                {result.warnings.map((w, i) => (
                  <li key={i} className="flex items-center space-x-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
        <div className="relative">
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-maersk-blue rounded-full opacity-50" />
          <h3 className="text-4xl font-black text-maersk-dark tracking-tighter uppercase italic">
            Feasible <span className="text-maersk-blue not-italic">{isImport ? 'Delivery' : 'Departure'}</span>
          </h3>
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2">Found {result.feasibleDepartures.length} optimal routes for your request.</p>
        </div>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={handleCopy} 
          className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl px-8 h-14 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-sm hover:shadow-xl active:scale-95"
        >
          <Copy className="h-4 w-4 mr-3" />
          Copy Summary
        </Button>
      </div>

      {result.warnings.length > 0 && (
        <Alert className="bg-amber-50/50 border-amber-100 text-amber-900 rounded-[2.5rem] p-8 shadow-xl shadow-amber-500/5 backdrop-blur-sm border-2">
          <div className="flex items-start space-x-5">
            <div className="p-3 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/20">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <AlertTitle className="font-black text-amber-900 uppercase tracking-widest text-sm mb-2">Operational Warnings</AlertTitle>
              <AlertDescription className="text-amber-700 text-xs font-bold">
                <ul className="space-y-2">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <div className="h-1 w-1 rounded-full bg-amber-400" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <div className="grid gap-10">
        {result.feasibleDepartures.slice(0, 3).map((dep, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15, duration: 0.6 }}
          >
            <div className={cn(
              "bento-card p-0 overflow-hidden group/card relative",
              dep.isRecommended ? "ring-2 ring-maersk-blue shadow-[0_40px_80px_-20px_rgba(66,176,213,0.15)]" : ""
            )}>
              <div className="flex flex-col lg:flex-row">
                {/* Left Column: Terminal & Mode */}
                <div className={cn(
                  "p-10 lg:w-1/3 flex flex-col justify-center relative overflow-hidden transition-all duration-700",
                  dep.isRecommended ? "bg-maersk-dark text-white" : "bg-slate-50/50 text-maersk-dark"
                )}>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={cn(
                        "p-3.5 rounded-2xl shadow-2xl transition-transform duration-500 group-hover/card:scale-110",
                        dep.isRecommended ? "bg-white/10 ring-1 ring-white/20" : "bg-white shadow-slate-200/50 ring-1 ring-slate-100"
                      )}>
                        {dep.schedule.mode === 'Rail' ? <Train className="h-6 w-6" /> : <ShipIcon className="h-6 w-6" />}
                      </div>
                      <span className={cn(
                        "font-black text-[10px] uppercase tracking-[0.3em]",
                        dep.isRecommended ? "text-maersk-blue" : "text-slate-400"
                      )}>{dep.schedule.mode}</span>
                    </div>
                    <div className="text-4xl font-black tracking-tighter mb-3 uppercase italic">{dep.terminal.name}</div>
                    <div className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em] opacity-60",
                      dep.isRecommended ? "text-slate-300" : "text-slate-500"
                    )}>Transit: {dep.schedule.transitDays} days</div>
                  </div>
                  
                  {dep.isRecommended && (
                    <div className="absolute top-6 right-6">
                      <Badge className="bg-maersk-blue text-white border-none font-black text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-[0_10px_20px_rgba(66,176,213,0.4)]">RECOMMENDED</Badge>
                    </div>
                  )}
                  
                  {/* Decorative background icon */}
                  <div className="absolute -bottom-12 -right-12 opacity-[0.04] pointer-events-none group-hover/card:scale-125 transition-transform duration-1000">
                    {dep.schedule.mode === 'Rail' ? <Train className="h-64 w-64" /> : <ShipIcon className="h-64 w-64" />}
                  </div>
                </div>

                {/* Right Column: Dates & Deadlines */}
                <div className="p-10 lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-10 bg-white relative">
                  <div className="absolute inset-0 bg-dot-grid opacity-[0.03]" />
                  
                  {isImport ? (
                    <>
                      <div className="space-y-2 relative z-10">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Depot Arrival</div>
                        <div className="text-xl font-black text-maersk-dark font-mono tracking-tight">{format(dep.arrivalDate, 'EEE, dd MMM yyyy')}</div>
                      </div>
                      <div className="space-y-2 relative z-10">
                        <div className="text-[10px] font-black text-maersk-blue uppercase tracking-[0.3em]">Customer Delivery</div>
                        <div className="text-xl font-black text-emerald-600 font-mono flex items-center tracking-tight">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 mr-3 animate-pulse" />
                          {format((dep as any).deliveryDate, 'EEE, dd MMM yyyy')}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2 relative z-10">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Terminal Departure</div>
                        <div className="text-xl font-black text-maersk-dark font-mono tracking-tight">{format(dep.departureDate, 'EEE, dd MMM yyyy')}</div>
                      </div>
                      <div className="space-y-2 relative z-10">
                        <div className="text-[10px] font-black text-maersk-blue uppercase tracking-[0.3em]">Earliest Vessel CCO</div>
                        <div className="text-xl font-black text-blue-600 font-mono flex items-center tracking-tight">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mr-3 animate-pulse" />
                          {format((dep as any).earliestVesselCco, 'EEE, dd MMM yyyy')}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="col-span-1 sm:col-span-2 pt-10 mt-2 border-t border-slate-100 flex flex-wrap gap-x-16 gap-y-6 relative z-10">
                    <div className="flex items-center space-x-4 group/item">
                      <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner group-hover/item:bg-white group-hover/item:shadow-xl transition-all duration-300">
                        <Clock className="h-5 w-5 text-slate-400 group-hover/item:text-maersk-blue transition-colors" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-2">Order Deadline</p>
                        <p className="text-sm font-black text-maersk-dark uppercase tracking-tight">{format(dep.orderDeadline, 'dd.MM.yyyy')}</p>
                      </div>
                    </div>
                    {dep.customsDeadline && (
                      <div className="flex items-center space-x-4 group/item">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner group-hover/item:bg-white group-hover/item:shadow-xl transition-all duration-300">
                          <FileText className="h-5 w-5 text-slate-400 group-hover/item:text-maersk-blue transition-colors" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-2">Customs Deadline</p>
                          <p className="text-sm font-black text-maersk-dark uppercase tracking-tight">{format(dep.customsDeadline, 'dd.MM.yyyy')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bento-card bg-maersk-dark p-0 overflow-hidden relative group shadow-[0_40px_80px_-20px_rgba(0,36,61,0.4)]">
        <div className="absolute inset-0 bg-dot-grid opacity-[0.05]" />
        <div className="p-10 flex flex-col sm:flex-row items-center justify-between relative z-10 gap-10">
          <div className="flex items-center space-x-6">
            <div className="h-20 w-20 rounded-[2rem] bg-white/5 backdrop-blur-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-700 shadow-2xl">
              <ShipIcon className="h-10 w-10 text-maersk-blue" />
            </div>
            <div>
              <p className="text-[10px] font-black text-maersk-blue uppercase tracking-[0.4em] mb-3">{isImport ? 'Empty Return Depot' : 'Empty Release Depot'}</p>
              <p className="text-4xl font-black text-white tracking-tighter uppercase italic">{isImport ? importRes.emptyReturnDepot : exportRes.emptyReleaseDepot}</p>
            </div>
          </div>
          
          {!isImport && exportRes.rankedDepots.length > 1 && (
            <div className="text-right">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Alternative Depots</p>
              <div className="flex gap-3">
                {exportRes.rankedDepots.slice(1, 3).map((d, i) => (
                  <Badge key={i} variant="outline" className="bg-white/5 border-white/10 text-slate-300 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
                    {d.depot}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

