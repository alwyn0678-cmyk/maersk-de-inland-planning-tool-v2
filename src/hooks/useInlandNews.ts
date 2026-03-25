import { useState, useEffect, useCallback, useRef } from 'react';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
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

const TERMINAL_CONFIGS = [
  {
    id: 'duisburg',
    name: 'Hutchison Ports Duisburg',
    shortName: 'HP Duisburg',
    query: '"Hutchison Ports Duisburg" OR "HPEI Duisburg" terminal inland',
    website: 'https://www.hutchisonportsduisburg.de',
  },
  {
    id: 'trier',
    name: 'Trier AZS',
    shortName: 'AZS Trier',
    query: '"AZS Trier" terminal binnenschiff containerterminal',
    website: 'https://azs-group.com',
  },
  {
    id: 'bonn',
    name: 'Bonn AZS',
    shortName: 'AZS Bonn',
    query: '"AZS Bonn" OR "AZS Andernach Bonn" terminal inland container',
    website: 'https://azs-group.com',
  },
  {
    id: 'germersheim',
    name: 'Germersheim DP World',
    shortName: 'DPW Germersheim',
    query: '"DP World Germersheim" terminal inland intermodal',
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
    query: '"Contargo Nürnberg" OR "CDN Nürnberg" terminal inland binnenschiff',
    website: 'https://www.contargo.net/en/locations/terminals-n-z/nuernberg/',
  },
  {
    id: 'andernach',
    name: 'Rheinhafen Andernach',
    shortName: 'Hafen Andernach',
    query: '"Rheinhafen Andernach" OR "hafen Andernach" binnenschiff container',
    website: 'https://www.hafen-andernach.de/',
  },
  {
    id: 'gustavsburg',
    name: 'Contargo Gustavsburg',
    shortName: 'Contargo Gustavsburg',
    query: '"Contargo Gustavsburg" terminal inland container',
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
    query: '"HGK Intermodal" OR "HGK Logistics" inland container barge',
    website: 'https://www.hgk.de/en/hgk-logistics-and-intermodal/',
  },
];

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json';
const GOOGLE_NEWS_BASE = 'https://news.google.com/rss/search';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface CacheEntry {
  items: NewsItem[];
  fetchedAt: number;
}

const cache: Record<string, CacheEntry> = {};

async function fetchTerminalNews(query: string): Promise<NewsItem[]> {
  const cached = cache[query];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.items;
  }

  const googleRssUrl = `${GOOGLE_NEWS_BASE}?q=${encodeURIComponent(query)}&hl=de&gl=DE&ceid=DE:de`;
  const apiUrl = `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(googleRssUrl)}&count=5`;

  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    throw new Error('Invalid RSS response');
  }

  const items: NewsItem[] = data.items.map((item: any) => ({
    title: item.title?.replace(/\s*-\s*[^-]+$/, '') ?? '',
    link: item.link ?? '',
    pubDate: item.pubDate ?? '',
    source: item.author ?? item.source?.title ?? 'Google News',
    description: item.description?.replace(/<[^>]+>/g, '').slice(0, 140) ?? '',
  }));

  cache[query] = { items, fetchedAt: Date.now() };
  return items;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export { TERMINAL_CONFIGS, timeAgo };

export function useInlandNews(autoRefreshMs = CACHE_TTL_MS) {
  const [terminals, setTerminals] = useState<TerminalNews[]>(() =>
    TERMINAL_CONFIGS.map(cfg => ({
      ...cfg,
      items: [],
      loading: true,
      error: false,
      lastFetched: null,
    }))
  );

  const mountedRef = useRef(true);

  const fetchAll = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      // Clear cache so all terminals re-fetch
      TERMINAL_CONFIGS.forEach(cfg => { delete cache[cfg.query]; });
    }

    setTerminals(prev =>
      prev.map(t => ({ ...t, loading: true, error: false }))
    );

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
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchAll, autoRefreshMs]);

  return { terminals, refresh: () => fetchAll(true) };
}
