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
  // Timestamps from the API are CET/CEST (e.g. "2026-03-25T07:15:00+01:00").
  // We extract the date and hour directly from the string to avoid UTC↔local mismatch.
  //
  // Reading selection:
  //   Past completed days → reading closest to 07:00 CET.
  //     This matches the official WSV daily gauge value used in Pegel bulletins,
  //     so numbers align when the manager cross-checks against official sources.
  //   Today → most recent reading available (no 07:00 reading yet for the full day).
  const today = todayKey();
  const byDate = new Map<string, { level: number; diff: number }>();

  for (const m of raw) {
    const localDate = m.timestamp.substring(0, 10); // "YYYY-MM-DD" in CET
    const level = Math.round(m.value) / 100;

    if (localDate === today) {
      // Always overwrite with the latest reading for today
      byDate.set(localDate, { level, diff: -1 });
    } else {
      // Pick reading closest to 07:00 CET
      const hour = parseInt(m.timestamp.substring(11, 13), 10);
      const min  = parseInt(m.timestamp.substring(14, 16), 10);
      const diff = Math.abs(hour * 60 + min - 7 * 60); // distance from 07:00 in minutes
      const existing = byDate.get(localDate);
      if (!existing || diff < existing.diff) {
        byDate.set(localDate, { level, diff });
      }
    }
  }

  // Sort ascending and return
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { level }]) => ({ key, level }));
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
  const SEP  = `═══════════════════════════════════════════════════════════`;
  const SEP2 = `───────────────────────────────────────────────────────────`;

  // Fetch all stations up front so we can build the summary table
  type StationData = {
    site: string;
    thresholdM: number;
    readings: DailyReading[];
    forecast: DailyReading[];
    error: boolean;
  };

  const stationData: StationData[] = await Promise.all(
    REPORT_STATIONS.map(async ({ site, station, thresholdM }) => {
      try {
        let readings = await fetchDailyReadings(station, 5);
        if (readings.length > 5) readings = readings.slice(-5);
        const forecast = buildForecast(readings, 2);
        return { site, thresholdM, readings, forecast, error: false };
      } catch {
        return { site, thresholdM, readings: [], forecast: [], error: true };
      }
    })
  );

  const lines: string[] = [];

  // ── Header ────────────────────────────────────────────────────────────────
  lines.push(SEP);
  lines.push(`  MAERSK DE — RHINE WATER LEVEL REPORT`);
  lines.push(`  Generated : ${todayFmt()}  ·  ${timeStr} CET`);
  lines.push(SEP);
  lines.push(``);

  // ── Operational notes placeholder ─────────────────────────────────────────
  lines.push(`  OPERATIONAL NOTES`);
  lines.push(SEP2);
  lines.push(`  [Add situation summary / action items here before sending]`);
  lines.push(``);

  // ── Status overview table ─────────────────────────────────────────────────
  lines.push(`  CURRENT STATUS OVERVIEW  (as of ${todayFmt()})`);
  lines.push(SEP2);
  lines.push(`  ${'Station'.padEnd(22)} ${'Level today'.padEnd(14)} ${'Threshold'.padEnd(12)} Status`);
  lines.push(`  ${'─'.repeat(21)} ${'─'.repeat(13)} ${'─'.repeat(11)} ${'─'.repeat(14)}`);

  for (const { site, thresholdM, readings, error } of stationData) {
    if (error || readings.length === 0) {
      lines.push(`  ${site.padEnd(22)} ${'N/A'.padEnd(14)} ${(thresholdM.toFixed(2) + ' m').padEnd(12)} DATA UNAVAILABLE`);
    } else {
      const latest = readings[readings.length - 1];
      const isLow = latest.level <= thresholdM;
      const levelStr = (latest.level.toFixed(2) + ' m').padEnd(14);
      const threshStr = (thresholdM.toFixed(2) + ' m').padEnd(12);
      const status = isLow ? `⚠  LOW WATER` : `✓  Normal`;
      lines.push(`  ${site.padEnd(22)} ${levelStr} ${threshStr} ${status}`);
    }
  }
  lines.push(``);

  // ── Detailed readings per station ─────────────────────────────────────────
  lines.push(`  DETAILED READINGS`);
  lines.push(SEP);

  for (const { site, thresholdM, readings, forecast, error } of stationData) {
    lines.push(``);
    lines.push(`  ▌ ${site.toUpperCase()}  —  Low-water threshold : ${thresholdM.toFixed(2)} m`);
    lines.push(`  ${SEP2}`);

    if (error || readings.length === 0) {
      lines.push(`    Live data unavailable — check pegelonline.wsv.de directly`);
      lines.push(``);
      continue;
    }

    // 5-day history
    lines.push(`    5-Day History :`);
    let prevLow: boolean | null = null;
    for (const r of readings) {
      const isLow = r.level <= thresholdM;
      let marker = '';
      if (prevLow !== null) {
        if (isLow && !prevLow)  marker = `   ◄ START OF LOW WATER`;
        if (!isLow && prevLow)  marker = `   ◄ End of low water`;
      }
      prevLow = isLow;
      const lowFlag = isLow ? `  ⚠` : `   `;
      lines.push(`    ${fmtKey(r.key)}  :  ${r.level.toFixed(2)} m${lowFlag}${marker}`);
    }

    // 2-day forecast
    if (forecast.length > 0) {
      lines.push(``);
      lines.push(`    2-Day Outlook  (trend estimate — not an official forecast) :`);
      for (const f of forecast) {
        const isLow = f.level <= thresholdM;
        const lowFlag = isLow ? `  ⚠  LOW WATER` : ``;
        lines.push(`    ${fmtKey(f.key)}  :  ${f.level.toFixed(2)} m  (est.)${lowFlag}`);
      }
    }

    lines.push(``);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  lines.push(SEP);
  lines.push(`  DATA SOURCE  : pegelonline.wsv.de (WSV — Wasserstraßen- und Schifffahrtsverwaltung)`);
  lines.push(`  DAILY VALUES : 07:00 CET reading (matches official WSV Pegel bulletins)`);
  lines.push(`                 Today's value = most recent reading at time of generation`);
  lines.push(`  FORECAST     : Trend-based estimate from last 3 completed daily readings — not official`);
  lines.push(`                 Always verify at pegelonline.wsv.de before making operational decisions.`);
  lines.push(`  Generated by Maersk DE Inland Ops Tool  ·  ${todayFmt()}  ·  ${timeStr} CET`);
  lines.push(SEP);

  return lines.join('\n');
}
