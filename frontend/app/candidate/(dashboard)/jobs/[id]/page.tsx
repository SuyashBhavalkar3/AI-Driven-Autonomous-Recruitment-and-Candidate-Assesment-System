"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { calculateProfileCompletion, UserProfile } from "@/lib/profileCompletion";

// Mock user profile (replace with actual data from auth context)
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

// Mock jobs data (same as in JobsPage)
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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.id);

  const [job, setJob] = useState<(typeof jobs)[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] =
    useState<ApplicationStatus>("idle");
  const [coverLetter, setCoverLetter] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);

  const profileStatus = calculateProfileCompletion(mockUserProfile);

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

  // Fetch job data
  useEffect(() => {
    const foundJob = jobs.find((j) => j.id === jobId);
    if (foundJob) {
      setJob(foundJob);
    }
    setLoading(false);
  }, [jobId]);

  const submitApplication = async () => {
    setApplicationStatus("applying");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const score = Math.floor(Math.random() * 40) + 60;
    setMatchScore(score);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setApplicationStatus(score >= 70 ? "success" : "rejected");
  };

  const handleApplyClick = () => {
    if (profileStatus.isComplete) {
      setApplyDialogOpen(true);
      setApplicationStatus("idle");
      setCoverLetter("");
      setMatchScore(null);
    } else {
      // Optionally, you could open a dialog warning instead of redirecting.
      // For now, we'll just open the dialog and show the warning inside it.
      setApplyDialogOpen(true);
      setApplicationStatus("idle");
    }
  };

  const resetDialog = () => {
    setApplyDialogOpen(false);
    setApplicationStatus("idle");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950 flex items-center justify-center">
        <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-none p-8 text-center">
          <h2 className="font-serif text-2xl text-[#2D2A24] dark:text-white mb-4">
            Job Not Found
          </h2>
          <p className="text-[#5A534A] dark:text-slate-400 mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/jobs">
            <Button className="bg-[#B8915C] hover:bg-[#9F7A4F]">
              Back to Jobs
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F9F6F0] dark:bg-slate-950 overflow-hidden">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-[#5A534A] hover:text-[#B8915C] hover:bg-[#B8915C]/10 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </motion.div>

        {/* Job Detail Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl border border-white/20">
            <CardContent className="p-8">
              {/* Header with company logo */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#B8915C] to-[#9F7A4F] flex items-center justify-center text-white font-semibold text-xl flex-shrink-0">
                  {job.logo}
                </div>
                <div className="flex-1">
                  <h1 className="font-serif text-3xl font-medium text-[#2D2A24] dark:text-white mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-[#B8915C]/30 text-[#B8915C] bg-white/50 backdrop-blur-sm"
                >
                  {job.type}
                </Badge>
              </div>

              {/* Key details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#F9F6F0]/50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-300">
                  <MapPin className="h-4 w-4 text-[#B8915C]" />
                  <span className="text-sm">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-300">
                  <Briefcase className="h-4 w-4 text-[#B8915C]" />
                  <span className="text-sm">{job.workMode}</span>
                </div>
                <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-300">
                  <DollarSign className="h-4 w-4 text-[#B8915C]" />
                  <span className="text-sm">{job.salary}</span>
                </div>
                <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-300">
                  <Clock className="h-4 w-4 text-[#B8915C]" />
                  <span className="text-sm">Posted {job.posted}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="font-serif text-xl text-[#2D2A24] dark:text-white mb-3">
                  Job Description
                </h2>
                <p className="text-[#5A534A] dark:text-slate-400 leading-relaxed">
                  {job.description}
                </p>
              </div>

              {/* Skills */}
              <div className="mb-6">
                <h2 className="font-serif text-xl text-[#2D2A24] dark:text-white mb-3">
                  Required Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="bg-[#B8915C]/10 text-[#B8915C] border-none px-3 py-1"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Experience requirement */}
              <div className="mb-8">
                <h2 className="font-serif text-xl text-[#2D2A24] dark:text-white mb-3">
                  Experience Required
                </h2>
                <p className="text-[#5A534A] dark:text-slate-400">
                  {job.experience}
                </p>
              </div>

              {/* Apply button with profile incomplete warning */}
              {!profileStatus.isComplete && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-1">
                        Profile Incomplete
                      </h4>
                      <p className="text-sm text-amber-800 mb-2">
                        Please complete your profile before applying.
                      </p>
                      <Link href="/candidate/profile">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-300 text-amber-900 hover:bg-amber-100"
                        >
                          Complete Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleApplyClick}
                className="w-full bg-[#B8915C] hover:bg-[#9F7A4F] text-white py-6 text-lg"
                disabled={!profileStatus.isComplete}
              >
                Apply for this position
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Application Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={resetDialog}>
        <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2D2A24] dark:text-white">
              Apply for {job.title}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {!profileStatus.isComplete ? (
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
                        You need a complete profile (100%) to apply.
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
                    onClick={resetDialog}
                    className="flex-1 border-[#D6CDC2]"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : applicationStatus === "idle" ? (
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
            ) : applicationStatus === "applying" ? (
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
            ) : applicationStatus === "success" ? (
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
                  onClick={resetDialog}
                  className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]"
                >
                  View Applications
                </Button>
              </motion.div>
            ) : (
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
                  onClick={resetDialog}
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