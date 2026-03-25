import { useState } from 'react';
import { usePlannerStore } from '../store/usePlannerStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import {
  ChevronDown,
  Anchor,
  Send,
  MapPin,
  CalendarDays,
  Clock,
  Package,
  Copy,
  AlertTriangle,
  Info,
  CheckCircle2,
  BookOpen,
  Ship,
  Train,
  Layers,
  Search,
  LayoutDashboard,
  Truck,
  MousePointerClick,
  Tag,
  ArrowRight,
  CircleHelp,
  Lightbulb,
  TriangleAlert,
  Database,
  FileText,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type GuideTab = 'overview' | 'import' | 'export' | 'glossary' | 'rules';

interface Step {
  icon: React.ElementType;
  title: string;
  summary: string;
  content: React.ReactNode;
}

// ── Callout boxes ─────────────────────────────────────────────────────────────

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 rounded-lg bg-[#42b0d5]/10 border border-[#42b0d5]/20 mt-3">
      <Lightbulb className="h-3.5 w-3.5 text-[#42b0d5] flex-none mt-0.5" />
      <p className="text-xs text-[#42b0d5] leading-relaxed">{children}</p>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-3">
      <TriangleAlert className="h-3.5 w-3.5 text-amber-400 flex-none mt-0.5" />
      <p className="text-xs text-amber-300 leading-relaxed">{children}</p>
    </div>
  );
}

function Critical({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 mt-3">
      <AlertTriangle className="h-3.5 w-3.5 text-rose-400 flex-none mt-0.5" />
      <p className="text-xs text-rose-300 leading-relaxed">{children}</p>
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 w-36 flex-none pt-0.5">{label}</span>
      <span className="text-xs text-white/80 leading-relaxed">{value}</span>
    </div>
  );
}

function FieldMock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      'px-3 py-2 rounded-lg border text-xs',
      highlight
        ? 'border-[#42b0d5]/50 bg-[#42b0d5]/10'
        : 'border-white/10 bg-white/5'
    )}>
      <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-0.5">{label}</div>
      <div className={cn('font-bold', highlight ? 'text-[#42b0d5]' : 'text-white/60')}>{value}</div>
    </div>
  );
}

