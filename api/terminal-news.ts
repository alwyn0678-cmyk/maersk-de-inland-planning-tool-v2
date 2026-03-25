import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
  category: 'ops' | 'business';
}

interface TerminalConfig {
  name: string;
  siteUrl: string;
  /** Explicit RSS URL if known */
  rssUrl?: string;
  /** Google News search query for this terminal */
  googleNewsQuery: string;
}

const TERMINALS: Record<string, TerminalConfig> = {
  duisburg: {
    name: 'Hutchison Ports Duisburg',
    siteUrl: 'https://www.hutchisonportsduisburg.de',
    googleNewsQuery: '"Hutchison Ports Duisburg"',
  },
  trier: {
    name: 'AZS Trier',
    siteUrl: 'https://azs-group.com',
    googleNewsQuery: 'AZS Trier Terminal Hafen',
  },
  bonn: {
    name: 'AZS Bonn',
    siteUrl: 'https://azs-group.com',
    googleNewsQuery: 'AZS Bonn Terminal Hafen',
  },
  germersheim: {
    name: 'DP World Germersheim',
    siteUrl: 'https://www.dpworld.com',
    googleNewsQuery: '"DP World" Germersheim',
  },
  mannheim: {
    name: 'DP World Mannheim',
    siteUrl: 'https://www.dpworld.com',
    googleNewsQuery: '"DP World" Mannheim',
  },
  nuernberg: {
    name: 'Contargo Nuernberg CDN',
    siteUrl: 'https://www.contargo.net',
    googleNewsQuery: 'Contargo Nürnberg Terminal',
  },
  andernach: {
    name: 'Rheinhafen Andernach',
    siteUrl: 'https://www.hafen-andernach.de',
    googleNewsQuery: '"Rheinhafen Andernach"',
  },
  gustavsburg: {
    name: 'Contargo Gustavsburg',
    siteUrl: 'https://www.contargo.net',
    googleNewsQuery: 'Contargo Gustavsburg',
  },
  neuss: {
    name: 'Contargo Neuss',
    siteUrl: 'https://www.contargo.net',
    googleNewsQuery: 'Contargo Neuss',
  },
  hgk: {
    name: 'HGK Intermodal',
    siteUrl: 'https://www.hgk.de',
    googleNewsQuery: '"HGK Intermodal"',
  },
};

// ── Keyword filters ───────────────────────────────────────────────────────────

/** Operational disruption/notice keywords → category: 'ops' (EN + DE) */
const OPERATIONAL_KEYWORDS = [
  // EN — Physical terminal ops
  'crane', 'berth', 'quay', 'gate', 'yard', 'stacking',
  // EN — Disruptions & incidents
  'congestion', 'disruption', 'disrupted', 'delay', 'delayed', 'outage',
  'breakdown', 'incident', 'service interruption', 'service disruption',
  // EN — Maintenance & closures
  'maintenance', 'closure', 'closed', 'repair', 'works',
  // EN — Waterway
  'rhine', 'water level', 'low water', 'high water', 'flood', 'lock ', 'waterway',
  // EN — Operational notices
  'schedule change', 'operating hours', 'terminal hours', 'opening hours',
  'advisory', 'operational update', 'service update', 'service notice', 'alert',
  // EN — Cargo ops
  'container handling', 'cargo operations', 'loading', 'unloading', 'discharge',
  'terminal operations', 'port operations',
  // DE — Störungen & Betrieb
  'wartung', 'störung', 'stau', 'ausfall', 'gesperrt', 'sperrung', 'verspätung',
  'betriebsstörung', 'serviceunterbrechung', 'unterbrechung',
  // DE — Wasserstand
  'niedrigwasser', 'hochwasser', 'rhein', 'wasserstand', 'pegel', 'schleuse',
  // DE — Betriebszeiten
  'betriebszeiten', 'öffnungszeiten', 'terminalbetrieb',
];

/** Business / strategic news keywords → category: 'business' (EN + DE)
 *  Articles that don't match any keyword default to 'business' as well,
 *  so these keywords are primarily used for ops priority override logic.
 */
