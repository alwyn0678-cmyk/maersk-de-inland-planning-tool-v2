import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { QuickZipLookup } from './components/QuickZipLookup';
import { motion, AnimatePresence } from 'motion/react';
import { User, Clock, Loader2, Waves, AlertTriangle } from 'lucide-react';
import { usePlannerStore } from './store/usePlannerStore';
import { supabase } from './lib/supabaseClient';
import { loadRemoteOverrides } from './logic/scheduleOverrides';
import { useRhineWaterLevels } from './hooks/useRhineWaterLevels';

// Lazy-loaded page components — only downloaded when the user first visits that tab.
// Cuts initial JS parse time significantly since most users start on the dashboard.
const ImportPlanner   = lazy(() => import('./pages/ImportPlanner').then(m => ({ default: m.ImportPlanner })));
const ExportPlanner   = lazy(() => import('./pages/ExportPlanner').then(m => ({ default: m.ExportPlanner })));
const CYCYPlanner     = lazy(() => import('./pages/CYCYPlanner').then(m => ({ default: m.CYCYPlanner })));
const NetworkSchedules = lazy(() => import('./pages/NetworkSchedules').then(m => ({ default: m.NetworkSchedules })));
const InlandNews      = lazy(() => import('./pages/InlandNews').then(m => ({ default: m.InlandNews })));
const PRD             = lazy(() => import('./pages/PRD').then(m => ({ default: m.PRD })));
const Help            = lazy(() => import('./pages/Help').then(m => ({ default: m.Help })));
const ScheduleManager = lazy(() => import('./pages/ScheduleManager').then(m => ({ default: m.ScheduleManager })));

// Minimal spinner shown while a lazy tab is loading (first visit only)
function TabSpinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-6 w-6 text-maersk-blue animate-spin" />
    </div>
  );
}

const TAB_META: Record<string, { label: string; sub: string }> = {
  dashboard:  { label: 'Overview',           sub: 'Operations Dashboard' },
  import:     { label: 'Import Booking',      sub: 'Port → Inland Delivery' },
  export:     { label: 'Export Booking',      sub: 'Inland → Port' },
  cycy:       { label: 'CY/CY Booking',       sub: 'Inland Hub Transfer' },
  schedules:  { label: 'Network Schedules',   sub: 'Barge & Rail Departures' },
  news:       { label: 'Terminal Directory',  sub: 'DE Inland Network' },
  prd:        { label: 'Specifications',      sub: 'Product Requirements' },
  'schedule-manager': { label: 'Schedule Manager', sub: 'Barge & Rail Schedule Updates' },
  help:       { label: 'Tool Guidelines',     sub: 'How-to & Rules' },
};

function TopBar({ activeTab, waterAlert }: { activeTab: string; waterAlert: 'critical' | 'low' | null }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const meta = TAB_META[activeTab] ?? { label: 'Overview', sub: 'Operations Dashboard' };
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="h-14 border-b border-maersk-blue/20 glass flex items-center justify-between px-6 shrink-0 z-40 shadow-sm">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs font-black text-maersk-dark uppercase tracking-widest leading-none">{meta.label}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">{meta.sub}</p>
        </div>
      </div>

      {/* Centre — Rhine water alert (only when critical/low) */}
      <AnimatePresence>
        {waterAlert && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
              waterAlert === 'critical'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            {waterAlert === 'critical'
              ? <AlertTriangle className="h-3 w-3" />
              : <Waves className="h-3 w-3" />
            }
            Rhine {waterAlert === 'critical' ? 'Critical' : 'Low'} Water · Check Dashboard
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date / time + user */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
          <Clock className="h-3 w-3" />
          <span className="text-[10px] font-bold tracking-wide">{dateStr} · {timeStr} CET</span>
        </div>
        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="h-8 w-8 rounded-xl bg-gradient-to-br from-maersk-dark to-maersk-blue p-0.5 shadow-md cursor-pointer"
        >
          <div className="h-full w-full rounded-[9px] bg-white flex items-center justify-center overflow-hidden">
            <User className="h-4 w-4 text-maersk-dark" />
          </div>
        </motion.div>
      </div>
    </header>
  );
}

