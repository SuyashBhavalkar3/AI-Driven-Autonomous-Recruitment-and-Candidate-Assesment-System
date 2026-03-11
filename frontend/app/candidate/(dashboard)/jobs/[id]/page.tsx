"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Building2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { jobsAPI } from "@/lib/api";
import { Job } from "@/lib/types";
import Link from "next/link";

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching job details for ID:', jobId);
        const response = await jobsAPI.getJobById(Number(jobId));
        console.log('Job details response:', response);
        setJob(response);
      } catch (err: any) {
        const errorMsg = err.message || "Failed to load job details. Please try again later.";
        setError(errorMsg);
        console.error("Error fetching job details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const handleApply = async () => {
    setApplying(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setApplying(false);
    setApplied(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#B8915C] mx-auto mb-4" />
          <p className="text-[#5A534A] dark:text-slate-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">
              {error || "Job not found"}
            </h3>
            <Link href="/candidate/jobs">
              <Button className="mt-4 bg-[#B8915C] hover:bg-[#9F7A4F]">
                Back to Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/candidate/jobs">
          <Button
            variant="ghost"
            className="mb-6 text-[#5A534A] hover:text-[#B8915C]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>

        {/* Job Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl mb-6">
            <CardContent className="p-8">
              <div className="flex gap-6">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#B8915C] to-[#9F7A4F] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {job.title.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="font-serif text-3xl font-medium text-[#2D2A24] dark:text-white mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center gap-2 text-[#5A534A] dark:text-slate-400 mb-4">
                    <Building2 className="h-5 w-5" />
                    <span className="text-lg">{job.company_name || "Company"}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1 text-[#5A534A] dark:text-slate-400">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1 text-[#5A534A] dark:text-slate-400">
                      <DollarSign className="h-4 w-4" />
                      {job.salary_range}
                    </span>
                    <span className="flex items-center gap-1 text-[#5A534A] dark:text-slate-400">
                      <Briefcase className="h-4 w-4" />
                      {job.experience_required}+ years
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Description */}
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl mb-6">
            <CardContent className="p-8">
              <h2 className="font-serif text-2xl font-medium text-[#2D2A24] dark:text-white mb-4">
                Job Description
              </h2>
              <p className="text-[#5A534A] dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </CardContent>
          </Card>

          {/* Required Skills */}
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl mb-6">
            <CardContent className="p-8">
              <h2 className="font-serif text-2xl font-medium text-[#2D2A24] dark:text-white mb-4">
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="border-[#B8915C]/30 text-[#B8915C] px-3 py-1"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application Section */}
          {!applied ? (
            <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-8">
                <h2 className="font-serif text-2xl font-medium text-[#2D2A24] dark:text-white mb-4">
                  Apply for this Position
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#4A443C] dark:text-slate-300 mb-2 block">
                      Cover Letter (Optional)
                    </label>
                    <Textarea
                      placeholder="Why are you a great fit for this role?"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={6}
                      className="bg-white/50 dark:bg-slate-800/50 border-[#D6CDC2] focus:border-[#B8915C]"
                    />
                  </div>
                  <div className="bg-[#B8915C]/10 p-4 rounded-lg text-sm text-[#B8915C]">
                    Your application will be reviewed by AI to match your experience
                    with job requirements.
                  </div>
                  <Button
                    onClick={handleApply}
                    disabled={applying}
                    className="w-full bg-[#B8915C] hover:bg-[#9F7A4F] h-12 text-base"
                  >
                    {applying ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Submitting Application...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-serif text-2xl font-medium text-[#2D2A24] dark:text-white mb-2">
                  Application Submitted!
                </h3>
                <p className="text-[#5A534A] dark:text-slate-400 mb-6">
                  Your application has been successfully submitted. We'll review it and get back to you soon.
                </p>
                <div className="flex gap-4">
                  <Link href="/candidate/applications" className="flex-1">
                    <Button className="w-full bg-[#B8915C] hover:bg-[#9F7A4F]">
                      View Applications
                    </Button>
                  </Link>
                  <Link href="/candidate/jobs" className="flex-1">
                    <Button variant="outline" className="w-full border-[#D6CDC2]">
                      Browse More Jobs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
