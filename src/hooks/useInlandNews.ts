import { useState, useEffect, useCallback, useRef } from 'react';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export interface TerminalNews {
  id: string;
  name: string;
  shortName: string;
  query: string;
  website: string;
  items: NewsItem[];
  loading: boolean;
  error: boolean;
  lastFetched: Date | null;
}

export const TERMINAL_CONFIGS = [
  {
    id: 'duisburg',
    name: 'Hutchison Ports Duisburg',
    shortName: 'HP Duisburg',
    query: '"Hutchison Ports Duisburg" OR "HPEI Duisburg" terminal',
    website: 'https://www.hutchisonportsduisburg.de',
  },
  {
    id: 'trier',
    name: 'Trier AZS',
    shortName: 'AZS Trier',
    query: '"AZS Trier" terminal binnenschiff container',
    website: 'https://azs-group.com',
  },
  {
    id: 'bonn',
    name: 'Bonn AZS',
    shortName: 'AZS Bonn',
    query: '"AZS Bonn" terminal inland container Rhein',
    website: 'https://azs-group.com',
  },
  {
    id: 'germersheim',
    name: 'Germersheim DP World',
    shortName: 'DPW Germersheim',
    query: '"DP World Germersheim" terminal inland',
    website: 'https://www.dpworld.com/en/ports-terminals/eu-intermodal/germersheim',
  },
  {
    id: 'mannheim',
    name: 'Mannheim DP World',
    shortName: 'DPW Mannheim',
    query: '"DP World Mannheim" terminal inland intermodal',
    website: 'https://www.dpworld.com/en/ports-terminals/eu-intermodal/mannheim',
  },
  {
    id: 'nuernberg',
    name: 'Nuernberg CDN',
    shortName: 'Contargo CDN',
    query: '"Contargo Nürnberg" OR "Contargo Nuernberg" OR "CDN Nürnberg" terminal',
    website: 'https://www.contargo.net/en/locations/terminals-n-z/nuernberg/',
  },
  {
    id: 'andernach',
    name: 'Rheinhafen Andernach',
    shortName: 'Hafen Andernach',
    query: '"Rheinhafen Andernach" OR "hafen Andernach" binnenschiff',
    website: 'https://www.hafen-andernach.de/',
  },
  {
    id: 'gustavsburg',
    name: 'Contargo Gustavsburg',
    shortName: 'Contargo Gustavsburg',
    query: '"Contargo Gustavsburg" terminal inland',
    website: 'https://www.contargo.net/en/locations/terminals-a-k/gustavsburg/',
  },
  {
    id: 'neuss',
    name: 'Contargo Neuss',
    shortName: 'Contargo Neuss',
    query: '"Contargo Neuss" terminal inland binnenschiff',
    website: 'https://www.contargo.net/en/locations/terminals-n-z/neuss/',
  },
  {
    id: 'hgk',
    name: 'HGK Intermodal',
    shortName: 'HGK Intermodal',
    query: '"HGK Intermodal" OR "HGK Logistics" inland container',
    website: 'https://www.hgk.de/en/hgk-logistics-and-intermodal/',
  },
];

const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry { items: NewsItem[]; fetchedAt: number }
const cache: Record<string, CacheEntry> = {};

function parseRssXml(xmlStr: string): NewsItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'text/xml');
  const items = Array.from(doc.querySelectorAll('item')).slice(0, 5);
  return items.map(el => {
    // Google News wraps title in CDATA — textContent strips it automatically
    const rawTitle = el.querySelector('title')?.textContent ?? '';
    // Strip trailing "- Publisher" suffix that Google News appends
    const title = rawTitle.replace(/\s*[-–]\s*[^-–]{3,60}$/, '').trim() || rawTitle.trim();
    // Google News puts the URL in a <link> text node after the element
    const link = el.querySelector('link')?.nextSibling?.textContent?.trim()
      ?? el.getElementsByTagName('link')[0]?.textContent?.trim()
      ?? '';
    const pubDate = el.querySelector('pubDate')?.textContent ?? '';
    const source = el.querySelector('source')?.textContent?.trim() ?? 'Google News';
    return { title, link, pubDate, source };
  });
}

async function fetchTerminalNews(query: string): Promise<NewsItem[]> {
  const cached = cache[query];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.items;

  const rssUrl = `${GOOGLE_NEWS_RSS}?q=${encodeURIComponent(query)}&hl=de&gl=DE&ceid=DE:de`;
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(rssUrl)}`;

  const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (!data.contents) throw new Error('Empty proxy response');

  const items = parseRssXml(data.contents);
  cache[query] = { items, fetchedAt: Date.now() };
  return items;
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function useInlandNews(autoRefreshMs = CACHE_TTL_MS) {
  const [terminals, setTerminals] = useState<TerminalNews[]>(() =>
    TERMINAL_CONFIGS.map(cfg => ({ ...cfg, items: [], loading: true, error: false, lastFetched: null }))
  );
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) TERMINAL_CONFIGS.forEach(cfg => { delete cache[cfg.query]; });
    setTerminals(prev => prev.map(t => ({ ...t, loading: true, error: false })));

    await Promise.all(
      TERMINAL_CONFIGS.map(async (cfg, idx) => {
        try {
          const items = await fetchTerminalNews(cfg.query);
          if (!mountedRef.current) return;
          setTerminals(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], items, loading: false, error: false, lastFetched: new Date() };
            return next;
          });
        } catch {
          if (!mountedRef.current) return;
          setTerminals(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], items: [], loading: false, error: true, lastFetched: null };
            return next;
          });
        }
      })
    );
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    const interval = setInterval(() => fetchAll(), autoRefreshMs);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, [fetchAll, autoRefreshMs]);

  return { terminals, refresh: () => fetchAll(true) };
}
