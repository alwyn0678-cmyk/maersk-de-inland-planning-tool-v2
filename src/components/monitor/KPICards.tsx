// ── KPI Cards ─────────────────────────────────────────────────────────────

import { motion } from 'motion/react';
import { MonitorKPIs } from '../../types/monitor';
import { cn } from '../../lib/utils';
import {
  Layers,
  AlertOctagon,
  AlertTriangle,
  Ship,
  FileWarning,
  Clock,
  XCircle,
  TrendingUp,
} from 'lucide-react';

interface KPICardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
  delay?: number;
}

function KPICard({ icon: Icon, label, value, color, bgColor, borderColor, delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay }}
      className={cn(
        'rounded-xl border p-4 flex items-start gap-3',
        bgColor, borderColor
      )}
    >
      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-none', bgColor, 'border', borderColor)}>
        <Icon className={cn('h-4 w-4', color)} />
      </div>
      <div className="min-w-0">
        <div className={cn('text-2xl font-black leading-none', color)}>{value}</div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 leading-tight">{label}</div>
      </div>
    </motion.div>
  );
}

export function KPICards({ kpis }: { kpis: MonitorKPIs }) {
  const cards: Omit<KPICardProps, 'delay'>[] = [
    {
      icon: Layers,
      label: 'Total Shipments',
      value: kpis.total,
      color: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
    },
    {
      icon: AlertOctagon,
      label: 'Critical',
      value: kpis.critical,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
    {
      icon: AlertTriangle,
      label: 'High Risk',
      value: kpis.high,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      icon: Ship,
      label: 'Exports at Risk of Missing CCO',
      value: kpis.exportsAtRiskOfMissingCCO,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      icon: FileWarning,
      label: 'Missing Customer Refs',
      value: kpis.missingCustomerRefs,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      icon: Clock,
      label: 'Not Started Within 24h',
      value: kpis.notStartedWithin24h,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      icon: XCircle,
      label: 'No Feasible Plan',
      value: kpis.noFeasiblePlan,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    },
    {
      icon: TrendingUp,
      label: 'Better Option Available',
      value: kpis.betterOptionAvailable,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      {cards.map((card, i) => (
        <KPICard key={card.label} {...card} delay={i * 0.04} />
      ))}
    </div>
  );
}
