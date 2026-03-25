import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Anchor,
  Send,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Ship,
  ArrowRightLeft,
  CalendarDays,
  Newspaper,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BASE_MENU_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'import', label: 'Import Booking', icon: Anchor },
  { id: 'export', label: 'Export Booking', icon: Send },
  { id: 'cycy', label: 'CY/CY Booking', icon: ArrowRightLeft },
  { id: 'schedules', label: 'Network Schedules', icon: CalendarDays },
  { id: 'news', label: 'Terminal Directory', icon: Newspaper },
] as const;

const secondaryItems = [
  { id: 'help', label: 'Tool Guidelines', icon: HelpCircle },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 64 : 220 }}
      className={cn(
        "relative flex flex-col h-screen bg-[#00243d] text-white border-r border-white/10 overflow-hidden z-50 shrink-0",
        isCollapsed ? "px-2" : "px-4"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "flex items-center h-14 mb-4",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#42b0d5] rounded-lg shadow-lg shadow-[#42b0d5]/20">
              <Ship className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight leading-none">Maersk</h1>
              <p className="text-[9px] text-[#42b0d5] font-bold uppercase tracking-widest mt-0.5">Inland Ops</p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="p-1.5 bg-[#42b0d5] rounded-lg">
            <Ship className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
        {BASE_MENU_ITEMS.map((item) => (
          <NavButton key={item.id} item={item} activeTab={activeTab} onTabChange={onTabChange} isCollapsed={isCollapsed} variant="main" />
        ))}
      </div>

      {/* Secondary Navigation */}
      <div className="pt-4 pb-4 space-y-1 border-t border-white/10">
        {secondaryItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex items-center w-full p-2.5 rounded-xl transition-all duration-300 group relative",
              activeTab === item.id
                ? "bg-[#42b0d5] text-white shadow-lg shadow-[#42b0d5]/30"
                : "text-slate-200 hover:text-white hover:bg-white/10"
            )}
          >
            <item.icon className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110",
              activeTab === item.id ? "text-white" : "text-slate-300 group-hover:text-white",
              !isCollapsed && "mr-3"
            )} />
            {!isCollapsed && (
              <span className={cn(
                "font-bold text-xs tracking-tight whitespace-nowrap",
                activeTab === item.id ? "opacity-100" : "opacity-80 group-hover:opacity-100"
              )}>{item.label}</span>
            )}
          </button>
        ))}

        <button
          className={cn(
            "flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group relative text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 mt-2"
          )}
        >
          <LogOut className={cn("h-4 w-4 shrink-0", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span className="font-medium text-xs">Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 h-5 w-5 bg-[#42b0d5] rounded-full flex items-center justify-center border-2 border-[#00243d] text-white hover:scale-110 transition-transform shadow-lg"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.div>
  );
}

// ─── helper component ─────────────────────────────────────────────────────────

function NavButton({
  item,
  activeTab,
  onTabChange,
  isCollapsed,
}: {
  item: { id: string; label: string; icon: React.ElementType };
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  variant: 'main' | 'tool';
}) {
  const isActive = activeTab === item.id;
  const isViolet = item.id === 'schedule-manager';

  return (
    <button
      onClick={() => onTabChange(item.id)}
      className={cn(
        "flex items-center w-full p-2.5 rounded-xl transition-all duration-300 group relative",
        isActive
          ? isViolet
            ? "bg-violet-500/20 text-violet-200 border border-violet-500/30"
            : "bg-white text-maersk-dark shadow-lg shadow-black/10 scale-[1.02]"
          : "text-slate-100 hover:text-white hover:bg-white/20"
      )}
    >
      <item.icon className={cn(
        "h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110",
        isActive
          ? isViolet ? "text-violet-400" : "text-maersk-blue"
          : "text-slate-300 group-hover:text-white",
        !isCollapsed && "mr-3"
      )} />
      {!isCollapsed && (
        <span className={cn(
          "font-black text-xs tracking-tight whitespace-nowrap",
          isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"
        )}>{item.label}</span>
      )}
      {isActive && !isCollapsed && !isViolet && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute right-3 h-1.5 w-1.5 rounded-full bg-maersk-blue shadow-glow"
        />
      )}
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-8px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl border border-white/10">
          {item.label}
        </div>
      )}
      {isActive && !isViolet && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 w-0.5 h-5 bg-white rounded-full ml-1"
        />
      )}
    </button>
  );
}
