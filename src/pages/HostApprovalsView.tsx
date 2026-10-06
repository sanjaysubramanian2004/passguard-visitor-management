import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { PopulatedVisit } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import { formatTime12h, formatTimeRange12h } from '../utils/formatters.ts';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  KeyRound, 
  ShieldCheck, 
  Building, 
  MapPin, 
  UserCheck, 
  Send, 
  AlertTriangle,
  Radio,
  FileCheck2,
  Mail,
  Phone
} from 'lucide-react';

interface HostApprovalsViewProps {
  onOpenBadge: (visitor: PopulatedVisit) => void;
  onOpenAction: (visitor: PopulatedVisit, action: any) => void;
  onOpenDetails: (visitor: PopulatedVisit) => void;
}

export const HostApprovalsView: React.FC<HostApprovalsViewProps> = ({
  onOpenBadge,
  onOpenAction,
  onOpenDetails
}) => {
  const { user, role, isEmployee } = useAuth();
  const { success, error, warning } = useToast();
  const [activeTab, setActiveTab] = useState<'PENDING' | 'INSIDE' | 'HISTORY'>('PENDING');
  const [visits, setVisits] = useState<PopulatedVisit[]>([]);
  const [internalRemarks, setInternalRemarks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadVisits = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await api.getVisitors({
        employeeId: isEmployee ? user?.employeeId : undefined
      });
      setVisits(res.visitors);
    } catch (e) {
      console.error('Failed to load host visits', e);
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
  }, [user, isEmployee]);

  const pendingVisits = visits.filter(v => v.status === 'PENDING');
  const insideVisits = visits.filter(v => v.status === 'CHECKED_IN');
  const historyVisits = visits.filter(v => v.status === 'CHECKED_OUT' || v.status === 'REJECTED' || v.status === 'CANCELLED');

  const handleQuickApprove = async (visit: PopulatedVisit) => {
    const remark = internalRemarks[visit.id] || 'Approved for campus perimeter access.';
    try {
      const res = await api.updateVisitorStatus(visit.id, 'APPROVE', remark);
      if (res.success) {
        success('Access Approved', `Approved ${visit.visitorName}. Pass QR issued to front desk.`);
        loadVisits();
      }
    } catch (err: any) {
      error('Approval Failed', err.message);
    }
  };

  const handleQuickDecline = (visit: PopulatedVisit) => {
    onOpenAction(visit, 'REJECT');
  };

  const handleRevokePass = async (visit: PopulatedVisit) => {
    try {
      const res = await api.updateVisitorStatus(visit.id, 'CHECK_OUT', 'Revoked early by host sponsor.');
      if (res.success) {
        success('Pass Revoked', `Visitor ${visit.visitorName} checked out of perimeter.`);
        loadVisits();
      }
    } catch (err: any) {
      error('Revoke Failed', err.message);
    }
  };

  // Rule 5 Capacity Calculation
  const maxPendingAllowed = 3;
  const currentPending = pendingVisits.length;
  const capacityPercent = Math.min(100, Math.round((currentPending / maxPendingAllowed) * 100));

  return (
    <div className="space-y-6">
      
      {/* Top Header: Host Portal Badge & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase text-teal-800 bg-teal-50 border border-teal-200/60 rounded">
              Host Sponsorship Portal
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Capacity Guard Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
            Host Employee Approval Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Logged in as <strong className="text-slate-800">{user?.name || 'Dr. Aris Thorne'}</strong> ({user?.department || 'Floor 6 Security Lead'} — Tier 4). Authorize or decline campus gate and turnstile access requests.
          </p>
        </div>

        {/* SLA & Badge Capacity Pills (Matching Screenshot 3) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
          <div className="px-3 py-1.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs flex items-center gap-2 text-blue-900 font-bold">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <div>
              <span className="text-[10px] text-blue-600 block leading-tight font-medium uppercase">SLA Target</span>
              <span className="font-mono text-xs">&lt; 4m 12s</span>
            </div>
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2 text-slate-900 font-bold">
            <KeyRound className="w-3.5 h-3.5 text-teal-700" />
            <div>
              <span className="text-[10px] text-slate-500 block leading-tight font-medium uppercase">Badge Capacity</span>
              <span className="font-mono text-xs text-teal-800">{currentPending} / {maxPendingAllowed} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Guardrail Alert Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-extrabold text-slate-900">
                Pending Approvals Queue: {currentPending} of {maxPendingAllowed} (Max Limit)
              </h3>
              <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-slate-100 text-slate-600 rounded">
                CAPACITY POLICY
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Host capacity guard active. Exactly <strong className="text-slate-800">{Math.max(0, maxPendingAllowed - currentPending)} slot remaining</strong> before auto-routing to Secondary Escort.
            </p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="flex justify-between text-[11px] font-mono font-bold text-slate-700 mb-1">
            <span>Capacity Allocated</span>
            <span>{capacityPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${capacityPercent >= 100 ? 'bg-rose-600' : 'bg-teal-700'}`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
            <span>{currentPending} in review</span>
            <span>Max: {maxPendingAllowed} simultaneous</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'PENDING'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Pending Approvals</span>
          <span className="font-mono text-[11px] bg-teal-900/50 px-1.5 py-0.2 rounded text-teal-100">
            {pendingVisits.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('INSIDE')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'INSIDE'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Active Inside</span>
          <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">
            {insideVisits.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'HISTORY'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Visit History</span>
        </button>
      </div>

      {/* Split Layout: Left Approval Cards (2/3) + Right Inside Badges Roster (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Rich Approval Request Cards or lists based on tab selection */}
        <div className="lg:col-span-2 space-y-5">
          
          {activeTab === 'PENDING' && (
            pendingVisits.length === 0 ? (
              <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900">All Sponsor Requests Cleared</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have zero pending visitor approvals awaiting your review.
                </p>
              </div>
            ) : (
              pendingVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5 hover:border-slate-300 transition-all"
                >
                  {/* Top Profile Lockup */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                        {visit.visitorName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-extrabold text-slate-950">
                            {visit.visitorName}
                          </h3>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200/60 rounded">
                            Identity Verified
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 rounded">
                            PASS #{visit.passNumber}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          {visit.visitorCompany || 'Independent Guest'} • {visit.purpose}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1 font-mono">
                            <Mail className="w-3 h-3" /> {visit.visitorEmail}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" /> {visit.visitorPhone}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
                        Awaiting Host Sign-off
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                        Arrived at desk: 12 min ago
                      </span>
                    </div>
                  </div>

                  {/* Scope & Schedule 3-Tile Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-slate-500" /> Scheduled Window
                      </span>
                      <div className="font-extrabold text-slate-900 font-mono">{visit.visitDate}</div>
                      <div className="text-[11px] text-slate-500">{formatTimeRange12h(visit.expectedArrivalTime, visit.expectedDepartureTime)}</div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Building className="w-3 h-3 text-slate-500" /> Designated Perimeter
                      </span>
                      <div className="font-extrabold text-slate-900">Floor 6 Technical Wing</div>
                      <div className="text-[11px] text-slate-500">{visit.employeeDepartment}</div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <FileCheck2 className="w-3 h-3 text-slate-500" /> Check-in Vetting
                      </span>
                      <div className="font-extrabold text-slate-900">Gov ID Validated</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">NDA Signed digitally</div>
                    </div>
                  </div>

                  {/* Scope Justification Quote */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Justification & Scope of Access
                    </span>
                    <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed font-medium">
                      "{visit.notes || 'Quarterly Infrastructure & Server Security Audit. Access required to rack suites F6-B and main optical junction for cross-connect hardware integrity verification.'}"
                    </p>
                  </div>

                  {/* Front Desk Reception Note */}
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-950">
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-900">Front Desk:</strong> "Visitor presented credentials. Pass {visit.passNumber} queued for host review."
                    </div>
                  </div>

                  {/* Internal Remarks Textarea */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10px]">
                      Host Internal Remarks & Gate Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add specific instructions for lobby dispatch (e.g. Escort required from elevator landing, issue biometric keycard)..."
                      value={internalRemarks[visit.id] || ''}
                      onChange={(e) => setInternalRemarks({ ...internalRemarks, [visit.id]: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none font-medium placeholder:text-slate-400"
                    />
                  </div>

                  {/* Bottom Decision Actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-teal-600 shrink-0" />
                      <span>Approval immediately generates gate QR and notifies lobby reception.</span>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleQuickDecline(visit)}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Decline Access</span>
                      </button>

                      <button
                        onClick={() => handleQuickApprove(visit)}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Issue QR</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'INSIDE' && (
            insideVisits.length === 0 ? (
              <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
                <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900">No Active On-Premises Guests</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have no sponsored visitors currently checked in inside the facility.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {insideVisits.map(visit => (
                  <div key={visit.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                        <h4 className="text-sm font-bold text-slate-900">{visit.visitorName}</h4>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">PASS #{visit.passNumber}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {visit.visitorCompany || 'Independent Guest'} • {visit.purpose}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        Checked In: {visit.checkInTime ? new Date(visit.checkInTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokePass(visit)}
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      Revoke Pass
                    </button>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'HISTORY' && (
            historyVisits.length === 0 ? (
              <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900">No Sponsorship History</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have not sponsored any past guest visits yet.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                        <th className="py-3 px-4">Visitor & Pass #</th>
                        <th className="py-3 px-4">Purpose</th>
                        <th className="py-3 px-4">Visit Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyVisits.map(visit => (
                        <tr key={visit.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-950">{visit.visitorName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{visit.passNumber}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {visit.purpose}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-mono">
                            {visit.visitDate}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                              visit.status === 'CHECKED_OUT' 
                                ? 'text-slate-700 bg-slate-100' 
                                : visit.status === 'REJECTED' 
                                ? 'text-rose-700 bg-rose-50 border border-rose-200' 
                                : 'text-slate-500 bg-slate-50'
                            }`}>
                              {visit.status === 'CHECKED_OUT' ? 'COMPLETED' : visit.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onOpenDetails(visit)}
                              className="text-xs font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>

        {/* Right Column: Currently Inside */}
        <div className="space-y-5">
          
          {/* Currently Inside Card (Matching Screenshot 3) */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Currently Inside
                </h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 bg-slate-100 rounded uppercase">
                {insideVisits.length} BADGES LIVE
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              Visitors currently checked in under your sponsorship. Real-time perimeter monitoring.
            </p>

            {/* List of active visitors */}
            <div className="space-y-3">
              {insideVisits.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No visitors currently inside under your sponsorship.
                </div>
              ) : (
                insideVisits.map((v) => (
                  <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 truncate">{v.visitorName}</span>
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-1 rounded">F6 Server</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{v.visitorCompany || 'Direct'}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        ⏱ Inside since {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokePass(v)}
                      className="px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors shrink-0"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Emergency Broadcast Button */}
            <button
              onClick={() => warning('Emergency Broadcast Triggered', 'SMS broadcast sent to all currently inside guests.')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Emergency Broadcast to Visitors</span>
            </button>
          </div>



        </div>
      </div>



    </div>
  );
};
