import { useState, useEffect, useMemo } from 'react';
import { useRhineWaterLevels } from '../../hooks/useRhineWaterLevels';
import { motion } from 'motion/react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { expRun } from '../../logic/export/expRun';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { StatsOverview } from './StatsOverview';
import { TerminalCongestionOverview } from './TerminalCongestionOverview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import {
  Activity,
  Waves,
  Truck,
  Info,
  CheckCircle2,
  Download,
  Upload,
  MapPin,
  Anchor,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  FileText,
  ClipboardCheck,
  Loader2,
  AlertTriangle,
  Wind,
} from 'lucide-react';
import { useWeatherForecast } from '../../hooks/useWeatherForecast';
import { generateWaterLevelReport } from '../../lib/waterLevelReport';
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


function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtShortDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
}

const getWeekNumber = (d: Date) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// buildWorkingDays: 15 working days (3 calendar weeks) starting from today.
// Called inside the component via useMemo so dates stay current if the tab is
// left open overnight instead of being frozen at module-load time.
function buildWorkingDays() {
  const result: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (cursor.getDay() === 6) cursor.setDate(cursor.getDate() + 2); // Sat → Mon
  if (cursor.getDay() === 0) cursor.setDate(cursor.getDate() + 1); // Sun → Mon
  while (result.length < 15) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      result.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result.map(d => ({
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
    dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    weekNum: getWeekNumber(d)
  }));
}

const TERMINAL_OPTIONS = [
  { value: 'NLROTTM|5|RTM',  label: 'APM Terminals Rotterdam',    port: 'RTM' },
  { value: 'NLROTWG|7|RTM',  label: 'Rotterdam World Gateway',    port: 'RTM' },
  { value: 'NLROT01|8|RTM',  label: 'Hutchison Ports Delta II',   port: 'RTM' },
  { value: 'NLROT21|8|RTM',  label: 'ECT Delta Terminal',         port: 'RTM' },
  { value: 'BEANT869|7|ANR', label: 'PSA Europa Terminal (ANR)',  port: 'ANR' },
  { value: 'BEANT913|7|ANR', label: 'PSA Noordzee Terminal (ANR)', port: 'ANR' },
];

function containerToSizeType(ct: string): { size: string; type: string } {
  if (ct === '20DC') return { size: '20', type: 'dc' };
  if (ct === '40DC') return { size: '40', type: 'dc' };
  if (ct === '40HC') return { size: '40', type: 'hc' };
  if (ct === '20RF') return { size: '20', type: 'reefer' };
  if (ct === '40RF') return { size: '40', type: 'reefer' };
  if (ct === 'IMO')  return { size: '40', type: 'imo' };
  return { size: '40', type: 'hc' };
}

// waterLevelData is now fetched live via useRhineWaterLevels hook

