import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { VisitorRequest, VisitStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';
import { formatTime12h } from '../utils/formatters.ts';
import { exportToCSV } from '../utils/csv.ts';
import { 
  Search, 
  UserPlus, 
  Printer, 
  Eye, 
  Calendar,
  Building,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';

interface VisitorsPageProps {
  onOpenRegister: () => void;
  onOpenBadge: (visitor: VisitorRequest) => void;
  onOpenAction: (visitor: VisitorRequest, action: any) => void;
  onOpenDetails: (visitor: VisitorRequest) => void;
}

const STATUS_TABS: Array<{ id: VisitStatus | 'ALL' | 'ACTIVE'; label: string }> = [
  { id: 'ALL', label: 'All Records' },
  { id: 'ACTIVE', label: 'Active Pipeline' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'CHECKED_IN', label: 'Checked In' },
  { id: 'CHECKED_OUT', label: 'Checked Out' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'CANCELLED', label: 'Cancelled' }
];

export const VisitorsPage: React.FC<VisitorsPageProps> = ({
  onOpenRegister,
  onOpenBadge,
  onOpenAction,
  onOpenDetails
}) => {
  const { user, isAdmin, isReceptionist, isEmployee } = useAuth();
  const { success, error } = useToast();
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visitToDelete, setVisitToDelete] = useState<VisitorRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<VisitStatus | 'ALL' | 'ACTIVE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');

  const loadVisitors = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await api.getVisitors({
        search: searchQuery,
        status: activeTab,
        date: selectedDate || undefined,
        department: selectedDepartment || undefined,
        purpose: selectedPurpose || undefined,
        employeeId: isEmployee ? user?.employeeId : undefined
      });
      setVisitors(res.visitors);
    } catch (err) {
      console.error('Failed to load visitors', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors(false);
    const interval = setInterval(() => loadVisitors(true), 5000);
    const handleFocus = () => loadVisitors(true);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTab, searchQuery, selectedDate, selectedDepartment, selectedPurpose, user]);

  const handleDeleteVisit = async () => {
    if (!visitToDelete) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteVisit(visitToDelete.id);
      if (res.success) {
        success('Pass Deleted', res.message);
        setVisitToDelete(null);
        loadVisitors();
      }
    } catch (err: any) {
      error('Failed to Delete Pass', err.message || 'Error deleting visit pass');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (visitors.length === 0) return;
    const headers = ['Pass Number', 'Visitor Name', 'Email', 'Phone', 'Company', 'Host Employee', 'Department', 'Purpose', 'Date', 'Arrival Time', 'Status'];
    const rows = visitors.map(v => [
      v.passNumber,
      v.visitorName,
      v.visitorEmail,
      v.visitorPhone,
      v.visitorCompany || 'Direct',
      v.employeeName,
      v.employeeDepartment,
      v.purpose,
      v.visitDate,
      formatTime12h(v.expectedArrivalTime),
      v.status
    ]);
    exportToCSV(`passguard-visitors-${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    success('Visitor Directory Exported', `Downloaded ${visitors.length} visitor pass records.`);
  };

  return (
    <div className="space-y-5">
      
      {/* Page Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {isEmployee ? 'My Visitor History & Requests' : 'Visitor Pass Directory'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEmployee ? 'Visitor passes registered with you as host' : 'Search, filter, and manage all organization visitor records'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="btn-secondary px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {(isReceptionist || isAdmin) && (
            <button
              onClick={onOpenRegister}
              className="btn-emerald px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Visitor</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Control Bar (Segmented Tabs as buttons) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters Controls */}
      <div className="p-3.5 glass-card rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search visitor, host, company, pass..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
          />
        </div>

        <div className="relative">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium text-slate-700"
          />
        </div>

        <div className="relative">
          <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedDepartment}
            onChange={e => setSelectedDepartment(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium text-slate-700"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Executive Office">Executive Office</option>
            <option value="Human Resources">Human Resources</option>
            <option value="IT & Security">IT & Security</option>
            <option value="Legal & Compliance">Legal & Compliance</option>
            <option value="Facilities">Facilities</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPurpose}
            onChange={e => setSelectedPurpose(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium text-slate-700"
          >
            <option value="">All Visit Purposes</option>
            <option value="Official Meeting">Official Meeting</option>
            <option value="Vendor / Supplier">Vendor / Supplier</option>
            <option value="Interview">Interview</option>
            <option value="Audit / Compliance">Audit / Compliance</option>
            <option value="Personal Visit">Personal Visit</option>
            <option value="Delivery / Logistics">Delivery / Logistics</option>
          </select>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading visitor records...</div>
        ) : visitors.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-1">
            <p className="font-semibold text-sm text-slate-700">No matching visitor passes found</p>
            <p className="text-slate-400">Try adjusting your search query or filter options above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-5">Pass ID & Visitor</th>
                  <th className="py-3.5 px-4">Host & Department</th>
                  <th className="py-3.5 px-4">Visit Date & Time</th>
                  <th className="py-3.5 px-4">Purpose</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visitors.map(v => (
                  <tr 
                    key={v.id} 
                    onClick={() => onOpenDetails(v)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-5">
                      <div className="font-mono text-[11px] font-bold text-teal-800">{v.passNumber}</div>
                      <div className="font-bold text-slate-900 mt-0.5">{v.visitorName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{v.visitorEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{v.employeeName}</div>
                      <div className="text-[11px] text-slate-400">{v.employeeDepartment}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-900 font-medium">{v.visitDate}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Expected: {formatTime12h(v.expectedArrivalTime)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {v.purpose}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="py-3.5 px-5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {v.status === 'APPROVED' && (
                          <button
                            onClick={() => onOpenAction(v, 'CHECK_IN')}
                            className="btn-emerald px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer"
                          >
                            Check In
                          </button>
                        )}
                        {v.status === 'CHECKED_IN' && (
                          <button
                            onClick={() => onOpenAction(v, 'CHECK_OUT')}
                            className="btn-secondary px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer"
                          >
                            Check Out
                          </button>
                        )}
                        <button
                          onClick={() => onOpenBadge(v)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Print Visitor Pass"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenDetails(v)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {(isAdmin || isReceptionist) && (
                          <button
                            onClick={() => setVisitToDelete(v)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Pass Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(visitToDelete)}
        title="Delete Visitor Pass Record"
        message={`Are you sure you want to delete visitor pass ${visitToDelete?.passNumber} for "${visitToDelete?.visitorName}"? This action cannot be undone.`}
        confirmLabel="Delete Pass"
        isSubmitting={isDeleting}
        onConfirm={handleDeleteVisit}
        onCancel={() => setVisitToDelete(null)}
      />

    </div>
  );
};
