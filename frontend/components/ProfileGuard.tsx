"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { Loader2 } from "lucide-react";

interface ProfileGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProfileGuard({ children, redirectTo = "/complete-profile" }: ProfileGuardProps) {
  const { profileStatus, loading } = useProfileStatus();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!loading && profileStatus) {
      if (!profileStatus.profile_completed) {
        router.push(redirectTo);
      } else {
        setShouldRender(true);
      }
    }
  }, [loading, profileStatus, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}