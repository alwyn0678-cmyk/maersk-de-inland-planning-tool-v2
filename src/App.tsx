import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ImportPlanner } from './pages/ImportPlanner';
import { ExportPlanner } from './pages/ExportPlanner';
import { CYCYPlanner } from './pages/CYCYPlanner';
import { PRD } from './pages/PRD';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Search, User, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';

import { usePlannerStore } from './store/usePlannerStore';

export default function App() {
  const { activeTab, setActiveTab } = usePlannerStore();

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
      case 'prd':
        return <PRD />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-maersk-light font-sans overflow-hidden selection:bg-maersk-blue/30 selection:text-maersk-dark">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              x: [0, 100, 0],
              y: [0, 50, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -right-[5%] w-[50%] h-[50%] bg-maersk-blue/10 rounded-full blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              x: [0, -100, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[15%] -left-[10%] w-[40%] h-[40%] bg-maersk-dark/5 rounded-full blur-[100px]" 
          />
          <motion.div 
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[30%] w-[20%] h-[20%] bg-maersk-accent/5 rounded-full blur-[80px]" 
          />
        </div>

        {/* Top Navigation Bar */}
        <header className="h-20 border-b border-maersk-blue/20 glass flex items-center justify-between px-8 shrink-0 z-40 shadow-md">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-maersk-blue transition-all" />
              <Input 
                placeholder="Search routes, schedules, or documentation..." 
                className="pl-12 bg-white border-slate-200 focus-visible:ring-2 focus-visible:ring-maersk-blue/50 h-12 rounded-2xl transition-all shadow-sm text-maersk-dark font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 ml-8">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-slate-600 hover:text-maersk-dark hover:bg-white rounded-2xl relative transition-all hover-glow border border-transparent hover:border-maersk-blue/10">
                <Bell className="h-5 w-5" />
                <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-maersk-accent rounded-full border-2 border-white animate-pulse" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`text-slate-600 hover:text-maersk-dark hover:bg-white rounded-2xl transition-all hover-glow border border-transparent hover:border-maersk-blue/10 ${activeTab === 'settings' ? 'bg-white shadow-sm text-maersk-dark border-maersk-blue/20' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="h-8 w-px bg-slate-200 mx-2" />
            
            <div className="flex items-center space-x-4 pl-2 group cursor-pointer">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-maersk-dark leading-none tracking-tight group-hover:text-maersk-blue transition-colors">Alwyn</p>
                <p className="text-[10px] font-black text-maersk-blue uppercase tracking-[0.2em] mt-1.5 opacity-90">Senior Planner</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="h-12 w-12 rounded-2xl bg-gradient-to-br from-maersk-dark to-maersk-blue p-0.5 shadow-xl shadow-maersk-dark/20 cursor-pointer hover-glow"
              >
                <div className="h-full w-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                  <User className="h-6 w-6 text-maersk-dark" />
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
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
