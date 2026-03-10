"use client";
 type ApplicationStage =
  | "under_review"
  | "assessment_pending"
  | "assessment_scheduled"
  | "interview_scheduled"
  | "offer"
  | "rejected";

 interface Application {
  id: number;
  company: string;
  position: string;
  location: string;
  appliedDate: string;
  stage: ApplicationStage;
  interviewDate?: string;      // ISO string
  assessmentDate?: string;     // ISO string (scheduled assessment)
  offerDetails?: { salary: string; deadline: string };
  rejectionReason?: string;
}


export const initialApplications: Application[] = [
  {
    id: 1,
    company: "TechCorp",
    position: "Senior Frontend Developer",
    location: "Remote",
    appliedDate: "2024-02-15",
    stage: "assessment_pending",
  },
  {
    id: 2,
    company: "InnovateLabs",
    position: "Full Stack Engineer",
    location: "New York",
    appliedDate: "2024-02-10",
    stage: "interview_scheduled",
    interviewDate: "2024-03-05T14:00:00",
  },
  {
    id: 3,
    company: "DataFlow Inc",
    position: "Backend Developer",
    location: "Austin",
    appliedDate: "2024-02-20",
    stage: "under_review",
  },
  {
    id: 4,
    company: "CloudTech",
    position: "DevOps Engineer",
    location: "Seattle",
    appliedDate: "2024-02-08",
    stage: "offer",
    offerDetails: { salary: "$140k - $160k", deadline: "2024-03-10" },
  },
  {
    id: 5,
    company: "StartupXYZ",
    position: "Frontend Developer",
    location: "Remote",
    appliedDate: "2024-02-18",
    stage: "rejected",
    rejectionReason: "Experience requirements not met",
  },
];

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";

import { ApplicationCard } from "@/components/ApplicationCard";
import { ScheduleDialog } from "@/components/ScheduleDialog";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

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

  const handleScheduleClick = (appId: number) => {
    setSelectedAppId(appId);
    setScheduleDialogOpen(true);
  };

  const handleSchedule = (date: Date, time: string) => {
    if (!selectedAppId) return;

    // Combine date and time into an ISO string (simplified)
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledDateTime = new Date(date);
    scheduledDateTime.setHours(hours, minutes);

    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedAppId
          ? {
              ...app,
              stage: "assessment_scheduled",
              assessmentDate: scheduledDateTime.toISOString(),
            }
          : app
      )
    );
  };

  const handleAssessmentPassed = (appId: number) => {
    // Simulate passing assessment -> move to interview scheduled
    // Set interview date to 3 days later as an example
    const interviewDate = new Date();
    interviewDate.setDate(interviewDate.getDate() + 3);
    interviewDate.setHours(14, 0, 0, 0); // 2:00 PM

    setApplications((prev) =>
      prev.map((app) =>
        app.id === appId
          ? {
              ...app,
              stage: "interview_scheduled",
              interviewDate: interviewDate.toISOString(),
            }
          : app
      )
    );
  };

  return (
    <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
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

        {/* Applications list */}
        <div ref={cardsRef} className="space-y-4">
          {loading ? (
            // Skeleton loaders
            [...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-pulse rounded-lg p-6"
              >
                <div className="h-6 w-48 bg-[#D6CDC2] dark:bg-slate-700 rounded mb-2" />
                <div className="h-4 w-32 bg-[#D6CDC2] dark:bg-slate-700 rounded" />
              </div>
            ))
          ) : (
            applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                onScheduleClick={handleScheduleClick}
                onAssessmentPassed={handleAssessmentPassed}
              />
            ))
          )}
        </div>
      </div>

      {/* Schedule Dialog */}
      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSchedule={handleSchedule}
      />
    </div>
  );
}