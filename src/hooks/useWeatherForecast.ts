/**
 * useWeatherForecast.ts
 *
 * 7-day weather forecast for the DE Inland operations area (Rotterdam / Rhine corridor).
 * Uses Open-Meteo API — free, no API key required.
 *
 * WMO weather code → icon + description mapping included.
 * Automatically flags severe weather (strong winds or storms) for operational alerts.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast' +
  '?latitude=51.9&longitude=4.48' +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_gusts_10m_max' +
  '&wind_speed_unit=kmh&timezone=Europe%2FBerlin&forecast_days=7';

// Refresh every 30 minutes
const REFRESH_INTERVAL = 30 * 60 * 1000;

// ── WMO code helpers ────────────────────────────────────────────────────────

export function wmoIcon(code: number): string {
  if (code === 0)              return '☀️';
  if (code === 1)              return '🌤️';
  if (code === 2)              return '⛅';
  if (code === 3)              return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57)  return '🌦️';
  if (code >= 61 && code <= 67)  return '🌧️';
  if (code >= 71 && code <= 77)  return '❄️';
  if (code >= 80 && code <= 82)  return '🌦️';
  if (code === 85 || code === 86) return '🌨️';
  if (code >= 95)              return '⛈️';
  return '🌡️';
}

export function wmoDescription(code: number): string {
  if (code === 0)              return 'Clear sky';
  if (code === 1)              return 'Mainly clear';
  if (code === 2)              return 'Partly cloudy';
  if (code === 3)              return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55)  return 'Drizzle';
  if (code >= 56 && code <= 57)  return 'Freezing drizzle';
  if (code >= 61 && code <= 65)  return 'Rain';
  if (code >= 66 && code <= 67)  return 'Freezing rain';
  if (code >= 71 && code <= 77)  return 'Snow';
  if (code >= 80 && code <= 82)  return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code === 95)             return 'Thunderstorm';
  if (code >= 96)              return 'Severe thunderstorm';
  return 'Unknown';
}

export function isSevereWeather(code: number): boolean {
  return code >= 95;
}

export function isStrongWind(gusts: number): boolean {
  return gusts >= 60;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface WeatherDay {
  date: string;          // ISO date
  dayLabel: string;      // e.g. "Mon", "Tue"
  code: number;          // WMO weather code
  icon: string;          // emoji icon
  description: string;
  tempMax: number;       // °C
  tempMin: number;       // °C
  windMax: number;       // km/h
  windGusts: number;     // km/h
  isSevere: boolean;
  isWindy: boolean;
}

export interface WeatherAlert {
  type: 'storm' | 'wind' | 'snow' | 'fog';
  message: string;
  days: string[];        // which days
}

export interface WeatherForecast {
  days: WeatherDay[];
  alert: WeatherAlert | null;
  location: string;
  loading: boolean;
  error: boolean;
  lastRefresh: Date | null;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Hook ────────────────────────────────────────────────────────────────────

export function useWeatherForecast(): WeatherForecast {
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [alert, setAlert] = useState<WeatherAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchForecast = useCallback(async () => {
    // Cancel previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    try {
      const res = await fetch(OPEN_METEO_URL, { signal });
      if (!res.ok) throw new Error('HTTP error');
      const json = await res.json();
      const d = json.daily;
      if (!d || !d.time) throw new Error('Invalid response');

      const parsed: WeatherDay[] = d.time.map((iso: string, i: number) => {
        const date = new Date(iso);
        const code = d.weather_code[i] ?? 0;
        const gusts = d.wind_gusts_10m_max?.[i] ?? 0;
        return {
          date: iso,
          dayLabel: i === 0 ? 'Today' : DAY_NAMES[date.getDay()],
          code,
          icon: wmoIcon(code),
          description: wmoDescription(code),
          tempMax: Math.round(d.temperature_2m_max[i] ?? 0),
          tempMin: Math.round(d.temperature_2m_min[i] ?? 0),
          windMax: Math.round(d.wind_speed_10m_max?.[i] ?? 0),
          windGusts: Math.round(gusts),
          isSevere: isSevereWeather(code),
          isWindy: isStrongWind(gusts),
        };
      });

      setDays(parsed);

      // Build alert if any severe conditions in next 3 days
      const nearDays = parsed.slice(0, 3);
      const stormDays = nearDays.filter(d => d.isSevere);
      const windDays  = nearDays.filter(d => d.isWindy && !d.isSevere);
      const snowDays  = nearDays.filter(d => d.code >= 71 && d.code <= 86);
      const fogDays   = nearDays.filter(d => d.code === 45 || d.code === 48);

      if (stormDays.length > 0) {
        setAlert({
          type: 'storm',
          message:
            'Due to storm / thunderstorm conditions, inland operations may experience significant delays. Contact inland ops before booking.',
          days: stormDays.map(d => d.dayLabel),
        });
      } else if (windDays.length > 0) {
        setAlert({
          type: 'wind',
          message:
            'Due to strong wind conditions, barge operations may experience delays. Monitor terminal congestion for live updates.',
          days: windDays.map(d => d.dayLabel),
        });
      } else if (snowDays.length > 0) {
        setAlert({
          type: 'snow',
          message:
            'Snow / wintry conditions forecast. Road transport may be affected — allow extra lead time for truck collections.',
          days: snowDays.map(d => d.dayLabel),
        });
      } else if (fogDays.length > 0) {
        setAlert({
          type: 'fog',
          message:
            'Fog forecast in the Rhine corridor. Reduced visibility may affect barge departures and terminal access.',
          days: fogDays.map(d => d.dayLabel),
        });
      } else {
        setAlert(null);
      }

      setError(false);
      setLastRefresh(new Date());
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return; // Normal cancellation — suppress
      console.warn('[Weather] Forecast fetch failed:', err);
      if (!signal.aborted) setError(true);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
    const id = setInterval(fetchForecast, REFRESH_INTERVAL);
    return () => {
      clearInterval(id);
      abortRef.current?.abort();
    };
  }, [fetchForecast]);

  return { days, alert, location: 'Rotterdam / Rhine Corridor', loading, error, lastRefresh };
}
