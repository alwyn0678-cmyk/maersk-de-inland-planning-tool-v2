// ── Filter Bar ─────────────────────────────────────────────────────────────

import { MonitorFilters, ScoredShipment } from '../../types/monitor';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FilterBarProps {
  filters: MonitorFilters;
  onChange: (f: Partial<MonitorFilters>) => void;
  shipments: ScoredShipment[];
  visibleCount: number;
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={cn(
        'text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors outline-none',
        'bg-white border-slate-200 text-slate-600 hover:border-[#42b0d5]/50 focus:border-[#42b0d5]',
        value ? 'border-[#42b0d5]/60 text-slate-800' : ''
      )}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function FilterBar({ filters, onChange, shipments, visibleCount }: FilterBarProps) {
  // Build unique option lists from the data
  const customers   = [...new Set(shipments.map(s => s.customerName).filter(Boolean) as string[])].sort();
  const terminals   = [...new Set(shipments.map(s => s.inlandTerminal.name).filter(n => n !== 'Unknown'))].sort();
  const carriers    = [...new Set(shipments.map(s => s.carrierName).filter(Boolean) as string[])].sort();
  const riskLevels  = ['Critical', 'High', 'Medium', 'Low', 'OK'];
  const directions  = ['Import', 'Export'];
  const statuses    = ['Not Started', 'In Execution', 'Ready for Transportation Execution', 'Executed'];
  const categories  = [
    'vessel-feasibility',
    'not-started-urgency',
    'missing-customer-ref',
    'missing-data',
    'terminal-schedule',
  ];

  const hasActive = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
      {/* Search + count row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={e => onChange({ search: e.target.value })}
            placeholder="Search booking, container, customer, vessel…"
            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 outline-none focus:border-[#42b0d5] placeholder:text-slate-400"
          />
        </div>
        <div className="text-xs font-bold text-slate-400 shrink-0 whitespace-nowrap">
          {visibleCount} / {shipments.length}
        </div>
        {hasActive && (
          <button
            onClick={() => onChange({ riskLevel: '', customer: '', inlandTerminal: '', direction: '', executionStatus: '', carrier: '', issueCategory: '', search: '' })}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {/* Dropdown filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.riskLevel}
          onChange={v => onChange({ riskLevel: v })}
          options={riskLevels}
          placeholder="All Risk Levels"
        />
        <Select
          value={filters.direction}
          onChange={v => onChange({ direction: v })}
          options={directions}
          placeholder="All Directions"
        />
        <Select
          value={filters.executionStatus}
          onChange={v => onChange({ executionStatus: v })}
          options={statuses}
          placeholder="All Statuses"
        />
        <Select
          value={filters.inlandTerminal}
          onChange={v => onChange({ inlandTerminal: v })}
          options={terminals}
          placeholder="All Inland Terminals"
        />
        <Select
          value={filters.customer}
          onChange={v => onChange({ customer: v })}
          options={customers}
          placeholder="All Customers"
        />
        <Select
          value={filters.carrier}
          onChange={v => onChange({ carrier: v })}
          options={carriers}
          placeholder="All Carriers"
        />
        <Select
          value={filters.issueCategory}
          onChange={v => onChange({ issueCategory: v })}
          options={categories}
          placeholder="All Issue Types"
        />
      </div>
    </div>
  );
}
