"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

import {
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  PlusCircle,
  BarChart3,
  Sparkles,
  ChevronRight,
  Eye,
  Award,
  Loader2,

  AlertCircle,
} from "lucide-react";
import Loader from "@/components/Loader";
import { getAuthToken, getUserRole } from "@/lib/auth";


// Types for API responses
interface StatsResponse {
  total_jobs: number;
  total_applications: number;
  pending_review: number;
  in_assessment: number;
  in_interview: number;
  hired_total: number;
  rejected: number;
  hired_this_month: number;
  applications_this_month: number;
}

interface RecentApplicant {
  id: number;
  candidate_id: number;
  job_title: string;
  status: string;
  resume_score: number | null;
  assessment_score: number | null;
  interview_score: number | null;
  final_score: number | null;
  applied_at: string;
}

interface Job {
  id: number;
  title: string;
  created_by: number;
  created_at: string;
  // other fields omitted
}

interface HRProfile {
  id: number;
  name: string;
  email: string;
  company: string;
  created_at: string;
}

// --- Static data for charts (can be replaced with API later) ---
const hiringFunnel = [
  { stage: "Pending", countKey: "pending_review", color: "bg-amber-400" },
  { stage: "Assessment", countKey: "in_assessment", color: "bg-amber-500" },
  { stage: "Interview", countKey: "in_interview", color: "bg-amber-600" },
  { stage: "Hired", countKey: "hired_total", color: "bg-amber-700" },
];

const monthlyHiring = [
  { month: "Jan", hired: 3 },
  { month: "Feb", hired: 5 },
  { month: "Mar", hired: 4 },
  { month: "Apr", hired: 6 },
  { month: "May", hired: 8 },
  { month: "Jun", hired: 7 },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  assessment_scheduled: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0",
  assessment_completed: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0",
  interview_scheduled: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-0",
  interview_completed: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-0",
  accepted: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0",
  rejected: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300 border-0",
};

