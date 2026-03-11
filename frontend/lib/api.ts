// API client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
import { removeAuthToken } from "./auth";
export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  is_employer: boolean;
  company?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  is_employer: boolean;
  company?: string;
  created_at: string;
}

export async function registerUser(data: RegisterData): Promise<UserData> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.fullName,
      email: data.email,
      password: data.password,
      is_employer: data.is_employer,
      ...(data.company && { company: data.company }),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<UserData> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // token invalid
    removeAuthToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  return response.json();
}

const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const Cookies = require('js-cookie');
    const token = Cookies.default.get('auth_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }
  return { 'Content-Type': 'application/json' };
};

// Dashboard API
export const dashboardAPI = {
  getCandidateStats: async () => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  getCandidateActivity: async (limit: number = 10) => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/dashboard/activity?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch activity');
    return res.json();
  },

  getHRStats: async () => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  getRecentApplicants: async (limit: number = 10) => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/recent-applicants?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch applicants');
    return res.json();
  },

  getTopCandidates: async (limit: number = 10) => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/top-candidates?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch candidates');
    return res.json();
  },

  getPendingActions: async () => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/pending-actions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pending actions');
    return res.json();
  },
};


// HR Actions API
export const hrActionsAPI = {
  sendOffer: async (applicationId: number, offerDetails: string) => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/actions/offer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ application_id: applicationId, offer_details: offerDetails }),
    });
    if (!res.ok) throw new Error('Failed to send offer');
    return res.json();
  },

  rejectCandidate: async (applicationId: number, reason: string) => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/actions/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ application_id: applicationId, reason }),
    });
    if (!res.ok) throw new Error('Failed to reject candidate');
    return res.json();
  },
};

// Proctoring API
export const proctoringAPI = {
  reportViolation: async (applicationId: number, violationType: string, timestamp: string, details: string) => {
    const res = await fetch(`${API_BASE_URL}/v1/proctoring/report-violation`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        application_id: applicationId,
        violation_type: violationType,
        timestamp,
        details,
      }),
    });
    if (!res.ok) throw new Error('Failed to report violation');
    return res.json();
  },

  getViolations: async (applicationId: number) => {
    const res = await fetch(`${API_BASE_URL}/v1/proctoring/violations/${applicationId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch violations');
    return res.json();
  },
};

// Jobs API
export const jobsAPI = {
  getAllJobs: async () => {
    const res = await fetch(`${API_BASE_URL}/jobs/`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  getJobById: async (jobId: number) => {
    const res = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
    if (!res.ok) throw new Error('Failed to fetch job details');
    return res.json();
  },
};