// ── Step accordion ─────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  isOpen,
  onToggle,
  accentColor,
}: {
  step: Step;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  accentColor: string;
}) {
  const Icon = step.icon;
  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl border overflow-hidden transition-colors duration-200',
        isOpen ? 'border-white/20 bg-white/5' : 'border-white/8 bg-white/[0.03] hover:bg-white/5 hover:border-white/12'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center flex-none text-sm font-black transition-colors',
          isOpen ? `${accentColor}` : 'bg-white/10 text-white/40'
        )}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-3.5 w-3.5 flex-none', isOpen ? 'text-white/70' : 'text-white/30')} />
            <span className={cn('text-sm font-black tracking-tight', isOpen ? 'text-white' : 'text-white/50')}>
              {step.title}
            </span>
          </div>
          {!isOpen && (
            <p className="text-[11px] text-white/30 mt-0.5 truncate">{step.summary}</p>
          )}
        </div>
        <ChevronDown className={cn(
          'h-4 w-4 text-white/30 flex-none transition-transform duration-300',
          isOpen && 'rotate-180'
        )} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 border-t border-white/8">
              {step.content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Import guide steps ─────────────────────────────────────────────────────────

const IMPORT_STEPS: Step[] = [
  {
    icon: MapPin,
    title: 'Enter Customer ZIP Code',
    summary: 'The 4–5 digit delivery postcode determines the terminal.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Enter the German postcode (PLZ) of the customer's delivery address. This is used to determine which inland terminal(s) can serve the final delivery.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <FieldMock label="Customer ZIP" value="47119" highlight />
          <FieldMock label="Result" value="→ Hutchison Ports Duisburg" />
        </div>
        <Tip>The ZIP lookup maps your customer to the best barge and rail terminals. Some ZIP ranges are served by two terminals — you'll see depot pills to switch between them.</Tip>
        <Warning>Some ZIP prefixes (starting with 0x, 1x, 20–30, 98, 99) are not covered via Antwerp. If you select ANR for these, the tool will tell you.</Warning>
      </div>
    ),
  },
  {
    icon: Anchor,
    title: 'Select Origin Port',
    summary: 'Rotterdam (RTM) or Antwerp (ANR) — where the vessel discharges.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Select the port where the vessel discharges the container. This determines which barge/rail schedules are searched.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <FieldMock label="Rotterdam" value="RTM — Full coverage" highlight />
          <FieldMock label="Antwerp" value="ANR — Limited ZIP coverage" />
        </div>
        <Tip>Rotterdam has wider inland schedule coverage. Antwerp is faster for southern Germany (Mannheim, Germersheim, Gustavsburg corridor).</Tip>
      </div>
    ),
  },
  {
    icon: CalendarDays,
    title: 'Enter Vessel ETD',
    summary: 'The departure date of the vessel from origin port.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Enter the vessel's ETD (Estimated Time of Departure) from the port. The tool uses this to:
        </p>
        <ul className="space-y-1.5">
          {[
            'Calculate which departures are still within the order window',
            'Flag departures as "recommended" (1–10 days after vessel ETD)',
            'Apply the customs deadline filter for Rotterdam',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-white/60">
              <ArrowRight className="h-3 w-3 text-[#42b0d5] flex-none mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
        <Tip>Use a <strong>future date</strong> when planning ahead of discharge. Use <strong>today or a past date</strong> if the vessel has already arrived — the tool switches to "already discharged" mode automatically.</Tip>
      </div>
    ),
  },
  {
    icon: Clock,
    title: 'Enter Vessel Discharge Time',
    summary: 'Affects the customs deadline calculation for Rotterdam.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Enter the time the vessel discharge window opens. This is used for the <strong className="text-white">customs deadline calculation</strong> (Rotterdam only).
        </p>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Customs Deadline Rule (Rotterdam)</p>
          <Rule label="Mon / Tue / Wed / Thu" value="Terminal ETD − 1 day at 12:00 CET" />
          <Rule label="Fri / Sat / Sun" value="Previous Friday at 15:00 CET" />
        </div>
        <Warning>If the customs deadline has already passed, that departure is automatically excluded from results — you won't see a card for it.</Warning>
      </div>
    ),
  },
  {
    icon: Layers,
    title: 'Review the Results',
    summary: 'Each card shows a complete inland connection with all key dates.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          The tool returns planning cards, one per viable inland connection. Here's what each date means:
        </p>
        <div className="space-y-2">
          {[
            { label: 'Terminal ETD', color: 'text-[#42b0d5]', desc: 'Date the barge or train departs the inland terminal towards the port.' },
            { label: 'Depot Arrival', color: 'text-emerald-400', desc: 'Date the container arrives at the inland depot after discharge.' },
            { label: 'Customer Delivery', color: 'text-violet-400', desc: 'Earliest date the customer can receive the container (next business day after depot arrival).' },
            { label: 'Order Deadline', color: 'text-amber-400', desc: 'Last date to place the inland transport order. Always 7 business days before terminal ETD.' },
            { label: 'Customs Deadline', color: 'text-rose-400', desc: 'RTM only. Deadline to submit customs release documents to the agent.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
              <span className={cn('text-[10px] font-black w-32 flex-none pt-0.5', item.color)}>{item.label}</span>
              <span className="text-xs text-white/60 leading-relaxed">{item.desc}</span>
            </div>
          ))}
        </div>
        <Tip>The <strong className="text-white">green RECOMMENDED</strong> badge marks the departure that falls 1–10 calendar days after vessel ETD — the optimal window for pre-planning.</Tip>
      </div>
    ),
  },
  {
    icon: Copy,
    title: 'Copy the Summary',
    summary: 'One click copies a formatted plan ready for Salesforce or email.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Each card has a copy button. Clicking it copies a pre-formatted plain text summary that can be pasted directly into a Salesforce case or sent to the customer.
        </p>
        <div className="p-3 rounded-lg bg-black/30 border border-white/10 font-mono text-[10px] text-white/50 leading-relaxed">
          <span className="text-[#42b0d5]">IMPORT INLAND PLAN</span><br />
          Status: PLANNABLE — RECOMMENDED<br />
          Port: Rotterdam<br />
          Terminal: Hutchison Ports Duisburg (DEDUI01)<br />
          Mode: Barge (Wed schedule)<br />
          Terminal ETD: Wed 25 Mar 2026<br />
          Depot Arrival: Fri 27 Mar 2026<br />
          Customer Delivery: Mon 30 Mar 2026<br />
          Order Deadline: Wed 18 Mar 2026
        </div>
        <Critical>The copy summary always includes the reminder: <em>"Always send copy of Customs document to nlaopsinlrbc@maersk.com"</em> — do not remove this when pasting.</Critical>
      </div>
    ),
  },
];

