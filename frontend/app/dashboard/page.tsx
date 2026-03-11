"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole, isAuthenticated, getUserData } from '@/lib/auth';
import Loader from '@/components/Loader';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirectToDashboard = async () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Get user role
      const role = getUserRole();
      const userData = getUserData();

      // If no role in cookies, try to determine from user data
      if (!role && userData?.is_employer !== undefined) {
        const userRole = userData.is_employer ? 'hr' : 'candidate';
        
        // Redirect based on role
        if (userRole === 'hr') {
          router.push('/hr');
        } else {
          router.push('/candidate');
        }
        return;
      }

      // Redirect based on stored role
      if (role === 'hr') {
        router.push('/hr');
      } else if (role === 'candidate') {
        router.push('/candidate');
      } else {
        // Fallback: redirect to login if role is unclear
        router.push('/login');
      }
    };

    redirectToDashboard();
  }, [router]);

  return <Loader fullPage={true} />;
}