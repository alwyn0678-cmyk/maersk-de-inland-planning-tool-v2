import { useState, useEffect } from 'react';
import { useRhineWaterLevels } from '../../hooks/useRhineWaterLevels';
import { motion } from 'motion/react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { StatsOverview } from './StatsOverview';
import { TerminalCongestionOverview } from './TerminalCongestionOverview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { 
  TrendingUp, 
  TrendingDown,
  Map as MapIcon, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  Activity,
  Calendar,
  Package,
  Globe,
  Zap,
  Ship,
  Anchor,
  Newspaper,
  Waves,
  Timer,
  Truck,
  ChevronRight,
  Info,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Download,
  Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const getWeekNumber = (d: Date) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

const allDays = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  const day = d.getDay();
  // Find current Monday (or last Monday if today is weekend)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  
  const currentDay = new Date(monday);
  currentDay.setDate(monday.getDate() + i);
  return currentDay;
}).filter(d => d.getDay() !== 0 && d.getDay() !== 6).slice(0, 15);

const days = allDays.map(d => ({
  date: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
  dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
  weekNum: getWeekNumber(d)
}));

// waterLevelData is now fetched live via useRhineWaterLevels hook

export function DashboardOverview() {
  const { setActiveTab, setExportRequest, truckCapacityData, setTruckCapacityData } = usePlannerStore();
  const { data: waterLevelData, loading: waterLoading, lastRefresh } = useRhineWaterLevels(5 * 60 * 1000);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookingInfo, setBookingInfo] = useState({
    zipcode: '',
    containerType: '40HC',
    loadPort: 'Rotterdam'
  });

  const handleDayClick = (day: any, status: number) => {
    if (status === 1) {
      setSelectedDay(day);
      setIsDialogOpen(true);
    }
  };

  const handleDownloadTemplate = () => {
    const data = truckCapacityData.map(hub => {
      const row: any = { Hub: hub.location };
      hub.forecast.forEach((status, i) => {
        row[`${days[i].dayName} ${days[i].date}`] = status === 1 ? 'Available' : 'Booked Out';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Capacity Forecast");
    XLSX.writeFile(workbook, "Maersk_Truck_Capacity_Forecast.xlsx");
  };

  const handleUploadExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const updatedData = jsonData.map(row => {
        const location = row.Hub;
        const forecast = days.map(day => {
          const val = row[`${day.dayName} ${day.date}`];
          return val === 'Available' ? 1 : 0;
        });
        return { location, forecast };
      });

      if (updatedData.length > 0) {
        setTruckCapacityData(updatedData);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmBooking = () => {
    setExportRequest({
      postcode: bookingInfo.zipcode,
      containerType: bookingInfo.containerType as any,
      portTerminal: bookingInfo.loadPort as any,
      loadingDate: new Date(new Date().getFullYear(), parseInt(selectedDay.date.split('/')[1]) - 1, parseInt(selectedDay.date.split('/')[0])).toISOString().split('T')[0]
    });
    setIsDialogOpen(false);
    setActiveTab('export');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-maersk-dark flex items-center">
            Export Capacity Germany
            <div className="ml-4 flex items-center">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="ml-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Live System</span>
            </div>
          </h2>
          <p className="text-slate-700 mt-1 font-bold italic">Real-time capacity forecasting and waterway intelligence across the German network.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden xl:flex items-center space-x-6 mr-6 px-6 py-2 bg-white/40 border border-white/20 rounded-2xl shadow-sm">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Network Load</span>
              <span className="text-sm font-black text-maersk-dark">74.2%</span>
            </div>
            <div className="h-8 w-px bg-slate-300" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Active Assets</span>
              <span className="text-sm font-black text-maersk-dark">1,248</span>
            </div>
          </div>
          <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-xl font-bold">
            <Calendar className="h-4 w-4 mr-2" />
            March 2026
          </Button>
          <Button className="bg-maersk-dark text-white hover:bg-maersk-blue shadow-xl shadow-maersk-dark/20 rounded-xl transition-all duration-300 font-bold">
            Export Report
          </Button>
        </div>
      </div>

      <StatsOverview />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Truck Capacity Forecast */}
        <Card className="lg:col-span-12 border-none bg-white/60 backdrop-blur-xl overflow-hidden group rounded-[2.5rem] shadow-xl border border-white/40">
          <CardHeader className="pb-6 border-b border-slate-200/50 bg-white/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-maersk-blue rounded-xl shadow-lg shadow-maersk-blue/30">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight text-maersk-dark">Export Truck Capacity Forecast</CardTitle>
                  <CardDescription className="text-slate-700 font-bold">Predictive 14-day availability across main Rhine hubs.</CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 mr-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownloadTemplate}
                    className="bg-white border-slate-200 text-maersk-dark hover:bg-slate-50 shadow-sm rounded-xl h-10 font-bold px-4 transition-all hover:scale-105"
                  >
                    <Download className="h-4 w-4 mr-2 text-maersk-blue" />
                    Extract Excel
                  </Button>
                  <div className="relative">
                    <input
                      type="file"
                      id="excel-upload"
                      className="hidden"
                      accept=".xlsx, .xls"
                      onChange={handleUploadExcel}
                    />
                    <label 
                      htmlFor="excel-upload"
                      className="inline-flex items-center justify-center whitespace-nowrap text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-50 text-maersk-dark shadow-sm rounded-xl h-10 px-4 cursor-pointer hover:scale-105"
                    >
                      <Upload className="h-4 w-4 mr-2 text-maersk-blue" />
                      Upload Capacity
                    </label>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-[10px] font-black uppercase tracking-widest text-maersk-dark">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-500/50" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-rose-500 mr-2 shadow-sm shadow-rose-500/50" />
                    <span>Booked Out</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-300" />
                <Button variant="ghost" size="sm" className="text-maersk-blue font-black text-xs hover:bg-maersk-blue/5 uppercase tracking-wider">
                  View Heatmap <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-12">
              {truckCapacityData.map((hub) => (
                <div key={hub.location} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative flex h-3 w-3">
                        <span className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          hub.forecast.filter(v => v === 1).length > 10 ? "bg-emerald-400" : "bg-amber-400"
                        )}></span>
                        <span className={cn(
                          "relative inline-flex rounded-full h-3 w-3",
                          hub.forecast.filter(v => v === 1).length > 10 ? "bg-emerald-500" : "bg-amber-500"
                        )}></span>
                      </div>
                      <span className="text-3xl font-black text-maersk-dark tracking-tighter drop-shadow-md">{hub.location}</span>
                    </div>
                    <div className="flex items-center space-x-8">
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.25em]">Capacity</span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-4xl font-black text-maersk-dark tracking-tighter">
                            {Math.round((hub.forecast.filter(v => v === 1).length / 15) * 100)}
                          </span>
                          <span className="text-lg font-black text-slate-700">%</span>
                        </div>
                      </div>
                      <div className="h-12 w-px bg-slate-300" />
                      <Badge variant="secondary" className="bg-maersk-blue text-white border-maersk-blue font-black text-[11px] px-5 py-2 rounded-full shadow-lg">
                        {hub.forecast.filter(v => v === 1).length}/15 DAYS
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-4">
                    {hub.forecast.map((status, i) => (
                      <div key={i} className={cn(
                        "flex flex-col items-center group/day",
                        (i === 5 || i === 10) && "relative" 
                      )}>
                        {(i === 5 || i === 10) && (
                          <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-slate-400 z-0" />
                        )}
                        
                        {/* Week Number */}
                        <div className="h-10 flex items-center justify-center w-full mb-3">
                          {(i === 0 || days[i].weekNum !== days[i-1].weekNum) ? (
                            <span className="text-[11px] font-black text-white bg-maersk-blue px-3 py-1.5 rounded-xl shadow-xl ring-2 ring-white/20">
                              KW {days[i].weekNum}
                            </span>
                          ) : null}
                        </div>
                        
                        {/* Day Name */}
                        <div className="text-[12px] font-black text-maersk-dark mb-3 uppercase tracking-[0.2em] group-hover/day:text-maersk-blue transition-colors drop-shadow-sm">
                          {days[i].dayName.substring(0, 2)}
                        </div>
                        
                        {/* Capacity Block */}
                        <motion.div
                          whileHover={{ y: -6, scale: 1.08, rotate: 2 }}
                          onClick={() => handleDayClick(days[i], status)}
                          className={cn(
                            "w-full h-20 rounded-2xl shadow-xl transition-all duration-300 cursor-pointer border-3 relative overflow-hidden group/block",
                            status === 1 
                              ? "bg-emerald-500 border-emerald-600 hover:bg-emerald-400 shadow-emerald-500/20" 
                              : "bg-rose-500 border-rose-600 hover:bg-rose-400 shadow-rose-500/20"
                          )}
                        >
                          <div className="absolute inset-0 animate-shimmer opacity-0 group-hover/block:opacity-30 transition-opacity duration-500 pointer-events-none" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={cn(
                              "text-xl font-black drop-shadow-xl",
                              "text-white"
                            )}>
                              {days[i].date.split('/')[0]}
                            </span>
                          </div>
                          {status === 1 && (
                            <div className="absolute bottom-2 right-2">
                              <CheckCircle2 className="h-5 w-5 text-white drop-shadow-lg" />
                            </div>
                          )}
                        </motion.div>
                        
                        {/* Date */}
                        <span className="text-[13px] font-black text-maersk-dark mt-4 group-hover/day:text-maersk-blue transition-colors">
                          {days[i].date.split('/')[0]}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(hub.forecast.filter(v => v === 1).length / 15) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full relative",
                        hub.forecast.filter(v => v === 1).length > 10 ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    >
                      <div className="absolute inset-0 animate-shimmer opacity-30" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rhine Water Levels Monitor */}
        <Card className="lg:col-span-12 border-none bg-maersk-dark shadow-2xl overflow-hidden group rounded-[2.5rem]">
          <CardHeader className="pb-6 border-b border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-maersk-blue rounded-lg shadow-lg shadow-maersk-blue/40">
                  <Waves className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black tracking-tight text-white drop-shadow-sm">Rhine Water Levels Monitor</CardTitle>
                  <CardDescription className="text-white/80 font-bold">
                    Live PEGEL data via pegelonline.wsv.de{lastRefresh ? ` · Updated ${lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ' · Connecting...'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className="bg-maersk-blue text-white border-maersk-blue shadow-lg shadow-maersk-blue/20">
                  <Activity className={cn("h-3 w-3 mr-1.5", waterLoading ? "animate-spin" : "animate-pulse")} />
                  {waterLoading ? 'Loading...' : 'Live Sync'}
                </Badge>
                <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {waterLoading ? (
              /* Loading skeleton */
              <div className="grid md:grid-cols-5 divide-x divide-white/10">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="p-6 flex flex-col space-y-4">
                    <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                    <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
                    <div className="h-20 w-full bg-white/5 rounded-lg animate-pulse" />
                    <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : waterLevelData.length === 0 ? (
              <div className="p-8 text-center text-white/40 font-bold text-sm uppercase tracking-widest">
                No station data available — check network connection
              </div>
            ) : (
              <div className="grid md:grid-cols-5 divide-x divide-white/10">
                {waterLevelData.map((item, i) => {
                  // Ensure chart always has data — use flat placeholder if empty
                  const chartData = item.history.length >= 2
                    ? item.history
                    : [
                        { time: '00:00', val: item.level ?? 2.0 },
                        { time: '04:00', val: item.level ?? 2.0 },
                        { time: '08:00', val: item.level ?? 2.0 },
                        { time: '12:00', val: item.level ?? 2.0 },
                        { time: '16:00', val: item.level ?? 2.0 },
                        { time: '20:00', val: item.level ?? 2.0 },
                      ];

                  const minVal = Math.min(...chartData.map(d => d.val)) * 0.97;
                  const maxVal = Math.max(...chartData.map(d => d.val)) * 1.03;

                  return (
                    <div key={i} className="p-6 hover:bg-white/5 transition-all duration-500 flex flex-col group/site relative">
                      <div className="flex items-center justify-between mb-4 relative z-10">
                        <span className="text-xs font-black text-[#42b0d5] uppercase tracking-[0.25em]">{item.site}</span>
                        <div className={cn(
                          "px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wider",
                          item.error ? 'bg-white/10 text-white/40' :
                          item.trend === 'up' ? 'bg-emerald-500 text-white' :
                          item.trend === 'down' ? 'bg-rose-500 text-white' :
                          'bg-slate-600 text-white'
                        )}>
                          {item.error ? 'offline' : item.trend}
                        </div>
                      </div>

                      <div className="flex items-baseline space-x-1.5 mb-4 relative z-10">
                        <span className="text-3xl font-black text-white tracking-tighter">
                          {item.error ? '—' : item.level?.toFixed(2) ?? '—'}
                        </span>
                        <span className="text-sm font-bold text-white/50">m</span>
                        <span className={cn(
                          "ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                          item.status === 'Normal' ? 'bg-emerald-500/80 text-white' :
                          item.status === 'Low' ? 'bg-amber-500/80 text-white' :
                          'bg-rose-500/80 text-white'
                        )}>{item.status}</span>
                      </div>

                      {/* Water level chart — always renders */}
                      <div className="h-24 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`wl-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#42b0d5" stopOpacity={item.error ? 0.2 : 0.7} />
                                <stop offset="95%" stopColor="#42b0d5" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
                            <XAxis
                              dataKey="time"
                              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700 }}
                              tickLine={false}
                              axisLine={false}
                              interval={1}
                            />
                            <YAxis
                              domain={[minVal, maxVal]}
                              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700 }}
                              tickLine={false}
                              axisLine={false}
                              width={28}
                              tickFormatter={(v) => `${v.toFixed(1)}`}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-[#0e1117] border border-white/20 px-2.5 py-1.5 rounded-lg shadow-xl">
                                      <p className="text-[9px] font-bold text-white/50">{payload[0].payload.time}</p>
                                      <p className="text-xs font-black text-[#42b0d5]">{Number(payload[0].value).toFixed(2)}m</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="val"
                              stroke={item.error ? 'rgba(255,255,255,0.15)' : '#42b0d5'}
                              strokeWidth={item.error ? 1.5 : 2.5}
                              strokeDasharray={item.error ? '4 3' : undefined}
                              fillOpacity={1}
                              fill={`url(#wl-${i})`}
                              dot={false}
                              animationDuration={1200}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                        {item.error && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-black text-white/25 uppercase tracking-widest">No live data</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 relative z-10">
                        <Badge className={cn(
                          "text-[9px] font-black border-none px-2.5 py-0.5 uppercase tracking-widest",
                          item.error ? 'bg-white/10 text-white/40' :
                          item.status === 'Critical' ? 'bg-rose-600 text-white' :
                          item.status === 'Low' ? 'bg-amber-600 text-white' :
                          'bg-emerald-600 text-white'
                        )}>
                          {item.error ? 'Offline' : item.status}
                        </Badge>
                        <div className="flex items-center text-[9px] font-black text-white/30 uppercase tracking-widest">
                          <Info className="h-3 w-3 mr-1 text-maersk-blue/60" />
                          PEGEL
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Terminal Barge Congestion Overview */}
        <TerminalCongestionOverview />
      </div>

      {/* Quick Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white/95 backdrop-blur-2xl border-none shadow-2xl rounded-3xl overflow-hidden p-0">
          <div className="h-2 w-full bg-gradient-to-r from-blue-600 to-[#42b0d5]" />
          <div className="p-8">
            <DialogHeader className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-700" />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight">Quick Export Booking</DialogTitle>
              </div>
              <DialogDescription className="font-semibold text-slate-600">
                Secure truck capacity for <span className="text-blue-700 font-black">{selectedDay?.dayName} {selectedDay?.date}</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="zipcode" className="text-[10px] font-black uppercase tracking-widest text-slate-600">Loading Zipcode</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="zipcode" 
                    placeholder="e.g. 40210" 
                    className="pl-10 h-12 bg-slate-100 border-slate-200 focus:ring-blue-600 rounded-xl font-bold"
                    value={bookingInfo.zipcode}
                    onChange={(e) => setBookingInfo({...bookingInfo, zipcode: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Container</Label>
                  <Select 
                    value={bookingInfo.containerType} 
                    onValueChange={(v) => setBookingInfo({...bookingInfo, containerType: v})}
                  >
                    <SelectTrigger className="h-12 bg-slate-100 border-slate-200 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="20GP">20' Standard</SelectItem>
                      <SelectItem value="40GP">40' Standard</SelectItem>
                      <SelectItem value="40HC">40' High Cube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600">Load Port</Label>
                  <Select 
                    value={bookingInfo.loadPort} 
                    onValueChange={(v) => setBookingInfo({...bookingInfo, loadPort: v})}
                  >
                    <SelectTrigger className="h-12 bg-slate-100 border-slate-200 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="Rotterdam">Rotterdam</SelectItem>
                      <SelectItem value="Antwerp">Antwerp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-10">
              <Button 
                variant="ghost" 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl font-bold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmBooking}
                disabled={!bookingInfo.zipcode}
                className="bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 rounded-xl font-black px-8 h-12"
              >
                Confirm & View Schedules
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