export function DashboardOverview() {
  const { setActiveTab, setExportRequest, setExpRunResult, truckCapacityData, setTruckCapacityData } = usePlannerStore();
  const weather = useWeatherForecast();
  const { data: waterLevelData, loading: waterLoading, lastRefresh } = useRhineWaterLevels(30 * 60 * 1000);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookingInfo, setBookingInfo] = useState({
    zipcode: '',
    containerType: '40HC',
    terminalValue: 'NLROTTM|5|RTM',
    loadingTime: '08:00',
  });
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  // Recomputed once per component mount so dates are always current
  const days = useMemo(() => buildWorkingDays(), []);

  const handleDayClick = (day: any, status: number) => {
    if (status === 1) {
      setSelectedDay(day);
      setBookingInfo(prev => ({ ...prev, zipcode: '' })); // clear zip for each new day
      setIsDialogOpen(true);
    }
  };

  const handleFindSchedules = () => {
    if (!bookingInfo.zipcode || !selectedDay) return;
    const [dd, mm] = selectedDay.date.split('/');
    const loadDate = new Date(new Date().getFullYear(), parseInt(mm) - 1, parseInt(dd)).toISOString().split('T')[0];
    const { size, type } = containerToSizeType(bookingInfo.containerType);
    const result = expRun({
      zip: bookingInfo.zipcode,
      size,
      type,
      loadDate,
      loadTime: bookingInfo.loadingTime,
      terminalValue: bookingInfo.terminalValue,
    });
    setExportRequest({
      postcode: bookingInfo.zipcode,
      containerType: bookingInfo.containerType as any,
      loadingDate: loadDate,
      loadingTime: bookingInfo.loadingTime,
      portTerminal: bookingInfo.terminalValue,
    });
    setExpRunResult(result);
    setIsDialogOpen(false);
    setActiveTab('export');
  };

  const handleGenerateReport = async () => {
    setReportGenerating(true);
    setReportCopied(false);
    let report: string | null = null;
    try {
      report = await generateWaterLevelReport();
      await navigator.clipboard.writeText(report);
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 3000);
    } catch (clipErr) {
      console.warn('[Report] Clipboard write failed, falling back to file download:', clipErr);
      // Reuse already-generated report — avoid calling generateWaterLevelReport() twice
      if (report) {
        try {
          const blob = new Blob([report], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Water_Level_Report_${new Date().toISOString().split('T')[0]}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (downloadErr) {
          console.warn('[Report] File download fallback also failed:', downloadErr);
        }
      }
    } finally {
      setReportGenerating(false);
    }
  };

  const handleDownloadTemplate = () => {
    const data = truckCapacityData.map(hub => {
      const row: any = { Hub: hub.location };
      days.forEach((day, i) => {
        row[`${day.dayName} ${day.date}`] = hub.forecast[i] === 1 ? 'Available' : 'Booked Out';
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
    reader.onerror = () => console.warn('[TruckCapacity] FileReader error:', reader.error);
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-700">

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl shadow-xl">
        {/* Layered gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#001829] via-[#002d52] to-[#00437a]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute -right-20 -top-16 h-72 w-72 rounded-full bg-[#42b0d5]/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-8 h-44 w-44 rounded-full bg-maersk-blue/20 blur-2xl pointer-events-none" />
        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#42b0d5]/40 to-transparent" />

        <div className="relative z-10 px-7 pt-6 pb-6">
          {/* Live pill + Maersk logo row */}
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/8 border border-white/12">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.25em]">Live Data</span>
            </div>
            {/* Maersk logo — 7-pointed star + wordmark */}
            <div className="flex items-center gap-2.5 opacity-80">
              <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M50 5 L57 35 L85 20 L67 45 L97 47 L70 60 L85 88 L55 72 L52 100 L45 72 L15 88 L30 60 L3 47 L33 45 L15 20 L43 35 Z"
                  fill="white"
                  fillOpacity="0.9"
                />
              </svg>
              <div>
                <div className="text-[11px] font-black text-white tracking-[0.15em] uppercase">Maersk</div>
                <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-none">Germany</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Left — title */}
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-white leading-[1.05]">
                Inland Operations
                <br />
                <span className="text-[#42b0d5]">Export Truck Capacity</span>
              </h1>
              <p className="text-sm text-white/40 mt-3 leading-relaxed max-w-md">
                Real-time export capacity, Rhine water levels, and terminal congestion across Maersk Germany's inland network.
              </p>
            </div>

            {/* Right — stat chips */}
            <div className="flex flex-row md:flex-col gap-2 flex-none">
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/10"
              >
                <div className="p-1.5 rounded-lg bg-[#42b0d5]/20">
                  <Truck className="h-3.5 w-3.5 text-[#42b0d5]" />
                </div>
                <div>
                  <div className="text-sm font-black text-white tracking-tight">3 Active Hubs</div>
                  <div className="text-[8px] text-white/30 uppercase tracking-widest">Germany</div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 }}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/10"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <Waves className="h-3.5 w-3.5 text-[#42b0d5]" />
                </div>
                <div>
                  <div className="text-sm font-black text-white tracking-tight">5 Rhine Gauges</div>
                  <div className="text-[8px] text-white/30 uppercase tracking-widest">Live PEGEL</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Route flow strip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-5 flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/6 border border-white/10">
              <MapPin className="h-3 w-3 text-white/35" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-wide">Customer</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-white/20" />
              <ArrowRight className="h-3 w-3 text-white/20 flex-none mx-1" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#42b0d5]/15 border border-[#42b0d5]/25">
              <Truck className="h-3 w-3 text-[#42b0d5]" />
              <span className="text-[10px] font-black text-[#42b0d5] uppercase tracking-wide">Inland Hub</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-white/10" />
              <ArrowRight className="h-3 w-3 text-white/20 flex-none mx-1" />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/6 border border-white/10">
              <Anchor className="h-3 w-3 text-white/35" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-wide">Port</span>
            </div>
          </motion.div>

          {/* ── 7-Day Weather Forecast Strip ─────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-5 pt-4 border-t border-white/10"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em]">
                  7-Day Forecast · Rotterdam / Rhine
                </span>
                {weather.lastRefresh && (
                  <span className="text-[8px] text-white/20">
                    · {weather.lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              {weather.loading && (
                <span className="text-[8px] text-white/25 uppercase tracking-widest animate-pulse">
                  Loading…
                </span>
              )}
            </div>

            {/* Day tiles */}
            {!weather.error && weather.days.length > 0 && (
              <div className="grid grid-cols-7 gap-1.5">
                {weather.days.map((day, i) => (
                  <div
                    key={day.date}
                    className={cn(
                      'flex flex-col items-center gap-1 px-1.5 py-2.5 rounded-xl border transition-all',
                      i === 0
                        ? 'bg-white/12 border-white/25'
                        : day.isSevere
                        ? 'bg-rose-500/15 border-rose-500/30'
                        : day.isWindy
                        ? 'bg-amber-500/10 border-amber-500/20'
                        : 'bg-white/5 border-white/10'
                    )}
                  >
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-wider leading-none">
                      {day.dayLabel}
                    </span>
                    <span className="text-lg leading-none select-none">{day.icon}</span>
                    <span className="text-[11px] font-black text-white leading-none">{day.tempMax}°</span>
                    <div className="flex items-center gap-0.5">
                      <Wind className="h-2 w-2 text-white/25" />
                      <span className="text-[8px] text-white/30 font-bold">{day.windMax}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Operational weather alert */}
            {weather.alert && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  'mt-3 flex items-start gap-3 px-4 py-3 rounded-xl border',
                  weather.alert.type === 'storm'
                    ? 'bg-rose-500/15 border-rose-500/35'
                    : weather.alert.type === 'wind'
                    ? 'bg-amber-500/15 border-amber-500/35'
                    : weather.alert.type === 'snow'
                    ? 'bg-sky-400/15 border-sky-400/30'
                    : 'bg-slate-400/15 border-slate-400/25'
                )}
              >
                <AlertTriangle
                  className={cn(
                    'h-4 w-4 flex-none mt-0.5',
                    weather.alert.type === 'storm'
                      ? 'text-rose-400'
                      : weather.alert.type === 'wind'
                      ? 'text-amber-400'
                      : 'text-sky-300'
                  )}
                />
                <div>
                  <p
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest mb-1',
                      weather.alert.type === 'storm'
                        ? 'text-rose-300'
                        : weather.alert.type === 'wind'
                        ? 'text-amber-300'
                        : 'text-sky-200'
                    )}
                  >
                    ⚠ Weather Alert — {weather.alert.days.join(' · ')}
                  </p>
                  <p className="text-xs font-bold text-white/60 leading-relaxed">
                    {weather.alert.message}
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <StatsOverview waterLevelData={waterLevelData} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Truck Capacity Forecast */}
        <Card className="lg:col-span-12 border border-slate-100 bg-white overflow-hidden group rounded-2xl shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-200/50 bg-white/80 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-maersk-blue rounded-lg shadow-md shadow-maersk-blue/30">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-black tracking-tight text-maersk-dark">Export Truck Capacity Forecast</CardTitle>
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="space-y-4">
              {truckCapacityData.map((hub) => (
                <div key={hub.location} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <div className="relative flex h-2 w-2">
                        <span className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          hub.forecast.slice(0, days.length).filter(v => v === 1).length > days.length * 2 / 3 ? "bg-emerald-400" : "bg-amber-400"
                        )}></span>
                        <span className={cn(
                          "relative inline-flex rounded-full h-2 w-2",
                          hub.forecast.slice(0, days.length).filter(v => v === 1).length > days.length * 2 / 3 ? "bg-emerald-500" : "bg-amber-500"
                        )}></span>
                      </div>
                      <span className="text-sm font-black text-maersk-dark tracking-tight">{hub.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-baseline space-x-0.5">
                        <span className="text-base font-black text-maersk-dark tracking-tighter">
                          {Math.round((hub.forecast.slice(0, days.length).filter(v => v === 1).length / days.length) * 100)}
                        </span>
                        <span className="text-[10px] font-black text-slate-500">%</span>
                      </div>
                      <div className="h-4 w-px bg-slate-200" />
                      <Badge variant="secondary" className="bg-maersk-blue text-white border-maersk-blue font-black text-[9px] px-2 py-0 rounded-full">
                        {hub.forecast.slice(0, days.length).filter(v => v === 1).length}/{days.length}d
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5">
                    {days.map((day, i) => {
                      const status = hub.forecast[i] ?? 0;
                      return (
                      <div key={i} className="flex flex-col items-center group/day">
                        {/* Week Number */}
                        <div className="h-4 flex items-center justify-center w-full mb-0.5">
                          {(i === 0 || days[i].weekNum !== days[i-1].weekNum) ? (
                            <span className="text-[7px] font-black text-white bg-maersk-blue px-1 py-0 rounded shadow">
                              KW{days[i].weekNum}
                            </span>
                          ) : null}
                        </div>

                        {/* Day Name */}
                        <div className="text-[8px] font-black text-slate-400 mb-0.5 uppercase tracking-wider group-hover/day:text-maersk-blue transition-colors">
                          {days[i].dayName.substring(0, 2)}
                        </div>

                        {/* Capacity Block */}
                        <div
                          onClick={() => handleDayClick(days[i], status)}
                          className={cn(
                            "w-full h-8 rounded-md shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:scale-105 cursor-pointer relative overflow-hidden",
                            status === 1
                              ? "bg-emerald-500 hover:bg-emerald-400"
                              : "bg-rose-500 hover:bg-rose-400"
                          )}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-black text-white">
                              {days[i].date.split('/')[0]}
                            </span>
                          </div>
                          {status === 1 && (
                            <div className="absolute bottom-0.5 right-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5 text-white/70" />
                            </div>
                          )}
                        </div>

                        {/* Month/Day under block */}
                        <span className="text-[7px] font-bold text-slate-400 mt-0.5 group-hover/day:text-maersk-blue transition-colors">
                          {day.date.split('/')[1]}/{day.date.split('/')[0]}
                        </span>
                      </div>
                      );
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(hub.forecast.slice(0, days.length).filter(v => v === 1).length / days.length) * 100}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        hub.forecast.slice(0, days.length).filter(v => v === 1).length > days.length * 2 / 3 ? "bg-emerald-500" : "bg-amber-500"
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rhine Water Levels Monitor */}
        <Card className="lg:col-span-12 border-none bg-maersk-dark shadow-xl overflow-hidden group rounded-2xl">
          <CardHeader className="pb-4 border-b border-white/10 bg-white/5 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-maersk-blue rounded-lg shadow-md shadow-maersk-blue/40">
                  <Waves className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-black tracking-tight text-white drop-shadow-sm">Rhine Water Levels Monitor</CardTitle>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateReport}
                  disabled={reportGenerating}
                  className={cn(
                    "h-8 px-3 gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200 border",
                    reportCopied
                      ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "text-white/70 border-white/20 hover:text-white hover:bg-white/10"
                  )}
                  title="Generate weekly water level report and copy to clipboard"
                >
                  {reportGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : reportCopied ? (
                    <ClipboardCheck className="h-3 w-3" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  {reportGenerating ? 'Generating...' : reportCopied ? 'Copied!' : 'Export Report'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => window.open('https://www.pegelonline.wsv.de/gast/karte/standard', '_blank', 'noopener,noreferrer')}
                  title="Open live data on pegelonline.wsv.de"
                >
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
                  <div key={i} className="p-5 flex flex-col space-y-4">
                    <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                    <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
                    <div className="h-24 w-full bg-white/5 rounded-lg animate-pulse" />
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
                    <div key={i} className="p-5 hover:bg-white/5 transition-colors duration-200 flex flex-col group/site relative">
                      <div className="flex items-center justify-between mb-2.5 relative z-10">
                        <div>
                          <span className="text-[11px] font-black text-[#42b0d5] uppercase tracking-[0.25em]">{item.site}</span>
                          {item.isEstimated && (
                            <span className="ml-1.5 text-[7px] font-black text-white/25 uppercase tracking-widest">est.</span>
                          )}
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wider",
                          item.error ? 'bg-white/10 text-white/40' :
                          item.trend === 'up' ? 'bg-emerald-500 text-white' :
                          item.trend === 'down' ? 'bg-rose-500 text-white' :
                          'bg-slate-600 text-white'
                        )}>
                          {item.error ? (
                            'offline'
                          ) : item.trend === 'up' ? (
                            <><TrendingUp className="h-2.5 w-2.5" /> rising</>
                          ) : item.trend === 'down' ? (
                            <><TrendingDown className="h-2.5 w-2.5" /> falling</>
                          ) : (
                            <><Minus className="h-2.5 w-2.5" /> stable</>
                          )}
                        </div>
                      </div>

                      <div className="flex items-baseline space-x-1.5 mb-3 relative z-10">
                        <span className="text-2xl font-black text-white tracking-tighter">
                          {item.error ? '—' : item.level?.toFixed(2) ?? '—'}
                        </span>
                        <span className="text-sm font-bold text-white/50">m</span>
                        <span className={cn(
                          "ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                          item.error ? 'bg-white/10 text-white/30' :
                          item.status === 'Normal' ? 'bg-emerald-500 text-white' :
                          item.status === 'Low' ? 'bg-amber-500 text-white' :
                          'bg-rose-600 text-white'
                        )}>{item.error ? '—' : item.status}</span>
                      </div>

                      {/* Water level chart — always renders */}
                      <div className="h-20 w-full relative z-10">
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
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                        {item.error && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-black text-white/25 uppercase tracking-widest">No live data</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between pt-2 border-t border-white/10 relative z-10">
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

      {/* Export Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-none shadow-2xl rounded-3xl overflow-hidden p-0 sm:max-w-[460px]">
          <div className="h-1.5 w-full bg-gradient-to-r from-maersk-dark via-maersk-blue to-[#42b0d5]" />
          <div className="p-7">
            <DialogHeader className="mb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-maersk-blue/10 rounded-xl">
                    <Truck className="h-5 w-5 text-maersk-blue" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black tracking-tight text-maersk-dark">
                      Export Schedule Lookup
                    </DialogTitle>
                    <DialogDescription className="font-semibold text-slate-500 text-xs mt-0.5">
                      Loading: <span className="text-maersk-blue font-black">{selectedDay?.dayName} {selectedDay?.date}</span>
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer ZIP Code (PLZ)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="e.g. 40210"
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-maersk-blue/50 rounded-xl font-bold"
                    value={bookingInfo.zipcode}
                    onChange={(e) => setBookingInfo({...bookingInfo, zipcode: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Container Type</Label>
                  <Select value={bookingInfo.containerType} onValueChange={(v) => setBookingInfo({...bookingInfo, containerType: v})}>
                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="20DC">20' Standard</SelectItem>
                      <SelectItem value="40DC">40' Standard</SelectItem>
                      <SelectItem value="40HC">40' High Cube</SelectItem>
                      <SelectItem value="20RF">20' Reefer</SelectItem>
                      <SelectItem value="40RF">40' Reefer</SelectItem>
                      <SelectItem value="IMO">IMO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loading Time</Label>
                  <Input
                    type="time"
                    className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold"
                    value={bookingInfo.loadingTime}
                    onChange={(e) => setBookingInfo({...bookingInfo, loadingTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Port Terminal</Label>
                <Select value={bookingInfo.terminalValue} onValueChange={(v) => setBookingInfo({...bookingInfo, terminalValue: v})}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl min-w-[300px]">
                    <div className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Rotterdam</div>
                    {TERMINAL_OPTIONS.filter(t => t.port === 'RTM').map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label} <span className="text-slate-400 ml-1">· YOT {t.value.split('|')[1]}d</span></SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 mt-1 pt-2">Antwerp</div>
                    {TERMINAL_OPTIONS.filter(t => t.port === 'ANR').map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label} <span className="text-slate-400 ml-1">· YOT {t.value.split('|')[1]}d</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold text-slate-500 hover:bg-slate-100 flex-none">Cancel</Button>
              <Button
                onClick={handleFindSchedules}
                disabled={!bookingInfo.zipcode || bookingInfo.zipcode.length < 4}
                className="flex-1 bg-maersk-dark text-white hover:bg-maersk-blue shadow-lg rounded-xl font-black h-11"
              >
                Find Export Schedules <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
