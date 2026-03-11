"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Eye,
  Edit,
  Trash2,
  PlusCircle,
  Sparkles,
  MapPin,
  Briefcase,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Loader from "@/components/Loader";
import { getAuthToken, getUserRole } from "@/lib/auth";

// Type for API job response
interface ApiJob {
  id: number;
  title: string;
  description: string;
  required_skills: string[];
  experience_required: number | null;
  location: string | null;
  salary_range: string | null;
  created_at: string;
  created_by: number;
}

// Type for UI job
interface UiJob {
  id: number;
  title: string;
  department: string; // placeholder
  location: string;
  type: string; // default "Full-time"
  salary: string;
  applicants: number; // placeholder
  status: "active" | "closed";
  posted: string; // formatted date
  createdAt: string; // raw for sorting
}

// Helper to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Status badge colors
const statusColors = {
  active: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  closed: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300 border-0",
} as const;

export default function JobsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState<UiJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Check authentication and fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        // Optional: check if user is HR
        const role = getUserRole();
        if (role !== "hr") {
          setError("You don't have permission to view this page.");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8000/jobs/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.statusText}`);
        }

        const data = await response.json();
        const apiJobs: ApiJob[] = data.jobs || [];

        // Map to UI format
        const uiJobs: UiJob[] = apiJobs.map((job) => ({
          id: job.id,
          title: job.title,
          department: "Engineering", // placeholder – could be extended
          location: job.location || "Remote",
          type: "Full-time", // placeholder – API doesn't have this yet
          salary: job.salary_range || "Not disclosed",
          applicants: 0, // placeholder – could be fetched from applications endpoint
          status: "active", // placeholder – API doesn't have status yet
          posted: formatDate(job.created_at),
          createdAt: job.created_at,
        }));

        // Sort by most recent first
        uiJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setJobs(uiJobs);
      } catch (err: any) {
        console.error("Error fetching jobs:", err);
        setError(err.message || "Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [router]);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteJobId) return;

    setDeleting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`http://localhost:8000/jobs/${deleteJobId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete job");
      }

      // Remove from list
      setJobs((prev) => prev.filter((job) => job.id !== deleteJobId));
    } catch (err: any) {
      alert(err.message || "An error occurred while deleting.");
    } finally {
      setDeleting(false);
      setDeleteJobId(null);
    }
  };

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Loader fullPage={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900 dark:text-white flex items-center gap-2">
              Job Listings
              <Sparkles className="h-5 w-5 text-amber-500" />
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mt-1">
              Manage all your job postings
            </p>
          </div>
          <Link href="/hr/jobs/new">
            <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-300">
              <PlusCircle className="h-4 w-4 mr-2" />
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

        {/* Search Card */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search jobs by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Cards */}
        {filteredJobs.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="text-stone-500 dark:text-stone-400">
                <p className="text-lg">No jobs found</p>
                <p className="text-sm mt-1">Try adjusting your search or post a new job.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Title and Status */}
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                          {job.title}
                        </h3>
                        <Badge className={statusColors[job.status]}>
                          {job.status}
                        </Badge>
                      </div>

                      {/* Job Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600 dark:text-stone-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 text-amber-500" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-amber-500" />
                          {job.location}
                        </span>
                        <span>{job.type}</span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-amber-500" />
                          {job.salary}
                        </span>
                      </div>

                      {/* Applicants and Posted Date */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-amber-500" />
                        <span className="text-stone-600 dark:text-stone-400">
                          {job.applicants} applicants
                        </span>
                        <span className="text-stone-400 dark:text-stone-600">•</span>
                        <span className="text-stone-500 dark:text-stone-500">
                          Posted {job.posted}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link href={`/hr/applicants?job=${job.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-stone-200 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/hr/jobs/edit/${job.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-stone-200 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteJobId(job.id)}
                        className="border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job posting and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}