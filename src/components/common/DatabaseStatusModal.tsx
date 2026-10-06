import React, { useState, useEffect } from 'react';
import { X, Database, RefreshCw, Copy, Check, Trash2, Globe } from 'lucide-react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { ConfirmModal } from './ConfirmModal.tsx';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const { success, error } = useToast();
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirmPurge, setShowConfirmPurge] = useState(false);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/database/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (e) {
      console.error('Failed to fetch DB status', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyEnvSample = () => {
    if (dbStatus?.connectionUri) {
      navigator.clipboard.writeText(dbStatus.connectionUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmPurge = async () => {
    try {
      setIsPurging(true);
      const res = await api.purgeAll();
      if (res.success) {
        success('Database Cleared', 'All visitor records and logs removed. The database is now clean.');
        setShowConfirmPurge(false);
        fetchStatus();
      }
    } catch (err: any) {
      error('Failed to clear database', err.message);
    } finally {
      setIsPurging(false);
    }
  };

  const isAtlasActive = dbStatus?.isConnectedToRealMongo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mx-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-800 flex items-center justify-center text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Database Connection Status</h2>
              <p className="text-xs text-slate-500">System Storage Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto">
          
          {/* Connection State Banner */}
          <div className={`p-4 rounded-2xl border flex items-start justify-between ${
            isAtlasActive 
              ? 'bg-emerald-50/80 border-emerald-200' 
              : 'bg-emerald-50/80 border-emerald-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-1 shrink-0 bg-emerald-500 animate-pulse" />
              <div>
                <div className="font-bold text-sm text-emerald-950">
                  Database Online & Operational
                </div>
                <p className="text-xs mt-0.5 text-emerald-800">
                  {dbStatus?.mode || 'Active persistence layer operational.'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchStatus}
              className="p-1.5 text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0"
              title="Refresh connection status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Collection Counts Grid */}
          <div>
            <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2">
              Live Collection Counters:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Users</span>
                <span className="text-base font-bold font-mono text-slate-900">{dbStatus?.stats?.users ?? 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Employees</span>
                <span className="text-base font-bold font-mono text-slate-900">{dbStatus?.stats?.employees ?? 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Visitors</span>
                <span className="text-base font-bold font-mono text-slate-900">{dbStatus?.stats?.visitors ?? 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Visits</span>
                <span className="text-base font-bold font-mono text-slate-900">{dbStatus?.stats?.visits ?? 0}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Activity Logs</span>
                <span className="text-base font-bold font-mono text-slate-900">{dbStatus?.stats?.activityLogs ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Action to purge/reset */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800 block">Purge Visitor Data</span>
              <span className="text-[11px] text-slate-500">Clear all visits, visitors, and logs to start fresh</span>
            </div>
            <button
              onClick={() => setShowConfirmPurge(true)}
              className="btn-danger px-3 py-1.5 text-xs font-bold rounded-xl shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="btn-dark px-5 py-2 text-xs font-bold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmPurge}
        title="Purge All Visitor Data"
        message="Are you sure you want to clear all visitor records, visits, and activity logs from the database?"
        confirmLabel="Purge Database"
        isSubmitting={isPurging}
        onConfirm={handleConfirmPurge}
        onCancel={() => setShowConfirmPurge(false)}
      />
    </div>
  );
};
