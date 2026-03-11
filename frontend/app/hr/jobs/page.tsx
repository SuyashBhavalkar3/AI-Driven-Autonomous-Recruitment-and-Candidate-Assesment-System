"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, Users, Eye, Edit, Trash2, PlusCircle, Sparkles, MapPin, Briefcase, DollarSign } from "lucide-react";
import Loader from "@/components/Loader";

const jobs = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    department: "Engineering",
    location: "San Francisco, CA",
    type: "Full-time",
    salary: "$120k - $150k",
    applicants: 45,
    status: "active",
    posted: "2024-02-15",
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    department: "Engineering",
    location: "New York, NY",
    type: "Full-time",
    salary: "$130k - $160k",
    applicants: 67,
    status: "active",
    posted: "2024-02-10",
  },
  {
    id: 3,
    title: "Backend Developer",
    department: "Engineering",
    location: "Austin, TX",
    type: "Full-time",
    salary: "$110k - $140k",
    applicants: 32,
    status: "active",
    posted: "2024-02-20",
  },
  {
    id: 4,
    title: "DevOps Engineer",
    department: "Operations",
    location: "Remote",
    type: "Full-time",
    salary: "$140k - $160k",
    applicants: 28,
    status: "closed",
    posted: "2024-02-05",
  },
];

// Status badge colors (beige palette)
const statusColors = {
  active: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  closed: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300 border-0",
} as const;

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Simulate API loading
  useEffect(() => {
    const loadJobs = async () => {
      try {
        // Simulate API call to fetch jobs
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load jobs:', error);
        setLoading(false);
      }
    };
    
    loadJobs();
  }, []);

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
                        Posted {new Date(job.posted).toLocaleDateString()}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-stone-200 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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
      </div>
    </div>
  );
}