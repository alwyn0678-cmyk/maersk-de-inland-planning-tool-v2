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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { useInlandNews, timeAgo, TerminalNews } from '../../hooks/useInlandNews';

function TerminalNewsCard({ terminal, delay }: { terminal: TerminalNews; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? terminal.items : terminal.items.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-200"
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
              Website
            </a>
          </div>
        </div>
        <div className="flex-none">
          {terminal.loading ? (
            <Badge className="bg-white/10 text-white/40 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              Loading
            </Badge>
          ) : terminal.error ? (
            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 gap-1 border">
              <AlertCircle className="h-2.5 w-2.5" />
              Offline
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 gap-1 border">
              <Rss className="h-2.5 w-2.5" />
              Live
            </Badge>
          )}
        </div>
      </div>

      {/* News list */}
      <div className="divide-y divide-white/5">
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
          <div className="px-4 py-5 text-center">
            <AlertCircle className="h-6 w-6 text-white/20 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              Unable to fetch news
            </p>
            <p className="text-[9px] text-white/20 mt-1">
              Check directly at terminal website
            </p>
          </div>
        )}

        {!terminal.loading && !terminal.error && terminal.items.length === 0 && (
          <div className="px-4 py-5 text-center">
            <Newspaper className="h-6 w-6 text-white/20 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              No recent news found
            </p>
          </div>
        )}

        {!terminal.loading &&
          visibleItems.map((item, i) => (
            <motion.a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + i * 0.05 }}
              className="block px-4 py-3 hover:bg-white/5 transition-colors group/item"
            >
              <p className="text-[11px] font-bold text-white/80 leading-snug group-hover/item:text-white transition-colors line-clamp-2 mb-1.5">
                {item.title}
              </p>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30">
                <span className="truncate max-w-[100px]">{item.source}</span>
                <span className="text-white/15">·</span>
                <Clock className="h-2.5 w-2.5 flex-none" />
                <span>{timeAgo(item.pubDate)}</span>
                <ExternalLink className="h-2.5 w-2.5 flex-none ml-auto opacity-0 group-hover/item:opacity-60 transition-opacity" />
              </div>
            </motion.a>
          ))}
      </div>

      {/* Expand/collapse if more than 3 */}
      {!terminal.loading && !terminal.error && terminal.items.length > 3 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full px-4 py-2.5 border-t border-white/10 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              {terminal.items.length - 3} more
            </>
          )}
        </button>
      )}

      {/* Last updated footer */}
      {terminal.lastFetched && !terminal.loading && (
        <div className="px-4 py-2 border-t border-white/5 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-white/20">
          <Clock className="h-2.5 w-2.5" />
          Updated {timeAgo(terminal.lastFetched.toISOString())}
        </div>
      )}
    </motion.div>
  );
}

export function InlandNewsOverview() {
  const { terminals, refresh } = useInlandNews();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refresh();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const liveCount = terminals.filter(t => !t.loading && !t.error && t.items.length > 0).length;

  return (
    <Card className="lg:col-span-12 border-none bg-maersk-dark shadow-xl overflow-hidden rounded-2xl">
      <CardHeader className="pb-4 pt-4 border-b border-white/10 bg-white/5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-maersk-blue rounded-lg shadow-lg shadow-maersk-blue/40">
              <Newspaper className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-black tracking-tighter text-white drop-shadow-md">
                Inland Terminal News
              </CardTitle>
              <CardDescription className="text-maersk-blue font-black uppercase tracking-[0.25em] text-[9px] mt-0.5">
                Live Google News · Auto-refresh every 30 min
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">
              {liveCount} / {terminals.length} terminals live
            </div>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              className="rounded-lg font-black text-[9px] uppercase tracking-widest text-white/70 hover:text-white hover:bg-white/10 transition-all h-8 px-3"
            >
              <RefreshCw className={cn('h-3 w-3 mr-1.5', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
            <Badge className="bg-maersk-blue/20 text-maersk-blue border-maersk-blue/30 border text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg gap-1.5">
              <Rss className="h-2.5 w-2.5" />
              Google News
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {terminals.map((terminal, i) => (
            <TerminalNewsCard key={terminal.id} terminal={terminal} delay={i * 0.06} />
          ))}
        </div>

        {/* Disclaimer footer */}
        <div className="mt-4 px-4 py-3 rounded-xl bg-white/3 border border-white/8 flex items-start gap-2.5">
          <Rss className="h-3.5 w-3.5 text-maersk-blue/60 flex-none mt-0.5" />
          <p className="text-[9px] font-bold text-white/30 leading-relaxed">
            <span className="text-white/50 font-black uppercase tracking-widest">Data Source: </span>
            News is sourced from Google News RSS feeds using terminal-specific search queries. Results reflect publicly indexed news articles and may not capture all operational updates. For critical updates, always verify directly with the terminal via their official website or operations contact.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
