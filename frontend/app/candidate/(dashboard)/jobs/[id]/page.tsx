"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Briefcase,
  DollarSign,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { jobsAPI } from "@/lib/api";
import { useProfileStatus } from "@/hooks/useProfileStatus";
import { enforceProfileCompletion } from "@/lib/profileEnforcement";
import Link from "next/link";

interface Job {
  id: number;
  title: string;
  description: string;
  required_skills: string[];
  experience_required: number;
  location: string;
  salary_range: string;
  created_by: number;
  created_at: string;
}

type ApplicationStatus = "idle" | "applying" | "success" | "rejected";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = parseInt(params.id as string);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("idle");
  const [coverLetter, setCoverLetter] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const { profileStatus, loading: profileLoading } = useProfileStatus();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const data = await jobsAPI.getJobById(jobId);
        setJob(data);
      } catch (error) {
        console.error("Failed to fetch job:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleApply = async () => {
    const canApply = await enforceProfileCompletion();
    if (!canApply) return;
    setShowApplyDialog(true);
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
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#2D2A24] dark:text-white mb-4">
            Job not found
          </h2>
          <Button onClick={() => router.push("/candidate/jobs")}>
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/candidate/jobs")}
          className="mb-6 text-[#B8915C] hover:text-[#9F7A4F]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#B8915C] to-[#9F7A4F] flex items-center justify-center text-white font-semibold text-xl">
                    {job.title.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-3xl font-serif font-semibold text-[#2D2A24] dark:text-white">
                      {job.title}
                    </h1>
                    <p className="text-[#5A534A] dark:text-slate-400 mt-1">
                      Job ID: {job.id}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleApply}
                  size="lg"
                  className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                >
                  Apply Now
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400">
                  <MapPin className="h-5 w-5 text-[#B8915C]" />
                  <div>
                    <p className="text-xs">Location</p>
                    <p className="font-medium text-[#2D2A24] dark:text-white">
                      {job.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400">
                  <DollarSign className="h-5 w-5 text-[#B8915C]" />
                  <div>
                    <p className="text-xs">Salary</p>
                    <p className="font-medium text-[#2D2A24] dark:text-white">
                      {job.salary_range}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400">
                  <Briefcase className="h-5 w-5 text-[#B8915C]" />
                  <div>
                    <p className="text-xs">Experience</p>
                    <p className="font-medium text-[#2D2A24] dark:text-white">
                      {job.experience_required}+ years
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400">
                  <Calendar className="h-5 w-5 text-[#B8915C]" />
                  <div>
                    <p className="text-xs">Posted</p>
                    <p className="font-medium text-[#2D2A24] dark:text-white">
                      {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white mb-3">
                    Job Description
                  </h2>
                  <p className="text-[#5A534A] dark:text-slate-400 leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white mb-3">
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.required_skills?.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="border-[#B8915C]/30 text-[#B8915C] px-3 py-1"
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
      </div>

      {/* Application Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2D2A24] dark:text-white">
              Apply for {job?.title}
            </DialogTitle>
          </DialogHeader>

          {!profileLoading && profileStatus && !profileStatus.profile_completed && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">
                      Complete Your Profile First
                    </h4>
                    <p className="text-sm text-amber-800 mb-3">
                      You need to complete your profile before applying for jobs.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/complete-profile" className="flex-1">
                  <Button className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]">
                    Complete Profile
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setShowApplyDialog(false)}
                  className="flex-1 border-[#D6CDC2]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {!profileLoading && profileStatus && profileStatus.profile_completed && applicationStatus === "idle" && (
            <div className="space-y-4">
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
            </div>
          )}

          {!profileLoading && profileStatus && profileStatus.profile_completed && applicationStatus === "applying" && (
            <div className="py-8 text-center">
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
            </div>
          )}

          {!profileLoading && profileStatus && profileStatus.profile_completed && applicationStatus === "success" && (
            <div className="py-8 text-center">
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
                onClick={() => router.push("/candidate/applications")}
                className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]"
              >
                View Applications
              </Button>
            </div>
          )}

          {!profileLoading && profileStatus && profileStatus.profile_completed && applicationStatus === "rejected" && (
            <div className="py-8 text-center">
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
                onClick={() => setShowApplyDialog(false)}
                variant="outline"
                className="w-full border-[#D6CDC2]"
              >
                Browse More Jobs
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
