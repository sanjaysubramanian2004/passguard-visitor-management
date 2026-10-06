import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { DashboardMetrics, VisitorRequest, Employee } from '../types/index.ts';
import { api } from '../services/api.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { 
  Users, 
  LogIn, 
  Clock, 
  CheckCircle2, 
  Building2, 
  AlertCircle, 
  UserPlus, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: any) => void;
  onOpenRegister: () => void;
  onOpenBadge: (visitor: VisitorRequest) => void;
  onOpenAction: (visitor: VisitorRequest, action: any) => void;
  onOpenDetails: (visitor: VisitorRequest) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenRegister,
  onOpenBadge,
  onOpenAction,
  onOpenDetails
}) => {
  const { user, role, isAdmin, isReceptionist, isEmployee } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentVisitors, setRecentVisitors] = useState<VisitorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const empId = isEmployee ? user?.employeeId : undefined;
      const [mRes, vRes] = await Promise.all([
        api.getMetrics(empId),
        api.getVisitors(isEmployee ? { employeeId: empId } : undefined)
      ]);
      setMetrics(mRes);
      setRecentVisitors(vRes.visitors.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isEmployee]);

  const pendingRequests = recentVisitors.filter(v => v.status === 'PENDING');
  const checkedInVisitors = recentVisitors.filter(v => v.status === 'CHECKED_IN');
  const approvedReady = recentVisitors.filter(v => v.status === 'APPROVED');

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950 px-2 py-0.5 rounded">
              {role} Workspace
            </span>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            {isAdmin && 'System overview & compliance monitoring. Manage visitor throughput, employee hosts, and activity history.'}
            {isReceptionist && 'Front desk visitor processing hub. Register new visitors, verify appointments, and issue QR access passes.'}
            {isEmployee && `Host portal for ${user?.department || 'your department'}. Review visitor pass requests and manage scheduled guests.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {(isReceptionist || isAdmin) && (
            <button
              onClick={onOpenRegister}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Visitor</span>
            </button>
          )}

          {isEmployee && (
            <button
              onClick={() => onNavigate('approvals')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-xs"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending Requests ({metrics?.myPendingRequests || 0})</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isEmployee ? 'My Pending' : "Pending Approvals"}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {isEmployee ? (metrics?.myPendingRequests ?? 0) : (metrics?.pendingRequests ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isEmployee ? 'Awaiting your review (Max 3)' : 'Awaiting host employee approval'}
          </p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Currently Inside
            </span>
            <LogIn className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics?.visitorsCurrentlyInside ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Active on-premises occupancy
          </p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Visitors
            </span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics?.totalVisitorsToday ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Scheduled & walk-in visits today
          </p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isAdmin ? 'Active Employees' : 'Completed Today'}
            </span>
            {isAdmin ? <Building2 className="w-4 h-4 text-purple-500" /> : <CheckCircle2 className="w-4 h-4 text-slate-600" />}
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {isAdmin ? (metrics?.totalEmployees ?? 0) : (metrics?.checkedOutToday ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAdmin ? 'Registered host accounts' : 'Successfully checked out'}
          </p>
        </div>
      </div>

      {/* Role-Tailored Action Queue */}
      {isEmployee && (
        <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-amber-950">
                Awaiting Your Approval ({pendingRequests.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('approvals')}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span>View Full Approval Queue</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingRequests.length === 0 ? (
            <p className="text-xs text-amber-800">
              You have no pending visitor requests awaiting approval at this time.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingRequests.map(v => (
                <div key={v.id} className="p-4 bg-white rounded-xl border border-amber-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{v.visitorName}</h4>
                      <span className="font-mono text-[11px] text-slate-500">{v.passNumber}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{v.visitorCompany || 'Direct Guest'} · {v.purpose}</p>
                    <p className="text-[11px] font-mono text-slate-700 mt-1">
                      Date: {v.visitDate} @ {v.expectedArrivalTime}
                    </p>
                    {v.notes && <p className="text-[11px] text-slate-600 italic mt-1">"{v.notes}"</p>}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onOpenAction(v, 'APPROVE')}
                      className="flex-1 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onOpenAction(v, 'REJECT')}
                      className="flex-1 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Front Desk Live Action Section for Receptionist */}
      {isReceptionist && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Approved Visitors Ready for Check-In */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Approved & Scheduled for Check-In ({approvedReady.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Pre-Approved</span>
            </div>

            {approvedReady.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No approved visits pending check-in.</p>
            ) : (
              <div className="space-y-2.5">
                {approvedReady.map(v => (
                  <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{v.visitorName}</div>
                      <div className="text-[11px] text-slate-500">
                        Host: {v.employeeName} ({v.employeeDepartment}) · {v.expectedArrivalTime}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenBadge(v)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg"
                      >
                        Badge
                      </button>
                      <button
                        onClick={() => onOpenAction(v, 'CHECK_IN')}
                        className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                      >
                        Check In
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Currently Checked In Visitors */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Currently On Premises ({checkedInVisitors.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('currently_inside')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View Full Roster
              </button>
            </div>

            {checkedInVisitors.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No visitors currently inside building.</p>
            ) : (
              <div className="space-y-2.5">
                {checkedInVisitors.map(v => (
                  <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{v.visitorName}</div>
                      <div className="text-[11px] text-slate-500">
                        Host: {v.employeeName} · Inside since {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString() : 'N/A'}
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenAction(v, 'CHECK_OUT')}
                      className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                    >
                      Check Out
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Visitors Table (Universal) */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Visitor Activity</h3>
            <p className="text-xs text-slate-500">Latest visitor registrations, approvals, and arrivals</p>
          </div>
          <button
            onClick={() => onNavigate('visitors')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Pass #</th>
                <th className="py-2.5 px-3">Visitor Name</th>
                <th className="py-2.5 px-3">Host Employee</th>
                <th className="py-2.5 px-3">Purpose</th>
                <th className="py-2.5 px-3">Schedule</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentVisitors.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                    {v.passNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{v.visitorName}</div>
                    <div className="text-[11px] text-slate-500">{v.visitorCompany || 'Independent'}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-800">{v.employeeName}</div>
                    <div className="text-[11px] text-slate-500">{v.employeeDepartment}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{v.purpose}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">
                    {v.visitDate} @ {v.expectedArrivalTime}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onOpenDetails(v)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
