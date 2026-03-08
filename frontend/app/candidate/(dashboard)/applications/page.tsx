"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Code,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Briefcase,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import gsap from "gsap";

// Mock data – replace with API later
type ApplicationStage = keyof typeof stageConfig;

const applications: Array<{
  id: number;
  company: string;
  position: string;
  location: string;
  appliedDate: string;
  stage: ApplicationStage;
  interviewDate?: string;
  offerDetails?: { salary: string; deadline: string };
  rejectionReason?: string;
}> = [
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

const stageConfig = {
  under_review: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    icon: Clock,
  },
  assessment_pending: {
    label: "Assessment Pending",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: AlertCircle,
  },
  assessment_scheduled: {
    label: "Assessment Scheduled",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    icon: Code,
  },
  interview_scheduled: {
    label: "Interview Scheduled",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    icon: MessageSquare,
  },
  offer: {
    label: "Offer Received",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: CheckCircle,
  },
  rejected: {
    label: "Not Selected",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
  },
};

export default function ApplicationsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [scheduleDialog, setScheduleDialog] = useState<number | null>(null);
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

  const scheduleAssessment = (appId: number) => {
    console.log("Scheduling assessment for", appId, selectedDate, selectedTime);
    setScheduleDialog(null);
    // Reset selection
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  return (
    <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header with artistic touch */}
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
              <Card
                key={i}
                className="border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-pulse"
              >
                <CardContent className="p-6">
                  <div className="h-6 w-48 bg-[#D6CDC2] dark:bg-slate-700 rounded mb-2" />
                  <div className="h-4 w-32 bg-[#D6CDC2] dark:bg-slate-700 rounded" />
                </CardContent>
              </Card>
            ))
          ) : (
            applications.map((app) => {
              const StageIcon = stageConfig[app.stage].icon;
              return (
                <motion.div
                  key={app.id}
                  className="application-card"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                              {app.position}
                            </h3>
                            <Badge
                              className={cn(
                                "stage-badge border-none flex items-center gap-1",
                                stageConfig[app.stage].color
                              )}
                            >
                              <StageIcon className="h-3 w-3" />
                              {stageConfig[app.stage].label}
                            </Badge>
                          </div>
                          <p className="text-[#5A534A] dark:text-slate-400">
                            {app.company}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-[#A69A8C] flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {app.location}
                            </span>
                            <span className="text-xs text-[#A69A8C] flex items-center">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              Applied {new Date(app.appliedDate).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Stage-specific actions */}
                          {app.stage === "assessment_pending" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 p-4 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-lg border border-amber-200 dark:border-amber-800"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-amber-600" />
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                                  Action Required: Schedule Assessment
                                </p>
                              </div>
                              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                                Please schedule your assessment test to proceed.
                              </p>
                              <Button
                                size="sm"
                                onClick={() => setScheduleDialog(app.id)}
                                variant="outline"
                                className="border-amber-600 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                              >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Schedule Now
                              </Button>
                            </motion.div>
                          )}

                          {app.stage === "interview_scheduled" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 p-4 bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm rounded-lg border border-indigo-200 dark:border-indigo-800"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="h-4 w-4 text-indigo-600" />
                                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                                  AI Interview Scheduled
                                </p>
                              </div>
                              <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-3">
                                {new Date(app.interviewDate!).toLocaleString()}
                              </p>
                              <Link href={`/candidate/interview?applicationId=${app.id}&company=${encodeURIComponent(app.company)}&position=${encodeURIComponent(app.position)}`}>
                                <Button
                                  size="sm"
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                  Join Interview
                                </Button>
                              </Link>
                            </motion.div>
                          )}

                          {app.stage === "offer" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 p-4 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm rounded-lg border border-green-200 dark:border-green-800"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <p className="text-sm font-medium text-green-900 dark:text-green-300">
                                  Congratulations!
                                </p>
                              </div>
                              <p className="text-sm text-green-700 dark:text-green-400 mb-1">
                                Salary: {app.offerDetails?.salary}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-500 mb-3">
                                Respond by:{" "}
                                {new Date(app.offerDetails?.deadline!).toLocaleDateString()}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Accept
                                </Button>
                                <Button size="sm" variant="outline">
                                  Decline
                                </Button>
                              </div>
                            </motion.div>
                          )}

                          {app.stage === "rejected" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3 }}
                              className="mt-4 p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-lg border border-red-200 dark:border-red-800"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <p className="text-sm font-medium text-red-900 dark:text-red-300">
                                  Application Closed
                                </p>
                              </div>
                              <p className="text-sm text-red-700 dark:text-red-400">
                                {app.rejectionReason}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Schedule Assessment Dialog */}
      <Dialog open={scheduleDialog !== null} onOpenChange={() => setScheduleDialog(null)}>
        <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="text-[#2D2A24] dark:text-white">
              Schedule Assessment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start border-[#D6CDC2] text-[#4A443C]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#B8915C]" />
                  {selectedDate ? selectedDate.toDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>

            <div className="grid grid-cols-3 gap-2">
              {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map(
                (time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                    className={
                      selectedTime === time
                        ? "bg-[#B8915C] hover:bg-[#9F7A4F]"
                        : "border-[#D6CDC2] text-[#4A443C]"
                    }
                  >
                    {time}
                  </Button>
                )
              )}
            </div>

            <Button
              onClick={() => scheduleAssessment(scheduleDialog!)}
              disabled={!selectedDate || !selectedTime}
              className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]"
            >
              Confirm Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper for classnames (if you don't have cn utility, you can use clsx)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}