import { useState, useEffect, useCallback } from 'react';

export interface WaterLevelSite {
  site: string;
  station: string;
  level: number | null;         // cm
  trend: 'up' | 'down' | 'stable';
  status: 'Normal' | 'Low' | 'Critical';
  history: { time: string; val: number }[];
  lastUpdated: string;
  error?: boolean;
}

const STATIONS: { site: string; station: string }[] = [
  { site: 'Bonn',        station: 'BONN' },
  { site: 'Köln',        station: 'KÖLN' },
  { site: 'Düsseldorf',  station: 'DÜSSELDORF' },
  { site: 'Duisburg',   station: 'DUISBURG-RUHRORT' },
  { site: 'Emmerich',   station: 'EMMERICH' },
];

const PEGEL_BASE = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations';

function classify(levelCm: number): 'Normal' | 'Low' | 'Critical' {
  if (levelCm < 100) return 'Critical';
  if (levelCm < 200) return 'Low';
  return 'Normal';
}

function computeTrend(history: { val: number }[]): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable';
  const first = history[0].val;
  const last = history[history.length - 1].val;
  const diff = last - first;
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}

async function fetchStation(station: string): Promise<{ measurements: { timestamp: string; value: number }[] }> {
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const url = `${PEGEL_BASE}/${encodeURIComponent(station)}/W/measurements.json?start=${start}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useRhineWaterLevels(refreshIntervalMs = 5 * 60 * 1000) {
  const [data, setData] = useState<WaterLevelSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    const results: WaterLevelSite[] = await Promise.all(
      STATIONS.map(async ({ site, station }) => {
        try {
          const { measurements } = await fetchStation(station);
          if (!measurements || measurements.length === 0) throw new Error('No data');

          // Build 6-point history (sample from last 24h)
          const step = Math.floor(measurements.length / 6);
          const history = Array.from({ length: 6 }, (_, i) => {
            const m = measurements[Math.min(i * step, measurements.length - 1)];
            const d = new Date(m.timestamp);
            const hh = d.getHours().toString().padStart(2, '0');
            const mm = d.getMinutes().toString().padStart(2, '0');
            return { time: `${hh}:${mm}`, val: Math.round(m.value) / 100 };  // cm → m
          });

          const latestCm = measurements[measurements.length - 1].value;
          const latestM = Math.round(latestCm) / 100;

          return {
            site,
            station,
            level: latestM,
            trend: computeTrend(history),
            status: classify(latestCm),
            history,
            lastUpdated: new Date().toISOString(),
          };
        } catch {
          return {
            site,
            station,
            level: null,
            trend: 'stable' as const,
            status: 'Normal' as const,
            history: [],
            lastUpdated: new Date().toISOString(),
            error: true,
          };
        }
      })
    );
    setData(results);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [fetchAll, refreshIntervalMs]);

  return { data, loading, lastRefresh, refresh: fetchAll };
}
