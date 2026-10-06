import React, { useState, useEffect } from 'react';
import { VisitorRequest } from '../types/index.ts';
import { api } from '../services/api.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { formatTime12h } from '../utils/formatters.ts';
import { 
  LogIn, 
  LogOut, 
  Printer, 
  ShieldAlert, 
  Clock, 
  Building, 
  Phone, 
  RefreshCw,
  FileDown
} from 'lucide-react';

interface CurrentlyInsidePageProps {
  onOpenBadge: (visitor: VisitorRequest) => void;
  onOpenAction: (visitor: VisitorRequest, action: any) => void;
  onOpenDetails: (visitor: VisitorRequest) => void;
}

export const CurrentlyInsidePage: React.FC<CurrentlyInsidePageProps> = ({
  onOpenBadge,
  onOpenAction,
  onOpenDetails
}) => {
  const [insideVisitors, setInsideVisitors] = useState<VisitorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadInsideVisitors = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await api.getVisitors({ status: 'CHECKED_IN' });
      setInsideVisitors(res.visitors);
    } catch (err) {
      console.error('Failed to load active inside visitors', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInsideVisitors(false);
    const interval = setInterval(() => loadInsideVisitors(true), 5000);
    const handleFocus = () => loadInsideVisitors(true);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleExportEvacuationRoster = () => {
    if (insideVisitors.length === 0) return;
    const lines = [
      'PASSGUARD EMERGENCY EVACUATION ROSTER',
      `Generated at: ${new Date().toLocaleString()}`,
      `Total Persons Inside: ${insideVisitors.length}`,
      '------------------------------------------------------------',
      'Pass # | Visitor Name | Phone | Host Employee | Department | Check-In Time',
      '------------------------------------------------------------',
      ...insideVisitors.map(v => 
        `${v.passNumber} | ${v.visitorName} | ${v.visitorPhone} | ${v.employeeName} | ${v.employeeDepartment} | ${v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString() : 'N/A'}`
      )
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `emergency-evacuation-roster-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold uppercase text-emerald-700 tracking-wider">
              Live Occupancy Monitor
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Visitors Currently Inside Premises
          </h1>
          <p className="text-xs text-slate-500">
            Real-time tracking of all verified guests present in the building
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadInsideVisitors(false)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refresh headcount"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleExportEvacuationRoster}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Emergency Evacuation Roster</span>
          </button>
        </div>
      </div>

      {/* Headcount Stat Pill */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xl border border-emerald-200">
            {insideVisitors.length}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Total Active Visitors On Site</h3>
            <p className="text-xs text-slate-500">Real-time check-in and checkout tracking active</p>
          </div>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Last checked: {new Date().toLocaleTimeString()}
        </span>
      </div>

      {/* Grid of Inside Visitors */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading inside roster...</div>
      ) : insideVisitors.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
          <p className="text-sm font-semibold text-slate-700">No visitors currently on premises</p>
          <p className="text-xs text-slate-400 mt-1">All registered visitors have checked out or are yet to arrive.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insideVisitors.map((v) => {
            const checkInDate = v.checkInTime ? new Date(v.checkInTime) : new Date();
            const elapsedMinutes = Math.max(1, Math.round((Date.now() - checkInDate.getTime()) / (1000 * 60)));

            return (
              <div
                key={v.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {v.passNumber}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {elapsedMinutes} mins on site
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {v.visitorName}
                  </h3>
                  <p className="text-xs font-semibold text-blue-700 truncate">
                    {v.visitorCompany || 'Independent'}
                  </p>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Host:</span>
                      <span className="font-semibold text-slate-800">{v.employeeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span>{v.employeeDepartment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Checked In:</span>
                      <span className="font-mono font-medium text-slate-800">
                        {formatTime12h(v.checkInTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Purpose:</span>
                      <span className="truncate max-w-[140px]">{v.purpose}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onOpenBadge(v)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                    title="Print Visitor Pass"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onOpenDetails(v)}
                    className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => onOpenAction(v, 'CHECK_OUT')}
                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                  >
                    Check Out
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
