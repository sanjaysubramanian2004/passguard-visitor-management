import React, { useState, useEffect } from 'react';
import { PopulatedVisit, ActivityLog } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { formatTime12h, formatTimeRange12h } from '../../utils/formatters.ts';
import { 
  X, 
  Printer, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Phone, 
  Mail, 
  History,
  Eye
} from 'lucide-react';

interface VisitorDetailsModalProps {
  visitor: PopulatedVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBadge: (visitor: PopulatedVisit) => void;
  onOpenAction: (visitor: PopulatedVisit, action: any) => void;
}

export const VisitorDetailsModal: React.FC<VisitorDetailsModalProps> = ({
  visitor,
  isOpen,
  onClose,
  onOpenBadge,
  onOpenAction
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    if (isOpen && visitor) {
      loadActivity();
    }
  }, [isOpen, visitor]);

  const loadActivity = async () => {
    if (!visitor) return;
    try {
      setIsLoadingActivity(true);
      const res = await api.getActivityLogs({ visitId: visitor.id });
      setActivities(res.logs);
    } catch (e) {
      console.error('Failed to load visit activity logs', e);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  if (!isOpen || !visitor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              {visitor.visitorName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">{visitor.visitorName}</h2>
                <span className="font-mono text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  {visitor.passNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">{visitor.visitorCompany || 'Independent Guest'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenBadge(visitor)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Pass Badge</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Current Status Bar */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Visit Status</span>
              <div className="mt-1">
                <StatusBadge status={visitor.status} />
              </div>
            </div>
            {visitor.checkInTime && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checked In</span>
                <span className="text-xs font-mono font-semibold text-emerald-700">
                  {formatTime12h(visitor.checkInTime)}
                </span>
              </div>
            )}
            {visitor.checkOutTime && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checked Out</span>
                <span className="text-xs font-mono font-semibold text-slate-700">
                  {formatTime12h(visitor.checkOutTime)}
                </span>
              </div>
            )}
          </div>

          {/* Visitor (Visitor Document) & Visit Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Visitor Identity (Visitor Document)</span>
              </h3>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Visitor ID</span>
                <span className="text-slate-800 font-mono text-[11px]">{visitor.visitorId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                <span className="text-slate-800 font-medium">{visitor.visitorEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phone</span>
                <span className="text-slate-800 font-medium font-mono">{visitor.visitorPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">ID Document</span>
                <span className="text-slate-800 font-medium font-mono">
                  {visitor.visitorIdType || 'National ID'} ({visitor.visitorIdNumber || 'N/A'})
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Host & Schedule (Visit Document)</span>
              </h3>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Host Employee</span>
                <span className="text-slate-800 font-bold">{visitor.employeeName}</span>
                <span className="text-slate-500 block text-[11px]">{visitor.employeeDepartment}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Purpose</span>
                <span className="text-slate-800 font-medium">{visitor.purpose}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scheduled Date & Time</span>
                <span className="text-slate-800 font-medium font-mono">
                  {visitor.visitDate} ({formatTimeRange12h(visitor.expectedArrivalTime, visitor.expectedDepartureTime)})
                </span>
              </div>
            </div>
          </div>

          {/* Remarks & Notes */}
          {(visitor.remarks || visitor.approvalRemarks || visitor.rejectionReason) && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800">Visit Remarks & Notes</h4>
              {visitor.remarks && (
                <div>
                  <span className="text-slate-500 font-semibold">Agenda: </span>
                  <span className="text-slate-700">{visitor.remarks}</span>
                </div>
              )}
              {visitor.approvalRemarks && (
                <div>
                  <span className="text-emerald-700 font-semibold">Approval Remarks: </span>
                  <span className="text-slate-700">{visitor.approvalRemarks}</span>
                </div>
              )}
              {visitor.rejectionReason && (
                <div>
                  <span className="text-rose-700 font-semibold">Rejection Reason: </span>
                  <span className="text-slate-700">{visitor.rejectionReason}</span>
                </div>
              )}
            </div>
          )}

          {/* Activity Audit Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-3">
              <History className="w-4 h-4 text-blue-600" />
              <span>Activity History & Audit Trail</span>
            </h3>

            {isLoadingActivity ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading audit history...</div>
            ) : activities.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No activity logs recorded yet.</div>
            ) : (
              <div className="space-y-2.5">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{act.action}</span>
                        <span className="text-slate-500">by {act.performedBy.name} ({act.performedBy.role})</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{act.details}</p>
                      {act.remarks && (
                        <p className="text-slate-500 italic text-[11px] mt-0.5">"{act.remarks}"</p>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0 ml-3">
                      {formatTime12h(act.timestamp || act.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {visitor.status === 'PENDING' && (
              <>
                <button
                  onClick={() => onOpenAction(visitor, 'APPROVE')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  Approve
                </button>
                <button
                  onClick={() => onOpenAction(visitor, 'REJECT')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
                >
                  Reject
                </button>
              </>
            )}

            {visitor.status === 'APPROVED' && (
              <button
                onClick={() => onOpenAction(visitor, 'CHECK_IN')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                Check In Visitor
              </button>
            )}

            {visitor.status === 'CHECKED_IN' && (
              <button
                onClick={() => onOpenAction(visitor, 'CHECK_OUT')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                Check Out Visitor
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