// Helper to format status for display
const formatStatus = (status: string) => {
  return status
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function HRDashboard() {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recentApplicants, setRecentApplicants] = useState<RecentApplicant[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [hrProfile, setHrProfile] = useState<HRProfile | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // Check role
        const role = getUserRole();
        if (role !== "hr") {
          setError("You don't have permission to view this page.");
          setLoading(false);
          return;
        }

        // Fetch HR profile to get user id (for filtering jobs)
        const profileRes = await fetch("http://localhost:8000/v1/profile/hr", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileRes.json();
        setHrProfile(profileData);

        // Fetch stats
        const statsRes = await fetch("http://localhost:8000/v1/hr/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!statsRes.ok) throw new Error("Failed to fetch stats");
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch recent applicants
        const applicantsRes = await fetch(
          "http://localhost:8000/v1/hr/dashboard/recent-applicants?limit=3",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!applicantsRes.ok) throw new Error("Failed to fetch recent applicants");
        const applicantsData = await applicantsRes.json();
        setRecentApplicants(applicantsData);

        // Fetch all jobs and filter by current user
        const jobsRes = await fetch("http://localhost:8000/jobs/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!jobsRes.ok) throw new Error("Failed to fetch jobs");
        const jobsData = await jobsRes.json();
        const userJobs = (jobsData.jobs || []).filter(
          (job: Job) => job.created_by === profileData.id
        );
        // Sort by most recent and take first 3
        userJobs.sort(
          (a: Job, b: Job) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentJobs(userJobs.slice(0, 3));
      } catch (err: any) {
        console.error("Error loading dashboard:", err);
        setError(err.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  // Fade-in effect when loaded
  useEffect(() => {
    if (containerRef.current && !loading) {
      containerRef.current.style.opacity = "1";
    }
  }, [loading]);

  if (loading) {
    return <Loader fullPage={true} />;
  }

  // Prepare stats for display
  const statCards = stats
    ? [
        {
          label: "Active Jobs",
          value: stats.total_jobs.toString(),
          icon: Briefcase,
          gradient: "from-amber-500 to-amber-400",
          bg: "bg-amber-50 dark:bg-amber-950/20",
          iconBg: "bg-amber-100 dark:bg-amber-900/30",
          textColor: "text-amber-600 dark:text-amber-400",
        },
        {
          label: "Total Applicants",
          value: stats.total_applications.toString(),
          icon: Users,
          gradient: "from-yellow-500 to-yellow-400",
          bg: "bg-yellow-50 dark:bg-yellow-950/20",
          iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
          textColor: "text-yellow-600 dark:text-yellow-400",
        },
        {
          label: "Pending Review",
          value: stats.pending_review.toString(),
          icon: Clock,
          gradient: "from-orange-500 to-orange-400",
          bg: "bg-orange-50 dark:bg-orange-950/20",
          iconBg: "bg-orange-100 dark:bg-orange-900/30",
          textColor: "text-orange-600 dark:text-orange-400",
        },
        {
          label: "Hired",
          value: stats.hired_total.toString(),
          icon: CheckCircle,
          gradient: "from-stone-500 to-stone-400",
          bg: "bg-stone-50 dark:bg-stone-950/20",
          iconBg: "bg-stone-100 dark:bg-stone-900/30",
          textColor: "text-stone-600 dark:text-stone-400",
        },
      ]
    : [];

  // Max values for funnel bars
  const maxFunnel = stats
    ? Math.max(
        stats.pending_review,
        stats.in_assessment,
        stats.in_interview,
        stats.hired_total
      )
    : 1;

  const maxHired = Math.max(...monthlyHiring.map((d) => d.hired));

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 opacity-0 transition-opacity duration-500"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-amber-200/[0.02] dark:bg-grid-stone-700/[0.02] -z-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-stone-900 dark:text-white flex items-center gap-3">
              <span>Dashboard</span>
              <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm md:text-base">
              Welcome back, {hrProfile?.name || "HR"}! Here's your recruitment overview.
            </p>
          </div>
          <Link href="/hr/jobs/new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group">
              <PlusCircle className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="group border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-semibold text-stone-900 dark:text-white mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                  </div>
                </div>
                <div
                  className={`mt-4 h-1 w-12 bg-gradient-to-r ${stat.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hiring Funnel */}
          <Card className="border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  Hiring Funnel
                </h3>
                <span className="text-xs text-stone-400">Live</span>
              </div>
              {stats ? (
                <div className="space-y-4">
                  {hiringFunnel.map((stage) => {
                    const count = stats[stage.countKey as keyof StatsResponse] as number;
                    const width = maxFunnel > 0 ? (count / maxFunnel) * 100 : 0;
                    return (
                      <div key={stage.stage} className="relative group">
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="text-stone-600 dark:text-stone-300">
                            {stage.stage}
                          </span>
                          <span className="font-medium text-stone-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${stage.color} group-hover:brightness-110 transition-all duration-300`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-stone-400">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Hiring (static for now) */}
          <Card className="border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  Monthly Hiring
                </h3>
                <span className="text-xs text-stone-400">Last 6 months</span>
              </div>
              <div className="flex items-end justify-between gap-2 h-48">
                {monthlyHiring.map((data) => (
                  <div
                    key={data.month}
                    className="flex-1 flex flex-col items-center gap-2 group"
                  >
                    <div className="w-full flex flex-col items-center justify-end h-full relative">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {data.hired}
                      </span>
                      <div
                        className="w-full bg-gradient-to-t from-amber-500 to-stone-500 rounded-t group-hover:from-amber-600 group-hover:to-stone-600 transition-all duration-300"
                        style={{
                          height: `${(data.hired / maxHired) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      {data.month}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Jobs and Recent Applicants */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-stone-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-500" />
                Recent Jobs
              </h2>
              <Link href="/hr/jobs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 hover:text-amber-700 group"
                >
                  View all
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {recentJobs.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-stone-400">
                  No jobs posted yet.
                </div>
              ) : (
                recentJobs.map((job) => (
                  <Card
                    key={job.id}
                    className="group border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-stone-500 dark:text-stone-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          asChild
                        >
                          <Link href={`/hr/jobs/${job.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Recent Applicants */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-stone-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Recent Applicants
              </h2>
              <Link href="/hr/applicants">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-600 hover:text-amber-700 group"
                >
                  View all
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3 min-h-[200px]">
              {recentApplicants.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-stone-400">
                  No recent applicants.
                </div>
              ) : (
                recentApplicants.map((applicant) => (
                  <Card
                    key={applicant.id}
                    className="group border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            Candidate #{applicant.candidate_id}
                          </h3>
                          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                            {applicant.job_title}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {applicant.resume_score && (
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">
                                {applicant.resume_score}% match
                              </span>
                            )}
                            <Badge className={statusColors[applicant.status.toLowerCase()] || ""}>
                              {formatStatus(applicant.status)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          asChild
                        >
                          <Link href={`/hr/applicants/${applicant.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}