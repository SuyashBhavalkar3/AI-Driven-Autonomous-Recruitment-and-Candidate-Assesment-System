"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Briefcase, Users, CheckCircle, Clock, TrendingUp, PlusCircle } from "lucide-react";

const stats = [
  { label: "Active Jobs", value: "8", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { label: "Total Applicants", value: "156", icon: Users, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { label: "Pending Review", value: "42", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { label: "Hired", value: "12", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
];

const recentJobs = [
  { id: 1, title: "Senior Frontend Developer", applicants: 45, status: "active", posted: "2d ago" },
  { id: 2, title: "Full Stack Engineer", applicants: 67, status: "active", posted: "1w ago" },
  { id: 3, title: "Backend Developer", applicants: 32, status: "active", posted: "3d ago" },
];

const recentApplicants = [
  { id: 1, name: "John Doe", position: "Senior Frontend Developer", score: 92, status: "interview" },
  { id: 2, name: "Jane Smith", position: "Full Stack Engineer", score: 88, status: "assessment" },
  { id: 3, name: "Mike Johnson", position: "Backend Developer", score: 85, status: "review" },
];

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  interview: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  assessment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function HRDashboard() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your recruitment pipeline</p>
        </div>
        <Link href="/hr/jobs/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Jobs</h2>
            <Link href="/hr/jobs">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <Card key={job.id} className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{job.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {job.applicants} applicants
                        </span>
                        <span>•</span>
                        <span>{job.posted}</span>
                      </div>
                    </div>
                    <Badge className={statusColors[job.status]}>{job.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Top Applicants</h2>
            <Link href="/hr/applicants">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentApplicants.map((applicant) => (
              <Card key={applicant.id} className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{applicant.name}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{applicant.position}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">{applicant.score}%</span>
                        </div>
                        <Badge className={statusColors[applicant.status]}>{applicant.status}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
