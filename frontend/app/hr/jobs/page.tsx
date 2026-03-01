"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, Users, Eye, Edit, Trash2, PlusCircle } from "lucide-react";

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

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
};

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Job Listings</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage all your job postings</p>
        </div>
        <Link href="/hr/jobs/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      <Card className="mb-6 border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <Card key={job.id} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                    <Badge className={statusColors[job.status]}>{job.status}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span>{job.type}</span>
                    <span>•</span>
                    <span>{job.salary}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {job.applicants} applicants
                    </span>
                    <span className="text-sm text-slate-500">
                      • Posted {new Date(job.posted).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/hr/applicants?job=${job.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Applicants
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