// ── Export guide steps ─────────────────────────────────────────────────────────

const EXPORT_STEPS: Step[] = [
  {
    icon: MapPin,
    title: 'Enter Customer ZIP Code',
    summary: 'The pickup address postcode determines the depot.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Enter the German postcode where the container will be loaded (customer stuffing address). This maps to the correct inland depot for collection.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <FieldMock label="Customer ZIP" value="56300" highlight />
          <FieldMock label="P1 Depot" value="Rheinhafen Andernach" />
        </div>
        <Tip>Some ZIP ranges (e.g. 56xxx) have two depot options — P1 and P2. You can switch between them using the depot pills after the results load.</Tip>
        <Warning>ZIP ranges 90000–97999 are not covered via Antwerp. The tool will show "not serviced via ANR" if you select that port.</Warning>
      </div>
    ),
  },
  {
    icon: Package,
    title: 'Select Container Size & Type',
    summary: '20\' / 40\' — DC / HC / Reefer / IMO.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Select the container size (20' or 40') and type (Dry/HC, Reefer, or IMO/DG). This affects:
        </p>
        <ul className="space-y-1.5">
          {[
            'Which empty depot to show for container release',
            'Whether the IMO/Reefer hard block triggers (Duisburg only)',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-white/60">
              <ArrowRight className="h-3 w-3 text-[#42b0d5] flex-none mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
        <Critical>If the container is <strong>IMO or Reefer</strong> and the depot is <strong>Duisburg (DEDUI01)</strong>, all results are blocked. CX must raise an ISR before any booking can proceed.</Critical>
      </div>
    ),
  },
  {
    icon: CalendarDays,
    title: 'Enter Loading Date',
    summary: 'The date the container will be stuffed at the customer.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Enter the date the container will be loaded/stuffed at the customer's premises. The tool searches for departures <strong className="text-white">from the day after</strong> loading — same-day departures are always excluded.
        </p>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Order Deadline Rule (Export)</p>
          <Rule label="Order Deadline" value="2 business days before loading date (prevBizDay)" />
          <Rule label="If passed" value="All options blocked — 'Order deadline passed' shown" />
        </div>
        <Tip>Plan early — if the order deadline has passed, the tool blocks all options and you must escalate manually.</Tip>
      </div>
    ),
  },
  {
    icon: Clock,
    title: 'Enter Loading Time',
    summary: 'Loading after 12:00 CET excludes the next-day departure.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Loading time (CET) matters for next-day departure eligibility:
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Before 12:00</p>
            <p className="text-xs text-white/60">Next-day departure included (with cutoff warning flag)</p>
          </div>
          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-1">After 12:00</p>
            <p className="text-xs text-white/60">Next-day departure excluded — minimum 2 days after loading</p>
          </div>
        </div>
        <Tip>For Rotterdam only: the customs deadline is calculated as loading time + 3 hours. A banner will show this deadline on the results page.</Tip>
      </div>
    ),
  },
  {
    icon: Ship,
    title: 'Select Port Terminal',
    summary: 'The vessel terminal code — affects YOT and rail schedule eligibility.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Select the exact port terminal where the vessel will load. This is critical because:
        </p>
        <div className="space-y-2 mt-1">
          {[
            { code: 'NLROTTM', name: 'APM Terminals', yot: 5 },
            { code: 'NLROTWG', name: 'Rotterdam World Gateway', yot: 7 },
            { code: 'NLROT01', name: 'Hutchison Ports Delta II', yot: 8 },
            { code: 'NLROT21', name: 'ECT Delta Terminal', yot: 8 },
            { code: 'BEANT869', name: 'PSA Europa Terminal', yot: 7 },
            { code: 'BEANT913', name: 'PSA Noordzee Terminal', yot: 7 },
          ].map(t => (
            <div key={t.code} className="flex items-center gap-3 py-1.5 border-b border-white/5 last:border-0">
              <span className="font-mono text-[10px] text-[#42b0d5] w-20 flex-none">{t.code}</span>
              <span className="text-xs text-white/60 flex-1">{t.name}</span>
              <span className="text-[10px] font-black text-amber-400">YOT {t.yot}d</span>
            </div>
          ))}
        </div>
        <Tip>YOT (Yard Opening Time) is the number of days before vessel ETD that the terminal starts accepting gate-in. The tool uses this to calculate your latest vessel ETA window.</Tip>
      </div>
    ),
  },
  {
    icon: Layers,
    title: 'Review Departure Cards',
    summary: 'Each card shows ETD, EAT, and your vessel planning window.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Each result card shows one inland departure option. Here's what to read:
        </p>
        <div className="space-y-2">
          {[
            { label: 'ETD (Depot)', color: 'text-[#42b0d5]', desc: 'Date the container departs the inland depot by barge or rail.' },
            { label: 'EAT (Terminal)', color: 'text-emerald-400', desc: 'Estimated Arrival at the port terminal.' },
            { label: 'Earliest CCO', color: 'text-violet-400', desc: 'Earliest vessel Cut-Off the container is ready for — EAT + buffer days.' },
            { label: 'Latest ETA', color: 'text-amber-400', desc: 'Latest vessel ETD this departure can still serve — EAT + YOT − 1 day.' },
            { label: 'Order Deadline', color: 'text-rose-400', desc: '2 business days before loading date. Booking must be placed before this.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
              <span className={cn('text-[10px] font-black w-28 flex-none pt-0.5', item.color)}>{item.label}</span>
              <span className="text-xs text-white/60 leading-relaxed">{item.desc}</span>
            </div>
          ))}
        </div>
        <Tip>The <strong className="text-white">first card</strong> is always marked as recommended. Rail departures are shown before barge when both are available.</Tip>
      </div>
    ),
  },
  {
    icon: Copy,
    title: 'Copy the Booking Summary',
    summary: 'Pre-formatted text for Salesforce cases and emails.',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">
          Click the copy button on any card to get a complete booking summary including the transport details and empty depot release info.
        </p>
        <div className="p-3 rounded-lg bg-black/30 border border-white/10 font-mono text-[10px] text-white/50 leading-relaxed">
          <span className="text-[#42b0d5]">MAERSK DE — EXPORT BOOKING SUMMARY</span><br />
          Customer ZIP: 47119<br />
          Container: 40' DC/HC<br />
          Loading Date: 25/03/2026 · 08:00<br />
          ─────────────────────<br />
          Depot: DEDUI01 — HP Duisburg<br />
          Modality: Rail<br />
          Departure (ETD): Thu 26 Mar 2026<br />
          ─────────────────────<br />
          Earliest Vessel CCO: Sat 28 Mar 2026<br />
          Latest Vessel ETA: Thu 02 Apr 2026
        </div>
      </div>
    ),
  },
];

