// API client for backend communication

import Cookies from 'js-cookie';
import { removeAuthToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
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

export interface HRDashboardStats {
  total_jobs: number;
  total_applications: number;
  pending_review: number;
  in_assessment: number;
  in_interview: number;
  hired_total: number;
  rejected: number;
  hired_this_month: number;
  applications_this_month: number;
}

export interface HRRecentApplicant {
  id: number;
  candidate_id: number;
  job_title: string;
  status: string;
  resume_score: number | null;
  assessment_score: number | null;
  interview_score: number | null;
  final_score: number | null;
  applied_at: string;
}

export interface HRPendingActionItem {
  id: number;
  job_title: string;
  candidate_id: number;
  applied_at?: string;
  assessment_score?: number | null;
  interview_score?: number | null;
}

export interface HRPendingActions {
  pending_review: HRPendingActionItem[];
  assessment_completed: HRPendingActionItem[];
  interview_completed: HRPendingActionItem[];
}

export interface HRJob {
  id: number;
  title: string;
  description?: string | null;
  required_skills?: string[] | null;
  experience_required?: number | null;
  location?: string | null;
  salary_range?: string | null;
  created_by: number;
  created_at: string;
}

export interface HRJobsResponse {
  total_jobs: number;
  jobs: HRJob[];
}

export interface HRApplication {
  id: number;
  job_id: number;
  candidate_id: number;
  user_id: number;
  status: string;
  resume_match_score: number | null;
  resume_analysis?: Record<string, unknown> | null;
  assessment_score: number | null;
  interview_score: number | null;
  final_score: number | null;
  hr_notes?: string | null;
  created_at: string;
}

export interface HRApplicationDetail extends HRApplication {
  assessment_data?: Record<string, unknown> | null;
  interview_transcript?: Record<string, unknown> | null;
  interview_feedback?: Record<string, unknown> | null;
  job?: {
    id: number;
    title: string;
    description?: string | null;
    location?: string | null;
  } | null;
}

export interface CreateHRJobPayload {
  title: string;
  description?: string;
  required_skills: string[];
  experience_required: number;
  location: string;
  salary_range: string;
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

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const token = Cookies.get('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Profile API
export const profileAPI = {
  getStatus: async () => {
    const res = await fetch(`${API_BASE_URL}/api/profile/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch profile status');
    return res.json();
  },

  saveProfile: async (profileData: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE_URL}/api/profile/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('Failed to save profile');
    return res.json();
  },

  parseResume: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = typeof window !== 'undefined' 
      ? document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1]
      : null;
    
    const res = await fetch(`${API_BASE_URL}/api/resume/parse`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to parse resume');
    return res.json();
  },
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

  getHRStats: async (): Promise<HRDashboardStats> => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  getRecentApplicants: async (limit: number = 10): Promise<HRRecentApplicant[]> => {
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

  getPendingActions: async (): Promise<HRPendingActions> => {
    const res = await fetch(`${API_BASE_URL}/v1/hr/dashboard/pending-actions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch pending actions');
    return res.json();
  },
};

export const hrAPI = {
  getJobs: async (): Promise<HRJobsResponse> => {
    const res = await fetch(`${API_BASE_URL}/v1/jobs/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  createJob: async (payload: CreateHRJobPayload): Promise<{ message: string; job: HRJob }> => {
    const res = await fetch(`${API_BASE_URL}/jobs/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  },

  getJobApplicants: async (jobId: number): Promise<HRApplication[]> => {
    const res = await fetch(`${API_BASE_URL}/v1/applications/job/${jobId}/applicants`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch applicants');
    return res.json();
  },

  getApplicationDetail: async (applicationId: number): Promise<HRApplicationDetail> => {
    const res = await fetch(`${API_BASE_URL}/v1/applications/application/${applicationId}/detail`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch application details');
    return res.json();
  },

  updateApplicationStatus: async (
    applicationId: number,
    payload: { status?: string; hr_notes?: string }
  ): Promise<HRApplication> => {
    const res = await fetch(`${API_BASE_URL}/v1/applications/application/${applicationId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update application');
    return res.json();
  },

  updateProfile: async (payload: {
    name?: string;
    email?: string;
    company_name?: string;
    company_website?: string;
    company_description?: string;
  }): Promise<UserData> => {
    const res = await fetch(`${API_BASE_URL}/v1/auth/me`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update profile');
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
