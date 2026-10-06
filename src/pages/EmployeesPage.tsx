import React, { useState, useEffect } from 'react';
import { Employee } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from '../context/ToastContext.tsx';
import { ConfirmModal } from '../components/common/ConfirmModal.tsx';
import { 
  Building2, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  X,
  Trash2
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { success, error } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Employee Deletion Modal State
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    officeLocation: 'Building A, Floor 3',
    maxPendingAllowed: 3
  });

  const loadEmployees = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await api.getEmployees();
      setEmployees(res.employees);
    } catch (err) {
      console.error('Failed to load employees', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees(false);
    const interval = setInterval(() => loadEmployees(true), 5000);
    const handleFocus = () => loadEmployees(true);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createEmployee(formData);
      if (res.success) {
        success('Host Employee Added', `${res.employee.name} added to host employee directory`);
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          department: 'Engineering',
          designation: '',
          officeLocation: 'Building A, Floor 3',
          maxPendingAllowed: 3
        });
        loadEmployees();
      }
    } catch (err: any) {
      error('Failed to Create Employee', err.message);
    }
  };

  const handleConfirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      setIsDeleting(true);
      const res = await api.deleteEmployee(employeeToDelete.id);
      if (res.success) {
        success('Employee Removed', `${employeeToDelete.name} removed from staff directory`);
        setEmployeeToDelete(null);
        loadEmployees();
      }
    } catch (err: any) {
      error('Failed to Delete Employee', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredEmployees = employees.filter(e => {
    const q = searchQuery.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Page Title & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Host Employees Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage host staff profiles who can receive visitor booking requests & gate approvals.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-emerald px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Host Employee</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 glass-card rounded-2xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee by name, department, designation, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Employees Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading host employee directory...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <p className="font-semibold text-sm text-slate-700">No host employees found</p>
          <p className="text-slate-400 mt-1">Add host employees or adjust your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(emp => (
            <div key={emp.id} className="p-5 glass-card glass-card-hover rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{emp.name}</h3>
                      <p className="text-[11px] text-teal-800 font-semibold">{emp.designation || 'Host Staff'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmployeeToDelete(emp)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete employee profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-600 truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-600">{emp.phone}</span>
                    </div>
                  )}
                  {emp.officeLocation && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500">{emp.officeLocation}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Pending Approvals:</span>
                <span className={`px-2 py-0.5 rounded-full font-mono font-bold ${
                  (emp.pendingRequestsCount || 0) >= (emp.maxPendingAllowed || 3)
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {emp.pendingRequestsCount || 0} / {emp.maxPendingAllowed || 3}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mx-auto">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Add Host Employee</h3>
                  <p className="text-[11px] text-slate-500">Register host staff for visitor approvals</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Aris Thorne"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="aris.thorne@company.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone / Extension
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-2831"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Engineering"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Principal Architect"
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Office Location
                </label>
                <input
                  type="text"
                  placeholder="Building A, Floor 3, Suite 302"
                  value={formData.officeLocation}
                  onChange={e => setFormData({ ...formData, officeLocation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-emerald px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Create Host Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(employeeToDelete)}
        title="Delete Host Employee Profile"
        message={`Are you sure you want to permanently delete host employee "${employeeToDelete?.name}" (${employeeToDelete?.email})?`}
        confirmLabel="Delete Employee"
        isSubmitting={isDeleting}
        onConfirm={handleConfirmDeleteEmployee}
        onCancel={() => setEmployeeToDelete(null)}
      />

    </div>
  );
};