// ── Glossary ──────────────────────────────────────────────────────────────────

const GLOSSARY = [
  { term: 'ETD', full: 'Estimated Time of Departure', def: 'The planned departure date of a vessel, barge, or rail service.' },
  { term: 'ETA', full: 'Estimated Time of Arrival', def: 'The planned arrival date at the destination — depot, port terminal, or customer.' },
  { term: 'EAT', full: 'Estimated Arrival at Terminal', def: 'Export-specific: the date the inland transport arrives at the port terminal.' },
  { term: 'CCO', full: 'Container Cut-Off', def: 'The deadline for a container to gate into the port terminal for a specific vessel voyage.' },
  { term: 'YOT', full: 'Yard Opening Time', def: 'The number of calendar days before vessel ETD that a terminal starts accepting gate-in. Varies by terminal (5–8 days).' },
  { term: 'ISR', full: 'Internal Service Request', def: 'Required for special cargo (IMO/DG, Reefer) transiting Duisburg, or any non-standard scenario outside the planning matrix.' },
  { term: 'P1 / P2', full: 'Primary / Secondary Depot', def: 'Ranked depot options from the ZIP matrix. P1 is always the preferred option. Use P2 only if P1 is unavailable.' },
  { term: 'PLZ', full: 'Postleitzahl', def: 'German postcode (ZIP code). The tool uses 4–5 digit PLZ for all depot and terminal lookups.' },
  { term: 'Order Deadline', full: '', def: 'Import: 7 business days before terminal ETD. Export: 2 business days before loading date. Orders cannot be placed after this date.' },
  { term: 'Customs Deadline', full: '', def: 'Rotterdam import only. The last time customs release documents must be submitted. Calculated from terminal departure day and vessel discharge time.' },
  { term: 'Vessel Planning Window', full: '', def: 'Export: the range of vessel ETDs compatible with a given inland departure — from earliest CCO date to latest ETA date.' },
  { term: 'Barge', full: '', def: 'Water-based inland transport via Rhine/Maas/Waal river system. Typical transit: 3–5 days depending on origin port and terminal.' },
  { term: 'Rail', full: '', def: 'Train-based inland transport. Faster than barge for specific corridors (e.g., Nuernberg CDN). Availability depends on terminal and port combination.' },
  { term: 'CY/CY', full: 'Container Yard to Container Yard', def: 'Booking type where the container moves between two Container Yard points without stripping/stuffing.' },
  { term: 'RTM', full: 'Rotterdam', def: 'Origin port code for Rotterdam. Full coverage for all German ZIP codes in the inland matrix.' },
  { term: 'ANR', full: 'Antwerp / Antwerpen', def: 'Origin port code for Antwerp. Not all German ZIP ranges are covered — northern Germany (0x, 1x, 20–30, 98–99) and Nuernberg (90–97) are RTM-only.' },
];

