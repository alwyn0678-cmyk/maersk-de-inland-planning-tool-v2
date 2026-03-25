import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

interface TerminalConfig {
  name: string;
  siteUrl: string;
  /** Explicit RSS URL if known, skips autodiscovery */
  rssUrl?: string;
  /** Fallback news page to check if homepage has no RSS link */
  newsPageUrl?: string;
}

const TERMINALS: Record<string, TerminalConfig> = {
  duisburg: {
    name: 'Hutchison Ports Duisburg',
    siteUrl: 'https://www.hutchisonportsduisburg.de',
    newsPageUrl: 'https://www.hutchisonportsduisburg.de/news',
  },
  trier: {
    name: 'AZS Trier',
    siteUrl: 'https://azs-group.com',
    newsPageUrl: 'https://azs-group.com/en/news',
  },
  bonn: {
    name: 'AZS Bonn',
    siteUrl: 'https://azs-group.com',
    newsPageUrl: 'https://azs-group.com/en/news',
  },
  germersheim: {
    name: 'DP World Germersheim',
    siteUrl: 'https://www.dpworld.com',
    newsPageUrl: 'https://www.dpworld.com/en/news',
  },
  mannheim: {
    name: 'DP World Mannheim',
    siteUrl: 'https://www.dpworld.com',
    newsPageUrl: 'https://www.dpworld.com/en/news',
  },
  nuernberg: {
    name: 'Contargo Nuernberg CDN',
    siteUrl: 'https://www.contargo.net',
    newsPageUrl: 'https://www.contargo.net/en/news',
  },
  andernach: {
    name: 'Rheinhafen Andernach',
    siteUrl: 'https://www.hafen-andernach.de',
    newsPageUrl: 'https://www.hafen-andernach.de/aktuelles',
  },
  gustavsburg: {
    name: 'Contargo Gustavsburg',
    siteUrl: 'https://www.contargo.net',
    newsPageUrl: 'https://www.contargo.net/en/news',
  },
  neuss: {
    name: 'Contargo Neuss',
    siteUrl: 'https://www.contargo.net',
    newsPageUrl: 'https://www.contargo.net/en/news',
  },
  hgk: {
    name: 'HGK Intermodal',
    siteUrl: 'https://www.hgk.de',
    newsPageUrl: 'https://www.hgk.de/en/news',
  },
};

// Common RSS feed URL suffixes to probe
const RSS_PROBE_PATHS = [
  '/feed',
  '/feed/',
  '/rss',
  '/rss.xml',
  '/feed.xml',
  '/atom.xml',
  '/news/feed',
  '/news/rss',
  '/en/news/feed',
  '/en/feed',
  '/aktuelles/feed',
  '/presse/feed',
  '/press/feed',
];

const FETCH_OPTS = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; MaerskInlandOps/1.0; +https://maersk-de-inland-planning-tool.vercel.app)',
    Accept: 'text/html,application/xhtml+xml,application/xml,application/rss+xml,text/xml,*/*',
  },
};

async function safeFetch(url: string, timeoutMs = 7000): Promise<Response | null> {
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

/** Extract RSS/Atom feed href from HTML <head> */
function extractRssLinkFromHtml(html: string, baseUrl: string): string | null {
  const re =
    /<link[^>]+type=["'](application\/rss\+xml|application\/atom\+xml)["'][^>]*href=["']([^"']+)["']/gi;
  const match = re.exec(html);
  if (!match) return null;
  const href = match[2];
  if (href.startsWith('http')) return href;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

/** Determine if a body looks like RSS/Atom XML */
function looksLikeFeed(text: string): boolean {
  const t = text.trimStart();
  return (
    t.includes('<rss') ||
    t.includes('<feed') ||
    t.includes('<channel>') ||
    t.includes('xmlns:atom')
  );
}

/** Parse RSS 2.0 or Atom XML into NewsItems */
function parseFeedXml(xml: string, fallbackSource: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Atom <entry> elements
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
      .slice(0, 200);
    const source = cdataOrTag(chunk, 'source') || fallbackSource;

    if (title) {
      items.push({ title: title.trim(), link: link.trim(), pubDate, description, source });
    }
    if (items.length >= 5) break;
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
  // <link> in RSS is a self-closing or text node after the element (quirky)
  const m = new RegExp(`<${tag}>([^<]+)<\\/${tag}>`, 'i').exec(xml);
  if (m) return m[1].trim();
  // Some RSS has bare <link>URL (no closing tag before next element)
  const m2 = new RegExp(`<${tag}>([^<]+)`, 'i').exec(xml);
  return m2 ? m2[1].trim() : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300'); // 30 min CDN cache

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id || !TERMINALS[id]) {
    return res.status(400).json({ error: 'Unknown terminal id' });
  }

  const cfg = TERMINALS[id];

  // ── 1. If we have a known RSS URL, use it directly ──────────────────────
  if (cfg.rssUrl) {
    const rssRes = await safeFetch(cfg.rssUrl);
    if (rssRes) {
      const xml = await rssRes.text();
      if (looksLikeFeed(xml)) {
        return res.json({ items: parseFeedXml(xml, cfg.name), rssUrl: cfg.rssUrl, source: 'rss-known' });
      }
    }
  }

  // ── 2. Autodiscover RSS from homepage HTML ───────────────────────────────
  const homeRes = await safeFetch(cfg.siteUrl);
  if (homeRes) {
    const homeHtml = await homeRes.text();
    const discovered = extractRssLinkFromHtml(homeHtml, cfg.siteUrl);
    if (discovered) {
      const feedRes = await safeFetch(discovered);
      if (feedRes) {
        const xml = await feedRes.text();
        if (looksLikeFeed(xml)) {
          return res.json({ items: parseFeedXml(xml, cfg.name), rssUrl: discovered, source: 'rss-autodiscovered' });
        }
      }
    }
  }

  // ── 3. Autodiscover from news page HTML (if different from homepage) ─────
  if (cfg.newsPageUrl && cfg.newsPageUrl !== cfg.siteUrl) {
    const newsPageRes = await safeFetch(cfg.newsPageUrl);
    if (newsPageRes) {
      const newsHtml = await newsPageRes.text();
      const discovered = extractRssLinkFromHtml(newsHtml, cfg.newsPageUrl);
      if (discovered) {
        const feedRes = await safeFetch(discovered);
        if (feedRes) {
          const xml = await feedRes.text();
          if (looksLikeFeed(xml)) {
            return res.json({ items: parseFeedXml(xml, cfg.name), rssUrl: discovered, source: 'rss-newspage' });
          }
        }
      }
    }
  }

  // ── 4. Probe common RSS paths on the domain ──────────────────────────────
  const origin = new URL(cfg.siteUrl).origin;
  for (const path of RSS_PROBE_PATHS) {
    const url = origin + path;
    const probeRes = await safeFetch(url, 4000);
    if (probeRes) {
      const body = await probeRes.text();
      if (looksLikeFeed(body)) {
        return res.json({ items: parseFeedXml(body, cfg.name), rssUrl: url, source: 'rss-probed' });
      }
    }
  }

  // ── 5. No feed found ─────────────────────────────────────────────────────
  return res.json({
    items: [],
    source: 'no-feed',
    message: `No RSS/Atom feed found for ${cfg.name}. The site may not publish one.`,
    newsPageUrl: cfg.newsPageUrl ?? cfg.siteUrl,
  });
}
