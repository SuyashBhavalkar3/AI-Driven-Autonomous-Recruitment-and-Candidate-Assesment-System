"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CalendarIcon, CheckCircle, Code, MapPin, MessageSquare, XCircle } from "lucide-react";
import {
  Clock,
  LucideIcon,
} from "lucide-react";



import Link from "next/link";
import { motion } from "framer-motion";

 type ApplicationStage =
  | "under_review"
  | "assessment_pending"
  | "assessment_scheduled"
  | "assessment_completed"
  | "interview_scheduled"
  | "offer"
  | "rejected";

 interface Application {
  id: number;
  job_id: number;
  status: string;
  resume_match_score?: number;
  assessment_score?: number;
  interview_score?: number;
  created_at: string;
  
  // Enhanced fields from backend
  job?: {
    id: number;
    title: string;
    description: string;
    location: string;
    salary_range?: string;
    required_skills?: string[];
  };
  company?: {
    name: string;
    website?: string;
    description?: string;
  };
  status_display?: {
    status: string;
    description: string;
    action?: string;
  };
}


 const stageConfig: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
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
  assessment_completed: {
    label: "Assessment Completed",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    icon: CheckCircle,
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

// Helper for classNames
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface ApplicationCardProps {
  application: Application;
  onTakeAssessment: (id: number) => void;
  onScheduleInterview: (id: number) => void;
}

export function ApplicationCard({
  application,
  onTakeAssessment,
  onScheduleInterview,
}: ApplicationCardProps) {
  // Get display data with fallbacks
  const position = application.job?.title || "Unknown Position";
  const company = application.company?.name || "Unknown Company";
  const location = application.job?.location || "Unknown Location";
  const statusDisplay = application.status_display?.status || "Under Review";
  const statusDescription = application.status_display?.description || "Your application is being processed";
  const action = application.status_display?.action;
  
  // Determine icon and color based on status
  const getStatusConfig = () => {
    const status = application.status_display?.status?.toLowerCase() || "under review";
    
    if (status.includes("assessment")) {
      return {
        icon: Code,
        color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      };
    } else if (status.includes("interview")) {
      return {
        icon: MessageSquare,
        color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
      };
    } else if (status.includes("accepted") || status.includes("qualified")) {
      return {
        icon: CheckCircle,
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      };
    } else if (status.includes("rejected") || status.includes("failed") || status.includes("not selected")) {
      return {
        icon: XCircle,
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      };
    } else {
      return {
        icon: Clock,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      };
    }
  };
  
  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      className="application-card"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <div className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                {position}
              </h3>
              <Badge
                className={cn(
                  "stage-badge border-none flex items-center gap-1",
                  statusConfig.color
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {statusDisplay}
              </Badge>
            </div>
            <p className="text-[#5A534A] dark:text-slate-400">
              {company}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-[#A69A8C] flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {location}
              </span>
              <span className="text-xs text-[#A69A8C] flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                Applied {new Date(application.created_at || new Date()).toLocaleDateString()}
              </span>
            </div>

            {/* Status description */}
            <div className="mt-3 p-3 bg-gray-50/80 dark:bg-slate-800/50 rounded-lg">
              <p className="text-sm text-[#5A534A] dark:text-slate-400">
                {statusDescription}
              </p>
              
              {/* Show scores if available */}
              {application.resume_match_score && (
                <p className="text-xs text-[#A69A8C] mt-1">
                  Resume Match: {application.resume_match_score.toFixed(0)}%
                </p>
              )}
              {application.assessment_score && (
                <p className="text-xs text-[#A69A8C] mt-1">
                  Assessment Score: {application.assessment_score.toFixed(0)}%
                </p>
              )}
            </div>

            {/* Action buttons based on status */}
            {action === "take_assessment" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <Button
                  size="sm"
                  onClick={() => onTakeAssessment(application.id)}
                  className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                >
                  <Code className="h-4 w-4 mr-2" />
                  Take Assessment
                </Button>
              </motion.div>
            )}

            {action === "take_interview" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <Link href={`/candidate/interview/${application.id}`}>
                  <Button
                    size="sm"
                    className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Interview
                  </Button>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}