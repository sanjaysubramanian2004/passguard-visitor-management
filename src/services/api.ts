import { 
  User, 
  Employee, 
  Visitor,
  Visit,
  PopulatedVisit, 
  ActivityLog, 
  DashboardMetrics, 
  ReportSummary, 
  VisitorFilterOptions 
} from '../types/index.ts';

// Get stored auth info
function getAuthHeaders(): HeadersInit {
  try {
    const raw = localStorage.getItem('passguard_user');
    if (raw) {
      const user: User = JSON.parse(raw);
      return {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-role': user.role,
        'x-user-email': user.email
      };
    }
  } catch (e) {
    console.error('Failed to parse stored user', e);
  }

  return {
    'Content-Type': 'application/json',
    'x-user-id': 'usr-recep-01',
    'x-user-name': 'Sarah Jenkins',
    'x-user-role': 'RECEPTIONIST',
    'x-user-email': 'reception@passguard.com'
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let errorMsg = data.error || `Server error (${res.status})`;
    
    if (res.status === 429) {
      errorMsg = 'Too many requests. Please wait a moment before trying again.';
    } else if (typeof errorMsg === 'string') {
      if (errorMsg.includes('Cast to ObjectId') || errorMsg.includes('BSONError') || errorMsg.includes('Argument passed in must be a string of 12 bytes')) {
        errorMsg = 'Invalid record identifier specified.';
      } else if (errorMsg.includes('E11000') || errorMsg.includes('duplicate key')) {
        errorMsg = 'A record with this email address or badge already exists.';
      } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = 'Unable to connect to the server. Please check your network connection.';
      } else if (errorMsg.includes('validation failed') || errorMsg.includes('ValidationError')) {
        errorMsg = 'Please verify your input fields and try again.';
      } else if (errorMsg.includes('Unexpected token') || errorMsg.includes('JSON')) {
        errorMsg = 'The server encountered a temporary error. Please try again.';
      }
    } else {
      errorMsg = 'An unexpected error occurred. Please try again.';
    }

    const err: any = new Error(errorMsg);
    err.rule = data.rule;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  async login(email?: string, password?: string, role?: string): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getSwitchableUsers(): Promise<{ users: User[] }> {
    const res = await fetch('/api/auth/switchable-users');
    return handleResponse(res);
  },

  // Visitor Profiles (Unique Visitor collection)
  async getVisitorDirectory(): Promise<{ visitors: Visitor[]; total: number }> {
    const res = await fetch('/api/visitors/directory', {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async searchVisitorProfile(q: string): Promise<{ visitors: Visitor[] }> {
    const res = await fetch(`/api/visitors/search-profile?q=${encodeURIComponent(q)}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Visits (Visit Collection populated with Visitor & Employee)
  async getVisitors(filters?: VisitorFilterOptions): Promise<{ visitors: PopulatedVisit[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.purpose) params.append('purpose', filters.purpose);
    if (filters?.visitorId) params.append('visitorId', filters.visitorId);

    const res = await fetch(`/api/visitors?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getVisitorById(id: string): Promise<{ visitor: PopulatedVisit }> {
    const res = await fetch(`/api/visitors/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async registerVisitor(payload: any): Promise<{ success: boolean; message: string; visitor: PopulatedVisit }> {
    const res = await fetch('/api/visitors', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async updateVisitorStatus(
    id: string, 
    action: 'APPROVE' | 'REJECT' | 'CHECK_IN' | 'CHECK_OUT' | 'CANCEL', 
    remarks?: string,
    customTimestamp?: string
  ): Promise<{ success: boolean; message: string; visitor: PopulatedVisit }> {
    const res = await fetch(`/api/visitors/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, remarks, customTimestamp })
    });
    return handleResponse(res);
  },

  async getMetrics(employeeId?: string): Promise<DashboardMetrics> {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);

    const res = await fetch(`/api/visitors/metrics/summary?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getReports(period: string = 'today', startDate?: string, endDate?: string): Promise<ReportSummary> {
    const params = new URLSearchParams({ period });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`/api/visitors/reports?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Employees
  async getEmployees(): Promise<{ employees: Employee[] }> {
    const res = await fetch('/api/employees', {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createEmployee(payload: Partial<Employee>): Promise<{ success: boolean; employee: Employee }> {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async updateEmployee(id: string, payload: Partial<Employee>): Promise<{ success: boolean; employee: Employee }> {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  // Users
  async getUsers(): Promise<{ users: User[] }> {
    const res = await fetch('/api/users', {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async createUser(payload: Partial<User>): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async updateUser(id: string, payload: Partial<User>): Promise<{ success: boolean; user: User }> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async purgeDummyUsers(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/users/purge-dummy', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Activity History
  async getActivityLogs(params?: { action?: string; search?: string; passNumber?: string; date?: string; visitId?: string }): Promise<{ logs: ActivityLog[]; total: number }> {
    const q = new URLSearchParams();
    if (params?.action) q.append('action', params.action);
    if (params?.search) q.append('search', params.search);
    if (params?.passNumber) q.append('passNumber', params.passNumber);
    if (params?.date) q.append('date', params.date);
    if (params?.visitId) q.append('visitId', params.visitId);

    const res = await fetch(`/api/activity?${q.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async getDatabaseStatus(): Promise<any> {
    const res = await fetch('/api/database/status', {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async deleteVisit(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/visitors/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async purgeAll(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/visitors/purge/all', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};
