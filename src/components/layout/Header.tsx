import { Anchor } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-[#00243d] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Maersk Logo SVG */}
          <svg viewBox="0 0 100 100" className="h-8 w-8 text-[#42b0d5]">
            <polygon fill="currentColor" points="50,5 61,35 95,35 68,55 78,85 50,65 22,85 32,55 5,35 39,35" />
          </svg>
          <span className="text-xl font-bold tracking-tight uppercase">Maersk</span>
          <span className="text-xl font-light tracking-tight text-slate-300 hidden sm:inline">| DE Inland Planning Tool</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-[#42b0d5] font-medium">
            <Anchor className="h-4 w-4 mr-1.5" />
            <span>Operations Dashboard</span>
          </div>
        </div>
      </div>
    </header>
  );
}
