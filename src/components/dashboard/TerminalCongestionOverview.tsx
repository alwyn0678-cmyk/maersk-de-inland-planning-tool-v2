import React from 'react';
import { motion } from 'motion/react';
import { Anchor, CheckCircle2, Info, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { usePlannerStore } from '../../store/usePlannerStore';

export function TerminalCongestionOverview() {
  const terminalCongestionData = usePlannerStore(s => s.terminalCongestionData);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Low': return 'bg-emerald-500 text-white';
      case 'Medium': return 'bg-amber-500 text-white';
      case 'High': return 'bg-rose-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const rotterdamTerminals = terminalCongestionData.filter(t => t.port === 'Rotterdam');
  const antwerpTerminals = terminalCongestionData.filter(t => t.port === 'Antwerp');

  const avgRotterdam = Math.round(rotterdamTerminals.reduce((acc, curr) => acc + curr.waitingTime, 0) / rotterdamTerminals.length);
  const avgAntwerp = Math.round(antwerpTerminals.reduce((acc, curr) => acc + curr.waitingTime, 0) / antwerpTerminals.length);

  return (
    <Card className="lg:col-span-12 border-none bg-maersk-dark shadow-xl overflow-hidden group rounded-2xl">
      <CardHeader className="pb-4 pt-4 border-b border-white/10 bg-white/5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-maersk-blue rounded-lg shadow-lg shadow-maersk-blue/40">
              <Anchor className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-black tracking-tighter text-white drop-shadow-md">Terminal Barge Congestion</CardTitle>
              <CardDescription className="text-maersk-blue font-black uppercase tracking-[0.25em] text-[9px] mt-0.5">Real-time Network Latency Monitor</CardDescription>
            </div>
          </div>

        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 divide-x divide-white/10">
          {/* Rotterdam Section */}
          <div className="p-4 space-y-3 bg-gradient-to-br from-maersk-dark to-[#002a4a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-maersk-blue/20 rounded-lg border border-maersk-blue/30">
                  <Globe className="h-3.5 w-3.5 text-maersk-blue" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight uppercase">Rotterdam Hub</h3>
                  <p className="text-[8px] font-bold text-maersk-blue uppercase tracking-widest">Main Port Operations</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-white tracking-tighter">{avgRotterdam}h</div>
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Avg. Wait</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {rotterdamTerminals.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-maersk-blue/50 hover:bg-white/10 transition-all duration-200 group/card relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-2 relative z-10">
                    <span className="text-[9px] font-black text-maersk-blue uppercase tracking-wider leading-tight pr-2">{item.terminal}</span>
                    <Badge className={cn("font-black text-[8px] uppercase tracking-widest px-1.5 py-0 rounded-md border-none flex-none", getStatusColor(item.status))}>
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex items-baseline space-x-1 mb-2 relative z-10">
                    <span className="text-xl font-black text-white tracking-tighter">{item.waitingTime}</span>
                    <span className="text-xs font-bold text-white/40 uppercase">hrs</span>
                  </div>

                  <div className="space-y-1 relative z-10">
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((item.waitingTime / 48) * 100, 100)}%` }}
                        className={cn(
                          "h-full rounded-full",
                          item.status === 'High' ? 'bg-rose-500' :
                          item.status === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/30">
                      <span>0h</span>
                      <span>48h+</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Antwerp Section */}
          <div className="p-4 space-y-3 bg-gradient-to-bl from-maersk-dark to-[#003559]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-[#42b0d5]/20 rounded-lg border border-[#42b0d5]/30">
                  <Anchor className="h-3.5 w-3.5 text-[#42b0d5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight uppercase">Antwerp Hub</h3>
                  <p className="text-[8px] font-bold text-[#42b0d5] uppercase tracking-widest">Secondary Port Operations</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-white tracking-tighter">{avgAntwerp}h</div>
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Avg. Wait</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {antwerpTerminals.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (i + 4) * 0.08 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#42b0d5]/50 hover:bg-white/10 transition-all duration-200 group/card relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-2 relative z-10">
                    <span className="text-[9px] font-black text-[#42b0d5] uppercase tracking-wider leading-tight pr-2">{item.terminal}</span>
                    <Badge className={cn("font-black text-[8px] uppercase tracking-widest px-1.5 py-0 rounded-md border-none flex-none", getStatusColor(item.status))}>
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex items-baseline space-x-1 mb-2 relative z-10">
                    <span className="text-xl font-black text-white tracking-tighter">{item.waitingTime}</span>
                    <span className="text-xs font-bold text-white/40 uppercase">hrs</span>
                  </div>

                  <div className="space-y-1 relative z-10">
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((item.waitingTime / 48) * 100, 100)}%` }}
                        className={cn(
                          "h-full rounded-full",
                          item.status === 'High' ? 'bg-rose-500' :
                          item.status === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/30">
                      <span>0h</span>
                      <span>48h+</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-white/5 border-t border-white/10 flex items-center justify-end">
          <div className="flex items-center space-x-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
            <Info className="h-3.5 w-3.5 text-maersk-blue" />
            Upload: Terminal + Waiting Hours only — Low ≤8h · Medium ≤24h · High &gt;24h (auto-classified)
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

