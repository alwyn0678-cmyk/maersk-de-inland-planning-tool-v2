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
  Clock,
} from 'lucide-react';
import { useWeatherForecast } from '../../hooks/useWeatherForecast';
import { generateWaterLevelReport } from '../../lib/waterLevelReport';
import { isHoliday } from '../../logic/bizDayUtils';
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

interface WorkingDay {
  date: string;    // dd/MM
  dayName: string; // Mon, Tue…
  weekNum: number;
  year: number;
}

// buildWorkingDays: 15 working days (3 calendar weeks) starting from today.
// Called inside the component via useMemo so dates stay current if the tab is
// left open overnight instead of being frozen at module-load time.
function buildWorkingDays(): WorkingDay[] {
  const result: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (cursor.getDay() === 6) cursor.setDate(cursor.getDate() + 2); // Sat → Mon
  if (cursor.getDay() === 0) cursor.setDate(cursor.getDate() + 1); // Sun → Mon
  while (result.length < 15) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6 && !isHoliday(cursor)) {
      result.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return result.map(d => ({
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }),
    dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    weekNum: getWeekNumber(d),
    year: d.getFullYear(),
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

// ── Capacity status definitions (matches the 6-level original system) ─────────
export const CAPACITY_STATUSES = [
  { value: 1, label: 'All possible',     dotCls: 'bg-emerald-500', blockCls: 'bg-emerald-500 hover:bg-emerald-400' },
  { value: 2, label: 'From 1100hrs',     dotCls: 'bg-yellow-400',  blockCls: 'bg-yellow-400  hover:bg-yellow-300'  },
  { value: 3, label: 'From 1300hrs',     dotCls: 'bg-orange-500',  blockCls: 'bg-orange-500  hover:bg-orange-400'  },
  { value: 4, label: 'From 1600hrs',     dotCls: 'bg-blue-500',    blockCls: 'bg-blue-500    hover:bg-blue-400'    },
  { value: 5, label: 'On request',       dotCls: 'bg-slate-400',   blockCls: 'bg-slate-400   hover:bg-slate-300'   },
  { value: 0, label: 'Not possible',     dotCls: 'bg-rose-500',    blockCls: 'bg-rose-500'                         },
] as const;

// waterLevelData is now fetched live via useRhineWaterLevels hook

export function DashboardOverview() {
  const setActiveTab      = usePlannerStore(s => s.setActiveTab);
  const setExportRequest  = usePlannerStore(s => s.setExportRequest);
  const setExpRunResult   = usePlannerStore(s => s.setExpRunResult);
  const truckCapacityData = usePlannerStore(s => s.truckCapacityData);
  const weather = useWeatherForecast();
  const { data: waterLevelData, loading: waterLoading, lastRefresh } = useRhineWaterLevels(30 * 60 * 1000);
  const [selectedDay, setSelectedDay] = useState<WorkingDay | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number>(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookingInfo, setBookingInfo] = useState({
    zipcode: '',
    containerType: '40HC',
    terminalValue: 'NLROTTM|5|RTM',
    loadingTime: '08:00',
  });

  // Minimum loading times per capacity status — drives the export schedule logic
  const STATUS_MIN_TIMES: Record<number, string> = {
    1: '08:00', // All possible — no restriction
    2: '11:00', // From 1100hrs — next-day still catchable (< 12:00)
    3: '13:00', // From 1300hrs — next-day excluded (>= 12:00)
    4: '16:00', // From 1600hrs — next-day excluded (>= 12:00)
    5: '08:00', // On request — no time restriction, contact ops
  };
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  // Recomputed once per component mount so dates are always current
  const days = useMemo(() => buildWorkingDays(), []);

  const handleDayClick = (day: WorkingDay, status: number) => {
    if (status > 0) {
      setSelectedDay(day);
      setSelectedStatus(status);
      // Pre-fill loading time from status minimum — this drives expGetNextDeps logic:
      // times >= 12:00 (status 3/4) auto-exclude next-day departures;
      // times < 12:00 (status 1/2) include next-day with cutoff flag
      const minTime = STATUS_MIN_TIMES[status] ?? '08:00';
      setBookingInfo(prev => ({ ...prev, zipcode: '', loadingTime: minTime }));
      setIsDialogOpen(true);
    }
  };

  const handleFindSchedules = () => {
    if (!bookingInfo.zipcode || !selectedDay) return;
    const [dd, mm] = selectedDay.date.split('/');
    const loadDate = new Date(selectedDay.year, parseInt(mm) - 1, parseInt(dd)).toISOString().split('T')[0];
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
      containerType: bookingInfo.containerType as import('../../types').ContainerType,
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

        <div className="relative z-10 px-6 pt-4 pb-4">
          {/* Live pill + Maersk wordmark row */}
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/8 border border-white/12">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.25em]">Live Data</span>
            </div>
            <div className="flex items-center gap-2 opacity-70">
              <div>
                <div className="text-[11px] font-black text-white tracking-[0.15em] uppercase text-right">Maersk</div>
                <div className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-none text-right">Germany</div>
              </div>
            </div>
          </div>

          {/* Title / wordmark / chips — vertically centred */}
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Far-left — title only */}
            <div className="flex-none">
              <h1 className="text-2xl font-black tracking-tighter text-white leading-tight">
                Inland Operations
                <br />
                <span className="text-[#42b0d5]">Export Truck Capacity</span>
              </h1>
            </div>

            {/* Center-left — Maersk wordmark, symmetric with weather bubble */}
            <div className="hidden md:flex flex-1 justify-center items-center pointer-events-none select-none">
              <div className="flex items-center gap-3">
                <div className="h-12 w-px bg-white/12 flex-none" />
                <svg
                  width="52" height="52"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="wmarkShadow" x="-25%" y="-25%" width="150%" height="150%">
                      <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#000824" floodOpacity="0.45" />
                    </filter>
                    <filter id="wmarkStarGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="1.4" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Solid Maersk blue badge — matches official logo */}
                  <rect x="3" y="3" width="94" height="94" rx="18"
                    fill="#42b0d5"
                    filter="url(#wmarkShadow)"
                  />
                  {/* 7-pointed star — outer R=38, inner r=14 */}
                  <path
                    d="M50,12 L56.1,37.4 L79.7,26.3 L63.6,46.9 L87.0,58.5 L61.0,58.7 L66.5,84.2 L50,64 L33.5,84.2 L39.0,58.7 L13.0,58.5 L36.4,46.9 L20.3,26.3 L43.9,37.4 Z"
                    fill="white"
                    filter="url(#wmarkStarGlow)"
                  />
                </svg>
                <div>
                  <div className="text-[22px] font-black tracking-[0.09em] text-white leading-none">MAERSK</div>
                  <div className="text-[8px] font-black text-white/35 uppercase tracking-[0.28em] mt-1">DE · Inland Planning</div>
                </div>
              </div>
            </div>

            {/* Center-right — TODAY weather (primary focus) */}
            {!weather.error && weather.days.length > 0 && (
              <div className="hidden md:flex flex-1 justify-center">
                {/* Outer glow ring — pulses independently */}
                <motion.div
                  animate={{ opacity: [0.4, 0.75, 0.4], scale: [1, 1.04, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className={cn(
                    'absolute rounded-2xl blur-xl pointer-events-none',
                    weather.days[0].isSevere
                      ? 'bg-rose-500/25 w-56 h-20'
                      : weather.days[0].isWindy
                      ? 'bg-amber-400/20 w-56 h-20'
                      : 'bg-[#42b0d5]/15 w-56 h-20'
                  )}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'relative flex items-center gap-5 px-7 py-3.5 rounded-2xl border backdrop-blur-sm overflow-hidden',
                    weather.days[0].isSevere
                      ? 'bg-rose-500/20 border-rose-500/35'
                      : weather.days[0].isWindy
                      ? 'bg-amber-500/15 border-amber-500/25'
                      : 'bg-white/10 border-white/20'
                  )}
                >
                  {/* Shimmer sweep */}
                  <motion.div
                    animate={{ x: ['-120%', '220%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/8 to-transparent skew-x-[-20deg] pointer-events-none"
                  />
                  {/* Weather emoji */}
                  <div className="flex items-center justify-center w-14 z-10">
                    <motion.span
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-5xl leading-none select-none"
                    >
                      {weather.days[0].icon}
                    </motion.span>
                  </div>
                  <div className="relative z-10">
                    <div className="text-[9px] font-black text-white/40 uppercase tracking-[0.25em] mb-1.5">Today · Rotterdam</div>
                    {/* Temperature count-up feel via key-based re-mount */}
                    <motion.div
                      key={weather.days[0].tempMax}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-4xl font-black text-white leading-none"
                    >
                      {weather.days[0].tempMax}°
                    </motion.div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <motion.div
                        animate={{ rotate: [0, 15, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
                      >
                        <Wind className="h-3 w-3 text-white/35" />
                      </motion.div>
                      <span className="text-[10px] text-white/50 font-bold">{weather.days[0].windMax} km/h</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Right — stat chips */}
            <div className="flex flex-row md:flex-col gap-2 flex-none">
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/10"
              >
                <div className="p-1.5 rounded-lg bg-[#42b0d5]/20">
                  <Truck className="h-3 w-3 text-[#42b0d5]" />
                </div>
                <div>
                  <div className="text-xs font-black text-white tracking-tight">{truckCapacityData.length} Active Hubs</div>
                  <div className="text-[8px] text-white/30 uppercase tracking-widest">Germany</div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/8 border border-white/10"
              >
                <div className="p-1.5 rounded-lg bg-blue-500/20">
                  <Waves className="h-3 w-3 text-[#42b0d5]" />
                </div>
                <div>
                  <div className="text-xs font-black text-white tracking-tight">5 Rhine Gauges</div>
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
            className="mt-3 flex items-center gap-2"
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

          {/* ── 6-Day Forecast Row + Weather Alert ─────────────────────────── */}
          {(!weather.error && weather.days.length > 1) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-white/35 uppercase tracking-[0.25em]">
                    Upcoming Forecast · Rotterdam / Rhine
                  </span>
                  {weather.lastRefresh && (
                    <span className="text-[8px] text-white/20">
                      · {weather.lastRefresh.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                {weather.loading && (
                  <span className="text-[8px] text-white/25 uppercase tracking-widest animate-pulse">Loading…</span>
                )}
              </div>
              {/* 6-day tiles */}
              <div className="grid grid-cols-6 gap-2">
                {weather.days.slice(1).map((day) => (
                  <div
                    key={day.date}
                    className={cn(
                      'flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl border transition-all',
                      day.isSevere
                        ? 'bg-rose-500/15 border-rose-500/30'
                        : day.isWindy
                        ? 'bg-amber-500/10 border-amber-500/20'
                        : 'bg-white/5 border-white/10'
                    )}
                  >
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-wider leading-none">{day.dayLabel}</span>
                    <span className="text-base leading-none select-none">{day.icon}</span>
                    <span className="text-[10px] font-black text-white leading-none">{day.tempMax}°</span>
                    <div className="flex items-center gap-0.5">
                      <Wind className="h-2 w-2 text-white/25" />
                      <span className="text-[8px] text-white/30 font-bold">{day.windMax}</span>
                    </div>
                  </div>
                ))}
              </div>
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
                      weather.alert.type === 'storm' ? 'text-rose-400'
                      : weather.alert.type === 'wind' ? 'text-amber-400'
                      : 'text-sky-300'
                    )}
                  />
                  <div>
                    <p className={cn(
                      'text-[10px] font-black uppercase tracking-widest mb-1',
                      weather.alert.type === 'storm' ? 'text-rose-300'
                      : weather.alert.type === 'wind' ? 'text-amber-300'
                      : 'text-sky-200'
                    )}>
                      ⚠ Weather Alert — {weather.alert.days.join(' · ')}
                    </p>
                    <p className="text-xs font-bold text-white/60 leading-relaxed">{weather.alert.message}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

        </div>
      </div>

      <StatsOverview waterLevelData={waterLevelData} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Truck Capacity Forecast */}
        <Card className="lg:col-span-12 border border-slate-100 bg-white overflow-hidden group rounded-2xl shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-200/50 bg-white/80 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-maersk-blue rounded-lg shadow-md shadow-maersk-blue/30">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-black tracking-tight text-maersk-dark">Export Truck Capacity Forecast</CardTitle>
                </div>
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                KW{days[0]?.weekNum ?? '—'} · {days.length}-day outlook
              </div>
            </div>
            {/* 6-status legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-600">
              {CAPACITY_STATUSES.map(s => (
                <div key={s.value} className="flex items-center gap-1.5">
                  <div className={`h-3 w-3 rounded-sm ${s.dotCls} shadow-sm`} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {/* Instructional callout */}
            <div className="flex items-start gap-2.5 px-3 py-2.5 mb-3 rounded-xl bg-maersk-blue/5 border border-maersk-blue/15">
              <div className="p-1.5 rounded-lg bg-maersk-blue/10 shrink-0 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-maersk-blue" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-maersk-dark uppercase tracking-widest leading-none mb-1.5">
                  How to use this chart
                </p>
                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                  Click any bookable date to look up export departure schedules. Enter the customer ZIP, container type and port terminal to instantly get barge &amp; rail options with a full vessel planning window.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="text-[10px] text-slate-500"><span className="font-black text-emerald-600">Green</span> — fully available all day</span>
                  <span className="text-[10px] text-slate-500"><span className="font-black text-yellow-500">Yellow</span> — available from 11:00 · next-day departure still reachable</span>
                  <span className="text-[10px] text-slate-500"><span className="font-black text-orange-500">Orange</span> — available from 13:00 · next-day departure excluded</span>
                  <span className="text-[10px] text-slate-500"><span className="font-black text-blue-500">Blue</span> — available from 16:00 · next-day departure excluded</span>
                  <span className="text-[10px] text-slate-500"><span className="font-black text-slate-400">Grey</span> — on request · contact inland ops first</span>
                  <span className="text-[10px] text-slate-500"><span className="font-black text-rose-500">Red</span> — not possible · cannot be selected</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {truckCapacityData.map((hub) => (
                <div key={hub.location} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <div className="relative flex h-2 w-2">
                        <span className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          hub.forecast.slice(0, days.length).filter(v => v > 0).length > days.length * 2 / 3 ? "bg-emerald-400" : "bg-amber-400"
                        )}></span>
                        <span className={cn(
                          "relative inline-flex rounded-full h-2 w-2",
                          hub.forecast.slice(0, days.length).filter(v => v > 0).length > days.length * 2 / 3 ? "bg-emerald-500" : "bg-amber-500"
                        )}></span>
                      </div>
                      <span className="text-sm font-black text-maersk-dark tracking-tight">{hub.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-baseline space-x-0.5">
                        <span className="text-base font-black text-maersk-dark tracking-tighter">
                          {Math.round((hub.forecast.slice(0, days.length).filter(v => v > 0).length / days.length) * 100)}
                        </span>
                        <span className="text-[10px] font-black text-slate-500">%</span>
                      </div>
                      <div className="h-4 w-px bg-slate-200" />
                      <Badge variant="secondary" className="bg-maersk-blue text-white border-maersk-blue font-black text-[9px] px-2 py-0 rounded-full">
                        {hub.forecast.slice(0, days.length).filter(v => v > 0).length}/{days.length}d
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5">
                    {days.map((day, i) => {
                      const status = hub.forecast[i] ?? 0;
                      const st = CAPACITY_STATUSES.find(s => s.value === status) ?? CAPACITY_STATUSES[0];
                      const isClickable = status > 0;
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
                        <div className={cn(
                          "text-[8px] font-black mb-0.5 uppercase tracking-wider group-hover/day:text-maersk-blue transition-colors",
                          i === 0 ? "text-maersk-blue" : "text-slate-400"
                        )}>
                          {i === 0 ? '●' : days[i].dayName.substring(0, 2)}
                        </div>

                        {/* Capacity Block */}
                        <div
                          onClick={() => isClickable && handleDayClick(days[i], status)}
                          title={i === 0 ? `Today · ${st.label}` : st.label}
                          className={cn(
                            "w-full h-8 rounded-md shadow-sm transition-transform duration-150 relative overflow-hidden",
                            st.blockCls,
                            i === 0 && "ring-2 ring-offset-1 ring-white/40",
                            isClickable
                              ? "hover:-translate-y-0.5 hover:scale-105 cursor-pointer"
                              : "cursor-default opacity-80"
                          )}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white leading-none drop-shadow-sm">
                              {days[i].date}
                            </span>
                          </div>
                          {status === 1 && (
                            <div className="absolute bottom-0.5 right-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5 text-white/70" />
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(hub.forecast.slice(0, days.length).filter(v => v > 0).length / days.length) * 100}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        hub.forecast.slice(0, days.length).filter(v => v > 0).length > days.length * 2 / 3 ? "bg-emerald-500" : "bg-amber-500"
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
                    <DialogDescription className="font-semibold text-slate-500 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
                      Loading: <span className="text-maersk-blue font-black">{selectedDay?.dayName} {selectedDay?.date}</span>
                      {selectedStatus > 0 && (
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                          selectedStatus === 1 ? "bg-emerald-100 text-emerald-700" :
                          selectedStatus === 2 ? "bg-yellow-100 text-yellow-700" :
                          selectedStatus === 3 ? "bg-orange-100 text-orange-700" :
                          selectedStatus === 4 ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {CAPACITY_STATUSES.find(s => s.value === selectedStatus)?.label}
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4" onKeyDown={(e) => { if (e.key === 'Enter' && bookingInfo.zipcode.length >= 4) handleFindSchedules(); }}>
              {/* Capacity restriction banner — shown for partial-day statuses */}
              {selectedStatus === 2 && (
                <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                  <Clock className="h-3.5 w-3.5 text-yellow-500 flex-none mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest leading-none mb-0.5">From 1100hrs only</p>
                    <p className="text-[10px] text-yellow-700 leading-snug">Loading starts from 11:00 CET. Next-day departure is still reachable — minimum time pre-set accordingly.</p>
                  </div>
                </div>
              )}
              {selectedStatus === 3 && (
                <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <Clock className="h-3.5 w-3.5 text-orange-500 flex-none mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none mb-0.5">From 1300hrs only</p>
                    <p className="text-[10px] text-orange-700 leading-snug">Loading starts from 13:00 CET. Next-day departures are automatically excluded — earliest option is day +2 onwards.</p>
                  </div>
                </div>
              )}
              {selectedStatus === 4 && (
                <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <Clock className="h-3.5 w-3.5 text-blue-500 flex-none mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-0.5">From 1600hrs only</p>
                    <p className="text-[10px] text-blue-700 leading-snug">Loading starts from 16:00 CET. Next-day departures are automatically excluded — earliest option is day +2 onwards.</p>
                  </div>
                </div>
              )}
              {selectedStatus === 5 && (
                <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-400/10 border border-slate-400/30">
                  <Clock className="h-3.5 w-3.5 text-slate-500 flex-none mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-0.5">On request</p>
                    <p className="text-[10px] text-slate-600 leading-snug">Contact inland ops to confirm availability before committing to a booking on this date.</p>
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer ZIP Code (PLZ)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="e.g. 40210"
                    inputMode="numeric"
                    maxLength={5}
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-maersk-blue/50 rounded-xl font-bold"
                    value={bookingInfo.zipcode}
                    onChange={(e) => setBookingInfo({...bookingInfo, zipcode: e.target.value.replace(/\D/g, '').slice(0, 5)})}
                    autoFocus
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
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Loading Time
                    {selectedStatus > 1 && selectedStatus < 5 && (
                      <span className="ml-1.5 text-[9px] font-black text-slate-400 normal-case tracking-normal">
                        (min {STATUS_MIN_TIMES[selectedStatus]})
                      </span>
                    )}
                  </Label>
                  <Input
                    type="time"
                    min={STATUS_MIN_TIMES[selectedStatus] ?? '08:00'}
                    className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold"
                    value={bookingInfo.loadingTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      const minTime = STATUS_MIN_TIMES[selectedStatus] ?? '08:00';
                      // Enforce minimum: if user enters earlier than allowed, snap back to minimum
                      setBookingInfo({...bookingInfo, loadingTime: val < minTime ? minTime : val});
                    }}
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
