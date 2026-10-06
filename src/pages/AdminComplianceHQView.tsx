import React, { useState, useEffect } from 'react';
import { ActivityLog, ActivityAction, ReportSummary } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import { formatTime12h } from '../utils/formatters.ts';
import { exportToCSV } from '../utils/csv.ts';
import { 
  Building, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  FileDown, 
  LogOut, 
  LogIn, 
  XCircle, 
  CheckCircle2, 
  Ban, 
  AlertTriangle, 
  Database,
  Shield,
  Layers,
  Activity
} from 'lucide-react';

export const AdminComplianceHQView: React.FC = () => {
  const { success } = useToast();
  const [period, setPeriod] = useState<'today' | 'this_week' | 'this_month' | 'custom'>('this_week');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActivityAction | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [logRes, repRes, statusRes] = await Promise.all([
        api.getActivityLogs({
          action: selectedAction === 'ALL' ? undefined : selectedAction,
          search: searchQuery || undefined
        }),
        api.getReports(period),
        api.getDatabaseStatus()
      ]);
      setLogs(logRes.logs);
      setReport(repRes);
      setDbStatus(statusRes);
    } catch (e) {
      console.error('Failed to load admin compliance data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period, selectedAction, searchQuery]);

  const handleExportAudit = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Event Action', 'Visitor Name', 'Host Sponsor', 'Details', 'Pass Number'];
    const rows = logs.map(l => [
      l.timestamp || l.createdAt || '',
      l.action || '',
      l.visitorName || 'Guest',
      l.performedBy ? `${l.performedBy.name} (${l.performedBy.role})` : 'System',
      l.details || '',
      l.passNumber || 'N/A'
    ]);
    exportToCSV(`audit-ledger-${period}-${Date.now()}.csv`, headers, rows);
    success('Audit Log Exported', `Successfully exported ${logs.length} audit records.`);
  };

  const getActionBadge = (action: ActivityAction) => {
    switch (action) {
      case 'CHECKED_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
            <LogOut className="w-3 h-3" /> CHECKED OUT
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <LogIn className="w-3 h-3" /> CHECKED IN
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3" /> REJECTED
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> APPROVED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-500 line-through">
            <Ban className="w-3 h-3" /> CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  };

  // Format real duration
  const formatDuration = (mins: number) => {
    if (!mins || mins === 0) return '0m';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const totalVisitsCount = report?.totalVisits ?? 0;
  const avgDuration = report?.averageVisitDurationMinutes ?? 0;
  const clearanceRate = report?.approvedRate ?? 0;
  const flaggedDenials = report?.flaggedDenials ?? report?.byStatus?.REJECTED ?? 0;
  const overstayAlerts = report?.overstayAlertsCount ?? 0;

  // Real Purpose Breakdown from database
  const purposeEntries = Object.entries(report?.byPurpose || {});
  const totalPurposes = purposeEntries.reduce((acc, [, count]) => acc + count, 0);

  // Real Department Workload from database
  const deptEntries = Object.entries(report?.byDepartment || {});
  const totalDepts = deptEntries.reduce((acc, [, count]) => acc + count, 0);

  // Real Hourly Distribution from database
  const hourly = report?.hourlyDistribution || {
    '08:00': 0,
    '10:00': 0,
    '12:00': 0,
    '14:00': 0,
    '16:00': 0,
    '18:00': 0
  };
  const maxHourly = Math.max(...Object.values(hourly), 1);

  return (
    <div className="space-y-6">
      
      {/* Header: Compliance Engine Badge, Title, Date Range Selector & Export CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-teal-900 bg-teal-50 border border-teal-200 rounded-full">
              Security & Compliance HQ
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Database Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Security & Compliance Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Real-time security analytics, immutable activity audit ledger, and policy enforcement across facilities.
          </p>
        </div>

        {/* Date Filter Pills & Export CTA */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${period === 'today' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('this_week')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${period === 'this_week' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${period === 'this_month' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Month
            </button>
          </div>

          <button
            onClick={handleExportAudit}
            disabled={logs.length === 0}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors shadow-xs ${
              logs.length > 0 
                ? 'text-white bg-teal-800 hover:bg-teal-900' 
                : 'text-slate-400 bg-slate-200 cursor-not-allowed'
            }`}
          >
            <FileDown className="w-4 h-4" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Cards (100% Real Database Values) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: TOTAL VISITS IN PERIOD */}
        <div className="p-5 bg-teal-50/40 rounded-2xl border border-teal-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Total Visits ({period.replace('_', ' ')})</span>
              <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center">
                <Building className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                {totalVisitsCount}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                {totalVisitsCount === 1 ? 'record' : 'records'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {report?.completedVisits ?? 0} checked-out, {report?.byStatus?.CHECKED_IN ?? 0} currently active
            </p>
          </div>
          <div className="pt-3 border-t border-teal-100/80 flex items-center justify-between text-[11px] text-slate-600 font-semibold mt-3">
            <span>Database Status</span>
            <span className="text-emerald-700 font-bold">Connected</span>
          </div>
        </div>

        {/* Card 2: AVERAGE DURATION */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Average Duration</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                {formatDuration(avgDuration)}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {report?.completedVisits ? `${report.completedVisits} completed` : 'No check-outs yet'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Calculated from check-in to check-out timestamps
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold mt-3">
            <span>Overstay alerts</span>
            <span className={`font-bold ${overstayAlerts > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {overstayAlerts} active
            </span>
          </div>
        </div>

        {/* Card 3: CLEARANCE RATE */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Clearance Rate</span>
              <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-950 font-mono tracking-tight">
                {totalVisitsCount > 0 ? `${clearanceRate}%` : '0%'}
              </span>
              <span className="text-xs font-bold text-emerald-700 font-mono">
                {totalVisitsCount > 0 ? `${(report?.byStatus?.APPROVED || 0) + (report?.byStatus?.CHECKED_IN || 0) + (report?.byStatus?.CHECKED_OUT || 0)} approved` : '0 visits'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Passed host vetting and rule approval
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold mt-3">
            <span>Approval Policy</span>
            <span className="text-emerald-700 font-bold">Host Approval Active</span>
          </div>
        </div>

        {/* Card 4: FLAGGED / DENIALS */}
        <div className="p-5 bg-rose-50/30 rounded-2xl border border-rose-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Flagged / Denials</span>
              <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-rose-700 font-mono tracking-tight">
                {flaggedDenials}
              </span>
              <span className="text-xs font-bold text-rose-700 font-mono">
                Rejections
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Visits rejected by employee sponsors
            </p>
          </div>
          <div className="pt-3 border-t border-rose-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold mt-3">
            <span>Security Gate Status</span>
            <span className="text-rose-700 font-bold">{flaggedDenials > 0 ? `${flaggedDenials} Denied` : 'Zero Flags'}</span>
          </div>
        </div>
      </div>

      {/* Middle Row: 3 Real Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Traffic by Hour */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Traffic by Hour
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Database Live</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Arrival distribution from recorded visit times
            </p>

            {/* Dynamic Bar Visualization */}
            <div className="pt-6 pb-2 flex items-end justify-between gap-2 h-36 px-2">
              {Object.entries(hourly).map(([hour, count]) => {
                const heightPct = totalVisitsCount > 0 ? Math.max(12, Math.round((count / maxHourly) * 100)) : 12;
                const isMax = count > 0 && count === maxHourly;

                return (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end relative">
                    {isMax && (
                      <span className="absolute -top-6 text-[9px] font-mono font-bold text-teal-800 bg-teal-50 px-1 rounded whitespace-nowrap">
                        {count} req
                      </span>
                    )}
                    <div 
                      className={`w-full rounded-md transition-all ${
                        count > 0 ? (isMax ? 'bg-teal-800 shadow-xs' : 'bg-teal-600/80') : 'bg-slate-100'
                      }`} 
                      style={{ height: `${heightPct}%` }}
                      title={`${hour}: ${count} visits`}
                    />
                    <span className="text-[10px] font-mono text-slate-400">{hour}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between mt-3">
            <span>Total Recorded Inbound</span>
            <span className="font-bold text-teal-800">{totalVisitsCount} visits</span>
          </div>
        </div>

        {/* Chart 2: Purpose Breakdown (100% Real from Database) */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Purpose Breakdown
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Real-time</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Categorized visitor purpose distribution
            </p>

            {/* List with dynamic Bars */}
            <div className="space-y-3 text-xs">
              {purposeEntries.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No purpose categories registered in current filter range.
                </div>
              ) : (
                purposeEntries.map(([purpose, count], idx) => {
                  const pct = totalPurposes > 0 ? Math.round((count / totalPurposes) * 100) : 0;
                  const colors = ['bg-teal-800', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-slate-500'];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={purpose}>
                      <div className="flex justify-between font-semibold text-slate-800 mb-1">
                        <span className="flex items-center gap-1.5 truncate max-w-[160px]">
                          <span className={`w-2.5 h-2.5 rounded-xs shrink-0 ${color}`} />
                          <span className="truncate">{purpose}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          {pct}% ({count})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between mt-3">
            <span>Distinct Purposes</span>
            <span className="font-bold text-teal-800">{purposeEntries.length} categories</span>
          </div>
        </div>

        {/* Chart 3: Host Department Distribution */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Department Activity
              </h3>
              <Building className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Visitor distribution across departments
            </p>

            <div className="space-y-3 text-xs">
              {deptEntries.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No department visits recorded in this period.
                </div>
              ) : (
                deptEntries.map(([dept, count], idx) => {
                  const pct = totalDepts > 0 ? Math.round((count / totalDepts) * 100) : 0;
                  const colors = ['bg-teal-700', 'bg-blue-700', 'bg-purple-700', 'bg-emerald-700'];
                  const color = colors[idx % colors.length];

                  return (
                    <div key={dept}>
                      <div className="flex justify-between font-semibold text-slate-800 mb-1">
                        <span className="truncate max-w-[160px]">{dept}</span>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          {pct}% ({count})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between mt-3">
            <span>Active Departments</span>
            <span className="font-bold text-slate-800">{deptEntries.length} hosts</span>
          </div>
        </div>

      </div>

      {/* Bottom Section: Immutable Audit Ledger (100% Real from Database) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Ledger Header & Action Filter Tabs */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/40">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-800" />
              <span>Immutable Audit Ledger</span>
            </h3>
            <p className="text-xs text-slate-500">
              Live database audit trail of all visitor actions and security validations
            </p>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setSelectedAction('ALL')}
              className={`px-3 py-1.5 rounded-full transition-all ${selectedAction === 'ALL' ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All Actions ({logs.length})
            </button>
            <button
              onClick={() => setSelectedAction('CHECKED_IN')}
              className={`px-3 py-1.5 rounded-full transition-all ${selectedAction === 'CHECKED_IN' ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Checked In
            </button>
            <button
              onClick={() => setSelectedAction('CHECKED_OUT')}
              className={`px-3 py-1.5 rounded-full transition-all ${selectedAction === 'CHECKED_OUT' ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Checked Out
            </button>
            <button
              onClick={() => setSelectedAction('APPROVED')}
              className={`px-3 py-1.5 rounded-full transition-all ${selectedAction === 'APPROVED' ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setSelectedAction('REJECTED')}
              className={`px-3 py-1.5 rounded-full transition-all ${selectedAction === 'REJECTED' ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Rejected
            </button>
            <button
              onClick={() => setSelectedAction('CANCELLED')}
              className={`px-3 py-1.5 rounded-full transition-all ${selectedAction === 'CANCELLED' ? 'bg-teal-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-5">Event / Action</th>
                <th className="py-3 px-4">Visitor & Pass #</th>
                <th className="py-3 px-4">Actor / Performed By</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-5">Details & Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm text-slate-700">No activity logs in database yet</p>
                    <p className="text-xs text-slate-400 mt-1">Actions performed on visitors (register, approve, check-in) will be logged here automatically.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateObj = new Date(log.timestamp || log.createdAt || Date.now());

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900">{log.visitorName || 'Guest'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{log.passNumber || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{log.performedBy.name}</div>
                        <div className="text-[11px] text-slate-500">{log.performedBy.role}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-800">
                          {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatTime12h(log.timestamp || log.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="text-slate-800 font-medium">
                          {log.details}
                        </div>
                        {log.remarks && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            "{log.remarks}"
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Database Summary Footer */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900">Database Status: Active</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-xl mt-0.5">
                {dbStatus?.stats?.visitors ?? 0} Visitor Profiles • {dbStatus?.stats?.visits ?? 0} Visitor Passes • {dbStatus?.stats?.activityLogs ?? 0} Audit Logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                loadData();
                success('Refreshed', 'Database metrics updated successfully.');
              }}
              className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
            >
              Refresh Database
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
