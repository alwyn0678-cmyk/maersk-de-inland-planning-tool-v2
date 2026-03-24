import { motion } from 'motion/react';
import { Ship, Truck, Clock, CheckCircle2, TrendingUp, TrendingDown, Activity, Package, Waves } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

import { usePlannerStore } from '../../store/usePlannerStore';

export function StatsOverview() {
  const { truckCapacityData } = usePlannerStore();

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

    const rhineStat = {
      label: 'Avg. Rhine Level',
      value: '1.42m',
      status: 'Normal Flow',
      change: '-0.15m',
      trend: 'down',
      icon: Waves,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      chart: [1.8, 1.7, 1.65, 1.6, 1.55, 1.5, 1.42]
    };

    return [...truckStats, rhineStat];
  };

  const stats = getStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            delay: i * 0.1, 
            duration: 0.6, 
            ease: [0.22, 1, 0.36, 1] 
          }}
          whileHover={{ y: -10, scale: 1.02 }}
        >
          <Card className="bg-white border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-500 group rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-10 relative">
              {/* Shimmer Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-maersk-blue/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              
              {/* Pulse Effect for high capacity */}
              {parseInt(stat.value) > 80 && (
                <div className="absolute top-6 right-6 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 shadow-[0_0_15px_rgba(5,150,105,0.5)]"></span>
                </div>
              )}

              <div className="flex items-start justify-between mb-8">
                <div className={`p-5 rounded-[1.5rem] ${stat.bg} ${stat.color} shadow-md transition-all group-hover:rotate-6 group-hover:scale-110 duration-500 ring-4 ring-slate-50`}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="flex flex-col items-end space-y-3">
                  <div className={`flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-sm border ${
                    stat.trend === 'up' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    {stat.trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    <span>{stat.change}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-xl border-2 shadow-sm",
                    stat.status.includes('Full') ? "bg-emerald-600 text-white border-emerald-700" :
                    stat.status.includes('Medium') ? "bg-amber-500 text-white border-amber-600" :
                    "bg-maersk-blue text-white border-maersk-blue/80"
                  )}>
                    {stat.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.25em] group-hover:text-maersk-blue transition-colors duration-500">{stat.label}</p>
                <div className="flex items-baseline space-x-2">
                  <h3 className="text-5xl font-black text-maersk-dark tracking-tighter group-hover:text-maersk-blue transition-colors duration-500">
                    {stat.value.replace('%', '').replace('m', '')}
                  </h3>
                  <span className="text-xl font-black text-slate-600">{stat.value.includes('%') ? '%' : 'm'}</span>
                </div>
              </div>

              {/* Enhanced Sparkline */}
              <div className="mt-10 h-16 flex items-end space-x-2">
                {stat.chart.map((val, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ height: 0 }}
                    animate={{ height: `${(val / (stat.value.includes('m') ? 2 : 100)) * 100}%` }}
                    transition={{ delay: 0.6 + (idx * 0.1), duration: 1, ease: "circOut" }}
                    className={`flex-1 rounded-full ${stat.color.replace('text', 'bg')} opacity-20 group-hover:opacity-100 transition-all duration-700 group-hover:shadow-[0_0_10px_rgba(0,0,0,0.05)]`}
                  />
                ))}
              </div>
              
              {/* Bottom Accent Line */}
              <div className={cn(
                "absolute bottom-0 left-0 h-2 transition-all duration-700 ease-out group-hover:w-full w-0",
                stat.color.replace('text', 'bg')
              )} />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
