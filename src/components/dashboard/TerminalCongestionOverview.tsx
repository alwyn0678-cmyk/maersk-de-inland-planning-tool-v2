import React from 'react';
import { motion } from 'motion/react';
import { Anchor, Clock, Download, Upload, AlertCircle, CheckCircle2, Info, Activity, Ship, Gauge, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { usePlannerStore, TerminalCongestion } from '../../store/usePlannerStore';
import * as XLSX from 'xlsx';

export function TerminalCongestionOverview() {
  const { terminalCongestionData, setTerminalCongestionData } = usePlannerStore();

  const handleExport = () => {
    const dataToExport = terminalCongestionData.map(item => ({
      Port: item.port,
      Terminal: item.terminal,
      'Waiting Time (Hours)': item.waitingTime,
      Status: item.status,
      'Last Updated': item.lastUpdated
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Terminal Congestion');
    XLSX.writeFile(workbook, 'Terminal_Congestion_Overview.xlsx');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const updatedData: TerminalCongestion[] = jsonData.map((row, idx) => ({
        id: `upd-${idx}`,
        port: row.Port as 'Rotterdam' | 'Antwerp',
        terminal: row.Terminal,
        waitingTime: Number(row['Waiting Time (Hours)']),
        status: row.Status as 'Low' | 'Medium' | 'High',
        lastUpdated: new Date().toISOString()
      }));

      if (updatedData.length > 0) {
        setTerminalCongestionData(updatedData);
      }
    };
    reader.readAsArrayBuffer(file);
  };

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
    <Card className="lg:col-span-12 border-none bg-maersk-dark shadow-2xl overflow-hidden group rounded-[3rem]">
      <CardHeader className="pb-10 border-b border-white/10 bg-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
          <Ship className="h-64 w-64 text-white rotate-12" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-maersk-blue rounded-[1.5rem] shadow-2xl shadow-maersk-blue/40 ring-4 ring-white/10">
              <Anchor className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tighter text-white drop-shadow-md">Terminal Barge Congestion</CardTitle>
              <CardDescription className="text-maersk-blue font-black uppercase tracking-[0.3em] text-[10px] mt-1">Real-time Network Latency Monitor</CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 rounded-2xl p-1.5 border border-white/10">
              <Button 
                onClick={handleExport}
                variant="ghost" 
                className="rounded-xl font-black text-[10px] uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all h-10 px-5"
              >
                <Download className="h-3.5 w-3.5 mr-2" />
                Extract
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Button 
                  variant="ghost" 
                  className="rounded-xl font-black text-[10px] uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all h-10 px-5"
                >
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
            <Badge className="bg-emerald-500 text-white border-none shadow-lg shadow-emerald-500/20 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">
              <Activity className="h-3 w-3 mr-2 animate-pulse" />
              Active Sync
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid lg:grid-cols-2 divide-x divide-white/10">
          {/* Rotterdam Section */}
          <div className="p-12 space-y-10 bg-gradient-to-br from-maersk-dark to-[#002a4a]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-maersk-blue/20 rounded-2xl border border-maersk-blue/30">
                  <Globe className="h-6 w-6 text-maersk-blue" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Rotterdam Hub</h3>
                  <p className="text-[10px] font-bold text-maersk-blue uppercase tracking-widest">Main Port Operations</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white tracking-tighter">{avgRotterdam}h</div>
                <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">Avg. Wait Time</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {rotterdamTerminals.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-maersk-blue/50 hover:bg-white/10 transition-all duration-500 group/card relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                    <Gauge className="h-12 w-12 text-white" />
                  </div>
                  
                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <span className="text-xs font-black text-maersk-blue uppercase tracking-[0.2em]">{item.terminal}</span>
                    <Badge className={cn("font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border-none shadow-lg", getStatusColor(item.status))}>
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-baseline space-x-2 mb-8 relative z-10">
                    <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{item.waitingTime}</span>
                    <span className="text-lg font-bold text-white/40 uppercase tracking-widest">Hrs</span>
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
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
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/30">
                      <span>0h</span>
                      <span>48h+</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Antwerp Section */}
          <div className="p-12 space-y-10 bg-gradient-to-bl from-maersk-dark to-[#003559]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-[#42b0d5]/20 rounded-2xl border border-[#42b0d5]/30">
                  <Anchor className="h-6 w-6 text-[#42b0d5]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Antwerp Hub</h3>
                  <p className="text-[10px] font-bold text-[#42b0d5] uppercase tracking-widest">Secondary Port Operations</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white tracking-tighter">{avgAntwerp}h</div>
                <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">Avg. Wait Time</div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {antwerpTerminals.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (i + 4) * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#42b0d5]/50 hover:bg-white/10 transition-all duration-500 group/card relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                    <Gauge className="h-12 w-12 text-white" />
                  </div>

                  <div className="flex items-start justify-between mb-8 relative z-10">
                    <span className="text-xs font-black text-[#42b0d5] uppercase tracking-[0.2em]">{item.terminal}</span>
                    <Badge className={cn("font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border-none shadow-lg", getStatusColor(item.status))}>
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-baseline space-x-2 mb-8 relative z-10">
                    <span className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">{item.waitingTime}</span>
                    <span className="text-lg font-bold text-white/40 uppercase tracking-widest">Hrs</span>
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
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
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/30">
                      <span>0h</span>
                      <span>48h+</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Advisory */}
        <div className="p-8 bg-white/5 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30">
              <AlertCircle className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-xs font-bold text-white/70 max-w-2xl leading-relaxed">
              <span className="text-rose-500 font-black uppercase tracking-widest mr-2">Critical Alert:</span>
              ECT Delta is experiencing severe bunching. Estimated waiting times have increased by <span className="text-white font-black">12%</span> in the last 24 hours. Consider rail diversion for time-sensitive cargo.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
            <Info className="h-4 w-4 text-maersk-blue" />
            Last Sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

