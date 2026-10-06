import React, { useState, useEffect } from 'react';
import { Employee, VisitPurpose, Visitor } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { formatTime12h } from '../../utils/formatters.ts';
import { 
  X, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  Building, 
  User, 
  Mail, 
  Phone, 
  Search,
  Sparkles
} from 'lucide-react';

interface VisitorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (visitor: any) => void;
  preselectedEmployeeId?: string;
}

const PURPOSES: VisitPurpose[] = [
  'Business Meeting',
  'Job Interview',
  'Client Presentation',
  'Vendor / Supplier',
  'Maintenance / Technical',
  'Delivery',
  'Personal / Guest',
  'Audit / Inspection'
];

export const VisitorRegistrationModal: React.FC<VisitorRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedEmployeeId
}) => {
  const { success, error } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLocalNow = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    // Default arrival is current local time + 15 mins to always be valid
    const futureDate = new Date(d.getTime() + 15 * 60 * 1000);
    const hh = String(futureDate.getHours()).padStart(2, '0');
    const mm = String(futureDate.getMinutes()).padStart(2, '0');
    
    return {
      date: `${y}-${m}-${day}`,
      time: `${hh}:${mm}`
    };
  };

  const getInitialFormData = () => {
    const localNow = getLocalNow();
    return {
      visitorName: '',
      visitorEmail: '',
      visitorPhone: '',
      visitorCompany: '',
      visitorIdType: 'National ID' as const,
      visitorIdNumber: '',
      employeeId: preselectedEmployeeId || '',
      purpose: 'Business Meeting' as VisitPurpose,
      customPurpose: '',
      visitDate: localNow.date,
      expectedArrivalTime: localNow.time,
      expectedDepartureTime: '',
      notes: ''
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [matchingProfiles, setMatchingProfiles] = useState<Visitor[]>([]);
  const [showProfileSuggestions, setShowProfileSuggestions] = useState(false);

  const resetForm = () => {
    setFormData(getInitialFormData());
    setValidationErrors({});
    setMatchingProfiles([]);
    setShowProfileSuggestions(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      const localNow = getLocalNow();
      setFormData(prev => ({
        ...prev,
        visitDate: localNow.date,
        expectedArrivalTime: localNow.time,
        ...(preselectedEmployeeId && { employeeId: preselectedEmployeeId })
      }));
      setValidationErrors({});
    }
  }, [isOpen, preselectedEmployeeId]);

  const loadEmployees = async () => {
    try {
      const res = await api.getEmployees();
      const activeEmps = res.employees.filter(e => e.isActive);
      setEmployees(activeEmps);
      if (!formData.employeeId && activeEmps.length > 0) {
        setFormData(prev => ({ ...prev, employeeId: activeEmps[0].id }));
      }
    } catch (e) {
      console.error('Failed to load employees', e);
    }
  };

  // Live lookup for returning visitors
  const handleEmailOrPhoneChange = async (field: 'email' | 'phone' | 'name', value: string) => {
    if (field === 'email') setFormData(prev => ({ ...prev, visitorEmail: value }));
    if (field === 'phone') setFormData(prev => ({ ...prev, visitorPhone: value }));
    if (field === 'name') setFormData(prev => ({ ...prev, visitorName: value }));

    if (value.trim().length >= 3) {
      try {
        const res = await api.searchVisitorProfile(value.trim());
        setMatchingProfiles(res.visitors);
        setShowProfileSuggestions(res.visitors.length > 0);
      } catch (e) {
        // ignore
      }
    } else {
      setMatchingProfiles([]);
      setShowProfileSuggestions(false);
    }
  };

  const selectExistingVisitor = (v: Visitor) => {
    setFormData(prev => ({
      ...prev,
      visitorName: v.name,
      visitorEmail: v.email,
      visitorPhone: v.phone,
      visitorCompany: v.company || '',
      visitorIdType: (v.idType as any) || 'National ID',
      visitorIdNumber: v.idNumber || ''
    }));
    setShowProfileSuggestions(false);
    success('Visitor Profile Selected', `Auto-filled details for returning guest ${v.name}`);
  };

  if (!isOpen) return null;

  const selectedEmployee = employees.find(e => e.id === formData.employeeId);
  const isEmployeeAtLimit = selectedEmployee && (selectedEmployee.pendingRequestsCount || 0) >= (selectedEmployee.maxPendingAllowed || 3);

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Name validation (at least 3 chars, letters and spaces only)
    const nameTrimmed = formData.visitorName.trim();
    if (!nameTrimmed) {
      errs.visitorName = 'Visitor name is required';
    } else if (nameTrimmed.length < 3) {
      errs.visitorName = 'Visitor name must be at least 3 characters long';
    } else if (!/^[A-Za-z\s]+$/.test(nameTrimmed)) {
      errs.visitorName = 'Visitor name can only contain letters and spaces';
    }

    // 2. Email validation (RFC standard regex)
    const emailTrimmed = formData.visitorEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      errs.visitorEmail = 'Visitor email address is required';
    } else if (!emailRegex.test(emailTrimmed)) {
      errs.visitorEmail = 'Please specify a valid email address (e.g. name@company.com)';
    }

    // 3. Phone number validation (exactly 10 digits)
    const phoneRaw = formData.visitorPhone.trim();
    const phoneDigits = phoneRaw.replace(/\D/g, ''); // strip formatting
    if (!phoneRaw) {
      errs.visitorPhone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      errs.visitorPhone = 'Phone number must be exactly 10 digits (e.g. 9876543210)';
    }

    // 4. Host employee select validation
    if (!formData.employeeId) {
      errs.employeeId = 'Please select a host employee';
    }

    // 5. ID Number (if provided, make sure it has some letters/numbers)
    if (formData.visitorIdNumber.trim() && formData.visitorIdNumber.trim().length < 4) {
      errs.visitorIdNumber = 'ID Document number must be at least 4 characters long';
    }

    const localNow = getLocalNow();

    // 6. Visit date cannot be earlier than today
    if (formData.visitDate < localNow.date) {
      errs.visitDate = 'Visit date cannot be earlier than today.';
    }

    // 7. For today, arrival time cannot be earlier than current time
    if (formData.visitDate === localNow.date) {
      const [expH, expM] = formData.expectedArrivalTime.split(':').map(Number);
      const now = new Date();
      const curMinutes = now.getHours() * 60 + now.getMinutes();
      const expMinutes = expH * 60 + expM;

      if (expMinutes < curMinutes - 5) {
        errs.expectedArrivalTime = 'Expected arrival time cannot be earlier than current time today.';
      }
    }

    // 8. Expected Departure Time must be strictly later than Expected Arrival Time
    if (formData.expectedArrivalTime && formData.expectedDepartureTime) {
      const [arrH, arrM] = formData.expectedArrivalTime.split(':').map(Number);
      const [depH, depM] = formData.expectedDepartureTime.split(':').map(Number);
      const arrMinutes = arrH * 60 + arrM;
      const depMinutes = depH * 60 + depM;

      if (depMinutes <= arrMinutes) {
        errs.expectedDepartureTime = `Expected departure time (${formatTime12h(formData.expectedDepartureTime)}) must be strictly later than expected arrival time (${formatTime12h(formData.expectedArrivalTime)}).`;
      }
    }

    // 9. Employee pending capacity check
    if (isEmployeeAtLimit) {
      errs.employeeId = `${selectedEmployee?.name} already has ${selectedEmployee?.pendingRequestsCount} pending requests awaiting approval (limit is 3).`;
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const res = await api.registerVisitor(formData);
      if (res.success) {
        success('Visit Created', res.message);
        onSuccess(res.visitor);
        resetForm();
        onClose();
      }
    } catch (err: any) {
      error(
        'Unable to Register Visit',
        err.message || 'Could not register visitor request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-950 flex items-center justify-center text-teal-400 shrink-0 shadow-sm border border-slate-800">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">New Visitor Registration</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Register visitor and generate secure gate pass
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          
          {/* Section 1: Visitor Identity Document */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Visitor Information
              </h3>
            </div>

            {/* Profile Suggestions if returning visitor matches */}
            {showProfileSuggestions && matchingProfiles.length > 0 && (
              <div className="mb-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-blue-900">
                  Returning Visitor Found — Click to autofill:
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchingProfiles.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectExistingVisitor(p)}
                      className="px-2.5 py-1.5 bg-white border border-blue-300 hover:border-blue-500 rounded-lg text-xs text-slate-800 font-semibold text-left transition-all shadow-xs"
                    >
                      {p.name} ({p.company || 'Direct'}) · {p.email}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visitor Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={formData.visitorName}
                  onChange={e => handleEmailOrPhoneChange('name', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all ${
                    validationErrors.visitorName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {validationErrors.visitorName && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.visitorName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Innovations Corp"
                  value={formData.visitorCompany}
                  onChange={e => setFormData({ ...formData, visitorCompany: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="visitor@company.com"
                  value={formData.visitorEmail}
                  onChange={e => handleEmailOrPhoneChange('email', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all ${
                    validationErrors.visitorEmail ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {validationErrors.visitorEmail && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.visitorEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={formData.visitorPhone}
                  onChange={e => handleEmailOrPhoneChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-600 transition-all font-mono ${
                    validationErrors.visitorPhone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {validationErrors.visitorPhone && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.visitorPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identity Document Type
                </label>
                <select
                  value={formData.visitorIdType}
                  onChange={e => setFormData({ ...formData, visitorIdType: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  <option value="National ID">National Identity Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driver License">Driver's License</option>
                  <option value="Employee Badge">External Corporate Badge</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identity Document Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL-889211"
                  value={formData.visitorIdNumber}
                  onChange={e => setFormData({ ...formData, visitorIdNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Host Employee */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Host Employee (Approver)
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Host Capacity: Max 3 pending
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Host Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.employeeId}
                onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white ${
                  isEmployeeAtLimit ? 'border-rose-400 bg-rose-50/40 text-rose-950' : 'border-slate-300'
                }`}
              >
                {employees.map(emp => {
                  const pending = emp.pendingRequestsCount || 0;
                  const limit = emp.maxPendingAllowed || 3;
                  const isFull = pending >= limit;
                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.department} ({emp.designation}) [{pending}/{limit} Pending{isFull ? ' - CAP REACHED' : ''}]
                    </option>
                  );
                })}
              </select>

              {isEmployeeAtLimit && (
                <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Capacity Notice:</span> {selectedEmployee?.name} already has {selectedEmployee?.pendingRequestsCount} pending requests awaiting approval. Submission is paused until a request is processed.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Visit Schedule & Purpose */}
          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              3. Visit Schedule & Purpose
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visit Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  min={getLocalNow().date}
                  required
                  value={formData.visitDate}
                  onChange={e => setFormData({ ...formData, visitDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
                {validationErrors.visitDate && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.visitDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Arrival <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.expectedArrivalTime}
                  onChange={e => setFormData({ ...formData, expectedArrivalTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono"
                />
                {validationErrors.expectedArrivalTime && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.expectedArrivalTime}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Departure
                </label>
                <input
                  type="time"
                  value={formData.expectedDepartureTime}
                  onChange={e => setFormData({ ...formData, expectedDepartureTime: e.target.value })}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-600 font-mono ${
                    validationErrors.expectedDepartureTime ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {validationErrors.expectedDepartureTime && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.expectedDepartureTime}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purpose of Visit <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.purpose}
                  onChange={e => setFormData({ ...formData, purpose: e.target.value as VisitPurpose })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
                >
                  {PURPOSES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Notes / Agenda
                </label>
                <input
                  type="text"
                  placeholder="e.g. Project kick-off, Room 402"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl text-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(isEmployeeAtLimit)}
              className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                isEmployeeAtLimit 
                  ? 'bg-slate-400 cursor-not-allowed border border-slate-300' 
                  : 'btn-emerald'
              }`}
            >
              {isSubmitting ? (
                <span>Validating & Registering...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Visit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
