// API client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
import { removeAuthToken, getAuthToken } from "./auth";

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
  company_name?: string;
  company_website?: string;
  company_description?: string;
  profile_completed: boolean;
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
      ...(data.company && { company_name: data.company }),
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
    const token = getAuthToken();
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

// Profile API - Updated to match actual backend response
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  is_employer: boolean;
  company_name: string | null;
  company_website: string | null;
  company_description: string | null;
  profile_completed: boolean;
  created_at: string;
}

export interface CandidateProfile {
  id: number;
  user_id: number;
  phone: string;
  linkedin_url: string;
  resume_url: string;
  profile_photo_url: string;
  bio: string;
  profile_completed: boolean;
  user: UserProfile;
  education: Array<{
    id: number;
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string;
    grade: string;
    location: string;
  }>;
  experiences: Array<{
    id: number;
    company_name: string;
    job_title: string;
    location: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description: string;
  }>;
  skills: Array<{
    id: number;
    languages: string;
    backend_technologies: string;
    databases: string;
    ai_ml_frameworks: string;
    tools_platforms: string;
    core_competencies: string;
  }>;
}

export const profileAPI = {
  getProfile: async (): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch profile');
      }
      return res.json();
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  },

  getCandidateProfile: async (): Promise<CandidateProfile | null> => {
    try {
      // First get user profile
      const userProfile = await profileAPI.getProfile();
      if (!userProfile) return null;
      
      // Then try to get candidate-specific data
      // This would need a separate endpoint or the user profile should include candidate data
      return {
        id: 0, // This would come from candidate table
        user_id: userProfile.id,
        phone: '',
        linkedin_url: '',
        resume_url: '',
        profile_photo_url: '',
        bio: '',
        profile_completed: userProfile.profile_completed,
        user: userProfile,
        education: [],
        experiences: [],
        skills: [],
      };
    } catch (error) {
      console.error('Candidate profile fetch error:', error);
      return null;
    }
  },

  uploadResume: async (formData: FormData): Promise<CandidateProfile> => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/resume/upload-resume/`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to upload resume');
    }
    return res.json();
  },

  addExperience: async (experience: {
    company_name: string;
    job_title: string;
    location?: string;
    start_date: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/experiences`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(experience),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to add experience');
    }
    return res.json();
  },

  addSkill: async (skill: {
    languages?: string;
    backend_technologies?: string;
    databases?: string;
    ai_ml_frameworks?: string;
    tools_platforms?: string;
    core_competencies?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/skills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(skill),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to add skill');
    }
    return res.json();
  },

  addEducation: async (education: {
    institution: string;
    degree: string;
    field_of_study?: string;
    start_date: string;
    end_date?: string;
    grade?: string;
    location?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/education`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(education),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to add education');
    }
    return res.json();
  },

  getProfileStatus: async () => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/profile-status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to fetch profile status');
    }
    return res.json();
  },

  completeProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/v1/candidate/complete-profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to complete profile');
    }
    return res.json();
  },
};