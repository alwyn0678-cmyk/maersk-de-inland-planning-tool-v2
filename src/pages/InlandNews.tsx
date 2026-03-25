import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Newspaper,
  RefreshCw,
  ExternalLink,
  Clock,
  AlertCircle,
  Loader2,
  Rss,
  Globe,
  ChevronDown,
  ChevronUp,
  Info,
  WifiOff,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useInlandNews, timeAgo, TerminalNews } from '../hooks/useInlandNews';

function feedSourceLabel(source: string | null): { label: string; color: string } {
  switch (source) {
    case 'rss-known':
    case 'rss-autodiscovered':
    case 'rss-newspage':
    case 'rss-probed':
      return { label: 'RSS', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' };
    case 'no-feed':
      return { label: 'No RSS', color: 'bg-amber-500/20 text-amber-400 border-amber-500/20' };
    case 'error':
      return { label: 'Error', color: 'bg-rose-500/20 text-rose-400 border-rose-500/20' };
    default:
      return { label: 'Live', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' };
  }
}

function TerminalNewsCard({ terminal, delay }: { terminal: TerminalNews; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? terminal.items : terminal.items.slice(0, 3);
  const hasItems = !terminal.loading && !terminal.error && terminal.items.length > 0;
  const noFeed = terminal.feedSource === 'no-feed';
  const { label: statusLabel, color: statusColor } = feedSourceLabel(terminal.feedSource);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-colors duration-200 flex flex-col"
    >
      {/* Terminal header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-maersk-blue/20 rounded-lg border border-maersk-blue/20 flex-none">
            <Globe className="h-3 w-3 text-maersk-blue" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-black text-white uppercase tracking-wide truncate">
              {terminal.shortName}
            </div>
            <a
              href={terminal.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] font-bold text-maersk-blue/70 hover:text-maersk-blue uppercase tracking-widest flex items-center gap-1 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="h-2.5 w-2.5" />
              Official Site
            </a>
          </div>
        </div>
        <div className="flex-none">
          {terminal.loading ? (
            <Badge className="bg-white/10 text-white/40 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Checking
            </Badge>
          ) : (
            <Badge className={cn('border text-[8px] font-black uppercase tracking-widest px-2 py-0.5 gap-1', statusColor)}>
              <Rss className="h-2.5 w-2.5" />
              {statusLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-white/5 flex-1">
        {terminal.loading && (
          <>
            {[0, 1, 2].map(i => (
              <div key={i} className="px-4 py-3 space-y-1.5 animate-pulse">
                <div className="h-2.5 bg-white/10 rounded-full w-5/6" />
                <div className="h-2 bg-white/5 rounded-full w-3/4" />
                <div className="h-2 bg-white/5 rounded-full w-1/3" />
              </div>
            ))}
          </>
        )}

        {!terminal.loading && terminal.error && (
          <div className="px-4 py-6 text-center">
            <WifiOff className="h-6 w-6 text-white/20 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              Connection failed
            </p>
            <a
              href={terminal.newsPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-[9px] font-bold text-maersk-blue/60 hover:text-maersk-blue transition-colors"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              Check website directly
            </a>
          </div>
        )}

        {!terminal.loading && !terminal.error && noFeed && (
          <div className="px-4 py-6 text-center">
            <AlertCircle className="h-6 w-6 text-amber-500/40 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">
              No RSS feed published
            </p>
            <p className="text-[9px] text-white/20 leading-relaxed max-w-[180px] mx-auto mb-3">
              This terminal's website does not expose an RSS or Atom feed.
            </p>
            <a
              href={terminal.newsPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              Open news page
            </a>
          </div>
        )}

        {hasItems &&
          visibleItems.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 hover:bg-white/5 transition-colors group/item"
            >
              <p className="text-[11px] font-bold text-white/80 leading-snug group-hover/item:text-white transition-colors line-clamp-2 mb-1.5">
                {item.title}
              </p>
              {item.description && (
                <p className="text-[9px] text-white/30 line-clamp-1 mb-1.5 leading-relaxed">
                  {item.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30">
                <span className="truncate max-w-[110px]">{item.source}</span>
                {item.pubDate && (
                  <>
                    <span className="text-white/15">·</span>
                    <Clock className="h-2.5 w-2.5 flex-none" />
                    <span>{timeAgo(item.pubDate)}</span>
                  </>
                )}
                <ExternalLink className="h-2.5 w-2.5 flex-none ml-auto opacity-0 group-hover/item:opacity-50 transition-opacity" />
              </div>
            </a>
          ))}
      </div>

      {/* Expand / collapse */}
      {hasItems && terminal.items.length > 3 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full px-4 py-2.5 border-t border-white/10 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" />Show less</>
          ) : (
            <><ChevronDown className="h-3 w-3" />{terminal.items.length - 3} more</>
          )}
        </button>
      )}

      {/* RSS source label + last updated */}
      {terminal.lastFetched && !terminal.loading && (
        <div className="px-4 py-1.5 border-t border-white/5 flex items-center justify-between gap-2 text-[8px] font-black uppercase tracking-widest text-white/20">
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {timeAgo(terminal.lastFetched.toISOString())}
          </span>
          {terminal.rssUrl && (
            <a
              href={terminal.rssUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open RSS feed"
              className="hover:text-white/50 transition-colors flex items-center gap-1"
            >
              <Rss className="h-2.5 w-2.5" />
              Feed
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function InlandNews() {
  const { terminals, refresh } = useInlandNews();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadingCount = terminals.filter(t => t.loading).length;
  const liveCount = terminals.filter(t => !t.loading && !t.error && t.items.length > 0).length;
  const noFeedCount = terminals.filter(t => t.feedSource === 'no-feed').length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-maersk-dark">Inland Terminal News</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Live news pulled directly from each terminal's own RSS feed — auto-refreshed every 30 minutes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {loadingCount > 0
              ? `Scanning ${loadingCount} terminals…`
              : `${liveCount} with RSS · ${noFeedCount} no feed`}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-maersk-dark text-white hover:bg-maersk-blue transition-colors shadow-sm"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-2', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing…' : 'Refresh All'}
          </Button>
        </div>
      </motion.div>

      {/* News grid */}
      <Card className="border-none bg-maersk-dark shadow-xl overflow-hidden rounded-2xl">
        <CardHeader className="pb-4 pt-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-maersk-blue rounded-lg shadow-lg shadow-maersk-blue/40">
                <Newspaper className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-black tracking-tighter text-white">
                  Terminal RSS Feeds
                </CardTitle>
                <CardDescription className="text-maersk-blue font-black uppercase tracking-[0.25em] text-[9px] mt-0.5">
                  Direct from terminal websites · Auto-refresh 30 min
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg gap-1.5">
                <Rss className="h-2.5 w-2.5" />
                RSS = live articles
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg gap-1.5">
                <AlertCircle className="h-2.5 w-2.5" />
                No RSS = site doesn't publish one
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {terminals.map((terminal, i) => (
              <TerminalNewsCard key={terminal.id} terminal={terminal} delay={i * 0.05} />
            ))}
          </div>

          {/* Info footer */}
          <div className="mt-5 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
            <Info className="h-3.5 w-3.5 text-maersk-blue/50 flex-none mt-0.5" />
            <p className="text-[9px] font-bold text-white/30 leading-relaxed">
              <span className="text-white/50 font-black uppercase tracking-widest mr-1.5">How it works:</span>
              Our server fetches each terminal website directly and auto-discovers their RSS/Atom feed (checking the page head, news page, and common feed paths like <span className="font-mono text-white/40">/feed</span>, <span className="font-mono text-white/40">/rss.xml</span>).
              Cards marked <span className="text-amber-400 font-black">No RSS</span> mean the terminal's site simply doesn't publish a machine-readable feed — use the "Open news page" link to check manually.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
