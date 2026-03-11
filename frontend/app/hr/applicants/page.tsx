"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  TrendingUp,
  Mail,
  Phone,
  FileText,
  Award,
  CheckCircle,
  Sparkles,
  Calendar,
  Briefcase,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Loader from "@/components/Loader";
import { getAuthToken, getUserRole } from "@/lib/auth";
import Link from "next/link";

// Types from backend
type ApplicationStatus =
  | "PENDING"
  | "RESUME_SCREENED"
  | "ASSESSMENT_SCHEDULED"
  | "ASSESSMENT_COMPLETED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "ACCEPTED"
  | "REJECTED";

interface Application {
  id: number;
  job_id: number;
  candidate_id: number;
  user_id: number;
  status: ApplicationStatus;
  resume_match_score: number | null;
  assessment_score: number | null;
  interview_score: number | null;
  final_score: number | null;
  created_at: string;
  updated_at: string;
  job_title?: string; // will be populated from job
  candidate_name?: string; // placeholder
  candidate_email?: string; // placeholder
  candidate_phone?: string; // placeholder
  candidate_skills?: string[]; // placeholder
  candidate_experience?: string; // placeholder
}

interface Job {
  id: number;
  title: string;
  created_by: number;
  required_skills: string[] | null;
  experience_required: number | null;
  // other fields
}

// Map backend status to our UI status
type UiStatus =
  | "under_review"
  | "assessment_completed"
  | "interview_completed"
  | "offered"
  | "rejected";

const mapStatus = (status: ApplicationStatus): UiStatus => {
  switch (status) {
    case "PENDING":
    case "RESUME_SCREENED":
    case "ASSESSMENT_SCHEDULED":
    case "INTERVIEW_SCHEDULED":
      return "under_review";
    case "ASSESSMENT_COMPLETED":
      return "assessment_completed";
    case "INTERVIEW_COMPLETED":
      return "interview_completed";
    case "ACCEPTED":
      return "offered";
    case "REJECTED":
      return "rejected";
    default:
      return "under_review";
  }
};

const statusConfig: Record<UiStatus, { label: string; color: string }> = {
  under_review: {
    label: "Under Review",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  },
  assessment_completed: {
    label: "Assessment Done",
    color: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300 border-0",
  },
  interview_completed: {
    label: "Interview Done",
    color: "bg-amber-200 text-amber-800 dark:bg-amber-800/30 dark:text-amber-200 border-0",
  },
  offered: {
    label: "Offered",
    color: "bg-amber-600 text-white dark:bg-amber-700 dark:text-white border-0",
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-0",
  },
};

