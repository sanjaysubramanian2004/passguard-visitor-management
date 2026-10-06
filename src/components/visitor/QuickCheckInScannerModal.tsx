import React, { useState } from 'react';
import { VisitorRequest } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { formatTime12h } from '../../utils/formatters.ts';
import { X, QrCode, Search, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface QuickCheckInScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickCheckInScannerModal: React.FC<QuickCheckInScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { success, error } = useToast();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedVisitor, setMatchedVisitor] = useState<VisitorRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setMatchedVisitor(null);
      const res = await api.getVisitors({ search: query.trim() });
      if (res.visitors.length > 0) {
        setMatchedVisitor(res.visitors[0]);
      } else {
        error('Not Found', `No visitor pass matched query '${query}'`);
      }
    } catch (err: any) {
      error('Search Failed', err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickAction = async (action: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!matchedVisitor) return;
    try {
      setIsProcessing(true);
      const res = await api.updateVisitorStatus(matchedVisitor.id, action);
      if (res.success) {
        success('Success', res.message);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      error('Action Failed', err.message || 'Unable to update visitor status');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">Quick Pass Scanner & Check-In</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4 sm:p-6 space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Enter Pass #, Phone, or Visitor Name:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="e.g. VP-2026-0893 or 555-912-3401"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
              >
                {isSearching ? 'Searching...' : 'Lookup'}
              </button>
            </div>
          </form>

          {/* Result Card */}
          {matchedVisitor && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{matchedVisitor.visitorName}</h4>
                  <p className="text-xs text-slate-500">{matchedVisitor.visitorCompany || 'Independent'}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-900">{matchedVisitor.passNumber}</span>
                  <div className="mt-0.5">
                    <StatusBadge status={matchedVisitor.status} />
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200/60">
                <div className="flex justify-between">
                  <span>Host:</span>
                  <span className="font-semibold text-slate-800">{matchedVisitor.employeeName} ({matchedVisitor.employeeDepartment})</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span className="font-mono text-slate-700">{matchedVisitor.visitDate} @ {formatTime12h(matchedVisitor.expectedArrivalTime)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                {matchedVisitor.status === 'APPROVED' && (
                  <button
                    onClick={() => handleQuickAction('CHECK_IN')}
                    disabled={isProcessing}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Check In Now</span>
                  </button>
                )}

                {matchedVisitor.status === 'CHECKED_IN' && (
                  <button
                    onClick={() => handleQuickAction('CHECK_OUT')}
                    disabled={isProcessing}
                    className="flex-1 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check Out Now</span>
                  </button>
                )}

                {matchedVisitor.status === 'PENDING' && (
                  <div className="w-full text-center text-xs text-amber-700 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Awaiting host employee approval before check-in.
                  </div>
                )}

                {matchedVisitor.status === 'CHECKED_OUT' && (
                  <div className="w-full text-center text-xs text-slate-500 bg-slate-100 p-2 rounded-lg">
                    Visit already completed and checked out.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
