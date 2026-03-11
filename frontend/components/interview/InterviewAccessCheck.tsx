"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface AccessCheckResult {
  can_access: boolean;
  error?: string;
  application?: {
    id: number;
    job_title: string;
    company_name: string;
    assessment_score: number;
  };
  current_status?: string;
  assessment_score?: number;
}

interface InterviewAccessCheckProps {
  children: React.ReactNode;
}

export default function InterviewAccessCheck({ children }: InterviewAccessCheckProps) {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  const [accessResult, setAccessResult] = useState<AccessCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(`http://localhost:8000/v1/interview/access/${applicationId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setAccessResult({
            can_access: false,
            error: errorData.detail || "Access denied"
          });
        } else {
          const data = await response.json();
          setAccessResult(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check access");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      checkAccess();
    }
  }, [applicationId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking interview access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-4">Access Error</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/candidate")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!accessResult?.can_access) {
    const getErrorMessage = () => {
      const error = accessResult?.error || "Access denied";
      
      if (error.includes("Assessment must be completed")) {
        return {
          title: "Assessment Required",
          message: "You need to complete the assessment before taking the interview.",
          action: "Take Assessment",
          actionPath: `/candidate/assessment/${applicationId}`
        };
      } else if (error.includes("Assessment score too low")) {
        return {
          title: "Assessment Score Too Low",
          message: `Your assessment score (${accessResult?.assessment_score || 0}%) is below the required threshold of 70%.`,
          action: "View Applications",
          actionPath: "/candidate"
        };
      } else if (error.includes("Interview already completed")) {
        return {
          title: "Interview Already Completed",
          message: "You have already completed the interview for this application.",
          action: "View Applications",
          actionPath: "/candidate"
        };
      } else {
        return {
          title: "Access Denied",
          message: error,
          action: "Return to Dashboard",
          actionPath: "/candidate"
        };
      }
    };

    const errorInfo = getErrorMessage();

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-yellow-100">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-4">{errorInfo.title}</h2>
            <p className="text-yellow-600 mb-6">{errorInfo.message}</p>
            
            {accessResult?.current_status && (
              <Alert className="mb-6">
                <AlertDescription>
                  Current Status: {accessResult.current_status}
                </AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={() => router.push(errorInfo.actionPath)} 
              className="w-full"
            >
              {errorInfo.action}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access granted - show interview confirmation
  if (accessResult.can_access && accessResult.application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-4">Interview Access Granted</h2>
            
            <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-green-800 mb-2">Interview Details:</h3>
              <p className="text-sm text-green-700 mb-1">
                <strong>Position:</strong> {accessResult.application.job_title}
              </p>
              <p className="text-sm text-green-700 mb-1">
                <strong>Company:</strong> {accessResult.application.company_name}
              </p>
              <p className="text-sm text-green-700">
                <strong>Assessment Score:</strong> {accessResult.application.assessment_score}%
              </p>
            </div>
            
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This interview will be proctored. Ensure you have a stable internet connection, 
                working camera and microphone, and are in a quiet environment.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  // Replace current page with interview page to prevent back navigation
                  window.location.replace(`/candidate/interview/${applicationId}/start`);
                }}
                className="w-full" 
                size="lg"
              >
                Start Interview
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push("/candidate")} 
                className="w-full"
              >
                Not Ready - Return Later
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This should not be reached, but render children as fallback
  return <>{children}</>;
}