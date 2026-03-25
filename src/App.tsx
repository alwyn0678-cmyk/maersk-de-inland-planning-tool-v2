import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ImportPlanner } from './pages/ImportPlanner';
import { ExportPlanner } from './pages/ExportPlanner';
import { CYCYPlanner } from './pages/CYCYPlanner';
import { NetworkSchedules } from './pages/NetworkSchedules';
import { InlandNews } from './pages/InlandNews';
import { PRD } from './pages/PRD';
import { Help } from './pages/Help';
import { ScheduleManager } from './pages/ScheduleManager';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { motion, AnimatePresence } from 'motion/react';
import { User, Clock } from 'lucide-react';
import { usePlannerStore } from './store/usePlannerStore';
import { supabase } from './lib/supabaseClient';
import { loadRemoteOverrides } from './logic/scheduleOverrides';

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

function TopBar({ activeTab }: { activeTab: string }) {
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
  const { activeTab, setActiveTab, setScheduleOverrideMeta } = usePlannerStore();

  // Load schedule overrides from Supabase on startup so all users share the same data
  useEffect(() => {
    async function fetchOverrides() {
      try {
        const { data, error } = await supabase
          .from('schedule_overrides')
          .select('id, data');
        if (error || !data) return; // fail silently — built-in schedules remain active
        const imp  = data.find(r => r.id === 'imp')?.data  ?? null;
        const exp  = data.find(r => r.id === 'exp')?.data  ?? null;
        const meta = data.find(r => r.id === 'meta')?.data ?? null;
        loadRemoteOverrides(imp, exp, meta);
        if (meta) setScheduleOverrideMeta(meta);
      } catch {
        // Network error — built-in schedules remain active
      }
    }
    fetchOverrides();
  }, []);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'import':
        return <ImportPlanner />;
      case 'export':
        return <ExportPlanner />;
      case 'cycy':
        return <CYCYPlanner />;
      case 'schedules':
        return <NetworkSchedules />;
      case 'news':
        return <InlandNews />;
      case 'prd':
        return <PRD />;
      case 'schedule-manager':
        return <ScheduleManager />;
      case 'help':
        return <Help />;
      default:
        return <DashboardOverview />;
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
        <TopBar activeTab={activeTab} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 relative scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
