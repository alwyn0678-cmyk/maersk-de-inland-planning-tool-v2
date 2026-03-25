import { useState, useEffect, useCallback, useRef } from 'react';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  category: 'ops' | 'business';
}

export interface TerminalNews {
  id: string;
  name: string;
  shortName: string;
  website: string;
  newsPageUrl: string;
  items: NewsItem[];         // all items (ops + business)
  opsItems: NewsItem[];      // operational alerts — current month
  businessItems: NewsItem[]; // business / strategic news — last 60 days
  rssUrl: string | null;
  feedSource: string | null;
  loading: boolean;
  error: boolean;
  lastFetched: Date | null;
}

export const TERMINAL_CONFIGS: Omit<
  TerminalNews,
  'items' | 'opsItems' | 'businessItems' | 'rssUrl' | 'feedSource' | 'loading' | 'error' | 'lastFetched'
>[] = [
  {
    id: 'duisburg',
    name: 'Hutchison Ports Duisburg',
    shortName: 'HP Duisburg',
    website: 'https://www.hutchisonportsduisburg.de',
    newsPageUrl: 'https://www.hutchisonportsduisburg.de/news',
  },
  {
    id: 'trier',
    name: 'Trier AZS',
    shortName: 'AZS Trier',
    website: 'https://azs-group.com',
    newsPageUrl: 'https://azs-group.com/en/news',
  },
  {
    id: 'bonn',
    name: 'Bonn AZS',
    shortName: 'AZS Bonn',
    website: 'https://azs-group.com',
    newsPageUrl: 'https://azs-group.com/en/news',
  },
  {
    id: 'germersheim',
    name: 'Germersheim DP World',
    shortName: 'DPW Germersheim',
    website: 'https://www.dpworld.com/en/ports-terminals/eu-intermodal/germersheim',
    newsPageUrl: 'https://www.dpworld.com/en/news',
  },
  {
    id: 'mannheim',
    name: 'Mannheim DP World',
    shortName: 'DPW Mannheim',
    website: 'https://www.dpworld.com/en/ports-terminals/eu-intermodal/mannheim',
    newsPageUrl: 'https://www.dpworld.com/en/news',
  },
  {
    id: 'nuernberg',
    name: 'Nuernberg CDN',
    shortName: 'Contargo CDN',
    website: 'https://www.contargo.net/en/locations/terminals-n-z/nuernberg/',
    newsPageUrl: 'https://www.contargo.net/en/news',
  },
  {
    id: 'andernach',
    name: 'Rheinhafen Andernach',
    shortName: 'Hafen Andernach',
    website: 'https://www.hafen-andernach.de',
    newsPageUrl: 'https://www.hafen-andernach.de/aktuelles',
  },
  {
    id: 'gustavsburg',
    name: 'Contargo Gustavsburg',
    shortName: 'Contargo Gustavsburg',
    website: 'https://www.contargo.net/en/locations/terminals-a-k/gustavsburg/',
    newsPageUrl: 'https://www.contargo.net/en/news',
  },
  {
    id: 'neuss',
    name: 'Contargo Neuss',
    shortName: 'Contargo Neuss',
    website: 'https://www.contargo.net/en/locations/terminals-n-z/neuss/',
    newsPageUrl: 'https://www.contargo.net/en/news',
  },
  {
    id: 'hgk',
    name: 'HGK Intermodal',
    shortName: 'HGK Intermodal',
    website: 'https://www.hgk.de/en/hgk-logistics-and-intermodal/',
    newsPageUrl: 'https://www.hgk.de/en/news',
  },
];

const CACHE_TTL_MS = 30 * 60 * 1000;

interface CacheEntry {
  opsItems: NewsItem[];
  businessItems: NewsItem[];
  rssUrl: string | null;
  feedSource: string | null;
  fetchedAt: number;
}
const cache: Record<string, CacheEntry> = {};

function isCurrentMonth(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isLast60Days(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  return d >= cutoff;
}

async function fetchFromApi(
  id: string
): Promise<{ opsItems: NewsItem[]; businessItems: NewsItem[]; rssUrl: string | null; feedSource: string | null }> {
  const cached = cache[id];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { opsItems: cached.opsItems, businessItems: cached.businessItems, rssUrl: cached.rssUrl, feedSource: cached.feedSource };
  }

  const res = await fetch(`/api/terminal-news?id=${encodeURIComponent(id)}`, {
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);

  const data = await res.json();

  // API already handles categorisation and sorting; pass through as-is
  const opsItems: NewsItem[] = data.opsItems ?? [];
  const businessItems: NewsItem[] = data.businessItems ?? [];
  const rssUrl: string | null = data.rssUrl ?? null;
  const feedSource: string | null = data.source ?? null;

  cache[id] = { opsItems, businessItems, rssUrl, feedSource, fetchedAt: Date.now() };
  return { opsItems, businessItems, rssUrl, feedSource };
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
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

export function currentMonthLabel(): string {
  return new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

export function useInlandNews(autoRefreshMs = CACHE_TTL_MS) {
  const [terminals, setTerminals] = useState<TerminalNews[]>(() =>
    TERMINAL_CONFIGS.map(cfg => ({
      ...cfg,
      items: [],
      opsItems: [],
      businessItems: [],
      rssUrl: null,
      feedSource: null,
      loading: true,
      error: false,
      lastFetched: null,
    }))
  );
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) TERMINAL_CONFIGS.forEach(cfg => { delete cache[cfg.id]; });
    setTerminals(prev => prev.map(t => ({ ...t, loading: true, error: false })));

    await Promise.all(
      TERMINAL_CONFIGS.map(async (cfg, idx) => {
        try {
          const { opsItems, businessItems, rssUrl, feedSource } = await fetchFromApi(cfg.id);
          if (!mountedRef.current) return;
          setTerminals(prev => {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              opsItems,
              businessItems,
              items: [...opsItems, ...businessItems],
              rssUrl,
              feedSource,
              loading: false,
              error: false,
              lastFetched: new Date(),
            };
            return next;
          });
        } catch {
          if (!mountedRef.current) return;
          setTerminals(prev => {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              opsItems: [],
              businessItems: [],
              items: [],
              rssUrl: null,
              feedSource: 'error',
              loading: false,
              error: true,
              lastFetched: null,
            };
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

  const newsChecked = terminals.every(t => !t.loading);
  const hasCurrentMonthNews = terminals.some(t => t.opsItems.length > 0 || t.businessItems.length > 0);
  const showNewsTab = !newsChecked || hasCurrentMonthNews;

  return { terminals, refresh: () => fetchAll(true), newsChecked, hasCurrentMonthNews, showNewsTab };
}
