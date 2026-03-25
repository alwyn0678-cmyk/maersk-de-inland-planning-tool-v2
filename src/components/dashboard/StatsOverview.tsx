import { motion } from 'motion/react';
import { Ship, Truck, Clock, CheckCircle2, TrendingUp, TrendingDown, Activity, Package, Waves } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

import { usePlannerStore } from '../../store/usePlannerStore';
import { useRhineWaterLevels } from '../../hooks/useRhineWaterLevels';

export function StatsOverview() {
  const { truckCapacityData } = usePlannerStore();
  const { data: waterLevelData } = useRhineWaterLevels(5 * 60 * 1000);

  const getStatus = (val: number) => {
    if (val > 80) return 'Capacity Full';
    if (val > 50) return 'Capacity Medium';
    return 'Capacity Low';
  };

  const getStats = () => {
    const truckStats = truckCapacityData.map((hub, i) => {
      const capacity = Math.round((hub.forecast.filter(v => v === 1).length / 15) * 100);
      const colors = [
        { text: 'text-blue-600', bg: 'bg-blue-50' },
        { text: 'text-amber-600', bg: 'bg-amber-50' },
        { text: 'text-emerald-600', bg: 'bg-emerald-50' }
      ];
      
      return {
        label: `Truck Cap. ${hub.location}`,
        value: `${capacity}%`,
        status: getStatus(capacity),
        change: i === 1 ? '-8.2%' : '+2.4%', // Keeping some static variety for trend
        trend: i === 1 ? 'down' : 'up',
        icon: Truck,
        color: colors[i % colors.length].text,
        bg: colors[i % colors.length].bg,
        chart: hub.forecast.map(v => v === 1 ? 80 + Math.random() * 20 : 20 + Math.random() * 30)
      };
    });

    const liveLevels = waterLevelData.filter(s => s.level !== null && !s.error).map(s => s.level as number);
    const avgLevel = liveLevels.length > 0 ? liveLevels.reduce((a, b) => a + b, 0) / liveLevels.length : null;
    const rhineTrend = waterLevelData.filter(s => !s.error).reduce((acc, s) => {
      if (s.trend === 'up') return acc + 1;
      if (s.trend === 'down') return acc - 1;
      return acc;
    }, 0);
    const rhineStatus = avgLevel === null ? 'No Data' : avgLevel < 1.5 ? 'Low' : avgLevel > 4.0 ? 'High Flow' : 'Normal Flow';
    const rhineStat = {
      label: 'Avg. Rhine Level',
      value: avgLevel !== null ? `${avgLevel.toFixed(2)}m` : '—',
      status: rhineStatus,
      change: rhineTrend >= 0 ? '+rising' : '-falling',
      trend: rhineTrend >= 0 ? 'up' : 'down',
      icon: Waves,
      color: rhineStatus === 'Low' ? 'text-amber-600' : rhineStatus === 'High Flow' ? 'text-rose-600' : 'text-blue-600',
      bg: rhineStatus === 'Low' ? 'bg-amber-50' : rhineStatus === 'High Flow' ? 'bg-rose-50' : 'bg-blue-50',
      chart: liveLevels.length >= 2 ? liveLevels : [avgLevel ?? 2.0, avgLevel ?? 2.0]
    };

    return [...truckStats, rhineStat];
  };

  const stats = getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: i * 0.08,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1]
          }}
          whileHover={{ y: -4, scale: 1.01 }}
        >
          <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group rounded-xl overflow-hidden">
            <CardContent className="p-4 relative">
              {/* Shimmer Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-maersk-blue/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              {/* Pulse for high capacity */}
              {parseInt(stat.value) > 80 && (
                <div className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} shadow-sm transition-all group-hover:scale-105 duration-200`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className={`flex items-center space-x-1 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
                    stat.trend === 'up' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    {stat.trend === 'up' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    <span>{stat.change}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border",
                    stat.status.includes('Full') ? "bg-emerald-600 text-white border-emerald-700" :
                    stat.status.includes('Medium') ? "bg-amber-500 text-white border-amber-600" :
                    stat.status === 'Low' ? "bg-amber-500 text-white border-amber-600" :
                    "bg-maersk-blue text-white border-maersk-blue/80"
                  )}>
                    {stat.status}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] group-hover:text-maersk-blue transition-colors duration-200">{stat.label}</p>
                <div className="flex items-baseline space-x-1">
                  <h3 className="text-2xl font-black text-maersk-dark tracking-tighter group-hover:text-maersk-blue transition-colors duration-200">
                    {stat.value === '—' ? '—' : stat.value.replace('%', '').replace('m', '')}
                  </h3>
                  {stat.value !== '—' && (
                    <span className="text-sm font-black text-slate-500">{stat.value.includes('%') ? '%' : 'm'}</span>
                  )}
                </div>
              </div>

              {/* Sparkline */}
              <div className="mt-3 h-8 flex items-end space-x-0.5">
                {stat.chart.map((val, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ height: 0 }}
                    animate={{ height: `${(val / (stat.value.includes('m') ? 4 : 100)) * 100}%` }}
                    transition={{ delay: 0.3 + (idx * 0.06), duration: 0.7, ease: "circOut" }}
                    className={`flex-1 rounded-sm ${stat.color.replace('text', 'bg')} opacity-25 group-hover:opacity-70 transition-all duration-300`}
                  />
                ))}
              </div>

              {/* Bottom Accent Line */}
              <div className={cn(
                "absolute bottom-0 left-0 h-0.5 transition-all duration-400 ease-out group-hover:w-full w-0",
                stat.color.replace('text', 'bg')
              )} />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
