/**
 * On-demand water level report generator.
 *
 * Accuracy notes:
 * - API returns a bare JSON array (not wrapped). Verified against live pegelonline v2 API.
 * - Timestamps include CET/CEST offset (e.g. "2026-03-25T10:00:00+01:00").
 *   Date grouping uses the local date part of the timestamp string directly
 *   (first 10 chars) — avoids UTC↔local mismatch that would misattribute
 *   midnight readings to the wrong calendar day.
 * - Levels: API returns cm as floats. We round to nearest cm then convert to
 *   metres (2 decimal places), matching the official reporting format.
 * - Low-water detection uses the official operational thresholds per station.
 * - Forecast: linear trend averaged over the last 3 completed days.
 *   Today's partial data is excluded from trend calculation to avoid skew.
 *   Clearly labelled "(est.)" — not an official forecast.
 *
 * Only called when the user clicks "Export Report" — zero page-load impact.
 */

const PEGEL_BASE = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations';

// Official operational low-water thresholds per station
const REPORT_STATIONS = [
  { site: 'Kaub',             station: 'KAUB',             thresholdM: 1.50, desc: 'middle part of the river Rhine' },
  { site: 'Cologne',          station: 'KÖLN',             thresholdM: 1.95, desc: 'middle part of the river Rhine' },
  { site: 'Duisburg-Ruhrort', station: 'DUISBURG-RUHRORT', thresholdM: 3.00, desc: 'terminal hub'                  },
] as const;

/** "YYYY-MM-DD" → "DD-MM-YYYY" */
function fmtKey(key: string): string {
  const [y, m, d] = key.split('-');
  return `${d}-${m}-${y}`;
}

/** Today's date as "DD-MM-YYYY" in local time */
function todayFmt(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${d}-${m}-${now.getFullYear()}`;
}

/** Today as "YYYY-MM-DD" in local time */
function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Advance a "YYYY-MM-DD" key by N days */
function advanceDayKey(key: string, days: number): string {
  // Use noon to safely avoid DST boundary issues
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface DailyReading {
  key: string;    // "YYYY-MM-DD"
  level: number;  // metres, rounded to 2dp
}

async function fetchDailyReadings(station: string, days: number): Promise<DailyReading[]> {
  // Fetch an extra day of buffer so we always have 5 complete days
  const start = new Date();
  start.setDate(start.getDate() - (days + 1));
  start.setHours(0, 0, 0, 0);

  const url = `${PEGEL_BASE}/${encodeURIComponent(station)}/W/measurements.json?start=${start.toISOString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${station}`);

  const raw: { timestamp: string; value: number }[] = await res.json();
  if (!Array.isArray(raw) || raw.length === 0) throw new Error(`No data returned for ${station}`);

  // Group by LOCAL calendar date.
  // We extract the date directly from the timestamp string (first 10 chars: "YYYY-MM-DD")
  // because the API returns CET/CEST timestamps like "2026-03-25T10:00:00+01:00".
  // This avoids any UTC↔local conversion error around midnight.
  const byDate = new Map<string, number>();
  for (const m of raw) {
    const localDate = m.timestamp.substring(0, 10); // CET local date
    byDate.set(localDate, Math.round(m.value) / 100); // last reading of each day wins
  }

  // Sort ascending and return
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, level]) => ({ key, level }));
}

function buildForecast(historicalDays: DailyReading[], forecastDays: number): DailyReading[] {
  // Use only fully-completed days (exclude today) for trend calculation to avoid
  // skewing the slope with a partial day's latest reading.
  const today = todayKey();
  const completed = historicalDays.filter(r => r.key < today);
  if (completed.length < 2) return [];

  const sample = completed.slice(-Math.min(3, completed.length));
  const avgDelta = (sample[sample.length - 1].level - sample[0].level) / (sample.length - 1);

  const lastCompleted = completed[completed.length - 1];

  return Array.from({ length: forecastDays }, (_, i) => {
    const key = advanceDayKey(lastCompleted.key, i + 1);
    // Round to 2dp — same precision as official readings
    const level = Math.max(0, Math.round((lastCompleted.level + avgDelta * (i + 1)) * 100) / 100);
    return { key, level };
  });
}

export async function generateWaterLevelReport(): Promise<string> {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const lines: string[] = [
    `MAERSK DE — RHINE WATER LEVEL REPORT`,
    `Generated : ${todayFmt()} · ${timeStr} CET`,
    ``,
    `─────────────────────────────────────────────────────────`,
    `[OPERATIONAL NOTES — add situation summary before sending]`,
    `─────────────────────────────────────────────────────────`,
    ``,
    `LOW WATER THRESHOLDS`,
    `─────────────────────────────────────────────────────────`,
  ];

  for (const { site, thresholdM, desc } of REPORT_STATIONS) {
    lines.push(
      `Low water situation at measure point ${site} - ${desc} starts as from ${thresholdM.toFixed(2)} meter and lower.`,
    );
  }

  lines.push(``);

  for (const { site, station, thresholdM } of REPORT_STATIONS) {
    let readings: DailyReading[];
    let forecast: DailyReading[] = [];

    try {
      readings = await fetchDailyReadings(station, 5);
      // Keep last 5 entries (oldest first)
      if (readings.length > 5) readings = readings.slice(-5);
      forecast = buildForecast(readings, 2);
    } catch {
      lines.push(`Measure point ${site} :`);
      lines.push(`  (Live data unavailable — check pegelonline.wsv.de directly)`);
      lines.push(``);
      continue;
    }

    const latest = readings[readings.length - 1];
    const isCurrentlyLow = latest.level <= thresholdM;

    lines.push(`Measure point ${site} :`);
    lines.push(
      `Level at measure point ${site} today ${todayFmt()} is ${latest.level.toFixed(2)} meter.` +
      (isCurrentlyLow ? `  ⚠ LOW WATER` : ''),
    );
    lines.push(``);

    // Historical rows with low-water transition markers
    let prevLow: boolean | null = null;
    for (const r of readings) {
      const isLow = r.level <= thresholdM;
      let tag = '';
      if (prevLow !== null) {
        if (isLow && !prevLow)  tag = '  * Start of low water *';
        if (!isLow && prevLow) tag = '  * End of low water *';
      }
      prevLow = isLow;
      lines.push(`${fmtKey(r.key)} : ${r.level.toFixed(2)} meter${tag}`);
    }

    // Forecast rows
    if (forecast.length > 0) {
      lines.push(``);
      lines.push(`2-day outlook (trend-based estimate — not an official forecast):`);
      for (const f of forecast) {
        const isLow = f.level <= thresholdM;
        const lowTag = isLow ? `  ⚠ LOW WATER (est.)` : '';
        lines.push(`${fmtKey(f.key)} : ${f.level.toFixed(2)} meter  (est.)${lowTag}`);
      }
    }

    lines.push(``);
  }

  lines.push(`─────────────────────────────────────────────────────────`);
  lines.push(`Forecast values are trend-based estimates derived from the last 3 completed daily readings.`);
  lines.push(`Always verify with live data at pegelonline.wsv.de before making operational decisions.`);
  lines.push(``);
  lines.push(`Generated by Maersk DE Inland Ops Tool`);

  return lines.join('\n');
}
