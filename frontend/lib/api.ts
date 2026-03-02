// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Request types (same as before)
export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role: 'hr' | 'candidate';
  company?: string; // required if role = hr
}

export interface LoginData {
  email: string;
  password: string;
  // role is removed
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserData; // include user info so we don't need a separate /me call
}


// Response types matching backend schemas
export interface CandidateProfile {
  id: number;
  user_id: number;
  phone?: string | null;
  location?: string | null;
  skills?: string | null;
  experience_years?: number | null;
  education?: string | null;
  resume_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
}

export interface HRProfile {
  id: number;
  user_id: number;
  company_name: string;
  company_website?: string | null;
  company_description?: string | null;
  industry?: string | null;
  company_size?: string | null;
  position?: string | null;
}

export interface UserData {
  id: number;
  email: string;
  full_name: string;
  role: 'hr' | 'candidate';
  is_active: boolean;
  created_at: string;
  candidate_profile?: CandidateProfile | null;
  hr_profile?: HRProfile | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// API functions
export async function loginUser(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data), // no role field
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}
export async function registerUser(data: RegisterData): Promise<UserData> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}


export async function getCurrentUser(token: string): Promise<UserData> {
  const response = await fetch(`${API_BASE_URL}/v1/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('unauthorized');
    }
    throw new Error('Failed to fetch user data');
  }

  return response.json();
}