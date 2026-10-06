import React, { useState, useEffect } from 'react';
import { ActivityLog, ActivityAction } from '../types/index.ts';
import { api } from '../services/api.ts';
import { formatTime12h } from '../utils/formatters.ts';
import { exportToCSV } from '../utils/csv.ts';
import { 
  History, 
  Search, 
  CheckCircle2, 
  XCircle, 
  LogIn, 
  LogOut, 
  Ban, 
  UserPlus,
  FileSpreadsheet
} from 'lucide-react';

const ACTION_FILTERS: Array<{ id: ActivityAction | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All Actions' },
  { id: 'CREATED', label: 'Created' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'CHECKED_IN', label: 'Checked In' },
  { id: 'CHECKED_OUT', label: 'Checked Out' },
  { id: 'CANCELLED', label: 'Cancelled' }
];

export const ActivityHistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<ActivityAction | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.getActivityLogs({
        action: selectedAction,
        search: searchQuery || undefined,
        date: selectedDate || undefined
      });
      setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedAction, searchQuery, selectedDate]);

  const getActionIcon = (action: ActivityAction) => {
    switch (action) {
      case 'CREATED':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'CHECKED_IN':
        return <LogIn className="w-4 h-4 text-emerald-600" />;
      case 'CHECKED_OUT':
        return <LogOut className="w-4 h-4 text-slate-700" />;
      case 'CANCELLED':
        return <Ban className="w-4 h-4 text-slate-500" />;
      default:
        return <History className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Pass Number', 'Visitor Name', 'Action', 'Performed By Name', 'Performed By Role', 'Details', 'Remarks'];
    const rows = logs.map(l => [
      l.timestamp || l.createdAt || '',
      l.passNumber || 'N/A',
      l.visitorName || 'Guest',
      l.action || '',
      l.performedBy?.name || 'System',
      l.performedBy?.role || 'SYSTEM',
      l.details || '',
      l.remarks || ''
    ]);
    exportToCSV(`passguard-audit-trail-${Date.now()}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Activity History & Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Immutable log of all visitor creation, host approvals, check-ins, check-outs, and security actions
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Action Tabs Filter */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {ACTION_FILTERS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedAction(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedAction === tab.id
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Date Input */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action logs by pass #, visitor, or actor name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {Boolean(searchQuery || selectedDate || selectedAction !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDate('');
              setSelectedAction('ALL');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Audit Log Entries List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading audit log entries...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No activity history records found matching criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const dateObj = new Date(log.timestamp || log.createdAt || Date.now());

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                      {getActionIcon(log.action)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{log.action}</span>
                        {log.passNumber && (
                          <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {log.passNumber}
                          </span>
                        )}
                        {log.visitorName && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="font-medium text-slate-800">{log.visitorName}</span>
                          </>
                        )}
                      </div>

                      <p className="text-slate-700 mt-1 leading-relaxed">
                        {log.details}
                      </p>

                      {log.remarks && (
                        <p className="text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px]">
                          Remark: "{log.remarks}"
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                        <span className="font-medium text-slate-600">Performed by: {log.performedBy.name}</span>
                        <span>({log.performedBy.role})</span>
                        {log.performedBy.email && (
                          <>
                            <span>·</span>
                            <span>{log.performedBy.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-semibold text-slate-700">
                      {formatTime12h(log.timestamp || log.createdAt)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {dateObj.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
