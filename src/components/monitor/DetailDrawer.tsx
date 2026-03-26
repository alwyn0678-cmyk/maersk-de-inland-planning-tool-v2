// ── Detail Drawer ──────────────────────────────────────────────────────────
// Full-detail side panel shown when a shipment row is clicked.

import { motion, AnimatePresence } from 'motion/react';
import { ScoredShipment, RiskLevel, IssueFlag } from '../../types/monitor';
import { fmt, fmtS } from '../../logic/dateUtils';
import { cn } from '../../lib/utils';
import {
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Ship,
  Package,
  MapPin,
  Calendar,
  Hash,
  User,
  Truck,
  Anchor,
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────────────

const RISK_HEADER: Record<RiskLevel, string> = {
  Critical: 'bg-rose-600',
  High:     'bg-orange-500',
  Medium:   'bg-amber-500',
  Low:      'bg-sky-500',
  OK:       'bg-emerald-500',
};

const SEVERITY_ICON = {
  critical: AlertOctagon,
  high:     AlertTriangle,
  medium:   Info,
  low:      CheckCircle2,
};

const SEVERITY_STYLES = {
  critical: 'bg-rose-50 border-rose-200 text-rose-700',
  high:     'bg-orange-50 border-orange-200 text-orange-700',
  medium:   'bg-amber-50 border-amber-200 text-amber-700',
  low:      'bg-sky-50 border-sky-200 text-sky-700',
};

function Flag({ flag }: { flag: IssueFlag }) {
  const Icon = SEVERITY_ICON[flag.severity];
  return (
    <div className={cn('flex gap-2.5 p-3 rounded-lg border text-xs', SEVERITY_STYLES[flag.severity])}>
      <Icon className="h-3.5 w-3.5 flex-none mt-0.5" />
      <div>
        <p className="font-black">{flag.label}</p>
        <p className="mt-0.5 leading-relaxed opacity-80">{flag.detail}</p>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-36 flex-none pt-0.5">{label}</span>
      <span className={cn('text-xs text-slate-700 leading-relaxed flex-1', mono && 'font-mono')}>{value || '—'}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 px-3 py-1">
        {children}
      </div>
    </div>
  );
}

// ── Main drawer ─────────────────────────────────────────────────────────

interface DetailDrawerProps {
  shipment: ScoredShipment | null;
  onClose: () => void;
}

export function DetailDrawer({ shipment: s, onClose }: DetailDrawerProps) {
  return (
    <AnimatePresence>
      {s && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-slate-50 border-l border-slate-200 z-50 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={cn('px-5 py-4 text-white flex items-start gap-3', RISK_HEADER[s.risk.riskLevel])}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    {s.risk.riskLevel} RISK
                  </span>
                  <span className="opacity-50">·</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    {s.direction}
                  </span>
                </div>
                <h2 className="text-base font-black mt-0.5 leading-tight">
                  {s.customerName || 'Unknown Customer'}
                </h2>
                <p className="text-xs opacity-80 mt-0.5">
                  {s.bookingNumber || 'No booking'} · {s.containerId || 'No container'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors flex-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Risk summary */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main Issue</p>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{s.risk.mainIssue}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Action</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{s.risk.recommendedAction}</p>
                </div>
                <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Risk Score</p>
                    <p className="text-lg font-black text-slate-800">{s.risk.riskScore}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validation</p>
                    <p className={cn(
                      'text-xs font-black',
                      s.risk.validationStatus === 'Fully Validated' ? 'text-emerald-600' :
                      s.risk.validationStatus === 'Partially Validated' ? 'text-amber-600' :
                      'text-rose-600'
                    )}>
                      {s.risk.validationStatus}
                    </p>
                  </div>
                  {s.risk.bufferToCCO !== null && (
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Buffer to CCO</p>
                      <p className={cn(
                        'text-lg font-black',
                        s.risk.bufferToCCO < 0 ? 'text-rose-600' :
                        s.risk.bufferToCCO < 2 ? 'text-amber-600' :
                        'text-emerald-600'
                      )}>
                        {s.risk.bufferToCCO}d
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Issue flags */}
              {s.risk.flags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    Issue Flags ({s.risk.flags.length})
                  </h3>
                  {s.risk.flags.map((flag, i) => <Flag key={i} flag={flag} />)}
                </div>
              )}

              {/* Feasibility (export only) */}
              {s.direction === 'Export' && s.risk.feasibility && (
                <div className={cn(
                  'rounded-xl border p-4',
                  s.risk.feasibility.status === 'Feasible' ? 'bg-emerald-50 border-emerald-200' :
                  s.risk.feasibility.status === 'Tight' ? 'bg-amber-50 border-amber-200' :
                  s.risk.feasibility.status === 'Not Feasible' ? 'bg-rose-50 border-rose-200' :
                  'bg-slate-50 border-slate-200'
                )}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Export Feasibility Check</p>
                  <p className={cn(
                    'text-sm font-black mt-1',
                    s.risk.feasibility.status === 'Feasible' ? 'text-emerald-700' :
                    s.risk.feasibility.status === 'Tight' ? 'text-amber-700' :
                    s.risk.feasibility.status === 'Not Feasible' ? 'text-rose-700' :
                    'text-slate-600'
                  )}>
                    {s.risk.feasibility.status}
                  </p>
                  {s.risk.feasibility.reason && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.risk.feasibility.reason}</p>
                  )}
                  {s.risk.feasibility.departureMod && s.risk.feasibility.departureEtd && (
                    <div className="mt-2 pt-2 border-t border-current/10 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Best Departure</p>
                        <p className="text-xs font-bold text-slate-700">
                          {s.risk.feasibility.departureMod} · {fmtS(s.risk.feasibility.departureEtd)}
                        </p>
                      </div>
                      {s.risk.feasibility.earliestCCO && (
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Earliest CCO</p>
                          <p className="text-xs font-bold text-slate-700">{fmt(s.risk.feasibility.earliestCCO)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Shipment details */}
              <Section title="Customer" icon={User}>
                <Field label="Name"     value={s.customerName} />
                <Field label="ZIP"      value={s.customerZip} mono />
                <Field label="City"     value={s.customerCity} />
                <Field label="Ref No."  value={s.customerRef}  mono />
                <Field label="Consignee" value={s.consigneeName} />
              </Section>

              <Section title="Inland Terminal" icon={Anchor}>
                <Field label="Terminal"  value={<span>{s.inlandTerminal.name} <span className="text-slate-400">({s.inlandTerminal.code})</span></span>} />
                <Field label="Source"    value={s.inlandTerminal.source} />
                <Field label="Empty Depot" value={s.emptyDepotName ? `${s.emptyDepotName} (${s.emptyDepotCode})` : s.emptyDepotCode} mono />
              </Section>

              <Section title="Ocean Terminal" icon={Ship}>
                <Field label="Port"      value={s.portTerminal?.raw} />
                <Field label="Code"      value={s.portTerminal?.termCode} mono />
                <Field label="YOT"       value={s.portTerminal?.yot ? `${s.portTerminal.yot} days` : undefined} />
              </Section>

              <Section title="Vessel & Dates" icon={Calendar}>
                <Field label="Vessel"    value={s.vesselName} />
                <Field label="Voyage"    value={s.voyage} mono />
                <Field label="Appointment" value={s.appointmentDateTime ? fmt(s.appointmentDateTime) + (s.appointmentTime ? ` ${s.appointmentTime}` : '') : undefined} />
                {s.direction === 'Export' && (
                  <Field label="Cut-Off" value={s.vesselCutoffDate ? fmt(s.vesselCutoffDate) : undefined} />
                )}
                {s.direction === 'Import' && (
                  <Field label="Vessel ETA" value={s.vesselEtaDate ? fmt(s.vesselEtaDate) : undefined} />
                )}
                {s.vesselEtdDate && (
                  <Field label="Vessel ETD" value={fmt(s.vesselEtdDate)} />
                )}
              </Section>

              <Section title="Container & Cargo" icon={Package}>
                <Field label="Container"  value={s.containerId} mono />
                <Field label="Equipment"  value={s.equipment ? `${s.equipment.size}' ${s.equipment.type} (${s.equipment.rawCode})` : undefined} />
                <Field label="IMO Class"  value={s.imoClass} />
                <Field label="Commodity"  value={s.commodityName} />
                <Field label="Gross Wt."  value={s.grossWeight ? `${s.grossWeight} t` : undefined} />
              </Section>

              <Section title="Transport" icon={Truck}>
                <Field label="Carrier"    value={s.carrierName} />
                <Field label="Transport"  value={s.meansOfTransport} mono />
                <Field label="Exec. Status" value={s.executionStatus} />
                <Field label="Subcont."   value={s.subcontrStatus} />
                <Field label="Delay"      value={s.delayStatus} />
                <Field label="Customs"    value={s.customsStatus} />
              </Section>

              <Section title="References" icon={Hash}>
                <Field label="Booking No." value={s.bookingNumber} mono />
                <Field label="FWD Order"   value={s.forwardingOrder} mono />
                <Field label="FRT Order"   value={s.freightOrder} mono />
                <Field label="Booked By"   value={s.bookedByName} />
              </Section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
