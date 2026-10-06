import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { VisitorRequest } from '../types/index.ts';
import { api } from '../services/api.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { 
  CheckSquare, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Building, 
  Calendar, 
  FileText,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface ApprovalsPageProps {
  onOpenBadge: (visitor: VisitorRequest) => void;
  onOpenAction: (visitor: VisitorRequest, action: any) => void;
  onOpenDetails: (visitor: VisitorRequest) => void;
}

export const ApprovalsPage: React.FC<ApprovalsPageProps> = ({
  onOpenBadge,
  onOpenAction,
  onOpenDetails
}) => {
  const { user, isEmployee, isAdmin } = useAuth();
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const res = await api.getVisitors({
        status: 'PENDING',
        employeeId: isEmployee ? user?.employeeId : undefined
      });
      setRequests(res.visitors);
    } catch (err) {
      console.error('Failed to load pending requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user, isEmployee]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Visitor Approval Inbox
          </h1>
          <p className="text-xs text-slate-500">
            {isEmployee 
              ? 'Review, approve, or reject visitor requests requesting to meet you' 
              : 'Administrative review of all pending visitor pass requests across departments'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-mono">
            {requests.length} Pending {requests.length === 1 ? 'Request' : 'Requests'}
          </span>
        </div>
      </div>

      {/* Capacity Guidance Callout */}
      {isEmployee && (
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
          <CheckSquare className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">Rule 5 Enforcement:</span> You currently have <strong>{requests.length} of 3</strong> maximum allowed pending requests awaiting review. Please promptly approve or reject requests so new visitors can schedule appointments with you.
          </div>
        </div>
      )}

      {/* Requests List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading pending requests...</div>
      ) : requests.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">All Caught Up!</p>
          <p className="text-xs text-slate-500 mt-1">There are no pending visitor requests awaiting your decision.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((v) => (
            <div
              key={v.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              {/* Left Details */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {v.visitorName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{v.visitorName}</h3>
                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                      {v.passNumber}
                    </span>
                  </div>
                  <p className="text-xs text-blue-700 font-medium">{v.visitorCompany || 'Independent Guest'} · {v.visitorEmail}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.visitDate}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.expectedArrivalTime} {v.expectedDepartureTime ? `- ${v.expectedDepartureTime}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Host: {v.employeeName} ({v.employeeDepartment})</span>
                    </div>
                    <div className="font-medium text-slate-800">
                      Purpose: {v.purpose}
                    </div>
                  </div>

                  {v.notes && (
                    <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{v.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                <button
                  onClick={() => onOpenDetails(v)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1" />
                  <span>Details</span>
                </button>
                <button
                  onClick={() => onOpenAction(v, 'REJECT')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5 inline mr-1" />
                  <span>Reject Request</span>
                </button>
                <button
                  onClick={() => onOpenAction(v, 'APPROVE')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                  <span>Approve Visit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
