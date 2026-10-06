import React, { useState, useEffect } from 'react';
import { ReportSummary } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  BarChart3, 
  Calendar, 
  FileSpreadsheet, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Users,
  Building,
  Briefcase
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'today' | 'this_week' | 'this_month' | 'custom'>('this_week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const res = await api.getReports(period, startDate, endDate);
      setReport(res);
    } catch (err) {
      console.error('Failed to load report data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [period, startDate, endDate]);

  const handleExportSummaryCSV = () => {
    if (!report) return;
    const lines = [
      'PASSGUARD VISITOR REPORT SUMMARY',
      `Period: ${period} (${report.dateRange.start} to ${report.dateRange.end})`,
      `Total Visits: ${report.totalVisits}`,
      `Completed Visits: ${report.completedVisits}`,
      `Approval Rate: ${report.approvedRate}%`,
      `Avg Duration: ${report.averageVisitDurationMinutes} mins`,
      '',
      '--- VISITS BY STATUS ---',
      ...Object.entries(report.byStatus).map(([st, count]) => `${st},${count}`),
      '',
      '--- VISITS BY PURPOSE ---',
      ...Object.entries(report.byPurpose).map(([pur, count]) => `"${pur}",${count}`),
      '',
      '--- VISITS BY DEPARTMENT ---',
      ...Object.entries(report.byDepartment).map(([dep, count]) => `"${dep}",${count}`)
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visitor-report-${period}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Visitor Intelligence & Reports
          </h1>
          <p className="text-xs text-slate-500">
            Analytics on visitor volume, approval throughput, duration, and departmental traffic
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportSummaryCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Report Data</span>
          </button>
        </div>
      </div>

      {/* Period Filter Selector */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              period === 'today' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('this_week')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              period === 'this_week' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('this_month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              period === 'this_month' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              period === 'custom' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Range
          </button>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        )}

        <div className="text-xs text-slate-500 font-mono">
          Coverage: {report?.dateRange.start} → {report?.dateRange.end}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Visits Logged</span>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {report?.totalVisits ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">In selected timeframe</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Approval Rate</span>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
            {report?.approvedRate ?? 0}%
          </div>
          <span className="text-[11px] text-slate-500">Host authorized visits</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Completed Visits</span>
          <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums mt-1">
            {report?.completedVisits ?? 0}
          </div>
          <span className="text-[11px] text-slate-500">Checked in and checked out</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Average Duration</span>
          <div className="text-2xl font-bold text-purple-600 font-mono tabular-nums mt-1">
            {report?.averageVisitDurationMinutes ?? 0} min
          </div>
          <span className="text-[11px] text-slate-500">Average time spent on site</span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Purpose Breakdown */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-blue-600" />
            <span>Visits by Purpose</span>
          </h3>

          {!report || Object.keys(report.byPurpose).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No purpose data in selected period.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(report.byPurpose).map(([purp, count]) => {
                const pct = report.totalVisits > 0 ? Math.round((count / report.totalVisits) * 100) : 0;
                return (
                  <div key={purp} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{purp}</span>
                      <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Department Breakdown */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Building className="w-4 h-4 text-purple-600" />
            <span>Visits by Host Department</span>
          </h3>

          {!report || Object.keys(report.byDepartment).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No department data in selected period.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(report.byDepartment).map(([dept, count]) => {
                const pct = report.totalVisits > 0 ? Math.round((count / report.totalVisits) * 100) : 0;
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{dept}</span>
                      <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown Bar */}
      {report && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Status Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(report.byStatus).map(([st, cnt]) => (
              <div key={st} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{st}</span>
                <span className="text-lg font-bold font-mono text-slate-900">{cnt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
