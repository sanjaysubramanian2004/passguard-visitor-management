import React, { useState, useEffect } from 'react';
import { PopulatedVisit, VisitStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';
import { formatTime12h, formatTimeRange12h } from '../utils/formatters.ts';
import { exportToCSV } from '../utils/csv.ts';
import { 
  UserPlus, 
  QrCode, 
  RefreshCw, 
  FileDown, 
  SlidersHorizontal, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Radio,
  Lock,
  Trash2
} from 'lucide-react';

interface FrontDeskVisitsViewProps {
  onOpenRegister: () => void;
  onOpenScanner: () => void;
  onOpenBadge: (visitor: PopulatedVisit) => void;
  onOpenAction: (visitor: PopulatedVisit, action: any) => void;
  onOpenDetails: (visitor: PopulatedVisit) => void;
  searchQuery?: string;
}

export const FrontDeskVisitsView: React.FC<FrontDeskVisitsViewProps> = ({
  onOpenRegister,
  onOpenScanner,
  onOpenBadge,
  onOpenAction,
  onOpenDetails,
  searchQuery = ''
}) => {
  const { success, error } = useToast();
  const [visits, setVisits] = useState<PopulatedVisit[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INSIDE' | 'APPROVED' | 'PENDING' | 'DENIED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [lastScanTime, setLastScanTime] = useState('12s ago');
  const [visitToDelete, setVisitToDelete] = useState<PopulatedVisit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadVisits = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      let statusFilter: any = undefined;
      if (activeFilter === 'INSIDE') statusFilter = 'CHECKED_IN';
      if (activeFilter === 'APPROVED') statusFilter = 'APPROVED';
      if (activeFilter === 'PENDING') statusFilter = 'PENDING';
      if (activeFilter === 'DENIED') statusFilter = 'REJECTED';

      const res = await api.getVisitors({
        search: searchQuery || undefined,
        status: statusFilter
      });
      setVisits(res.visitors);
    } catch (e) {
      console.error('Failed to load visits', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisits(false);
    const interval = setInterval(() => loadVisits(true), 5000);
    const handleFocus = () => loadVisits(true);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeFilter, searchQuery]);

  const handleDeleteVisit = async () => {
    if (!visitToDelete) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteVisit(visitToDelete.id);
      if (res.success) {
        success('Pass Deleted', res.message);
        setVisitToDelete(null);
        loadVisits();
      }
    } catch (err: any) {
      error('Failed to Delete Pass', err.message || 'Error deleting visit pass');
    } finally {
      setIsDeleting(false);
    }
  };

  // Derived counts for tabs and KPI cards
  const insideNow = visits.filter(v => v.status === 'CHECKED_IN');
  const approvedAwaiting = visits.filter(v => v.status === 'APPROVED');
  const pendingHost = visits.filter(v => v.status === 'PENDING');
  const deniedVisits = visits.filter(v => v.status === 'REJECTED');
  const checkedOutToday = visits.filter(v => v.status === 'CHECKED_OUT');

  const handleExportCSV = () => {
    if (visits.length === 0) return;
    const headers = ['Pass Number', 'Visitor Name', 'Company', 'Host Employee', 'Department', 'Scheduled Time', 'Status', 'Check-In'];
    const rows = visits.map(v => [
      v.passNumber,
      v.visitorName,
      v.visitorCompany || 'Direct',
      v.employeeName,
      v.employeeDepartment,
      `${v.visitDate} ${formatTime12h(v.expectedArrivalTime)}`,
      v.status,
      v.checkInTime ? formatTime12h(v.checkInTime) : 'N/A'
    ]);
    exportToCSV(`passguard-manifest-${Date.now()}.csv`, headers, rows);
    success('Manifest Exported', `Downloaded security manifest (${visits.length} records).`);
  };

  const handlePrintManifest = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Terminal ID, Title & Action CTAs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-700 bg-slate-200/80 rounded">
              Lobby Terminal 01
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
              Gate Enforcer Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
            Receptionist Active Visits Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Real-time lobby queue & turnstile access control with live database sync.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            <QrCode className="w-4 h-4 text-slate-700" />
            <span>Scan QR Pass</span>
          </button>

          <button
            onClick={onOpenRegister}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register Visitor</span>
          </button>
        </div>
      </div>

      {/* Segmented Filter Pills (Matching Screenshot 1) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeFilter === 'ALL'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
          }`}
        >
          <span>All Visitors</span>
          <span className="font-mono text-[11px] opacity-80">{visits.length}</span>
        </button>

        <button
          onClick={() => setActiveFilter('INSIDE')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeFilter === 'INSIDE'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Inside Now</span>
          <span className="font-mono text-[11px]">{insideNow.length}</span>
        </button>

        <button
          onClick={() => setActiveFilter('APPROVED')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeFilter === 'APPROVED'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100/80 border border-blue-200/60'
          }`}
        >
          <span>Approved Awaiting</span>
          <span className="font-mono text-[11px]">{approvedAwaiting.length}</span>
        </button>

        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeFilter === 'PENDING'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100/80 border border-amber-200/60'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Pending Host</span>
          <span className="font-mono text-[11px]">{pendingHost.length}</span>
        </button>

        <button
          onClick={() => setActiveFilter('DENIED')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
            activeFilter === 'DENIED'
              ? 'bg-teal-900 text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100/80 border border-rose-200/60'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span>Flagged / Denied</span>
          <span className="font-mono text-[11px]">{deniedVisits.length}</span>
        </button>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Inside Building Now */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Inside Building Now</span>
              <span className={`w-2.5 h-2.5 rounded-full ${insideNow.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                {insideNow.length}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {insideNow.length === 1 ? 'active guest' : 'active guests'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              HQ Turnstiles active • Live verification
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-4 overflow-hidden">
            <div className="bg-emerald-600 h-1 rounded-full transition-all" style={{ width: insideNow.length > 0 ? '100%' : '0%' }}></div>
          </div>
        </div>

        {/* Card 2: Expected Today */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Expected Today</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                {visits.length}
              </span>
              <span className="text-xs font-medium text-slate-500">registered</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {approvedAwaiting.length + pendingHost.length} remaining lobby arrivals expected
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-4 overflow-hidden">
            <div className="bg-blue-600 h-1 rounded-full transition-all" style={{ width: visits.length > 0 ? '100%' : '0%' }}></div>
          </div>
        </div>

        {/* Card 3: Pending Host Approvals */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Pending Host Approvals</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                {pendingHost.length}
              </span>
              <span className={`text-xs font-bold ${pendingHost.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {pendingHost.length > 0 ? 'Action needed' : 'All clear'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Awaiting employee response • Rule 6 locked
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-4 overflow-hidden">
            <div className="bg-amber-500 h-1 rounded-full transition-all" style={{ width: pendingHost.length > 0 ? '100%' : '0%' }}></div>
          </div>
        </div>

        {/* Card 4: Checked Out Today */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span>Checked Out Today</span>
              <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                {checkedOutToday.length}
              </span>
              <span className="text-xs font-medium text-slate-500">passes expired</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Check-outs recorded and archived in database
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-4 overflow-hidden">
            <div className="bg-slate-700 h-1 rounded-full transition-all" style={{ width: checkedOutToday.length > 0 ? '100%' : '0%' }}></div>
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left Active Lobby Flow (2/3) + Right Hardware Telemetry (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2/3: Active Lobby Flow & Manifest */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          
          {/* Table Header Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Active Lobby Flow & Manifest
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold text-slate-600 bg-slate-100 rounded-lg">
                LIVE 5 SEC AUTO-SYNC
              </span>
              <button
                onClick={() => loadVisits(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                title="Refresh table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* High-Fidelity Table (Matching Screenshot 1) */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3 px-5">Visitor Credentials</th>
                  <th className="py-3 px-4">Host & Department</th>
                  <th className="py-3 px-4">Arrival Window</th>
                  <th className="py-3 px-4 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <p className="font-semibold text-sm text-slate-700">No visitors in current manifest</p>
                      <p className="text-xs text-slate-400 mt-1">Register a new visitor or clear filter pills.</p>
                    </td>
                  </tr>
                ) : (
                  visits.map((v) => {
                    const isInside = v.status === 'CHECKED_IN';
                    const isDenied = v.status === 'REJECTED';
                    const isApproved = v.status === 'APPROVED';

                    return (
                      <tr 
                        key={v.id} 
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => onOpenDetails(v)}
                      >
                        {/* Visitor Credentials */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {v.visitorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-950 truncate">{v.visitorName}</span>
                                {v.purpose.includes('Client') && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-slate-100 text-slate-700 rounded uppercase">VIP</span>
                                )}
                                {v.purpose.includes('Vendor') && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-slate-100 text-slate-700 rounded uppercase">Contractor</span>
                                )}
                                {v.purpose.includes('Interview') && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-blue-50 text-blue-700 rounded uppercase">Candidate</span>
                                )}
                                {isDenied && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-rose-50 text-rose-700 rounded uppercase">DENIED</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {v.visitorCompany || 'Independent Guest'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Host & Department */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{v.employeeName}</div>
                          <div className="text-[11px] text-slate-500">{v.employeeDepartment}</div>
                        </td>

                        {/* Arrival Window & Real-time Tag */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-slate-800 text-xs font-semibold">
                            {formatTimeRange12h(v.expectedArrivalTime, v.expectedDepartureTime)}
                          </div>
                          <div className="text-[11px] mt-0.5">
                            {isInside ? (
                              <span className="text-teal-700 font-bold">In Lobby (Arrived {formatTime12h(v.checkInTime)})</span>
                            ) : isApproved ? (
                              <span className="text-slate-500">Gate Entry: {formatTime12h(v.expectedArrivalTime)}</span>
                            ) : isDenied ? (
                              <span className="text-rose-600 font-bold">Unscheduled Attempt</span>
                            ) : (
                              <span className="text-slate-400">Pre-registered via Web</span>
                            )}
                          </div>
                        </td>

                        {/* Gate Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isApproved && (
                              <button
                                onClick={() => onOpenAction(v, 'CHECK_IN')}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg transition-colors shadow-2xs"
                              >
                                Check In
                              </button>
                            )}
                            {isInside && (
                              <button
                                onClick={() => onOpenAction(v, 'CHECK_OUT')}
                                className="px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                              >
                                Check Out
                              </button>
                            )}
                            <button
                              onClick={() => onOpenBadge(v)}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Print Visitor Pass"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setVisitToDelete(v)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Pass Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/20">
            <span>Showing 1 - {visits.length} of {visits.length} scheduled visits</span>
            <div className="flex items-center gap-1">
              <button className="px-2.5 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100">&lt;</button>
              <button className="px-2.5 py-1 rounded bg-teal-800 text-white font-bold font-mono">1</button>
              <button className="px-2.5 py-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100">&gt;</button>
            </div>
          </div>
        </div>

        {/* Right 1/3: Turnstile Hardware & Emergency Roll Call (Matching Screenshot 1) */}
        <div className="space-y-4">
          
          {/* Card: Turnstile Hardware ONLINE */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Turnstile Hardware
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 rounded uppercase">
                ONLINE
              </span>
            </div>

            {/* Gates Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                  <span>GATE 01 (NORTH)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">Normal Inflow</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Optical Sensor: 0 errors</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                  <span>GATE 02 (SOUTH)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1">QR Flap Open</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Optical Sensor: 0 errors</div>
              </div>
            </div>

            {/* Last Live Scanner Tap Card */}
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                <span className="font-bold uppercase tracking-wider text-slate-700">Latest Processed Visitor</span>
                <span className="font-mono text-slate-500">Live</span>
              </div>

              {insideNow.length > 0 || visits.length > 0 ? (
                (() => {
                  const latest = insideNow[0] || visits[0];
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {latest.visitorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs truncate">{latest.visitorName}</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            latest.status === 'CHECKED_IN' ? 'text-emerald-700 bg-emerald-100/80' : 'text-blue-700 bg-blue-100/80'
                          }`}>
                            {latest.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">Pass #{latest.passNumber} • Host: {latest.employeeName}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{latest.status === 'CHECKED_IN' ? 'Checked In Active' : 'Pre-approved'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="py-2 text-center text-xs text-slate-500">
                  <span>Scanner ready • No recent scans</span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Emergency Roll Call (Matching Screenshot 1) */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg border border-rose-200">
                ✱
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Emergency Roll Call</h4>
                <p className="text-[11px] text-slate-500">{insideNow.length} Visitors currently in zone</p>
              </div>
            </div>
            <button
              onClick={handlePrintManifest}
              className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
            >
              Print Manifest
            </button>
          </div>

        </div>
      </div>

      {/* Delete Pass Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(visitToDelete)}
        title="Delete Visitor Pass Record"
        message={`Are you sure you want to delete visitor pass ${visitToDelete?.passNumber} for "${visitToDelete?.visitorName}"? This action cannot be undone.`}
        confirmLabel="Delete Pass"
        isSubmitting={isDeleting}
        onConfirm={handleDeleteVisit}
        onCancel={() => setVisitToDelete(null)}
      />

    </div>
  );
};
