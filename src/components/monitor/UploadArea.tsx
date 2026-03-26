// ── Upload Area ────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Upload, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface UploadAreaProps {
  onFile: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

export function UploadArea({ onFile, isProcessing, error }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls)$/i)) return;
    onFile(file);
  }

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer group',
          isDragOver
            ? 'border-[#42b0d5] bg-[#42b0d5]/5'
            : error
              ? 'border-rose-300 bg-rose-50/50'
              : 'border-slate-200 bg-white hover:border-[#42b0d5]/50 hover:bg-[#42b0d5]/5'
        )}
        onClick={() => !isProcessing && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="h-10 w-10 text-[#42b0d5] animate-spin mb-3" />
              <p className="text-sm font-bold text-slate-600">Processing TMS file…</p>
              <p className="text-xs text-slate-400 mt-1">Parsing rows, running risk checks</p>
            </>
          ) : (
            <>
              <div className={cn(
                'h-12 w-12 rounded-xl flex items-center justify-center mb-3 transition-colors',
                isDragOver ? 'bg-[#42b0d5]/20' : 'bg-slate-100 group-hover:bg-[#42b0d5]/10'
              )}>
                {isDragOver
                  ? <Upload className="h-6 w-6 text-[#42b0d5]" />
                  : <FileSpreadsheet className="h-6 w-6 text-slate-400 group-hover:text-[#42b0d5]" />
                }
              </div>
              <p className="text-sm font-black text-slate-700">
                {isDragOver ? 'Drop TMS file here' : 'Upload TMS Extract (.xlsx)'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Drag & drop or click to browse — Excel export from TMS
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-px w-12 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected columns</span>
                <div className="h-px w-12 bg-slate-200" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                {['Traffic Direction', 'Appointment Date/Time', 'Booking Number', 'Customer Name', 'Port', 'Vessel Cut-Off Date'].map(col => (
                  <span key={col} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                    {col}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="sr-only"
          onChange={e => handleFiles(e.target.files)}
          disabled={isProcessing}
        />
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200"
        >
          <AlertCircle className="h-4 w-4 text-rose-500 flex-none mt-0.5" />
          <p className="text-xs font-bold text-rose-700">{error}</p>
        </motion.div>
      )}
    </div>
  );
}
