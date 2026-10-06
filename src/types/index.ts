export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  employeeId?: string; // Linked employee profile if role is EMPLOYEE
  department?: string;
  designation?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone?: string;
  officeLocation?: string;
  isActive: boolean;
  pendingRequestsCount?: number;
  maxPendingAllowed?: number;
}

// 1. Separate Visitor Entity (Guest Identity Profile)
export interface Visitor {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  idType?: 'National ID' | 'Passport' | 'Driver License' | 'Employee Badge';
  idNumber?: string;
  createdAt: string;
  totalVisitsCount?: number;
}

export type VisitStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CHECKED_IN' 
  | 'CHECKED_OUT' 
  | 'CANCELLED';

export type VisitPurpose = 
  | 'Business Meeting'
  | 'Job Interview'
  | 'Client Presentation'
  | 'Vendor / Supplier'
  | 'Maintenance / Technical'
  | 'Delivery'
  | 'Personal / Guest'
  | 'Audit / Inspection';

// 2. Separate Visit Entity (Specific Scheduled Appointment)
export interface Visit {
  id: string;
  passNumber: string; // e.g. VP-2026-0891
  visitorId: string;
  employeeId: string;
  visitDate: string; // YYYY-MM-DD
  expectedArrivalTime: string; // HH:mm
  expectedDepartureTime?: string; // HH:mm
  purpose: VisitPurpose;
  customPurpose?: string;
  status: VisitStatus;
  remarks?: string; // Notes / meeting agenda
  approvalRemarks?: string;
  rejectionReason?: string;
  checkInTime?: string; // ISO string
  checkOutTime?: string; // ISO string
  registeredBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  approvedBy?: {
    id: string;
    name: string;
    role: UserRole;
    timestamp: string;
  };
  rejectedBy?: {
    id: string;
    name: string;
    role: UserRole;
    timestamp: string;
  };
  checkedInBy?: {
    id: string;
    name: string;
  };
  checkedOutBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// 3. Populated Visit (Joined Visit with Visitor & Employee data)
export interface PopulatedVisit extends Visit {
  visitor: Visitor;
  employee: Employee;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitorCompany?: string;
  visitorIdType?: string;
  visitorIdNumber?: string;
  employeeName: string;
  employeeDepartment: string;
  employeeEmail?: string;
  notes?: string;
}

// Alias for seamless backward compatibility across UI components
export type VisitorRequest = PopulatedVisit;

// 4. Activity Log Entity
export type ActivityAction = 
  | 'CREATED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CHECKED_IN' 
  | 'CHECKED_OUT' 
  | 'CANCELLED'
  | 'UPDATED';

export interface ActivityLog {
  id: string;
  visitId: string;
  action: ActivityAction;
  performedBy: {
    id: string;
    name: string;
    role: UserRole;
    email?: string;
  };
  details: string;
  remarks?: string;
  passNumber?: string;
  visitorName?: string;
  createdAt: string;
  timestamp: string; // Guaranteed timestamp string
}

export interface DashboardMetrics {
  totalVisitorsToday: number;
  visitorsCurrentlyInside: number;
  pendingRequests: number;
  approvedVisitorsToday: number;
  checkedOutToday: number;
  rejectedTotal: number;
  totalEmployees: number;
  totalRegisteredVisitors: number;
  myPendingRequests?: number;
  myApprovedToday?: number;
}

export interface ReportSummary {
  period: 'today' | 'this_week' | 'this_month' | 'custom';
  dateRange: { start: string; end: string };
  totalVisits: number;
  completedVisits: number;
  approvedRate: number;
  averageVisitDurationMinutes: number;
  flaggedDenials?: number;
  overstayAlertsCount?: number;
  hourlyDistribution?: Record<string, number>;
  byStatus: Record<VisitStatus, number>;
  byPurpose: Record<string, number>;
  byDepartment: Record<string, number>;
  timelineData?: Array<{
    date: string;
    total: number;
    checkedIn: number;
    approved: number;
    rejected: number;
  }>;
}

export interface VisitorFilterOptions {
  search?: string;
  status?: VisitStatus | 'ALL' | 'ACTIVE';
  employeeId?: string;
  department?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  purpose?: string;
  visitorId?: string;
}
