import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Truck, Waves } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { usePlannerStore } from '../../store/usePlannerStore';
import { WaterLevelSite } from '../../hooks/useRhineWaterLevels';

interface StatsOverviewProps {
  waterLevelData: WaterLevelSite[];
}

export function StatsOverview({ waterLevelData }: StatsOverviewProps) {
  const truckCapacityData = usePlannerStore(s => s.truckCapacityData);

  const getStatus = (val: number) => {
    if (val > 80) return 'Capacity Full';
    if (val > 50) return 'Capacity Medium';
    return 'Capacity Low';
  };

  // Memoize stats so Math.random() only runs when truckCapacityData or waterLevelData changes
  const stats = useMemo(() => {
    const truckStats = truckCapacityData.map((hub, i) => {
      // Count all non-zero statuses (1–5) as "available" — status 0 = Not possible
      const capacity = Math.round((hub.forecast.filter(v => v > 0).length / 15) * 100);
      const colors = [
        { text: 'text-blue-600', bg: 'bg-blue-50' },
        { text: 'text-amber-600', bg: 'bg-amber-50' },
        { text: 'text-emerald-600', bg: 'bg-emerald-50' }
      ];
      return {
        label: `Truck Cap. ${hub.location}`,
        value: `${capacity}%`,
        status: getStatus(capacity),
        icon: Truck,
        color: colors[i % colors.length].text,
        bg: colors[i % colors.length].bg,
        // Deterministic sparkline: stable visual variation derived from index + location name
        // Avoids re-randomization on every waterLevelData refresh (every 30 min)
        chart: hub.forecast.map((v, idx) => {
          const seed = (idx * 17 + hub.location.charCodeAt(0) * 3 + hub.location.charCodeAt(hub.location.length - 1)) % 100;
          return v > 0 ? 75 + (seed % 25) : 15 + (seed % 25);
        })
      };
    });

    const liveLevels = waterLevelData.filter(s => s.level !== null && !s.error).map(s => s.level as number);
    const avgLevel = liveLevels.length > 0 ? liveLevels.reduce((a, b) => a + b, 0) / liveLevels.length : null;
    const rhineStatus = avgLevel === null ? 'No Data' : avgLevel < 1.5 ? 'Low' : avgLevel > 4.0 ? 'High Flow' : 'Normal Flow';

    const repStation = waterLevelData.find(s => !s.error && s.history.length >= 2);
    const rhineSparkline = repStation
      ? repStation.history.map(h => h.val)
      : liveLevels.length >= 2 ? liveLevels : [avgLevel ?? 2.0, avgLevel ?? 2.0];

    const rhineStat = {
      label: 'Avg. Rhine Level',
      value: avgLevel !== null ? `${avgLevel.toFixed(2)}m` : '—',
      status: rhineStatus,
      icon: Waves,
      color: rhineStatus === 'Low' ? 'text-amber-600' : rhineStatus === 'High Flow' ? 'text-rose-600' : 'text-blue-600',
      bg: rhineStatus === 'Low' ? 'bg-amber-50' : rhineStatus === 'High Flow' ? 'bg-rose-50' : 'bg-blue-50',
      chart: rhineSparkline,
    };

    return [...truckStats, rhineStat];
  }, [truckCapacityData, waterLevelData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2, scale: 1.005 }}
        >
          <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group rounded-xl overflow-hidden">
            <CardContent className="p-3 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-maersk-blue/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              <div className="flex items-start justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${stat.bg} ${stat.color} transition-all group-hover:scale-105 duration-200`}>
                  <stat.icon className="h-3.5 w-3.5" />
                </div>
                <span className={cn(
                  "text-[7px] font-black uppercase tracking-wide px-1 py-0.5 rounded border",
                  stat.status.includes('Full') ? "bg-emerald-600 text-white border-emerald-700" :
                  stat.status.includes('Medium') ? "bg-amber-500 text-white border-amber-600" :
                  stat.status === 'Low' ? "bg-amber-500 text-white border-amber-600" :
                  "bg-maersk-blue text-white border-maersk-blue/80"
                )}>
                  {stat.status}
                </span>
              </div>

              <div className="space-y-0">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.12em] group-hover:text-maersk-blue transition-colors duration-200">{stat.label}</p>
                <div className="flex items-baseline space-x-0.5">
                  <h3 className="text-xl font-black text-maersk-dark tracking-tighter group-hover:text-maersk-blue transition-colors duration-200">
                    {stat.value === '—' ? '—' : stat.value.replace('%', '').replace('m', '')}
                  </h3>
                  {stat.value !== '—' && (
                    <span className="text-xs font-black text-slate-500">{stat.value.includes('%') ? '%' : 'm'}</span>
                  )}
                </div>
              </div>

              {/* Sparkline */}
              <div className="mt-2 h-6 flex items-end space-x-0.5">
                {stat.chart.map((val, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${(val / (stat.value.includes('m') ? 4 : 100)) * 100}%` }}
                    className={`flex-1 rounded-sm ${stat.color.replace('text', 'bg')} opacity-45 group-hover:opacity-80 transition-opacity duration-300`}
                  />
                ))}
              </div>

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