export default function ApplicantsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("matchScore");
  const [filterStatus, setFilterStatus] = useState<UiStatus | "all">("all");
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [updating, setUpdating] = useState<number | null>(null); // application id being updated

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const role = getUserRole();
        if (role !== "hr") {
          setError("You don't have permission to view this page.");
          setLoading(false);
          return;
        }

        // 1. Fetch HR profile to get user id
        const profileRes = await fetch("http://localhost:8000/v1/profile/hr", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch profile");
        const profile = await profileRes.json();
        const hrUserId = profile.id;

        // 2. Fetch all jobs
        const jobsRes = await fetch("http://localhost:8000/jobs/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!jobsRes.ok) throw new Error("Failed to fetch jobs");
        const jobsData = await jobsRes.json();
        const allJobs: Job[] = jobsData.jobs || [];

        // Filter jobs created by this HR
        const hrJobs = allJobs.filter((job) => job.created_by === hrUserId);

        if (hrJobs.length === 0) {
          setApplications([]);
          setLoading(false);
          return;
        }

        // 3. For each job, fetch applicants
        const allApplications: Application[] = [];
        for (const job of hrJobs) {
          const applicantsRes = await fetch(
            `http://localhost:8000/v1/applications/job/${job.id}/applicants`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!applicantsRes.ok) {
            console.warn(`Failed to fetch applicants for job ${job.id}`);
            continue;
          }
          const applicantsData: Application[] = await applicantsRes.json();
          // Attach job title to each application
          applicantsData.forEach((app) => {
            console.log(app);
            app.job_title = job.title;
            // Placeholder fields – you could extend backend to include candidate details
            app.candidate_name = `${app.candidate_name}`;
            app.candidate_email = `${app.candidate_email}@example.com`;
            app.candidate_phone = app.candidate_phone;
            app.candidate_skills = app.candidate_skills || [];
            app.candidate_experience = app.candidate_experience
              ? `${job.experience_required}+ years`
              : "N/A";
          });
          allApplications.push(...applicantsData);
        }

        // Sort by most recent first
        allApplications.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setApplications(allApplications);
      } catch (err: any) {
        console.error("Error loading applicants:", err);
        setError(err.message || "Failed to load applicants.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleStatusUpdate = async (applicationId: number, newStatus: ApplicationStatus) => {
    setUpdating(applicationId);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(
        `http://localhost:8000/v1/applications/application/${applicationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update status");
      }

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      if (selectedApplicant?.id === applicationId) {
        setSelectedApplicant((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const getOverallScore = (app: Application) => {
    const scores = [app.resume_match_score, app.assessment_score, app.interview_score].filter(
      (s) => s !== null && s !== undefined
    ) as number[];
    if (scores.length === 0) return app.resume_match_score || 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const filteredAndSorted = applications
    .filter((app) => {
      const matchesSearch =
        (app.candidate_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (app.job_title?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || mapStatus(app.status) === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "matchScore") return (b.resume_match_score || 0) - (a.resume_match_score || 0);
      if (sortBy === "assessmentScore") return (b.assessment_score || 0) - (a.assessment_score || 0);
      if (sortBy === "interviewScore") return (b.interview_score || 0) - (a.interview_score || 0);
      return 0;
    });

  if (loading) {
    return <Loader fullPage={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-900 dark:text-white flex items-center gap-2">
            Applicants
            <Sparkles className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Review and manage all applicants
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters Card */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search by name or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matchScore">Match Score</SelectItem>
                  <SelectItem value="assessmentScore">Assessment Score</SelectItem>
                  <SelectItem value="interviewScore">Interview Score</SelectItem>
                </SelectContent>
              </Select>
              {/* Filter by status */}
              <Select
                value={filterStatus}
                onValueChange={(val) => setFilterStatus(val as UiStatus | "all")}
              >
                <SelectTrigger className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="assessment_completed">Assessment Done</SelectItem>
                  <SelectItem value="interview_completed">Interview Done</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applicant Cards */}
        <div className="space-y-4">
          {filteredAndSorted.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center text-stone-500 dark:text-stone-400">
                No applicants found.
              </CardContent>
            </Card>
          ) : (
            filteredAndSorted.map((applicant) => {
              const uiStatus = mapStatus(applicant.status);
              const overall = getOverallScore(applicant);
              return (
                <Card
                  key={applicant.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Name and Status */}
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                            {applicant.candidate_name}
                          </h3>
                          <Badge className={statusConfig[uiStatus].color}>
                            {statusConfig[uiStatus].label}
                          </Badge>
                        </div>
                        {/* Position */}
                        <p className="text-stone-600 dark:text-stone-400 mb-3">
                          {applicant.job_title}
                        </p>

                        {/* Scores */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                            <TrendingUp className="h-4 w-4 text-amber-500" />
                            <span className="text-stone-600 dark:text-stone-400">
                              Match:
                            </span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {applicant.resume_match_score ?? "N/A"}%
                            </span>
                          </div>
                          {applicant.assessment_score && (
                            <div className="flex items-center gap-2 text-sm bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                              <FileText className="h-4 w-4 text-stone-500" />
                              <span className="text-stone-600 dark:text-stone-400">
                                Assessment:
                              </span>
                              <span className="font-semibold text-stone-600 dark:text-stone-400">
                                {applicant.assessment_score}%
                              </span>
                            </div>
                          )}
                          {applicant.interview_score && (
                            <div className="flex items-center gap-2 text-sm bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                              <Award className="h-4 w-4 text-amber-500" />
                              <span className="text-stone-600 dark:text-stone-400">
                                Interview:
                              </span>
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                {applicant.interview_score}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Meta info: Overall score, experience, applied date */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-stone-500 dark:text-stone-400">
                              Overall:
                            </span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full ${
                                overall >= 90
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                  : overall >= 80
                                  ? "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300"
                                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                              }`}
                            >
                              {overall}%
                            </span>
                          </div>
                          <span className="text-stone-400">•</span>
                          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                            <Briefcase className="h-4 w-4" />
                            {applicant.candidate_experience}
                          </div>
                          <span className="text-stone-400">•</span>
                          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                            <Calendar className="h-4 w-4" />
                            Applied {new Date(applicant.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedApplicant(applicant)}
                          className="border-stone-200 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                          View Details
                        </Button>
                        {uiStatus === "interview_completed" && overall >= 85 && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(applicant.id, "ACCEPTED")}
                            disabled={updating === applicant.id}
                            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-300"
                          >
                            {updating === applicant.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Send Offer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Applicant Details Dialog */}
        <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
          <DialogContent className="max-w-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-stone-900 dark:text-white">
                {selectedApplicant?.candidate_name}
              </DialogTitle>
            </DialogHeader>
            {selectedApplicant && (
              <div className="space-y-5">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                    Contact
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-amber-500" />
                      <span className="text-stone-700 dark:text-stone-300">
                        {selectedApplicant.candidate_email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-amber-500" />
                      <span className="text-stone-700 dark:text-stone-300">
                        {selectedApplicant.candidate_phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.candidate_skills?.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Scores */}
                <div>
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                    Scores
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                      <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Match</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {selectedApplicant.resume_match_score ?? "N/A"}%
                      </p>
                    </div>
                    {selectedApplicant.assessment_score && (
                      <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-center">
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Assessment</p>
                        <p className="text-2xl font-bold text-stone-600 dark:text-stone-400">
                          {selectedApplicant.assessment_score}%
                        </p>
                      </div>
                    )}
                    {selectedApplicant.interview_score && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Interview</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {selectedApplicant.interview_score}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {mapStatus(selectedApplicant.status) === "interview_completed" &&
                    getOverallScore(selectedApplicant) >= 85 && (
                      <Button
                        onClick={() => handleStatusUpdate(selectedApplicant.id, "ACCEPTED")}
                        disabled={updating === selectedApplicant.id}
                        className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg"
                      >
                        {updating === selectedApplicant.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Send Offer
                      </Button>
                    )}
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedApplicant.id, "REJECTED")}
                    disabled={updating === selectedApplicant.id}
                    className="border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    {updating === selectedApplicant.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      "Reject"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}