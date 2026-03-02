// lib/auth.ts (unchanged except maybe adding getters for profile)
import Cookies from 'js-cookie';
import { UserData } from './api';

const TOKEN_KEY = 'auth_token';
const ROLE_KEY = 'user_role';
const USER_KEY = 'user_data';

export function setAuthToken(token: string) {
  Cookies.set(TOKEN_KEY, token, { expires: 7 });
}

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function removeAuthToken() {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(ROLE_KEY);
  Cookies.remove(USER_KEY);
}

export function setUserRole(role: 'hr' | 'candidate') {
  Cookies.set(ROLE_KEY, role, { expires: 7 });
}

export function getUserRole(): 'hr' | 'candidate' | null {
  const role = Cookies.get(ROLE_KEY);
  return (role as 'hr' | 'candidate') || null;
}

export function setUserData(data: UserData) {
  Cookies.set(USER_KEY, JSON.stringify(data), { expires: 7 });
}

export function getUserData(): UserData | null {
  const data = Cookies.get(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function logout() {
  removeAuthToken();
  window.location.href = '/login';
}

// Optional: helper to get profile based on role
export function getUserProfile(user: UserData) {
  if (user.role === 'hr') return user.hr_profile;
  return user.candidate_profile;
}
