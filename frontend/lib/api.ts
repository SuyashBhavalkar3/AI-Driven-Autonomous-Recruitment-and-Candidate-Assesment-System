// lib/api.ts

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";


export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  is_employer: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  is_employer: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}



async function apiFetch<T>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.detail || "API request failed");
  }

  return response.json();
}


export const authApi = {
  register: (data: RegisterPayload) =>
    apiFetch<AuthResponse>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: LoginPayload) =>
    apiFetch<AuthResponse>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};