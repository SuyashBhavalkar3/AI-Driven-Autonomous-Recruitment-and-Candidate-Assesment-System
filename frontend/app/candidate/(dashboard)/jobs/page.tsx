"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { calculateProfileCompletion, UserProfile } from "@/lib/profileCompletion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import Loader from "@/components/Loader";

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

const jobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp",
    logo: "TC",
    location: "San Francisco, CA",
    workMode: "Remote",
    salary: "$120k - $150k",
    type: "Full-time",
    posted: "2d ago",
    description:
      "We are looking for a senior frontend developer with React expertise to build next-generation web applications.",
    skills: ["React", "TypeScript", "Tailwind", "Next.js"],
    experience: "5+ years",
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    company: "InnovateLabs",
    logo: "IL",
    location: "New York, NY",
    workMode: "Hybrid",
    salary: "$130k - $160k",
    type: "Full-time",
    posted: "1w ago",
    description:
      "Join our team to build scalable applications that impact millions of users worldwide.",
    skills: ["Node.js", "React", "PostgreSQL", "AWS"],
    experience: "3-5 years",
  },
  {
    id: 3,
    title: "Backend Developer",
    company: "DataFlow Inc",
    logo: "DF",
    location: "Austin, TX",
    workMode: "On-site",
    salary: "$110k - $140k",
    type: "Full-time",
    posted: "3d ago",
    description:
      "Build robust APIs and microservices for our data processing platform.",
    skills: ["Python", "Django", "Redis", "Docker"],
    experience: "4+ years",
  },
];

type ApplicationStatus = "idle" | "applying" | "success" | "rejected";

export default function JobsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("all"); // Changed initial to "all"
  const [selectedJob, setSelectedJob] = useState<typeof jobs[0] | null>(null);
  const [applicationStatus, setApplicationStatus] =
    useState<ApplicationStatus>("idle");
  const [coverLetter, setCoverLetter] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);
  const cardsRef = useRef<HTMLDivElement>(null);

  // Check profile completion
  const profileStatus = calculateProfileCompletion(mockUserProfile);

  // Simulate loading
  useEffect(() => {
    const loadJobs = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load jobs:', error);
        setLoading(false);
      }
    };
    loadJobs();
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

  // Auto-redirect to profile if incomplete after 3 seconds
  useEffect(() => {
    if (!profileStatus.isComplete && selectedJob) {
      const timer = setTimeout(() => {
        router.push("/candidate/profile");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profileStatus.isComplete, selectedJob, router]);

  const filteredJobs = jobs.filter((job) => {
    // Simplified filter: if jobType is "all", include all jobs; otherwise match type
    return (
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (location === "" ||
        job.location.toLowerCase().includes(location.toLowerCase())) &&
      (jobType === "all" || job.type === jobType)
    );
  });

  const handleApply = (job: typeof jobs[0]) => {
    // Removed early return – dialog opens even if profile incomplete
    setSelectedJob(job);
    setApplicationStatus("idle");
    setCoverLetter("");
    setMatchScore(null);
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
      {loading && <Loader fullPage={true} />}

      {!loading && (
        <>
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

            {/* Search/Filter Card */}
            <Card className="filter-card mb-8 border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]">
                      <SelectValue placeholder="Job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
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
                            {job.logo}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[#2D2A24] dark:text-white">
                                  {job.title}
                                </h3>
                                <p className="text-[#5A534A] dark:text-slate-400 mt-1">
                                  {job.company}
                                </p>
                              </div>
                              <Button
                                onClick={() => handleApply(job)}
                                size="sm"
                                className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                              >
                                Apply
                              </Button>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[#5A534A] dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                              <Badge
                                variant="secondary"
                                className="bg-[#B8915C]/10 text-[#B8915C] border-none"
                              >
                                {job.workMode}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {job.salary}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {job.experience}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {job.posted}
                              </span>
                            </div>
                            <p className="mt-3 text-[#5A534A] dark:text-slate-400 text-sm line-clamp-2">
                              {job.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {job.skills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="border-[#B8915C]/30 text-[#B8915C]"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div> {/* Closes space-y-4 */}
          </div> {/* Closes cardsRef div */}
        </>
      )}

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2D2A24] dark:text-white">
              Apply for {selectedJob?.title}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Profile Incomplete Warning */}
            {!profileStatus.isComplete && (
              <motion.div
                key="incomplete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-2">
                        Complete Your Profile First
                      </h4>
                      <p className="text-sm text-amber-800 mb-3">
                        You need to complete your profile (100%) before applying for
                        jobs. Redirecting to profile page in 3 seconds...
                      </p>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm font-medium text-amber-900">
                          Missing:
                        </p>
                        <ul className="text-sm text-amber-800 list-disc list-inside">
                          {profileStatus.missingFields.map((field) => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/candidate/profile" className="flex-1">
                    <Button className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]">
                      Complete Profile
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedJob(null)}
                    className="flex-1 border-[#D6CDC2]"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {profileStatus.isComplete && applicationStatus === "idle" && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-medium text-[#4A443C] mb-2 block">
                    Cover Letter (Optional)
                  </label>
                  <Textarea
                    placeholder="Why are you a great fit for this role?"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                    className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                  />
                </div>
                <div className="bg-[#B8915C]/10 p-3 rounded-lg text-sm text-[#B8915C]">
                  Your application will be reviewed by AI to match your experience
                  with job requirements.
                </div>
                <Button
                  onClick={submitApplication}
                  className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]"
                >
                  Submit Application
                </Button>
              </motion.div>
            )}

            {profileStatus.isComplete && applicationStatus === "applying" && (
              <motion.div
                key="applying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center"
              >
                <Loader2 className="h-12 w-12 animate-spin text-[#B8915C] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#2D2A24] dark:text-white mb-2">
                  Analyzing Your Profile
                </h3>
                <p className="text-[#5A534A] dark:text-slate-400 text-sm">
                  Matching your experience with requirements...
                </p>
                {matchScore !== null && (
                  <motion.p
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="mt-4 text-lg font-semibold text-[#B8915C]"
                  >
                    Match Score: {matchScore}%
                  </motion.p>
                )}
              </motion.div>
            )}

            {profileStatus.isComplete && applicationStatus === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#2D2A24] dark:text-white mb-2">
                  Application Accepted!
                </h3>
                <p className="text-[#5A534A] dark:text-slate-400 mb-4">
                  Match score: {matchScore}%
                </p>
                <div className="bg-[#B8915C]/10 p-3 rounded-lg mb-4 text-sm text-[#B8915C]">
                  Next: Schedule your assessment test
                </div>
                <Button
                  onClick={() => setSelectedJob(null)}
                  className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]"
                >
                  View Applications
                </Button>
              </motion.div>
            )}

            {profileStatus.isComplete && applicationStatus === "rejected" && (
              <motion.div
                key="rejected"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="font-serif text-xl font-medium text-[#2D2A24] dark:text-white mb-2">
                  Application Not Matched
                </h3>
                <p className="text-[#5A534A] dark:text-slate-400 mb-4">
                  Score: {matchScore}% (minimum 70% required)
                </p>
                <Button
                  onClick={() => setSelectedJob(null)}
                  variant="outline"
                  className="w-full border-[#D6CDC2]"
                >
                  Browse More Jobs
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}