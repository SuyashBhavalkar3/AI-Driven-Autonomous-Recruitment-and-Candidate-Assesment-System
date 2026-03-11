"use client";

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import Loader from "@/components/Loader";

// --- Data (unchanged) ---
const stats = [
  {
    label: "Active Jobs",
    value: "8",
    icon: Briefcase,
    gradient: "from-amber-500 to-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "Total Applicants",
    value: "156",
    icon: Users,
    gradient: "from-yellow-500 to-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    textColor: "text-yellow-600 dark:text-yellow-400",
  },
  {
    label: "Pending Review",
    value: "42",
    icon: Clock,
    gradient: "from-orange-500 to-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  {
    label: "Hired",
    value: "12",
    icon: CheckCircle,
    gradient: "from-stone-500 to-stone-400",
    bg: "bg-stone-50 dark:bg-stone-950/20",
    iconBg: "bg-stone-100 dark:bg-stone-900/30",
    textColor: "text-stone-600 dark:text-stone-400",
  },
];

const recentJobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    applicants: 45,
    status: "active",
    posted: "2d ago",
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    applicants: 67,
    status: "active",
    posted: "1w ago",
  },
  {
    id: 3,
    title: "Backend Developer",
    applicants: 32,
    status: "active",
    posted: "3d ago",
  },
];

const recentApplicants = [
  {
    id: 1,
    name: "John Doe",
    position: "Senior Frontend Developer",
    score: 92,
    status: "interview",
  },
  {
    id: 2,
    name: "Jane Smith",
    position: "Full Stack Engineer",
    score: 88,
    status: "assessment",
  },
  {
    id: 3,
    name: "Mike Johnson",
    position: "Backend Developer",
    score: 85,
    status: "review",
  },
];

const hiringFunnel = [
  { stage: "Applied", count: 156, color: "bg-amber-400" },
  { stage: "Screened", count: 98, color: "bg-amber-500" },
  { stage: "Assessment", count: 54, color: "bg-amber-600" },
  { stage: "Interview", count: 28, color: "bg-amber-700" },
  { stage: "Offer", count: 12, color: "bg-amber-800" },
];

const monthlyHiring = [
  { month: "Jan", hired: 3 },
  { month: "Feb", hired: 5 },
  { month: "Mar", hired: 4 },
  { month: "Apr", hired: 6 },
  { month: "May", hired: 8 },
  { month: "Jun", hired: 7 },
];

const statusColors = {
  active:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  interview:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-0",
  assessment:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0",
  review:
    "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300 border-0",
};

export default function HRDashboard() {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const funnelRef = useRef<HTMLDivElement>(null);
  const trendRef = useRef<HTMLDivElement>(null);
  const jobsRef = useRef<HTMLDivElement>(null);
  const applicantsRef = useRef<HTMLDivElement>(null);

  // Track loading state for animations
  const [animationsReady, setAnimationsReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Calculate max values
  const maxFunnel = Math.max(...hiringFunnel.map((d) => d.count));
  const maxHired = Math.max(...monthlyHiring.map((d) => d.hired));

  // If data is missing, show placeholders
  const hasJobs = recentJobs.length > 0;
  const hasApplicants = recentApplicants.length > 0;

  useEffect(() => {
    // Simulate API loading
    const loadData = async () => {
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    // Simple fade-in effect without GSAP
    if (containerRef.current && !loading) {
      containerRef.current.style.opacity = "1";
    }
    setAnimationsReady(true);
  }, [loading]);

  if (loading) {
    return <Loader fullPage={true} />;
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900"
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
              Welcome back! Here's your recruitment overview.
            </p>
          </div>
          <Link href="/hr/jobs/new">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group">
              <PlusCircle className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Post New Job
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
        >
          {stats.map((stat) => (
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
                <div className={`mt-4 h-1 w-12 bg-gradient-to-r ${stat.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hiring Funnel */}
          <Card
            ref={funnelRef}
            className="border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-lg transition-shadow duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  Hiring Funnel
                </h3>
                <span className="text-xs text-stone-400">Real-time</span>
              </div>
              <div className="space-y-4">
                {hiringFunnel.map((stage) => (
                  <div key={stage.stage} className="relative group">
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="text-stone-600 dark:text-stone-300">
                        {stage.stage}
                      </span>
                      <span className="font-medium text-stone-900 dark:text-white">
                        {stage.count}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className={`funnel-bar h-full rounded-full ${stage.color} group-hover:brightness-110 transition-all duration-300`}
                        style={{ width: 0 }}
                      />
                    </div>
                    <div className="absolute right-0 -top-8 bg-stone-800 text-white text-xs py-1 px-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {stage.count} candidates
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Hiring */}
          <Card
            ref={trendRef}
            className="border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-lg transition-shadow duration-300"
          >
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
                        className="trend-bar w-full bg-gradient-to-t from-amber-500 to-stone-500 rounded-t group-hover:from-amber-600 group-hover:to-stone-600 transition-all duration-300"
                        style={{ height: 0 }}
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

        {/* Recent Jobs and Top Applicants */}
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
            <div ref={jobsRef} className="space-y-3 min-h-[200px]">
              {!hasJobs && (
                <div className="flex items-center justify-center h-32 text-stone-400">
                  No recent jobs
                </div>
              )}
              {hasJobs &&
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
                              <Users className="h-3.5 w-3.5" />
                              {job.applicants} applicants
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {job.posted}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[job.status as keyof typeof statusColors]}>
                            {job.status}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>

          {/* Top Applicants */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-stone-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Top Applicants
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
            <div ref={applicantsRef} className="space-y-3 min-h-[200px]">
              {!hasApplicants && (
                <div className="flex items-center justify-center h-32 text-stone-400">
                  No recent applicants
                </div>
              )}
              {hasApplicants &&
                recentApplicants.map((applicant) => (
                  <Card
                    key={applicant.id}
                    className="group border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-stone-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {applicant.name}
                          </h3>
                          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                            {applicant.position}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded">
                              {applicant.score}% match
                            </span>
                            <Badge className={statusColors[applicant.status as keyof typeof statusColors]}>
                              {applicant.status}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>

        {/* Loading state indicator */}
        {!animationsReady && (
          <div className="fixed bottom-4 right-4 bg-white dark:bg-stone-800 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading dashboard...
          </div>
        )}
      </div>
    </div>
  );
}