export default function App() {
  // Granular selectors — each component only re-renders when its own slice changes
  const activeTab               = usePlannerStore(s => s.activeTab);
  const setActiveTab            = usePlannerStore(s => s.setActiveTab);
  const setScheduleOverrideMeta = usePlannerStore(s => s.setScheduleOverrideMeta);
  const setTruckCapacityData    = usePlannerStore(s => s.setTruckCapacityData);
  const setTerminalCongestionData = usePlannerStore(s => s.setTerminalCongestionData);

  // Rhine water level alert (2-hour refresh — separate from dashboard's 30-min refresh)
  const { data: rhineData } = useRhineWaterLevels(2 * 60 * 60 * 1000);
  const waterAlert: 'critical' | 'low' | null = (() => {
    if (!rhineData || rhineData.length === 0) return null;
    if (rhineData.some(s => s.status === 'Critical' && !s.error)) return 'critical';
    if (rhineData.some(s => s.status === 'Low'      && !s.error)) return 'low';
    return null;
  })();

  // Load schedule overrides from Supabase on startup so all users share the same data
  useEffect(() => {
    let cancelled = false;
    async function fetchOverrides() {
      try {
        const { data, error } = await supabase
          .from('schedule_overrides')
          .select('id, data');
        if (cancelled) return;
        if (error) { console.warn('[Schedules] Remote override fetch error:', error); return; }
        if (!data) return;
        const imp      = data.find(r => r.id === 'imp')?.data      ?? null;
        const exp      = data.find(r => r.id === 'exp')?.data      ?? null;
        const meta     = data.find(r => r.id === 'meta')?.data     ?? null;
        const capacity = data.find(r => r.id === 'truck_capacity')?.data ?? null;
        const cong     = data.find(r => r.id === 'congestion')?.data     ?? null;
        loadRemoteOverrides(imp, exp, meta);
        if (meta)     setScheduleOverrideMeta(meta);
        if (capacity) setTruckCapacityData(capacity);
        if (cong)     setTerminalCongestionData(cong);
      } catch (err) {
        if (!cancelled) console.warn('[Schedules] Network error loading remote overrides:', err);
        // Built-in schedules remain active
      }
    }
    fetchOverrides();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable reference — won't cause Sidebar to re-render on unrelated state changes
  // NOTE: No automatic resets on tab switch — results persist so users can compare
  // planners side-by-side without losing their work. Use "New Search" in each planner
  // to explicitly clear results and start fresh.
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const ctrl = e.ctrlKey || e.metaKey;
      const alt  = e.altKey;

      // Ctrl/Cmd+K → open Quick ZIP Lookup
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('open-quick-zip'));
        return;
      }

      // Alt+D/I/E/C/S/T → tab shortcuts
      if (alt && !ctrl) {
        const keyMap: Record<string, string> = {
          d: 'dashboard',
          i: 'import',
          e: 'export',
          c: 'cycy',
          s: 'schedules',
          t: 'news',
        };
        const tab = keyMap[e.key.toLowerCase()];
        if (tab) { e.preventDefault(); handleTabChange(tab); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleTabChange]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':     return <DashboardOverview />;
      case 'import':        return <ImportPlanner />;
      case 'export':        return <ExportPlanner />;
      case 'cycy':          return <CYCYPlanner />;
      case 'schedules':     return <NetworkSchedules />;
      case 'news':          return <InlandNews />;
      case 'prd':           return <PRD />;
      case 'schedule-manager': return <ScheduleManager />;
      case 'help':          return <Help />;
      default:              return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-maersk-light font-sans overflow-hidden selection:bg-maersk-blue/30 selection:text-maersk-dark">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Orbs — static, GPU-composited */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-[10%] -right-[5%] w-[50%] h-[50%] bg-maersk-blue/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-[15%] -left-[10%] w-[40%] h-[40%] bg-maersk-dark/5 rounded-full blur-[100px]" />
          <div className="absolute top-[20%] left-[30%] w-[20%] h-[20%] bg-maersk-accent/5 rounded-full blur-[80px]" />
        </div>

        {/* Top Navigation Bar */}
        <TopBar activeTab={activeTab} waterAlert={waterAlert} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 relative scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Suspense boundary for lazy-loaded tab pages */}
                <Suspense fallback={<TabSpinner />}>
                  {renderContent()}
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global floating widgets (rendered outside the scroll container so they stay fixed) */}
      <QuickZipLookup />
    </div>
  );
}
