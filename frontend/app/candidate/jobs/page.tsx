"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Briefcase, Clock, DollarSign, Search, Building2, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { calculateProfileCompletion, UserProfile } from "@/lib/profileCompletion";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    description: "We are looking for a senior frontend developer with React expertise to build next-generation web applications.",
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
    description: "Join our team to build scalable applications that impact millions of users worldwide.",
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
    description: "Build robust APIs and microservices for our data processing platform.",
    skills: ["Python", "Django", "Redis", "Docker"],
    experience: "4+ years",
  },
];

type ApplicationStatus = "idle" | "applying" | "success" | "rejected";

export default function JobsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [selectedJob, setSelectedJob] = useState<typeof jobs[0] | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("idle");
  const [coverLetter, setCoverLetter] = useState("");
  const [matchScore, setMatchScore] = useState<number | null>(null);
  
  // Check profile completion
  const profileStatus = calculateProfileCompletion(mockUserProfile);

  // Auto-redirect to profile if incomplete after 3 seconds
  useEffect(() => {
    if (!profileStatus.isComplete && selectedJob) {
      const timer = setTimeout(() => {
        router.push('/candidate/profile');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [profileStatus.isComplete, selectedJob, router]);

  const filteredJobs = jobs.filter((job) => {
    return (
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (location === "" || job.location.toLowerCase().includes(location.toLowerCase())) &&
      (jobType === "" || jobType === "all" || job.type === jobType)
    );
  });

  const handleApply = (job: typeof jobs[0]) => {
    // Check if profile is complete before allowing application
    if (!profileStatus.isComplete) {
      return; // Dialog will show incomplete profile message
    }
    setSelectedJob(job);
    setApplicationStatus("idle");
    setCoverLetter("");
    setMatchScore(null);
  };

  const submitApplication = async () => {
    setApplicationStatus("applying");
    await new Promise(resolve => setTimeout(resolve, 2000));
    const score = Math.floor(Math.random() * 40) + 60;
    setMatchScore(score);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setApplicationStatus(score >= 70 ? "success" : "rejected");
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Find Your Next Opportunity</h1>
          <p className="text-slate-600 dark:text-slate-400">Discover roles that match your expertise</p>
        </div>

        <Card className="mb-8 border-slate-200 dark:border-slate-800">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Job title or keyword"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
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

        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {job.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{job.company}</p>
                      </div>
                      <Button 
                        onClick={() => {
                          setSelectedJob(job);
                          if (profileStatus.isComplete) {
                            handleApply(job);
                          }
                        }} 
                        size="sm"
                      >
                        Apply
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <Badge variant="secondary" className="text-xs">{job.workMode}</Badge>
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
                    <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm line-clamp-2">{job.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {/* Profile Incomplete Warning */}
            {!profileStatus.isComplete && (
              <motion.div key="incomplete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Complete Your Profile First</h4>
                      <p className="text-sm text-amber-800 dark:text-amber-400 mb-3">
                        You need to complete your profile (100%) before applying for jobs. Redirecting to profile page in 3 seconds...
                      </p>
                      <div className="space-y-1 mb-3">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Missing:</p>
                        <ul className="text-sm text-amber-800 dark:text-amber-400 list-disc list-inside">
                          {profileStatus.missingFields.map(field => (
                            <li key={field}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/candidate/profile" className="flex-1">
                    <Button className="w-full">Complete Profile</Button>
                  </Link>
                  <Button variant="outline" onClick={() => setSelectedJob(null)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {profileStatus.isComplete && applicationStatus === "idle" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Cover Letter (Optional)</label>
                  <Textarea
                    placeholder="Why are you a great fit for this role?"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-sm text-blue-900 dark:text-blue-300">
                  Your application will be reviewed by AI to match your experience with job requirements.
                </div>
                <Button onClick={submitApplication} className="w-full">Submit Application</Button>
              </motion.div>
            )}

            {profileStatus.isComplete && applicationStatus === "applying" && (
              <motion.div key="applying" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analyzing Your Profile</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Matching your experience with requirements...</p>
                {matchScore !== null && (
                  <p className="mt-4 text-lg font-semibold text-blue-600">Match Score: {matchScore}%</p>
                )}
              </motion.div>
            )}

            {profileStatus.isComplete && applicationStatus === "success" && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Application Accepted!</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">Match score: {matchScore}%</p>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg mb-4 text-sm">
                  Next: Schedule your assessment test
                </div>
                <Button onClick={() => setSelectedJob(null)} className="w-full">View Applications</Button>
              </motion.div>
            )}

            {profileStatus.isComplete && applicationStatus === "rejected" && (
              <motion.div key="rejected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Application Not Matched</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">Score: {matchScore}% (minimum 70% required)</p>
                <Button onClick={() => setSelectedJob(null)} variant="outline" className="w-full">Browse More Jobs</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