const BUSINESS_KEYWORDS = [
  // EN
  'new service', 'new route', 'new connection', 'launches', 'launched',
  'opens', 'opened', 'opening', 'expansion', 'expands', 'extends',
  'investment', 'invest', 'contract', 'agreement', 'partnership',
  'cooperation', 'collaboration', 'joint venture', 'acquisition',
  'warehouse', 'intermodal', 'trimodal', 'multimodal',
  'automation', 'digital', 'technology', 'sustainable', 'electric',
  'barge service', 'rail service', 'rail connection', 'feeder service',
  // DE
  'neue verbindung', 'neuer service', 'neue strecke', 'eröffnung',
  'erweiterung', 'investition', 'kooperation', 'partnerschaft',
  'zusammenarbeit', 'übernahme', 'lager', 'intermodal', 'trimodal',
  'automatisierung', 'digitalisierung', 'nachhaltig', 'elektro',
  'bahnverbindung', 'bargeverbindung', 'schienendienst',
];

/** Finance/PR exclusion list — strictly irrelevant to logistics planning */
const EXCLUDE_KEYWORDS = [
  // Finance
  'revenue', 'profit', 'earnings', 'quarterly results', 'annual report',
  'financial results', 'investor', 'ipo', 'share price', 'net income', 'ebitda',
  'quartalsergebnis', 'jahresbericht', 'finanzergebnis',
  // Rates
  'rate increase', 'surcharge', 'rate hike', 'general rate', 'baf adjustment',
  // Pure HR/PR
  'job opening', 'we are hiring', 'vacancy', 'career opportunity',
  'stellenausschreibung', 'wir suchen',
];

// ── Time helpers ──────────────────────────────────────────────────────────────

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

// ── Categorization ────────────────────────────────────────────────────────────

