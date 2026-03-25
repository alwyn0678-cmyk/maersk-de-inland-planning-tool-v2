import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Globe, Newspaper, MapPin, ExternalLink,
  Anchor, Train, Building2,
  Waves, ArrowUpRight, Info,
  ChevronRight, AlertTriangle, Mail,
  CheckCircle2, MinusCircle, Ship,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

// ── Operator config ───────────────────────────────────────────────────────────

const OPERATORS = {
  hutchison: { name: 'Hutchison Ports', bar: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  contargo:  { name: 'Contargo',        bar: 'bg-orange-400',  badge: 'bg-orange-500/15 text-orange-300 border-orange-500/25' },
  dpworld:   { name: 'DP World',        bar: 'bg-sky-400',     badge: 'bg-sky-500/15 text-sky-300 border-sky-500/25' },
  azs:       { name: 'AZS Group',       bar: 'bg-violet-400',  badge: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
  hgk:       { name: 'HGK',             bar: 'bg-teal-400',    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/25' },
  rheinhafen:{ name: 'Rheinhafen',      bar: 'bg-slate-400',   badge: 'bg-slate-500/15 text-slate-300 border-slate-500/25' },
} as const;

type OperatorKey = keyof typeof OPERATORS;

interface TerminalLink {
  label: string;
  url: string;
  icon: 'globe' | 'news' | 'terminal';
  primary?: boolean;
}

interface Terminal {
  id: string;
  code: string;
  name: string;
  operator: OperatorKey;
  city: string;
  region: string;
  modalities: Array<'barge' | 'rail'>;
  ports: Array<'RTM' | 'ANR'>;
  hasSchedule: boolean;
  links: TerminalLink[];
  mapsQuery: string;
  warning?: string;
}

// ── Terminal data ─────────────────────────────────────────────────────────────

const TERMINALS: Terminal[] = [
  {
    id: 'duisburg',
    code: 'DEDUI01',
    name: 'Hutchison Ports Duisburg',
    operator: 'hutchison',
    city: 'Duisburg',
    region: 'NRW',
    modalities: ['barge', 'rail'],
    ports: ['RTM', 'ANR'],
    hasSchedule: true,
    links: [
      { label: 'Website', url: 'https://www.hutchisonportsduisburg.de', icon: 'globe', primary: true },
    ],
    mapsQuery: 'Hutchison+Ports+Duisburg',
    warning: 'IMO & Reefer on request only — raise ISR before booking',
  },
  {
    id: 'gustavsburg',
    code: 'DEG4TG',
    name: 'Contargo Gustavsburg',
    operator: 'contargo',
    city: 'Gustavsburg',
    region: 'Rhein-Main',
    modalities: ['barge'],
    ports: ['RTM', 'ANR'],
    hasSchedule: true,
    links: [
      { label: 'Terminal', url: 'https://www.contargo.net/en/locations/terminals-a-k/gustavsburg/', icon: 'terminal', primary: true },
      { label: 'News', url: 'https://www.contargo.net/en/news', icon: 'news' },
    ],
    mapsQuery: 'Contargo+Gustavsburg+Terminal',
  },
  {
    id: 'germersheim',
    code: 'DEGRH01',
    name: 'DP World Germersheim',
    operator: 'dpworld',
    city: 'Germersheim',
    region: 'Rheinland-Pfalz',
    modalities: ['barge'],
    ports: ['RTM', 'ANR'],
    hasSchedule: true,
    links: [
      { label: 'Terminal', url: 'https://www.dpworld.com/en/ports-terminals/eu-intermodal/germersheim', icon: 'terminal', primary: true },
      { label: 'News', url: 'https://www.dpworld.com/en/news', icon: 'news' },
    ],
    mapsQuery: 'DP+World+Germersheim+Inland+Terminal',
  },
  {
    id: 'mannheim',
    code: 'DEMHG02',
    name: 'DP World Mannheim',
    operator: 'dpworld',
    city: 'Mannheim',
    region: 'Baden-Württemberg',
    modalities: ['barge'],
    ports: ['RTM', 'ANR'],
    hasSchedule: true,
    links: [
      { label: 'Terminal', url: 'https://www.dpworld.com/en/ports-terminals/eu-intermodal/mannheim', icon: 'terminal', primary: true },
      { label: 'News', url: 'https://www.dpworld.com/en/news', icon: 'news' },
    ],
    mapsQuery: 'DP+World+Mannheim+Inland+Terminal',
  },
  {
    id: 'andernach',
    code: 'DEAJHRA',
    name: 'Rheinhafen Andernach',
    operator: 'rheinhafen',
    city: 'Andernach',
    region: 'Rheinland-Pfalz',
    modalities: ['barge'],
    ports: ['RTM', 'ANR'],
    hasSchedule: true,
    links: [
      { label: 'Website', url: 'https://www.hafen-andernach.de', icon: 'globe', primary: true },
      { label: 'Aktuelles', url: 'https://www.hafen-andernach.de/aktuelles', icon: 'news' },
    ],
    mapsQuery: 'Rheinhafen+Andernach',
  },
  {
    id: 'bonn',
    code: 'DEBNX01',
    name: 'AZS Bonn',
    operator: 'azs',
    city: 'Bonn',
    region: 'NRW',
    modalities: ['barge'],
    ports: ['RTM', 'ANR'],
    hasSchedule: true,
    links: [
      { label: 'Website', url: 'https://azs-group.com', icon: 'globe', primary: true },
      { label: 'News', url: 'https://azs-group.com/en/news', icon: 'news' },
    ],
    mapsQuery: 'AZS+Terminal+Bonn+Hafen',
  },
  {
    id: 'neuss',
    code: 'DECRNE01',
    name: 'Contargo Neuss',
    operator: 'contargo',
    city: 'Neuss',
    region: 'NRW',
    modalities: ['barge'],
    ports: ['RTM', 'ANR'],
    hasSchedule: false,
    links: [
      { label: 'Terminal', url: 'https://www.contargo.net/en/locations/terminals-n-z/neuss/', icon: 'terminal', primary: true },
      { label: 'News', url: 'https://www.contargo.net/en/news', icon: 'news' },
    ],
    mapsQuery: 'Contargo+Neuss+Terminal',
  },
  {
    id: 'trier',
    code: 'DETREAZ',
    name: 'AZS Trier',
    operator: 'azs',
    city: 'Trier',
    region: 'Rheinland-Pfalz',
    modalities: ['barge'],
    ports: ['RTM', 'ANR'],
    hasSchedule: false,
    links: [
      { label: 'Website', url: 'https://azs-group.com', icon: 'globe', primary: true },
      { label: 'News', url: 'https://azs-group.com/en/news', icon: 'news' },
    ],
    mapsQuery: 'AZS+Terminal+Trier+Hafen',
  },
  {
    id: 'nuernberg',
    code: 'NUE02',
    name: 'Contargo Nuernberg CDN',
    operator: 'contargo',
    city: 'Nürnberg',
    region: 'Bavaria',
    modalities: ['rail'],
    ports: ['RTM'],
    hasSchedule: true,
    links: [
      { label: 'Terminal', url: 'https://www.contargo.net/en/locations/terminals-n-z/nuernberg/', icon: 'terminal', primary: true },
      { label: 'News', url: 'https://www.contargo.net/en/news', icon: 'news' },
    ],
    mapsQuery: 'Contargo+Nuernberg+CDN+Terminal',
  },
  {
    id: 'hgk',
    code: 'HGK',
    name: 'HGK Intermodal',
    operator: 'hgk',
    city: 'Cologne',
    region: 'NRW',
    modalities: ['barge', 'rail'],
    ports: ['RTM', 'ANR'],
    hasSchedule: false,
    links: [
      { label: 'Intermodal', url: 'https://www.hgk.de/en/hgk-logistics-and-intermodal/', icon: 'terminal', primary: true },
      { label: 'News', url: 'https://www.hgk.de/en/news', icon: 'news' },
    ],
    mapsQuery: 'HGK+Intermodal+Cologne',
  },
];

// ── Resources ─────────────────────────────────────────────────────────────────

const RESOURCES = [
  {
    id: 'pegelonline',
    label: 'Rhine Water Levels',
    sublabel: 'Pegelonline · Federal Waterways (WSV)',
    url: 'https://www.pegelonline.wsv.de',
    icon: Waves,
    accent: 'bg-blue-500/20 text-blue-300 border-blue-500/25',
    tip: 'Kaub below 40 cm → barge restrictions on Middle Rhine',
  },
  {
    id: 'dvz',
    label: 'DVZ — Logistics News',
    sublabel: 'Deutsche Verkehrs-Zeitung · Trade press',
    url: 'https://www.dvz.de',
    icon: Newspaper,
    accent: 'bg-amber-500/20 text-amber-300 border-amber-500/25',
    tip: 'Primary German logistics & intermodal trade publication',
  },
];

// ── Key reminders ─────────────────────────────────────────────────────────────

const REMINDERS = [
  {
    id: 'customs',
    icon: Mail,
    title: 'Customs Documents',
    body: 'Always send a copy of the Customs document to',
    highlight: 'nlaopsinlrbc@maersk.com',
    sub: 'Do NOT forward this to the terminal or customer.',
    accent: 'border-amber-500/30 bg-amber-500/[0.06]',
    iconColor: 'text-amber-400',
  },
  {
    id: 'multistop',
    icon: Ship,
    title: 'Multistop Deliveries',
    body: 'Send ATA to the team at least',
    highlight: '2 business days before customer delivery',
    sub: 'Required for all multistop transport orders.',
    accent: 'border-maersk-blue/30 bg-maersk-blue/[0.06]',
    iconColor: 'text-maersk-blue',
  },
  {
    id: 'isr',
    icon: AlertTriangle,
    title: 'IMO & Reefer via Duisburg',
    body: 'IMO and Reefer containers via DEDUI01 are',
    highlight: 'on request only',
    sub: 'CX must raise an ISR before any booking can be made.',
    accent: 'border-rose-500/30 bg-rose-500/[0.06]',
    iconColor: 'text-rose-400',
  },
];

// ── Subcomponents ─────────────────────────────────────────────────────────────

function LinkIcon({ icon }: { icon: TerminalLink['icon'] }) {
  if (icon === 'globe') return <Globe className="h-2.5 w-2.5" />;
  if (icon === 'news') return <Newspaper className="h-2.5 w-2.5" />;
  return <Building2 className="h-2.5 w-2.5" />;
}

function TerminalCard({ terminal, delay }: { terminal: Terminal; delay: number }) {
  const op = OPERATORS[terminal.operator];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
      className="relative rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-white/20 hover:bg-white/[0.08] transition-all duration-200 flex flex-col"
    >
      {/* Operator colour bar */}
      <div className={cn('h-0.5 w-full flex-none', op.bar)} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-black text-white uppercase tracking-wide leading-snug flex-1">
            {terminal.name}
          </p>
          <code className="text-[8px] font-black text-white/25 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 flex-none tracking-wider whitespace-nowrap">
            {terminal.code}
          </code>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-2.5 w-2.5 text-white/25 flex-none" />
          <span className="text-[9px] font-bold text-white/35 uppercase tracking-widest">
            {terminal.city} · {terminal.region}
          </span>
        </div>

        {/* Operator + modalities + ports */}
        <div className="flex flex-wrap gap-1.5">
          <Badge className={cn('border text-[7.5px] font-black uppercase tracking-widest px-1.5 py-0.5', op.badge)}>
            {op.name}
          </Badge>
          {terminal.modalities.map(m => (
            <span key={m} className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest border',
              m === 'barge'
                ? 'bg-maersk-blue/15 text-[#42b0d5] border-[#42b0d5]/25'
                : 'bg-violet-500/15 text-violet-300 border-violet-500/25'
            )}>
              {m === 'barge' ? <Anchor className="h-2 w-2" /> : <Train className="h-2 w-2" />}
              {m}
            </span>
          ))}
          {terminal.ports.map(p => (
            <span key={p} className="inline-flex items-center px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase tracking-widest border bg-white/5 text-white/30 border-white/10">
              {p}
            </span>
          ))}
        </div>

        {/* Schedule availability */}
        <div className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[8.5px] font-bold',
          terminal.hasSchedule
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-white/5 border-white/10 text-white/25'
        )}>
          {terminal.hasSchedule
            ? <CheckCircle2 className="h-2.5 w-2.5 flex-none" />
            : <MinusCircle className="h-2.5 w-2.5 flex-none" />
          }
          {terminal.hasSchedule ? 'Schedule data available in tool' : 'Contact terminal for schedule'}
        </div>

        {/* Warning */}
        {terminal.warning && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="h-2.5 w-2.5 text-rose-400 flex-none mt-0.5" />
            <p className="text-[8px] font-bold text-rose-300 leading-snug">{terminal.warning}</p>
          </div>
        )}

        {/* Links */}
        <div className="mt-auto pt-1 flex flex-wrap gap-1.5">
          {terminal.links.map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all',
                link.primary
                  ? 'bg-white/10 text-white/70 border border-white/15 hover:bg-white/20 hover:text-white'
                  : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/70'
              )}
            >
              <LinkIcon icon={link.icon} />
              {link.label}
              <ExternalLink className="h-2 w-2 opacity-40" />
            </a>
          ))}
          <a
            href={`https://maps.google.com/?q=${terminal.mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/70 transition-all"
          >
            <MapPin className="h-2.5 w-2.5" />
            Map
            <ExternalLink className="h-2 w-2 opacity-40" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ── Filter config ─────────────────────────────────────────────────────────────

type FilterKey = 'all' | OperatorKey;

const FILTER_OPTS: { id: FilterKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'contargo', label: 'Contargo' },
  { id: 'dpworld', label: 'DP World' },
  { id: 'hutchison', label: 'Hutchison' },
  { id: 'azs', label: 'AZS Group' },
  { id: 'hgk', label: 'HGK' },
  { id: 'rheinhafen', label: 'Rheinhafen' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export function InlandNews() {
  const [filter, setFilter] = useState<FilterKey>('all');

  const visible = filter === 'all'
    ? TERMINALS
    : TERMINALS.filter(t => t.operator === filter);

  const bargeCount  = TERMINALS.filter(t => t.modalities.includes('barge')).length;
  const railCount   = TERMINALS.filter(t => t.modalities.includes('rail')).length;
  const schedCount  = TERMINALS.filter(t => t.hasSchedule).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black tracking-tight text-maersk-dark">Inland Terminal Directory</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Official contacts &amp; resources for the{' '}
            <span className="font-black text-maersk-blue">Maersk DE inland network</span>
          </p>
        </div>
        {/* Quick stats */}
        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1 text-slate-500">
            <Anchor className="h-3 w-3 text-[#42b0d5]" />{bargeCount} barge
          </span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1 text-slate-500">
            <Train className="h-3 w-3 text-violet-400" />{railCount} rail
          </span>
          <span className="text-slate-300">·</span>
          <span className="flex items-center gap-1 text-slate-500">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />{schedCount} with live schedule
          </span>
        </div>
      </motion.div>

      {/* Main dark card — directory */}
      <Card className="border-none bg-maersk-dark shadow-xl overflow-hidden rounded-2xl">
        <CardHeader className="pb-0 pt-4 border-b border-white/10 bg-white/[0.03]">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-maersk-blue rounded-lg shadow-lg shadow-maersk-blue/40">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-black tracking-tighter text-white">Terminal Directory</CardTitle>
              <CardDescription className="text-maersk-blue font-black uppercase tracking-[0.25em] text-[9px] mt-0.5">
                {TERMINALS.length} terminals · {Object.keys(OPERATORS).length} operators
              </CardDescription>
            </div>
          </div>

          {/* Operator filter tabs */}
          <div className="flex gap-1 flex-wrap -mb-px">
            {FILTER_OPTS.map(opt => {
              const count = opt.id === 'all' ? TERMINALS.length : TERMINALS.filter(t => t.operator === opt.id).length;
              const isActive = filter === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 text-[9px] font-black uppercase tracking-widest rounded-t-lg border border-b-0 transition-all',
                    isActive
                      ? 'bg-maersk-dark border-white/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10'
                  )}
                >
                  {opt.label}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-[8px] font-black',
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/30'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          {/* Terminal grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {visible.map((terminal, i) => (
              <TerminalCard key={terminal.id} terminal={terminal} delay={i * 0.04} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maersk DE Key Reminders */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-maersk-dark overflow-hidden border border-white/10"
      >
        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03] flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/20 rounded-lg border border-amber-500/20">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight">Maersk DE — Key Reminders</p>
            <p className="text-[9px] font-black text-amber-400/60 uppercase tracking-[0.2em] mt-0.5">
              Applies to all inland transport bookings
            </p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {REMINDERS.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className={cn('rounded-xl p-4 border', r.accent)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn('h-3.5 w-3.5 flex-none', r.iconColor)} />
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">{r.title}</p>
                </div>
                <p className="text-[9px] text-white/50 leading-relaxed">
                  {r.body}{' '}
                  <span className="font-black text-white/80">{r.highlight}</span>.
                </p>
                <p className="text-[8.5px] text-white/25 mt-1.5 font-medium">{r.sub}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Operational resources */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl bg-maersk-dark overflow-hidden border border-white/10"
      >
        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.03] flex items-center gap-3">
          <div className="p-1.5 bg-maersk-blue/20 rounded-lg border border-maersk-blue/20">
            <ChevronRight className="h-3.5 w-3.5 text-maersk-blue" />
          </div>
          <div>
            <p className="text-sm font-black text-white tracking-tight">Operational Resources</p>
            <p className="text-[9px] font-black text-maersk-blue/60 uppercase tracking-[0.2em] mt-0.5">
              Rhine levels · Trade news
            </p>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RESOURCES.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="group flex items-start gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.09] hover:border-white/20 transition-all duration-200"
              >
                <div className={cn('p-2 rounded-lg border flex-none', r.accent)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-white/70 group-hover:text-white transition-colors">{r.label}</p>
                  <p className="text-[9px] text-white/35 font-medium mt-0.5">{r.sublabel}</p>
                  <p className="text-[8.5px] font-bold text-white/20 mt-1.5 italic">{r.tip}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-white/20 group-hover:text-white/50 flex-none transition-colors mt-0.5" />
              </motion.a>
            );
          })}
        </div>
        <div className="mx-5 mb-5 px-4 py-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/15 flex items-start gap-2.5">
          <Info className="h-3 w-3 text-blue-400/50 flex-none mt-0.5" />
          <p className="text-[8.5px] font-medium text-white/30 leading-relaxed">
            <span className="text-white/50 font-black uppercase tracking-widest mr-1">Rhine levels:</span>
            Kaub is the critical chokepoint on the Middle Rhine — below 40 cm typically triggers barge restrictions affecting
            Gustavsburg, Germersheim, Mannheim and Andernach.
            Cologne gauge covers NRW terminals (Duisburg, Neuss, Bonn). Check the Pegelonline map for all active gauges.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
