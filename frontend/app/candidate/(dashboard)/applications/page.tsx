"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import Loader from "@/components/Loader";
import { ApplicationCard } from "@/components/ApplicationCard";
import { ScheduleDialog } from "@/components/ScheduleDialog";
import { getAuthToken } from "@/lib/auth";

// Updated to include assessment_completed
type ApplicationStage =
  | "under_review"
  | "assessment_pending"
  | "assessment_scheduled"
  | "assessment_completed"
  | "interview_scheduled"
  | "offer"
  | "rejected";

// Updated interface to match what we're actually using
interface Application {
  id: number;
  company: string;
  position: string;
  location: string;
  appliedDate: string;
  stage: ApplicationStage;
  interviewDate?: string;
  assessmentDate?: string;
  offerDetails?: { salary: string; deadline: string };
  rejectionReason?: string;
  
  // Additional fields from backend
  resume_match_score?: number;
  assessment_score?: number;
  status_display?: {
    status: string;
    description: string;
    action?: string;
  };
  
  // Add these for ApplicationCard compatibility
  created_at?: string;
  job?: {
    title: string;
    location: string;
  };
}

// Helper to map backend status to frontend stage
function mapBackendStatus(backendStatus: string): ApplicationStage {
  const map: Record<string, ApplicationStage> = {
    pending: "under_review",
    resume_screened: "assessment_pending", 
    assessment_scheduled: "assessment_scheduled",
    assessment_completed: "assessment_completed",
    interview_scheduled: "interview_scheduled",
    interview_completed: "interview_scheduled",
    accepted: "offer",
    rejected: "rejected",
  };
  return map[backendStatus] || "under_review";
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [selectedAppForInterview, setSelectedAppForInterview] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Fetch real applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch("http://localhost:8000/v1/applications/my-applications", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load applications");

        const data = await res.json();
        console.log("=== Backend response ===", data);
        
        // Transform backend data to our Application type
        const transformed: Application[] = data.map((app: any, index: number) => {
          console.log(`\n=== Processing frontend app ${index} ===`);
          console.log("Raw app data:", app);
          console.log("Job data:", app.job);
          console.log("Company data:", app.company);
          
          const result = {
            id: app.id,
            company: app.company || "Unknown Company",
            position: app.job?.title || "Unknown Position", 
            location: app.job?.location || "Unknown Location",
            appliedDate: app.created_at || new Date().toISOString(),
            stage: mapBackendStatus(app.status),
            interviewDate: app.interview_scheduled_at,
            assessmentDate: app.assessment_scheduled_at,
            offerDetails: app.offer_details,
            rejectionReason: app.rejection_reason,
            resume_match_score: app.resume_match_score,
            assessment_score: app.assessment_score,
            status_display: app.status_display,
            
            // Add these for ApplicationCard compatibility
            created_at: app.created_at,
            job: app.job ? {
              title: app.job.title,
              location: app.job.location
            } : undefined
          };
          
          console.log("Transformed result:", result);
          return result;
        });
        setApplications(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [router]);

  // Generate decorative particles
  useEffect(() => {
    const newParticles: React.ReactNode[] = [];
    for (let i = 0; i < 15; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      newParticles.push(
        <div
          key={`dot-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-[#B8915C]/10 dark:bg-[#B8915C]/5"
          style={{ top: `${top}%`, left: `${left}%`, filter: "blur(1px)" }}
        />
      );
    }
    setParticles(newParticles);
  }, []);

  // GSAP animations
  useEffect(() => {
    if (!loading && cardsRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".application-card", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        });
        gsap.from(".stage-badge", {
          scale: 0.8,
          opacity: 0,
          duration: 0.4,
          stagger: 0.2,
          delay: 0.5,
        });
      }, cardsRef);
      return () => ctx.revert();
    }
  }, [loading]);

  // Handlers
  const handleTakeAssessment = (appId: number) => {
    router.push(`/candidate/assessment/${appId}`);
  };

  const handleScheduleInterviewClick = (appId: number) => {
    setSelectedAppForInterview(appId);
    setInterviewDialogOpen(true);
  };

  const handleScheduleInterview = (date: Date, time: string) => {
    if (!selectedAppForInterview) return;

    const [hours, minutes] = time.split(":").map(Number);
    const scheduledDateTime = new Date(date);
    scheduledDateTime.setHours(hours, minutes);

    // Update local state (in real app, call API to update status)
    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedAppForInterview
          ? {
              ...app,
              stage: "interview_scheduled",
              interviewDate: scheduledDateTime.toISOString(),
            }
          : app
      )
    );

    // Optional: Call API to persist (if endpoint exists for candidate)
    // await fetch(`/v1/applications/${selectedAppForInterview}/schedule-interview`, { ... })
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      {loading && <Loader fullPage={true} />}

      {!loading && (
        <>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles}
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 flex items-center justify-between"
            >
              <div>
                <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white mb-2 flex items-center gap-2">
                  My Applications
                  <Sparkles className="h-6 w-6 text-[#B8915C] animate-pulse" />
                </h1>
                <p className="text-[#5A534A] dark:text-slate-400">
                  Track your application progress
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-[#B8915C]/30 text-[#B8915C] bg-white/50 backdrop-blur-sm"
              >
                {applications.length} total
              </Badge>
            </motion.div>

            <div ref={cardsRef} className="space-y-4">
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#5A534A] dark:text-slate-400 text-lg">
                    No applications yet
                  </p>
                  <p className="text-[#A69A8C] dark:text-slate-500 text-sm mt-2">
                    Start applying to jobs to see your applications here
                  </p>
                </div>
              ) : (
                applications.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    application={app}
                    onTakeAssessment={handleTakeAssessment}
                    onScheduleInterview={handleScheduleInterviewClick}
                  />
                ))
              )}
            </div>

            {/* Interview Scheduling Dialog */}
            <ScheduleDialog
              open={interviewDialogOpen}
              onOpenChange={setInterviewDialogOpen}
              onSchedule={handleScheduleInterview}
              title="Schedule Interview"
            />
          </div>
        </>
      )}
    </div>
  );
}