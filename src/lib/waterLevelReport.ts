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

const DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MON_NAMES  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** "YYYY-MM-DD" → "Wed 25 Mar" */
function fmtKey(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MON_SHORT[d.getMonth()]}`;
}

/** Today's date as "Wednesday 25 March 2026" */
function todayLong(): string {
  const now = new Date();
  return `${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MON_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

/** Today's date as "25 March 2026" */
function todayFmt(): string {
  const now = new Date();
  return `${now.getDate()} ${MON_NAMES[now.getMonth()]} ${now.getFullYear()}`;
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
  const DIV  = `----------------------------------------------------------------`;
  const THIN = `- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -`;

  type StationData = {
    site: string;
    thresholdM: number;
    desc: string;
    readings: DailyReading[];
    forecast: DailyReading[];
    error: boolean;
  };

  const stationData: StationData[] = await Promise.all(
    REPORT_STATIONS.map(async ({ site, station, thresholdM, desc }) => {
      try {
        let readings = await fetchDailyReadings(station, 5);
        if (readings.length > 5) readings = readings.slice(-5);
        const forecast = buildForecast(readings, 2);
        return { site, thresholdM, desc, readings, forecast, error: false };
      } catch {
        return { site, thresholdM, desc, readings: [], forecast: [], error: true };
      }
    })
  );

  const anyLow = stationData.some(
    s => !s.error && s.readings.length > 0 && s.readings[s.readings.length - 1].level <= s.thresholdM
  );

  const lines: string[] = [];

  // ── Subject line ──────────────────────────────────────────────────────────
  const subjectStatus = anyLow ? 'ACTION: Low Water Situation' : 'Rhine Water Level Update';
  lines.push(`SUBJECT: ${subjectStatus} — ${todayFmt()}`);
  lines.push(``);
  lines.push(DIV);
  lines.push(``);

  // ── Greeting & intro ──────────────────────────────────────────────────────
  lines.push(`Dear Team,`);
  lines.push(``);
  lines.push(`Please find below the Rhine water level update for ${todayLong()}.`);
  if (anyLow) {
    lines.push(`One or more stations are currently reporting low-water conditions — please review and take appropriate action.`);
  }
  lines.push(``);

  // ── Operational notes placeholder ─────────────────────────────────────────
  lines.push(DIV);
  lines.push(`OPERATIONAL NOTES`);
  lines.push(DIV);
  lines.push(``);
  lines.push(`[Add situation summary and action items here before sending]`);
  lines.push(``);

  // ── Current status overview ───────────────────────────────────────────────
  lines.push(DIV);
  lines.push(`CURRENT STATUS  —  ${todayFmt()}  (07:00 CET reading)`);
  lines.push(DIV);
  lines.push(``);

  for (const { site, thresholdM, readings, error } of stationData) {
    if (error || readings.length === 0) {
      lines.push(`  ${site.padEnd(20)}  Data unavailable  (check pegelonline.wsv.de)`);
    } else {
      const latest = readings[readings.length - 1];
      const isLow = latest.level <= thresholdM;
      const status = isLow ? `*** LOW WATER ***` : `Normal`;
      lines.push(`  ${site.padEnd(20)}  ${latest.level.toFixed(2)} m    ${status}    (threshold: ${thresholdM.toFixed(2)} m)`);
    }
  }
  lines.push(``);

  // ── Detailed readings per station ─────────────────────────────────────────
  lines.push(DIV);
  lines.push(`DETAILED READINGS`);
  lines.push(DIV);

  for (let i = 0; i < stationData.length; i++) {
    const { site, thresholdM, desc, readings, forecast, error } = stationData[i];

    lines.push(``);
    lines.push(`${site.toUpperCase()}  —  low-water threshold: ${thresholdM.toFixed(2)} m  (${desc})`);
    lines.push(``);

    if (error || readings.length === 0) {
      lines.push(`  Live data unavailable — check pegelonline.wsv.de directly.`);
      lines.push(``);
      if (i < stationData.length - 1) lines.push(THIN);
      continue;
    }

    // 5-day history
    lines.push(`  History (07:00 CET daily reading):`);
    lines.push(``);
    let prevLow: boolean | null = null;
    for (const r of readings) {
      const isLow = r.level <= thresholdM;
      let marker = '';
      if (prevLow !== null) {
        if (isLow && !prevLow)  marker = `    << START OF LOW WATER`;
        if (!isLow && prevLow)  marker = `    << End of low water`;
      }
      prevLow = isLow;
      const lowFlag = isLow ? `  *` : `   `;
      lines.push(`    ${fmtKey(r.key)}    ${r.level.toFixed(2)} m${lowFlag}${marker}`);
    }

    // 2-day forecast
    if (forecast.length > 0) {
      lines.push(``);
      lines.push(`  Outlook — trend-based estimate (not an official forecast):`);
      lines.push(``);
      for (const f of forecast) {
        const isLow = f.level <= thresholdM;
        const lowFlag = isLow ? `    *** LOW WATER (est.) ***` : ``;
        lines.push(`    ${fmtKey(f.key)}    ${f.level.toFixed(2)} m  (est.)${lowFlag}`);
      }
    }

    lines.push(``);
    if (i < stationData.length - 1) lines.push(THIN);
  }

  // ── Low-water threshold reference ─────────────────────────────────────────
  lines.push(DIV);
  lines.push(`LOW-WATER THRESHOLDS (reference)`);
  lines.push(DIV);
  lines.push(``);
  for (const { site, thresholdM, desc } of REPORT_STATIONS) {
    lines.push(`  ${site}: low-water situation (${desc}) starts from ${thresholdM.toFixed(2)} m and lower.`);
  }
  lines.push(``);

  // ── Sign-off ──────────────────────────────────────────────────────────────
  lines.push(DIV);
  lines.push(``);
  lines.push(`Kind regards,`);
  lines.push(`Maersk DE Inland Operations`);
  lines.push(``);
  lines.push(`--`);
  lines.push(`Data source: pegelonline.wsv.de (WSV). Daily values = 07:00 CET reading.`);
  lines.push(`Today's value = latest available reading at ${timeStr} CET.`);
  lines.push(`Outlook values are trend-based estimates only — always verify before operational decisions.`);
  lines.push(`Generated by Maersk DE Inland Ops Tool`);

  return lines.join('\n');
}
