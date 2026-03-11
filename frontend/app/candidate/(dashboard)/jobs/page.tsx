"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { calculateProfileCompletion, UserProfile } from "@/lib/profileCompletion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { jobsAPI } from "@/lib/api";
import { Job } from "@/lib/types";

// Mock user profile - replace with actual data from backend
const mockUserProfile: UserProfile = {
  fullName: "John Doe",
  email: "john@example.com",
  phone: "",
  location: "",
  bio: "",
  skills: [],
  resume: "",
  experiences: [],
};

type ApplicationStatus = "idle" | "applying" | "success" | "rejected";

export default function JobsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Check profile completion
  const profileStatus = calculateProfileCompletion(mockUserProfile);

  // Fetch jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await jobsAPI.getAllJobs();
        console.log('Jobs response:', response);
        setJobs(response.jobs || []);
      } catch (err: any) {
        const errorMsg = err.message || "Failed to load jobs. Please try again later.";
        setError(errorMsg);
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
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

  // GSAP entrance animations
  useEffect(() => {
    if (!loading && cardsRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".filter-card", {
          y: -20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        });
        gsap.from(".job-card", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
        });
      }, cardsRef);
      return () => ctx.revert();
    }
  }, [loading]);

  // Auto-redirect to profile if incomplete
  useEffect(() => {
    if (!profileStatus.isComplete) {
      const timer = setTimeout(() => {
        router.push("/candidate/profile");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profileStatus.isComplete, router]);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = location === "" || job.location.toLowerCase().includes(location.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const handleApply = (job: Job) => {
    if (!profileStatus.isComplete) {
      return;
    }
    router.push(`/candidate/jobs/${job.id}`);
  };

  const submitApplication = async () => {
    setApplicationStatus("applying");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const score = Math.floor(Math.random() * 40) + 60;
    setMatchScore(score);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setApplicationStatus(score >= 70 ? "success" : "rejected");
  };

  return (
    <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles}
      </div>

      <div ref={cardsRef} className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white mb-2 flex items-center gap-2">
              Find Your Next Opportunity
              <Sparkles className="h-6 w-6 text-[#B8915C] animate-pulse" />
            </h1>
            <p className="text-[#5A534A] dark:text-slate-400">
              Discover roles that match your expertise
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-[#B8915C]/30 text-[#B8915C] bg-white/50 backdrop-blur-sm"
          >
            {filteredJobs.length} jobs found
          </Badge>
        </motion.div>

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4 flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Search/Filter Card */}
        <Card className="filter-card mb-8 border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A69A8C]" />
                <Input
                  placeholder="Job title or keyword"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A69A8C]" />
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <div className="space-y-4">
          {loading ? (
            // Skeleton loaders
            [...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="border-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm animate-pulse"
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#D6CDC2] dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-48 bg-[#D6CDC2] dark:bg-slate-700 rounded" />
                      <div className="h-4 w-32 bg-[#D6CDC2] dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                className="job-card"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20 hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#B8915C] to-[#9F7A4F] flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {job.title.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                              {job.title}
                            </h3>
                            <p className="text-[#5A534A] dark:text-slate-400 mt-1">
                              {job.company_name || "Company"}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleApply(job)}
                            size="sm"
                            className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                          >
                            View Details
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#5A534A] dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {job.salary_range}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.experience_required}+ years
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-3 text-[#5A534A] dark:text-slate-400 text-sm line-clamp-2">
                          {job.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {job.required_skills.slice(0, 4).map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="border-[#B8915C]/30 text-[#B8915C]"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {job.required_skills.length > 4 && (
                            <Badge
                              variant="outline"
                              className="border-[#B8915C]/30 text-[#B8915C]"
                            >
                              +{job.required_skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}