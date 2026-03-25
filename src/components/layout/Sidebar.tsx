import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Anchor,
  Send,
  HelpCircle,
  LogOut,
  Ship,
  ArrowRightLeft,
  CalendarDays,
  Newspaper,
} from 'lucide-react';
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
  return (
    <div className="relative flex flex-col h-screen w-[220px] bg-[#00243d] text-white border-r border-white/10 px-4 z-50 shrink-0">
      {/* Logo Section */}
      <div className="flex items-center h-14 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-[#42b0d5] rounded-lg shadow-lg shadow-[#42b0d5]/20">
            <Ship className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight leading-none">Maersk</h1>
            <p className="text-[9px] text-[#42b0d5] font-bold uppercase tracking-widest mt-0.5">Inland Ops</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 space-y-1 overflow-y-auto">
        {BASE_MENU_ITEMS.map((item) => (
          <NavButton key={item.id} item={item} activeTab={activeTab} onTabChange={onTabChange} variant="main" />
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
            <item.icon className="h-4 w-4 shrink-0 mr-3 transition-transform duration-300 group-hover:scale-110" />
            <span className={cn(
              "font-bold text-xs tracking-tight",
              activeTab === item.id ? "opacity-100" : "opacity-80 group-hover:opacity-100"
            )}>{item.label}</span>
          </button>
        ))}

        <button
          className="flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group relative text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 mt-2"
        >
          <LogOut className="h-4 w-4 shrink-0 mr-3" />
          <span className="font-medium text-xs">Sign Out</span>
        </button>
      </div>
    </div>
  );
}

// ─── helper component ─────────────────────────────────────────────────────────

function NavButton({
  item,
  activeTab,
  onTabChange,
}: {
  item: { id: string; label: string; icon: React.ElementType };
  activeTab: string;
  onTabChange: (tab: string) => void;
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
        "h-4 w-4 shrink-0 mr-3 transition-transform duration-300 group-hover:scale-110",
        isActive
          ? isViolet ? "text-violet-400" : "text-maersk-blue"
          : "text-slate-300 group-hover:text-white"
      )} />
      <span className={cn(
        "font-black text-xs tracking-tight",
        isActive ? "opacity-100" : "opacity-80 group-hover:opacity-100"
      )}>{item.label}</span>
      {isActive && !isViolet && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute right-3 h-1.5 w-1.5 rounded-full bg-maersk-blue shadow-glow"
        />
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
