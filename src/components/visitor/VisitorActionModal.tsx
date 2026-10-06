import React, { useState } from 'react';
import { VisitorRequest } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { formatTime12h } from '../../utils/formatters.ts';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  LogIn, 
  LogOut, 
  Ban, 
  AlertTriangle,
  Clock,
  ShieldCheck,
  User,
  Building
} from 'lucide-react';

export type ActionType = 'APPROVE' | 'REJECT' | 'CHECK_IN' | 'CHECK_OUT' | 'CANCEL';

interface VisitorActionModalProps {
  visitor: VisitorRequest | null;
  actionType: ActionType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedVisitor: VisitorRequest) => void;
}

export const VisitorActionModal: React.FC<VisitorActionModalProps> = ({
  visitor,
  actionType,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { success, error, warning } = useToast();
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideTime, setOverrideTime] = useState(false);
  const [customTime, setCustomTime] = useState('');

  if (!isOpen || !visitor || !actionType) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (actionType === 'REJECT' && (!remarks || remarks.trim().length === 0)) {
      warning('Remarks Required', 'Please specify the rejection reason for this request.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      let customTimestamp: string | undefined = undefined;
      if (overrideTime && customTime) {
        // Construct full ISO
        const [hh, mm] = customTime.split(':');
        const dt = new Date();
        dt.setHours(Number(hh), Number(mm), 0, 0);
        customTimestamp = dt.toISOString();
      }

      // Validation: Chronological Check-Out Order (check-out must be strictly later than check-in)
      if (actionType === 'CHECK_OUT' && visitor.checkInTime) {
        const checkInMs = new Date(visitor.checkInTime).getTime();
        const checkOutMs = customTimestamp ? new Date(customTimestamp).getTime() : Date.now();

        if (checkOutMs <= checkInMs) {
          warning('Invalid Check-Out Time', 'Check-out time must always be strictly later than check-in time.');
          return;
        }
      }

      const res = await api.updateVisitorStatus(visitor.id, actionType, remarks, customTimestamp);
      if (res.success) {
        success('Status Updated', res.message);
        onSuccess(res.visitor);
        onClose();
        setRemarks('');
      }
    } catch (err: any) {
      error(
        'Action Failed',
        err.message || 'Could not update visitor status'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionConfig = () => {
    switch (actionType) {
      case 'APPROVE':
        return {
          title: 'Approve Visitor Request',
          description: `Authorize visit pass for ${visitor.visitorName} to meet ${visitor.employeeName}.`,
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          buttonLabel: 'Approve Request',
          remarksPlaceholder: 'Optional remarks, conference room assignment, escort requirements...'
        };
      case 'REJECT':
        return {
          title: 'Reject Visitor Request',
          description: `Decline visit pass request for ${visitor.visitorName}.`,
          icon: <XCircle className="w-5 h-5 text-rose-600" />,
          buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white',
          buttonLabel: 'Reject Request',
          remarksPlaceholder: 'Required reason for rejection (e.g., reschedule requested, missing credentials)...'
        };
      case 'CHECK_IN':
        return {
          title: 'Check In Visitor',
          description: `Verify credentials and issue physical/digital pass for ${visitor.visitorName}.`,
          icon: <LogIn className="w-5 h-5 text-blue-600" />,
          buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
          buttonLabel: 'Confirm Check-In',
          remarksPlaceholder: 'Optional badge issue notes, temporary access card number...'
        };
      case 'CHECK_OUT':
        return {
          title: 'Check Out Visitor',
          description: `Confirm badge return and log departure for ${visitor.visitorName}.`,
          icon: <LogOut className="w-5 h-5 text-slate-800" />,
          buttonBg: 'bg-slate-900 hover:bg-slate-800 text-white',
          buttonLabel: 'Confirm Check-Out',
          remarksPlaceholder: 'Optional checkout notes, escort sign-off...'
        };
      case 'CANCEL':
        return {
          title: 'Cancel Visit Pass',
          description: `Cancel scheduled pass ${visitor.passNumber} for ${visitor.visitorName}.`,
          icon: <Ban className="w-5 h-5 text-slate-600" />,
          buttonBg: 'bg-slate-700 hover:bg-slate-800 text-white',
          buttonLabel: 'Confirm Cancellation',
          remarksPlaceholder: 'Reason for cancellation...'
        };
    }
  };

  const config = getActionConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-xs">
              {config.icon}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">{config.title}</h2>
              <p className="text-xs text-slate-500 font-mono">Pass: {visitor.passNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Visitor Summary */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {config.description}
          </p>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Visitor:</span>
              <span className="font-bold text-slate-900">{visitor.visitorName} ({visitor.visitorCompany || 'Direct Guest'})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Host:</span>
              <span className="font-semibold text-slate-800">{visitor.employeeName} ({visitor.employeeDepartment})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Scheduled Date:</span>
              <span className="font-mono text-slate-700">{visitor.visitDate} at {formatTime12h(visitor.expectedArrivalTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Current Status:</span>
              <span className="font-bold uppercase text-blue-700">{visitor.status}</span>
            </div>
          </div>

          {/* Rule Note Box for specific actions */}
          {actionType === 'CHECK_IN' && visitor.status !== 'APPROVED' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Approval Check:</strong> Visitors can only be checked in after host approval. If this visit is still pending or rejected, the system will prevent check-in.
              </div>
            </div>
          )}

          {actionType === 'CHECK_OUT' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Rule 8 Check:</strong> Checked in at {visitor.checkInTime ? new Date(visitor.checkInTime).toLocaleTimeString() : 'N/A'}. Checkout timestamp will be strictly validated to be later than check-in time.
              </div>
            </div>
          )}

          {/* Remarks Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks / Comments {actionType === 'REJECT' && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              rows={3}
              required={actionType === 'REJECT'}
              placeholder={config.remarksPlaceholder}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2 ${config.buttonBg}`}
            >
              {isSubmitting ? 'Processing...' : config.buttonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
