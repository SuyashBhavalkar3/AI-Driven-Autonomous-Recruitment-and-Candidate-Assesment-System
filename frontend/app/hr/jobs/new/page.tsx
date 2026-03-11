"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Award,
  FileText,
  ListChecks,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getAuthToken, getUserRole } from "@/lib/auth";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "",
    type: "Full-time", // default
    salary: "",
    experience: "",
    description: "",
    requirements: "",
    skills: "",
  });

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const role = getUserRole();
        if (role !== "hr") {
          setError("You don't have permission to view this page.");
          setAuthChecked(true);
          return;
        }

        setAuthChecked(true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setError("Authentication failed.");
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError("You must be logged in to post a job.");
        setLoading(false);
        return;
      }

      // Parse experience: extract number from string like "5+ years" -> 5
      let experienceRequired = 0;
      const expMatch = formData.experience.match(/\d+/);
      if (expMatch) {
        experienceRequired = parseInt(expMatch[0], 10);
      }

      // Parse skills: comma-separated string to array
      const requiredSkills = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Prepare payload matching JobCreate schema
      const payload = {
        title: formData.title,
        description: formData.description,
        required_skills: requiredSkills,
        experience_required: experienceRequired,
        location: formData.location,
        salary_range: formData.salary,
      };

      const response = await fetch("http://localhost:8000/jobs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create job");
      }

      // Success - redirect to jobs list
      router.push("/hr/jobs");
    } catch (err: any) {
      setError(err.message || "An error occurred while posting the job.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <div className="mb-6">
          <Link href="/hr/jobs">
            <Button
              variant="ghost"
              size="sm"
              className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-900 dark:text-white flex items-center gap-2">
            Post New Job
            <Sparkles className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Create a new job posting to attract top talent
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Card */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
          <CardHeader className="border-b border-stone-200 dark:border-stone-800 pb-6">
            <CardTitle className="text-xl font-medium text-stone-900 dark:text-white">
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Title & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                    Job Title <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="title"
                      placeholder="e.g. Senior Frontend Developer"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      disabled={loading}
                      className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                    Department
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="department"
                      placeholder="e.g. Engineering"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      disabled={loading}
                      className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Location & Job Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                    Location <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="location"
                      placeholder="e.g. San Francisco, CA"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      disabled={loading}
                      className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                    Job Type <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 z-10" />
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      disabled={loading}
                    >
                      <SelectTrigger
                        id="type"
                        className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Row 3: Salary & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="salary" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                    Salary Range <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="salary"
                      placeholder="e.g. $120k - $150k"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      required
                      disabled={loading}
                      className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                    Experience Required <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                    <Input
                      id="experience"
                      placeholder="e.g. 5+ years"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      required
                      disabled={loading}
                      className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                  Job Description <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <Textarea
                    id="description"
                    placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    required
                    disabled={loading}
                    className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Requirements (optional, not sent to API) */}
              <div className="space-y-2">
                <Label htmlFor="requirements" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                  Requirements (Optional)
                </Label>
                <div className="relative">
                  <ListChecks className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                  <Textarea
                    id="requirements"
                    placeholder="List the required qualifications, education, and experience..."
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={5}
                    disabled={loading}
                    className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Required Skills */}
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-stone-700 dark:text-stone-300 text-sm font-medium">
                  Required Skills (comma-separated) <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="skills"
                    placeholder="e.g. React, TypeScript, Node.js"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    required
                    disabled={loading}
                    className="pl-9 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-300 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Post Job
                    </>
                  )}
                </Button>
                <Link href="/hr/jobs">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    className="border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}