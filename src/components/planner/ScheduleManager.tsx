import { useState } from 'react';
import { usePlannerStore, Schedule } from '../../store/usePlannerStore';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Badge 
} from '../ui/badge';
import { 
  Download, 
  Upload, 
  Plus, 
  Calendar, 
  Ship, 
  Train, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Filter,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import * as XLSX from 'xlsx';

interface ScheduleManagerProps {
  direction: 'Import' | 'Export';
}

export function ScheduleManager({ direction }: ScheduleManagerProps) {
  const schedules    = usePlannerStore(s => s.schedules);
  const setSchedules = usePlannerStore(s => s.setSchedules);
  const addSchedule  = usePlannerStore(s => s.addSchedule);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Barge' | 'Rail'>('All');
  
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    type: 'Barge',
    direction: direction,
    origin: '',
    destination: '',
    departure: '',
    arrival: '',
    capacity: 100,
    status: 'On Time'
  });

  const filteredSchedules = schedules.filter(s => 
    s.direction === direction &&
    (typeFilter === 'All' || s.type === typeFilter) &&
    (s.origin.toLowerCase().includes(searchTerm.toLowerCase()) || 
     s.destination.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportExcel = () => {
    const dataToExport = filteredSchedules.map(s => ({
      Type: s.type,
      Origin: s.origin,
      Destination: s.destination,
      Departure: s.departure,
      Arrival: s.arrival,
      Capacity: s.capacity,
      Status: s.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Schedules");
    XLSX.writeFile(wb, `Maersk_${direction}_Schedules_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const importedSchedules: Schedule[] = data.map((item, index) => ({
        id: `imported-${Date.now()}-${index}`,
        type: item.Type || 'Barge',
        direction: direction,
        origin: item.Origin || '',
        destination: item.Destination || '',
        departure: item.Departure || '',
        arrival: item.Arrival || '',
        capacity: Number(item.Capacity) || 100,
        status: item.Status || 'On Time'
      }));

      setSchedules([...schedules, ...importedSchedules]);
    };
    reader.readAsBinaryString(file);
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const schedule: Schedule = {
      ...newSchedule as Schedule,
      id: `manual-${Date.now()}`,
    };
    addSchedule(schedule);
    setIsAdding(false);
    setNewSchedule({
      type: 'Barge',
      direction: direction,
      origin: '',
      destination: '',
      departure: '',
      arrival: '',
      capacity: 100,
      status: 'On Time'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white/90 backdrop-blur-xl shadow-xl overflow-hidden rounded-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-maersk-dark via-maersk-blue to-maersk-dark" />
        <CardHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-maersk-dark rounded-xl shadow-lg">
                <Calendar className="h-5 w-5 text-maersk-blue" />
              </div>
              <div>
                <CardTitle className="text-lg font-black text-maersk-dark tracking-tight">
                  {direction} Barge & Rail Schedules
                </CardTitle>
                <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-0.5">
                  Network Capacity Management v4.0
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                className="rounded-xl border-slate-200 hover:bg-slate-50 font-black text-xs uppercase tracking-widest h-9 px-4 group"
              >
                <Download className="mr-2 h-3.5 w-3.5 group-hover:-translate-y-0.5 transition-transform" />
                Extract
              </Button>
              <div className="relative">
                <input
                  type="file"
                  id="schedule-upload"
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="schedule-upload"
                  className="inline-flex items-center justify-center bg-maersk-blue hover:bg-maersk-blue/90 text-white rounded-xl shadow-md shadow-maersk-blue/20 font-black text-xs uppercase tracking-widest h-9 px-4 cursor-pointer transition-all active:translate-y-px"
                >
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Upload
                </label>
              </div>
              <Button
                onClick={() => setIsAdding(!isAdding)}
                className="bg-maersk-dark hover:bg-maersk-dark/90 text-white rounded-xl shadow-md font-black text-xs uppercase tracking-widest h-9 px-4"
              >
                <Plus className={cn("mr-2 h-4 w-4 transition-transform", isAdding && "rotate-45")} />
                {isAdding ? 'Cancel' : 'Add New'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <AnimatePresence>
            {isAdding && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-slate-100 bg-slate-50/50"
              >
                <form onSubmit={handleAddSchedule} className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Transport Type</Label>
                    <Select 
                      value={newSchedule.type} 
                      onValueChange={(val: 'Barge' | 'Rail') => setNewSchedule({...newSchedule, type: val})}
                    >
                      <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Barge">Barge</SelectItem>
                        <SelectItem value="Rail">Rail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Origin</Label>
                    <Input 
                      placeholder="e.g. Rotterdam" 
                      value={newSchedule.origin}
                      onChange={(e) => setNewSchedule({...newSchedule, origin: e.target.value})}
                      className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Destination</Label>
                    <Input 
                      placeholder="e.g. Duisburg" 
                      value={newSchedule.destination}
                      onChange={(e) => setNewSchedule({...newSchedule, destination: e.target.value})}
                      className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Capacity (TEU)</Label>
                    <Input 
                      type="number"
                      value={newSchedule.capacity}
                      onChange={(e) => setNewSchedule({...newSchedule, capacity: Number(e.target.value)})}
                      className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Departure</Label>
                    <Input 
                      type="datetime-local"
                      value={newSchedule.departure}
                      onChange={(e) => setNewSchedule({...newSchedule, departure: e.target.value})}
                      className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Arrival</Label>
                    <Input 
                      type="datetime-local"
                      value={newSchedule.arrival}
                      onChange={(e) => setNewSchedule({...newSchedule, arrival: e.target.value})}
                      className="bg-white border-slate-200 rounded-xl h-11 font-bold"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Status</Label>
                    <Select 
                      value={newSchedule.status} 
                      onValueChange={(val: any) => setNewSchedule({...newSchedule, status: val})}
                    >
                      <SelectTrigger className="bg-white border-slate-200 rounded-xl h-11 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="On Time">On Time</SelectItem>
                        <SelectItem value="Delayed">Delayed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" className="w-full bg-maersk-blue hover:bg-maersk-blue/90 text-white rounded-xl h-11 font-black uppercase tracking-widest text-xs">
                      Save Schedule
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-5 space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-maersk-blue transition-colors" />
                <Input
                  placeholder="Search by origin or destination..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 rounded-xl h-9 font-bold focus-visible:ring-maersk-blue/30 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={typeFilter === 'All' ? 'default' : 'outline'}
                  onClick={() => setTypeFilter('All')}
                  className={cn(
                    "rounded-xl h-9 px-4 font-black text-xs uppercase tracking-widest transition-all",
                    typeFilter === 'All' ? "bg-maersk-dark text-white" : "border-slate-200 text-slate-500"
                  )}
                >
                  All
                </Button>
                <Button
                  variant={typeFilter === 'Barge' ? 'default' : 'outline'}
                  onClick={() => setTypeFilter('Barge')}
                  className={cn(
                    "rounded-xl h-9 px-4 font-black text-xs uppercase tracking-widest transition-all",
                    typeFilter === 'Barge' ? "bg-maersk-blue text-white" : "border-slate-200 text-slate-500"
                  )}
                >
                  <Ship className="mr-1.5 h-3.5 w-3.5" />
                  Barge
                </Button>
                <Button
                  variant={typeFilter === 'Rail' ? 'default' : 'outline'}
                  onClick={() => setTypeFilter('Rail')}
                  className={cn(
                    "rounded-xl h-9 px-4 font-black text-xs uppercase tracking-widest transition-all",
                    typeFilter === 'Rail' ? "bg-amber-500 text-white" : "border-slate-200 text-slate-500"
                  )}
                >
                  <Train className="mr-1.5 h-3.5 w-3.5" />
                  Rail
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-inner bg-slate-50/30">
              <Table>
                <TableHeader className="bg-slate-100/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 py-3 pl-5">Type</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 py-3">Route</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 py-3">Departure</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 py-3">Arrival</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 py-3">Capacity</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 py-3 pr-5">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredSchedules.map((s) => (
                      <motion.tr 
                        key={s.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-white transition-colors border-slate-100"
                      >
                        <TableCell className="py-3 pl-5">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "p-2.5 rounded-xl shadow-sm",
                              s.type === 'Barge' ? "bg-maersk-blue/10 text-maersk-blue" : "bg-amber-100 text-amber-600"
                            )}>
                              {s.type === 'Barge' ? <Ship className="h-4 w-4" /> : <Train className="h-4 w-4" />}
                            </div>
                            <span className="font-black text-sm text-maersk-dark">{s.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center space-x-3">
                            <span className="font-black text-sm text-maersk-dark">{s.origin}</span>
                            <ArrowRight className="h-3 w-3 text-slate-300" />
                            <span className="font-black text-sm text-maersk-dark">{s.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-maersk-dark">
                              {new Date(s.departure).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">
                              {new Date(s.departure).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-black text-sm text-maersk-dark">
                              {new Date(s.arrival).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase">
                              {new Date(s.arrival).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col space-y-1.5 w-24">
                            <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
                              <span className="text-maersk-dark">{s.capacity} TEU</span>
                              <span className="text-slate-400">MAX</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-maersk-blue w-3/4 rounded-full" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 pr-5">
                          <Badge className={cn(
                            "rounded-lg font-black text-xs uppercase tracking-widest border-none px-3 py-1.5 shadow-sm",
                            s.status === 'On Time' ? "bg-emerald-500 text-white" :
                            s.status === 'Delayed' ? "bg-amber-500 text-white" :
                            "bg-rose-500 text-white"
                          )}>
                            {s.status === 'On Time' && <CheckCircle2 className="mr-1.5 h-3 w-3" />}
                            {s.status === 'Delayed' && <AlertCircle className="mr-1.5 h-3 w-3" />}
                            {s.status === 'Cancelled' && <XCircle className="mr-1.5 h-3 w-3" />}
                            {s.status}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center space-x-4 p-4 bg-maersk-dark/5 rounded-2xl border border-maersk-dark/10">
        <FileSpreadsheet className="h-5 w-5 text-maersk-blue" />
        <p className="text-xs font-bold text-maersk-dark opacity-70">
          Bulk operations supported. Use the <span className="text-maersk-blue">Extract Excel</span> button to get the current template for bulk updates.
        </p>
      </div>
    </div>
  );
}
