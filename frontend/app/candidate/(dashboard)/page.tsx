"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import {
  Briefcase,
  FileText,
  Bell,
  Award,
  Clock,
  ArrowRight,
  Target,
  TrendingUp,
  Sparkles,
  MapPin,
  Calendar,
  Loader2,
  Settings,
} from "lucide-react";
import { getUserData, getAuthToken } from "@/lib/auth";
import { getCurrentUser } from "@/lib/api";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";
import { calculateProfileCompletion } from "@/lib/profileCompletion";
import Loader from "@/components/Loader";

// Mock API functions – replace with actual endpoints
const fetchDashboardStats = async () => {
  // Simulate API call
  return [
    { label: "Applications", value: 12, change: "+2 this week", icon: FileText },
    { label: "In Progress", value: 5, change: "3 interviews", icon: Briefcase },
    { label: "Interviews", value: 2, change: "1 upcoming", icon: Bell },
    { label: "Offers", value: 1, change: "pending response", icon: Award },
  ];
};

const fetchRecommendedJobs = async () => {
  return [
    { id: 1, title: "Senior Frontend Developer", company: "TechCorp", location: "Remote", match: 92 },
    { id: 2, title: "Full Stack Engineer", company: "InnovateLabs", location: "New York", match: 85 },
    { id: 3, title: "DevOps Engineer", company: "CloudTech", location: "Austin", match: 78 },
  ];
};

const fetchUpcomingInterviews = async () => {
  return [
    { id: 1, company: "TechCorp", position: "Frontend Developer", date: "Tomorrow, 2:00 PM", type: "Technical" },
    { id: 2, company: "InnovateLabs", position: "Full Stack", date: "Mar 12, 11:00 AM", type: "HR" },
  ];
};

export default function CandidateDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const statsRef = useRef<HTMLDivElement>(null);
  const jobsRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);

  // Load user data from auth
  useEffect(() => {
    const stored = getUserData();
    if (stored) setUserData(stored);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, jobsData, interviewsData] = await Promise.all([
          fetchDashboardStats(),
          fetchRecommendedJobs(),
          fetchUpcomingInterviews(),
        ]);
        setStats(statsData);
        setJobs(jobsData);
        setInterviews(interviewsData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Generate decorative particles (client-side only)
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

  // GSAP animations after data loads
  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        // Animate stat values (count-up)
        gsap.from(".stat-value", {
          textContent: 0,
          duration: 1.5,
          ease: "power1.out",
          snap: { textContent: 1 },
          stagger: 0.2,
        });

        // Animate stat cards
        gsap.from(".stat-card", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.2)",
        });

        // Animate job cards
        gsap.from(".job-card", {
          x: -20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.15,
          delay: 0.4,
          ease: "power3.out",
        });

        // Animate interview items
        gsap.from(".interview-item", {
          x: 20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.6,
          ease: "power3.out",
        });
      }, [statsRef, jobsRef]);

      return () => ctx.revert();
    }
  }, [loading]);

  // Profile completion calculation
  const profileStatus = calculateProfileCompletion({
    fullName: userData?.full_name || "",
    email: userData?.email || "",
    phone: "",
    location: "",
    bio: "",
    skills: [],
    resume: "",
    experiences: [],
  });

  if (loading) {
    return <Loader fullPage={true} />;
  }

  return (
    <div className="relative">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>

      {/* Soft gradient blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#B8915C]/5 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#9F7A4F]/5 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between relative z-10">
        <div>
          <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white mb-2 flex items-center gap-2">
            Welcome back, {userData?.full_name?.split(" ")[0] || "Candidate"}!
            <Sparkles className="h-6 w-6 text-[#B8915C] animate-pulse" />
          </h1>
          <p className="text-[#5A534A] dark:text-slate-400">
            Here's what's happening with your job search
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-[#B8915C]/30 text-[#B8915C] bg-white/50 backdrop-blur-sm"
        >
          <Calendar className="h-3 w-3 mr-1" />
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </Badge>
      </div>

      {/* Stats grid */}
      <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            className="stat-card"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[#5A534A] dark:text-slate-400">{stat.label}</p>
                  <div className="p-2 rounded-lg bg-[#B8915C]/10">
                    <stat.icon className="h-5 w-5 text-[#B8915C]" />
                  </div>
                </div>
                <p className="stat-value text-3xl font-bold text-[#2D2A24] dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-[#A69A8C] mt-2">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Profile completion card */}
      {!profileStatus.isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <ProfileCompletionCard status={profileStatus} showDetails={true} />
        </motion.div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column – jobs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
              Recommended for you
            </h2>
            <Link href="/candidate/jobs">
              <Button variant="ghost" size="sm" className="text-[#B8915C] hover:text-[#9F7A4F]">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div ref={jobsRef} className="space-y-4">
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                className="job-card"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#2D2A24] dark:text-white">
                          {job.title}
                        </h3>
                        <p className="text-sm text-[#5A534A] dark:text-slate-400 mt-1">
                          {job.company}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-[#A69A8C]">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </div>
                          <Badge className="bg-[#B8915C]/10 text-[#B8915C] border-none">
                            {job.match}% match
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" className="bg-[#B8915C] hover:bg-[#9F7A4F]">
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right column – interviews & quick actions */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white">Upcoming</h2>
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 space-y-3">
              {interviews.map((interview) => (
                <motion.div
                  key={interview.id}
                  className="interview-item"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="p-3 bg-[#F1E9E0] dark:bg-slate-800/50 rounded-lg cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full mt-2 bg-[#B8915C]" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#2D2A24] dark:text-white">
                          {interview.position} at {interview.company}
                        </p>
                        <p className="text-xs text-[#5A534A] dark:text-slate-400">
                          {interview.type} Interview
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-[#A69A8C]" />
                          <p className="text-xs text-[#5A534A] dark:text-slate-400">
                            {interview.date}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-[#2D2A24] dark:text-white mb-3">Quick actions</h3>
              <Link href="/candidate/jobs">
                <Button variant="outline" className="w-full justify-start border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]">
                  <Briefcase className="h-4 w-4 mr-2 text-[#B8915C]" />
                  Browse jobs
                </Button>
              </Link>
              <Link href="/candidate/applications">
                <Button variant="outline" className="w-full justify-start border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]">
                  <Target className="h-4 w-4 mr-2 text-[#B8915C]" />
                  Track applications
                </Button>
              </Link>
              <Link href="/candidate/profile">
                <Button variant="outline" className="w-full justify-start border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]">
                  <Settings className="h-4 w-4 mr-2 text-[#B8915C]" />
                  Update profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}