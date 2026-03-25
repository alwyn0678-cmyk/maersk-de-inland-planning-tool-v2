import { useState, useEffect, useCallback } from 'react';

export interface WaterLevelSite {
  site: string;
  station: string;
  level: number | null;         // meters
  trend: 'up' | 'down' | 'stable';
  status: 'Normal' | 'Low' | 'Critical';
  history: { time: string; val: number }[];
  lastUpdated: string;
  error?: boolean;
  isEstimated?: boolean;
}

// Operationally relevant Rhine gauge stations for Maersk DE inland planning
// thresholdCm = official low-water threshold for each station
const STATIONS: { site: string; station: string; thresholdCm: number; criticalCm: number }[] = [
  { site: 'Kaub',     station: 'KAUB',             thresholdCm: 150, criticalCm: 100 }, // Middle Rhine chokepoint
  { site: 'Cologne',  station: 'KÖLN',             thresholdCm: 195, criticalCm: 130 }, // NRW corridor
  { site: 'Duisburg', station: 'DUISBURG-RUHRORT', thresholdCm: 300, criticalCm: 200 }, // Key terminal hub
  { site: 'Mannheim', station: 'MANNHEIM',          thresholdCm: 200, criticalCm: 130 }, // Southern Rhine hub
  { site: 'Maxau',    station: 'MAXAU',             thresholdCm: 250, criticalCm: 160 }, // Karlsruhe / Bavaria feeder
];

// Static fallback baselines — only used when the API is unreachable.
// Clearly marked as estimated in the UI.
function makeBaseline(levelCm: number): { levelCm: number; history: { time: string; val: number }[] } {
  const levelM = levelCm / 100;
  const now = Date.now();
  const history = Array.from({ length: 6 }, (_, i) => {
    const t = new Date(now - (5 - i) * 4 * 60 * 60 * 1000);
    const hh = t.getHours().toString().padStart(2, '0');
    const mm = t.getMinutes().toString().padStart(2, '0');
    return { time: `${hh}:${mm}`, val: levelM };
  });
  return { levelCm, history };
}

const STATIC_BASELINES: Record<string, ReturnType<typeof makeBaseline>> = {
  'KAUB':             makeBaseline(150),
  'KÖLN':             makeBaseline(200),
  'DUISBURG-RUHRORT': makeBaseline(300),
  'MANNHEIM':         makeBaseline(200),
  'MAXAU':            makeBaseline(250),
};

const PEGEL_BASE = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations';

// Station-specific status classification
function classify(levelCm: number, thresholdCm: number, criticalCm: number): 'Normal' | 'Low' | 'Critical' {
  if (levelCm <= criticalCm) return 'Critical';
  if (levelCm <= thresholdCm) return 'Low';
  return 'Normal';
}

// Compare oldest to newest reading; 3cm delta = meaningful trend
function computeTrend(history: { val: number }[]): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable';
  const diff = history[history.length - 1].val - history[0].val;
  if (diff > 0.03) return 'up';
  if (diff < -0.03) return 'down';
  return 'stable';
}

// Pegelonline v2 API returns a bare JSON array — NOT wrapped in { measurements: [...] }
async function fetchStation(station: string): Promise<{ timestamp: string; value: number }[]> {
  const start = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const url = `${PEGEL_BASE}/${encodeURIComponent(station)}/W/measurements.json?start=${start}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('No data');
  return data;
}

export function useRhineWaterLevels(refreshIntervalMs = 60 * 60 * 1000) {
  const [data, setData] = useState<WaterLevelSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    const results: WaterLevelSite[] = await Promise.all(
      STATIONS.map(async ({ site, station, thresholdCm, criticalCm }) => {
        try {
          const measurements = await fetchStation(station);

          // Sample 6 evenly-spaced points across the last 24h (oldest → newest)
          const step = Math.max(1, Math.floor(measurements.length / 6));
          const history = Array.from({ length: 6 }, (_, i) => {
            const m = measurements[Math.min(i * step, measurements.length - 1)];
            const d = new Date(m.timestamp);
            const hh = d.getHours().toString().padStart(2, '0');
            const mm = d.getMinutes().toString().padStart(2, '0');
            return { time: `${hh}:${mm}`, val: Math.round(m.value) / 100 };
          });

          const latestCm = measurements[measurements.length - 1].value;
          const latestM = Math.round(latestCm) / 100;

          return {
            site,
            station,
            level: latestM,
            trend: computeTrend(history),
            status: classify(latestCm, thresholdCm, criticalCm),
            history,
            lastUpdated: new Date().toISOString(),
            isEstimated: false,
          };
        } catch {
          // Network/API failure — fall back to static baseline, clearly marked as estimated
          const baseline = STATIC_BASELINES[station];
          if (baseline) {
            return {
              site,
              station,
              level: baseline.levelCm / 100,
              trend: 'stable' as const,
              status: classify(baseline.levelCm, thresholdCm, criticalCm),
              history: baseline.history,
              lastUpdated: new Date().toISOString(),
              isEstimated: true,
              error: false,
            };
          }
          return {
            site,
            station,
            level: null,
            trend: 'stable' as const,
            status: 'Normal' as const,
            history: Array.from({ length: 6 }, (_, i) => ({ time: `${(i * 4).toString().padStart(2, '0')}:00`, val: 2.0 })),
            lastUpdated: new Date().toISOString(),
            isEstimated: true,
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