function categorizeItem(item: Omit<NewsItem, 'category'>): 'ops' | 'business' | null {
  const titleLower = item.title.toLowerCase();
  const fullText = (item.title + ' ' + item.description).toLowerCase();

  // Hard-exclude finance/PR unless an ops keyword overrides
  if (EXCLUDE_KEYWORDS.some(kw => titleLower.includes(kw))) {
    if (!OPERATIONAL_KEYWORDS.some(kw => fullText.includes(kw))) {
      return null;
    }
  }

  // Ops takes priority — time-critical disruptions/notices
  if (OPERATIONAL_KEYWORDS.some(kw => fullText.includes(kw))) {
    return 'ops';
  }

  // Default: show as business — covers German articles and niche terminal news
  // that don't match specific keywords but are still relevant
  return 'business';
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const FETCH_OPTS = {
  headers: {
    // Full browser UA — Google News blocks datacenter IPs with bot UAs
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml,application/rss+xml,*/*;q=0.9',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
  },
};

async function safeFetch(url: string, timeoutMs = 8000): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      ...FETCH_OPTS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

// ── Feed parsing ──────────────────────────────────────────────────────────────

function looksLikeFeed(text: string): boolean {
  const t = text.trimStart();
  return (
    t.includes('<rss') ||
    t.includes('<feed') ||
    t.includes('<channel>') ||
    t.includes('xmlns:atom')
  );
}

function parseFeedXml(xml: string, fallbackSource: string): Omit<NewsItem, 'category'>[] {
  const items: Omit<NewsItem, 'category'>[] = [];

  const isAtom = xml.includes('<feed') && xml.includes('<entry');
  const itemRe = isAtom
    ? /<entry>([\s\S]*?)<\/entry>/g
    : /<item>([\s\S]*?)<\/item>/g;

  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const chunk = m[1];

    const title = cdataOrTag(chunk, 'title');
    const link = isAtom
      ? (/<link[^>]+href=["']([^"']+)["']/.exec(chunk)?.[1] ?? '')
      : (plainTag(chunk, 'link') ||
          (/<guid[^>]*>([^<]+)<\/guid>/.exec(chunk)?.[1] ?? ''));
    const pubDate =
      cdataOrTag(chunk, 'pubDate') ||
      cdataOrTag(chunk, 'published') ||
      cdataOrTag(chunk, 'updated') ||
      cdataOrTag(chunk, 'dc:date');
    const description = cdataOrTag(chunk, isAtom ? 'summary' : 'description')
      .replace(/<[^>]+>/g, '')
      .slice(0, 250);

    // Google News puts publisher in <source url="...">Name</source>
    const sourceTag = /<source[^>]*>([^<]+)<\/source>/.exec(chunk)?.[1];
    const source = sourceTag?.trim() || cdataOrTag(chunk, 'source') || fallbackSource;

    if (title) {
      items.push({ title: title.trim(), link: link.trim(), pubDate, description, source });
    }
    if (items.length >= 20) break;
  }

  return items;
}

function cdataOrTag(xml: string, tag: string): string {
  const cdataRe = new RegExp(
    `<${tag}(?:[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    'i'
  );
  const cm = cdataRe.exec(xml);
  if (cm) return cm[1].trim();
  const re = new RegExp(`<${tag}(?:[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

function plainTag(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}>([^<]+)<\\/${tag}>`, 'i').exec(xml);
  if (m) return m[1].trim();
  const m2 = new RegExp(`<${tag}>([^<]+)`, 'i').exec(xml);
  return m2 ? m2[1].trim() : '';
}

// ── Google News RSS ───────────────────────────────────────────────────────────

async function fetchGoogleNews(
  query: string,
  fallbackSource: string
): Promise<Omit<NewsItem, 'category'>[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=de&gl=DE&ceid=DE:de`;
  const res = await safeFetch(url, 10000);
  if (!res) return [];
  const xml = await res.text();
  if (!looksLikeFeed(xml)) return [];
  return parseFeedXml(xml, fallbackSource);
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // 30-min CDN cache — short enough to catch same-day operational alerts
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id || !TERMINALS[id]) {
    return res.status(400).json({ error: 'Unknown terminal id' });
  }

  const cfg = TERMINALS[id];
  let ownItems: Omit<NewsItem, 'category'>[] = [];
  let rssUrl: string | null = null;

  // ── 1. Known RSS URL (fast path — only if explicitly configured) ───────────
  if (cfg.rssUrl) {
    const rssRes = await safeFetch(cfg.rssUrl);
    if (rssRes) {
      const xml = await rssRes.text();
      if (looksLikeFeed(xml)) {
        ownItems = parseFeedXml(xml, cfg.name);
        rssUrl = cfg.rssUrl;
      }
    }
  }

  // ── 2. Google News RSS (primary source for all terminals) ─────────────────
  const googleItems = await fetchGoogleNews(cfg.googleNewsQuery, cfg.name);

  // ── 3. Merge & deduplicate by title ───────────────────────────────────────
  const seen = new Set<string>();
  const allRaw: Omit<NewsItem, 'category'>[] = [];

  for (const item of [...ownItems, ...googleItems]) {
    const key = item.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    allRaw.push(item);
  }

  // ── 4. Categorize — no date filter; show most recent items per category ───
  // Google News doesn't always have current-month coverage for niche terminals,
  // so we return the most recent items and let the UI show publication dates.
  const opsItems: NewsItem[] = [];
  const businessItems: NewsItem[] = [];

  for (const item of allRaw) {
    const category = categorizeItem(item);
    if (!category) continue;
    if (category === 'ops') {
      opsItems.push({ ...item, category: 'ops' });
    } else {
      businessItems.push({ ...item, category: 'business' });
    }
  }

  // Sort by date descending, cap per category
  const byDate = (a: NewsItem, b: NewsItem) =>
    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  const finalOps = opsItems.sort(byDate).slice(0, 5);
  const finalBusiness = businessItems.sort(byDate).slice(0, 8);

  return res.json({
    opsItems: finalOps,
    businessItems: finalBusiness,
    // Legacy `items` field — combined, for any cached clients
    items: [...finalOps, ...finalBusiness],
    rssUrl,
    source: googleItems.length > 0 ? 'google-news' : (ownItems.length > 0 ? 'rss-known' : 'no-feed'),
  });
}