// ── Key Rules ─────────────────────────────────────────────────────────────────

const KEY_RULES = [
  {
    icon: AlertTriangle,
    color: 'border-rose-500/20 bg-rose-500/5',
    iconColor: 'text-rose-400',
    titleColor: 'text-rose-300',
    title: 'Customs Email — Always Required',
    body: 'For every import booking, a copy of the customs document MUST be sent to nlaopsinlrbc@maersk.com. Do not send it to inland operations — it goes directly to the customs team at this address.',
  },
  {
    icon: AlertTriangle,
    color: 'border-amber-500/20 bg-amber-500/5',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-300',
    title: 'Multistop — ATA Required 2 Days Before Delivery',
    body: 'When a multistop delivery is needed, the Actual Time of Arrival (ATA) must be communicated at least 2 business days before the customer delivery date. Failure to do so may result in missed slots.',
  },
  {
    icon: AlertTriangle,
    color: 'border-rose-500/20 bg-rose-500/5',
    iconColor: 'text-rose-400',
    titleColor: 'text-rose-300',
    title: 'IMO & Reefer via Duisburg — ISR Mandatory',
    body: 'IMO (DG) and Reefer containers via DEDUI01 (Hutchison Ports Duisburg) are on request only. The CX coordinator must raise an ISR before any booking can be made. The planning tool will block all results and show this requirement when triggered.',
  },
  {
    icon: Info,
    color: 'border-[#42b0d5]/20 bg-[#42b0d5]/5',
    iconColor: 'text-[#42b0d5]',
    titleColor: 'text-[#42b0d5]',
    title: 'No Rail from Germersheim or Mainz',
    body: 'DEGRH01 (Germersheim DPW) and DEMNZ01 (Mainz Frankenbach) have no rail connection. Only barge options will be shown for these terminals regardless of ZIP or port selection.',
  },
  {
    icon: Info,
    color: 'border-[#42b0d5]/20 bg-[#42b0d5]/5',
    iconColor: 'text-[#42b0d5]',
    titleColor: 'text-[#42b0d5]',
    title: 'Nuernberg CDN — Rail Only',
    body: 'NUE02 (Nuernberg CDN / Contargo) is a rail-only terminal serving ZIP codes 90000–97999 via Rotterdam. No barge option exists for this corridor. Antwerp does not serve this ZIP range.',
  },
  {
    icon: Info,
    color: 'border-violet-500/20 bg-violet-500/5',
    iconColor: 'text-violet-400',
    titleColor: 'text-violet-300',
    title: 'Empty Depot — Always Use P1 First',
    body: 'The tool shows a preferred (P1) and optional secondary (P2) empty depot for export bookings. Always use P1 unless unavailable. If P1 has no stock, delay transport or contact Inland Ops directly before using P2.',
  },
];

// ── Main component ─────────────────────────────────────────────────────────────

