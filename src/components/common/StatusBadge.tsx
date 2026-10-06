import React from 'react';
import { VisitStatus } from '../../types/index.ts';
import { Clock, CheckCircle2, XCircle, LogIn, LogOut, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: VisitStatus;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          {showIcon && <Clock className="w-3.5 h-3.5" />}
          <span>Pending Approval</span>
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
          {showIcon && <CheckCircle2 className="w-3.5 h-3.5" />}
          <span>Approved / Scheduled</span>
        </span>
      );
    case 'CHECKED_IN':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          {showIcon && <LogIn className="w-3.5 h-3.5" />}
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Checked In (Inside)</span>
        </span>
      );
    case 'CHECKED_OUT':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          {showIcon && <LogOut className="w-3.5 h-3.5" />}
          <span>Checked Out</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
          {showIcon && <XCircle className="w-3.5 h-3.5" />}
          <span>Rejected</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 line-through">
          {showIcon && <Ban className="w-3.5 h-3.5" />}
          <span>Cancelled</span>
        </span>
      );
    default:
      return <span className="text-xs font-medium text-slate-600">{status}</span>;
  }
};