export function Help() {
  const { setActiveTab: setAppTab } = usePlannerStore();
  const [activeTab, setActiveTab] = useState<GuideTab>('overview');
  const [openImportStep, setOpenImportStep] = useState<number | null>(0);
  const [openExportStep, setOpenExportStep] = useState<number | null>(0);
  const [glossarySearch, setGlossarySearch] = useState('');

  const filteredGlossary = GLOSSARY.filter(
    g =>
      g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      g.full.toLowerCase().includes(glossarySearch.toLowerCase()) ||
      g.def.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  const TABS: { id: GuideTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'import', label: 'Import Guide', icon: Anchor },
    { id: 'export', label: 'Export Guide', icon: Send },
    { id: 'glossary', label: 'Glossary', icon: BookOpen },
    { id: 'rules', label: 'Key Rules', icon: CircleHelp },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">User Guide</h1>
        <p className="text-sm text-slate-500 mt-1">Step-by-step instructions for the Maersk DE Inland Planning Tool</p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl bg-[#00243d] border border-white/10 overflow-hidden shadow-2xl">
        {/* Tab bar */}
        <div className="flex border-b border-white/10 px-4 pt-3 gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-black whitespace-nowrap transition-all duration-200 border-b-2',
                  isActive
                    ? 'bg-white/8 text-white border-[#42b0d5]'
                    : 'text-white/40 border-transparent hover:text-white/70 hover:bg-white/5'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-5">

                {/* ── Hero Banner ─────────────────────────────────────────── */}
                <div className="-mx-6 -mt-6 mb-6 relative overflow-hidden">
                  {/* Layered gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#001829] via-[#002d52] to-[#00437a]" />
                  {/* Subtle grid overlay */}
                  <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                    }}
                  />
                  {/* Glow blobs */}
                  <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#42b0d5]/15 blur-3xl pointer-events-none" />
                  <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-maersk-blue/20 blur-2xl pointer-events-none" />
                  {/* Bottom border */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#42b0d5]/30 to-transparent" />

                  <div className="relative z-10 px-6 pt-7 pb-7">
                    {/* Live pill */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/8 border border-white/12 mb-4">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.25em]">Live Dashboard</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      {/* Left — title block */}
                      <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white leading-[1.05]">
                          Export Capacity
                          <br />
                          <span className="text-[#42b0d5]">Germany</span>
                        </h1>
                        <p className="text-sm text-white/40 mt-3 leading-relaxed max-w-sm">
                          15-day rolling truck forecast across inland hubs. Click any green date to run a quick export schedule lookup and jump straight into the Export Planner.
                        </p>
                      </div>

                      {/* Right — stat chips */}
                      <div className="flex flex-row md:flex-col gap-2 flex-none">
                        <motion.div
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm"
                        >
                          <div className="p-1.5 rounded-lg bg-[#42b0d5]/20">
                            <Truck className="h-3.5 w-3.5 text-[#42b0d5]" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-white tracking-tight">3 Hubs</div>
                            <div className="text-[8px] text-white/30 uppercase tracking-widest">Active</div>
                          </div>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.18 }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/10 backdrop-blur-sm"
                        >
                          <div className="p-1.5 rounded-lg bg-emerald-500/20">
                            <CalendarDays className="h-3.5 w-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-sm font-black text-white tracking-tight">15 Days</div>
                            <div className="text-[8px] text-white/30 uppercase tracking-widest">Forecast</div>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Route flow strip */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="mt-6 flex items-center gap-2"
                    >
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/6 border border-white/10">
                        <MapPin className="h-3 w-3 text-white/35" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-wide">Customer</span>
                      </div>
                      <div className="flex-1 flex items-center">
                        <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-white/20" />
                        <ArrowRight className="h-3 w-3 text-white/20 flex-none mx-1" />
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#42b0d5]/15 border border-[#42b0d5]/25">
                        <Truck className="h-3 w-3 text-[#42b0d5]" />
                        <span className="text-[10px] font-black text-[#42b0d5] uppercase tracking-wide">Inland Hub</span>
                      </div>
                      <div className="flex-1 flex items-center">
                        <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-white/10" />
                        <ArrowRight className="h-3 w-3 text-white/20 flex-none mx-1" />
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/6 border border-white/10">
                        <Anchor className="h-3 w-3 text-white/35" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-wide">Port</span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Truck capacity block explanation */}
                <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-[#42b0d5]" />
                    <p className="text-xs font-black text-white">Export Truck Capacity Forecast</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-white/70 leading-relaxed">
                      The capacity board shows a 15-working-day rolling forecast for each inland hub. Each day block is colour-coded:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="h-8 w-8 rounded-md bg-emerald-500 flex items-center justify-center flex-none">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-400">Green — Available</p>
                          <p className="text-[10px] text-white/50 leading-snug mt-0.5">Truck capacity is available on this date. Click to look up export schedules.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <div className="h-8 w-8 rounded-md bg-rose-500 flex items-center justify-center flex-none">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-rose-400">Red — Booked Out</p>
                          <p className="text-[10px] text-white/50 leading-snug mt-0.5">No truck capacity on this date. Not clickable.</p>
                        </div>
                      </div>
                    </div>

                    {/* Click flow */}
                    <div className="mt-2 rounded-xl border border-[#42b0d5]/20 bg-[#42b0d5]/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <MousePointerClick className="h-4 w-4 text-[#42b0d5] flex-none" />
                        <p className="text-xs font-black text-[#42b0d5]">Clicking a green date — step by step</p>
                      </div>
                      <div className="space-y-2.5 pl-1">
                        {[
                          { n: '1', text: 'A popup appears pre-filled with the selected loading date.' },
                          { n: '2', text: 'Enter the customer ZIP code (PLZ) of the pickup address.' },
                          { n: '3', text: 'Select the container type (20\'DC, 40\'HC, Reefer, IMO, etc.).' },
                          { n: '4', text: 'Set the loading time — this affects next-day departure eligibility (after 12:00 = excluded).' },
                          { n: '5', text: 'Select the port terminal your vessel will load at (e.g. APM Terminals Rotterdam).' },
                          { n: '6', text: 'Click "Find Export Schedules" — the tool runs the export planner instantly.' },
                          { n: '7', text: 'Review available barge/rail departures shown in the popup.' },
                          { n: '8', text: 'Click "Open in Export Booking" to go directly to the full Export Planner with your results loaded.' },
                        ].map(step => (
                          <div key={step.n} className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-[#42b0d5]/20 border border-[#42b0d5]/30 flex items-center justify-center flex-none mt-0.5">
                              <span className="text-[9px] font-black text-[#42b0d5]">{step.n}</span>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed">{step.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-none mt-0.5" />
                      <p className="text-xs text-amber-300 leading-relaxed">The popup is a <strong>quick-lookup only</strong> — it does not save or commit a booking. Use the full Export Planner for complete planning with all options and the copy summary.</p>
                    </div>
                  </div>
                </div>

                {/* Excel upload/download */}
                <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-xs font-black text-white">Updating Capacity Data</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-white/70 leading-relaxed">
                      Capacity data is not live — it must be maintained manually using the Excel extract/upload buttons in the capacity board header.
                    </p>
                    <div className="space-y-2 mt-1">
                      {[
                        { label: 'Extract Excel', desc: 'Downloads the current capacity grid as a .xlsx file. Open it, update Available/Booked Out cells, then upload.' },
                        { label: 'Upload Capacity', desc: 'Uploads a filled Excel template and refreshes the board. The file must match the exact column format of the extract.' },
                      ].map(item => (
                        <div key={item.label} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                          <span className="text-[10px] font-black text-[#42b0d5] w-28 flex-none pt-0.5">{item.label}</span>
                          <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rhine water levels */}
                <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-xs font-black text-white">Rhine Water Levels Monitor</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-white/70 leading-relaxed">
                      Live water level data from <strong className="text-white">pegelonline.wsv.de</strong> (German federal waterways authority). Refreshes every 5 minutes. Five gauge stations are monitored:
                    </p>
                    <div className="grid grid-cols-5 gap-2 mt-2">
                      {['Kaub', 'Cologne', 'Duisburg', 'Mannheim', 'Maxau'].map(s => (
                        <div key={s} className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/8 text-center">
                          <p className="text-[9px] font-black text-white/50">{s}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2.5 p-3 rounded-lg bg-[#42b0d5]/10 border border-[#42b0d5]/20 mt-2">
                      <Info className="h-3.5 w-3.5 text-[#42b0d5] flex-none mt-0.5" />
                      <p className="text-xs text-[#42b0d5] leading-relaxed"><strong>Kaub</strong> is the critical Middle Rhine chokepoint — restrictions typically activate below ~0.75m affecting Andernach, Mainz, Mannheim and Germersheim barges. Cologne covers NRW terminals (Duisburg, Bonn). Low water (below 1.5m avg) impacts capacity; high water (above 4.0m avg) may restrict passage. Data refreshes every 5 minutes.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Import Guide */}
            {activeTab === 'import' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-[#42b0d5]/15 border border-[#42b0d5]/20">
                    <Anchor className="h-4 w-4 text-[#42b0d5]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">Import Planner — How It Works</h2>
                    <p className="text-xs text-white/40">Plan inland delivery from port to customer for import containers</p>
                  </div>
                </div>
                {IMPORT_STEPS.map((step, i) => (
                  <StepCard
                    key={i}
                    step={step}
                    index={i}
                    isOpen={openImportStep === i}
                    onToggle={() => setOpenImportStep(openImportStep === i ? null : i)}
                    accentColor="bg-[#42b0d5]/20 text-[#42b0d5]"
                  />
                ))}
              </div>
            )}

            {/* Export Guide */}
            {activeTab === 'export' && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/20">
                    <Send className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">Export Planner — How It Works</h2>
                    <p className="text-xs text-white/40">Plan inland collection from customer to port for export containers</p>
                  </div>
                </div>
                {EXPORT_STEPS.map((step, i) => (
                  <StepCard
                    key={i}
                    step={step}
                    index={i}
                    isOpen={openExportStep === i}
                    onToggle={() => setOpenExportStep(openExportStep === i ? null : i)}
                    accentColor="bg-emerald-500/20 text-emerald-400"
                  />
                ))}
              </div>
            )}

            {/* Glossary */}
            {activeTab === 'glossary' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-violet-500/15 border border-violet-500/20">
                    <BookOpen className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">Glossary</h2>
                    <p className="text-xs text-white/40">Definitions for all terms used in the planning tool</p>
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                  <input
                    value={glossarySearch}
                    onChange={e => setGlossarySearch(e.target.value)}
                    placeholder="Search terms..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#42b0d5]/50 focus:bg-white/8 transition-all"
                  />
                </div>

                <div className="space-y-0 rounded-xl border border-white/10 overflow-hidden">
                  {filteredGlossary.length === 0 ? (
                    <div className="py-8 text-center text-xs text-white/25">No terms match your search</div>
                  ) : (
                    filteredGlossary.map((g, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
                      >
                        <div className="flex-none w-28">
                          <span className="font-mono text-xs font-black text-[#42b0d5]">{g.term}</span>
                          {g.full && <p className="text-[9px] text-white/25 mt-0.5 leading-tight">{g.full}</p>}
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">{g.def}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Key Rules */}
            {activeTab === 'rules' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/20">
                    <CircleHelp className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">Key Rules & Reminders</h2>
                    <p className="text-xs text-white/40">Critical rules every CX coordinator must follow</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {KEY_RULES.map((rule, i) => {
                    const Icon = rule.icon;
                    return (
                      <div key={i} className={cn('rounded-xl border p-4 space-y-2', rule.color)}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn('h-4 w-4 flex-none', rule.iconColor)} />
                          <h3 className={cn('text-sm font-black', rule.titleColor)}>{rule.title}</h3>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed pl-6">{rule.body}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Quick reference table */}
                <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden mt-6">
                  <div className="px-4 py-3 border-b border-white/8">
                    <p className="text-xs font-black text-white/50 uppercase tracking-widest">Quick Reference — Deadlines</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      { label: 'Import order deadline', value: '7 business days before terminal ETD' },
                      { label: 'Export order deadline', value: '2 business days before loading date' },
                      { label: 'Import customs (RTM Mon–Thu)', value: 'Terminal ETD − 1 day at 12:00 CET' },
                      { label: 'Import customs (RTM Fri/Sat/Sun)', value: 'Previous Friday at 15:00 CET' },
                      { label: 'Export customs (RTM)', value: 'Loading time + 3 hours' },
                      { label: 'Multistop ATA notice', value: 'At least 2 days before customer delivery' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-start gap-4 px-4 py-3">
                        <span className="text-xs text-white/40 flex-1">{row.label}</span>
                        <span className="text-xs font-bold text-white/80 text-right">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Internal tools — not shown in main nav */}
      <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-200">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Internal</p>
        <button
          onClick={() => setAppTab('prd')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200 hover:border-slate-300"
        >
          <FileText className="h-3.5 w-3.5" />
          Specifications
        </button>
        <button
          onClick={() => setAppTab('schedule-manager')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all border border-slate-200 hover:border-slate-300"
        >
          <Database className="h-3.5 w-3.5" />
          Schedule Manager
        </button>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-400">
        Maersk DE Inland Planning Tool · For operational queries contact{' '}
        <span className="font-bold text-slate-600">nl.execution@lns.maersk.com</span>
      </p>
    </div>
  );
}
