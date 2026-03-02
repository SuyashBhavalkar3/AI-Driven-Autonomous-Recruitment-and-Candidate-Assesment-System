"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Briefcase, FileText, Bell, Award, Clock, ArrowRight, Target, TrendingUp } from "lucide-react";
import { ProfileCompletionCard } from "@/components/ProfileCompletionCard";
import { calculateProfileCompletion, UserProfile } from "@/lib/profileCompletion";

// Mock user profile data - replace with actual data from backend
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

const stats = [
  { label: "Applications", value: "12", icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { label: "In Progress", value: "5", icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
  { label: "Interviews", value: "2", icon: Bell, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
  { label: "Offers", value: "1", icon: Award, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
];

const recentApplications: Array<{ id: number; company: string; position: string; status: keyof typeof statusColors; action: string; link: string }> = [
  { id: 1, company: "TechCorp", position: "Senior Frontend Developer", status: "assessment_pending", action: "Schedule Assessment", link: "/candidate/applications" },
  { id: 2, company: "InnovateLabs", position: "Full Stack Engineer", status: "interview_scheduled", action: "Join Interview", link: "/candidate/interview" },
  { id: 3, company: "CloudTech", position: "DevOps Engineer", status: "offer", action: "View Offer", link: "/candidate/applications" },
];

const upcomingTasks = [
  { id: 1, title: "Schedule Frontend Assessment", company: "TechCorp", due: "Today", priority: "high" },
  { id: 2, title: "AI Interview", company: "InnovateLabs", due: "Tomorrow, 2:00 PM", priority: "medium" },
  { id: 3, title: "Respond to Offer", company: "CloudTech", due: "Mar 10, 2024", priority: "high" },
];

const applicationTrend = [
  { month: "Jan", count: 2 },
  { month: "Feb", count: 4 },
  { month: "Mar", count: 6 },
];

const statusDistribution = [
  { status: "Under Review", count: 4, color: "bg-blue-500" },
  { status: "Assessment", count: 3, color: "bg-purple-500" },
  { status: "Interview", count: 2, color: "bg-indigo-500" },
  { status: "Offer", count: 1, color: "bg-green-500" },
  { status: "Rejected", count: 2, color: "bg-red-500" },
];

const statusColors = {
  assessment_pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  interview_scheduled: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  offer: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export default function CandidateDashboard() {
  const maxCount = Math.max(...applicationTrend.map(d => d.count));
  const totalApplications = statusDistribution.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate profile completion
  const profileStatus = calculateProfileCompletion(mockUserProfile);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back, John!</h1>
          <p className="text-slate-600 dark:text-slate-400">Here's your job search overview</p>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Application Trend Chart */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">Application Trend</h3>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-4">
                {applicationTrend.map((data) => (
                  <div key={data.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{data.month}</span>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{data.count}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(data.count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution Chart */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Application Status</h3>
              <div className="space-y-3">
                {statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{item.status}</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {item.count} ({Math.round((item.count / totalApplications) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className={`${item.color} h-2 rounded-full transition-all duration-500`}
                          style={{ width: `${(item.count / totalApplications) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Profile Completion Card */}
            {!profileStatus.isComplete && (
              <ProfileCompletionCard status={profileStatus} showDetails={true} />
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Applications</h2>
              <Link href="/candidate/applications">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            {recentApplications.map((app) => (
              <Card key={app.id} className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{app.position}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{app.company}</p>
                      <Badge className={`mt-2 ${statusColors[app.status]}`}>
                        {app.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <Link href={app.link}>
                      <Button size="sm">{app.action}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Upcoming Tasks</h2>
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-4 space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 ${task.priority === "high" ? "bg-red-500" : "bg-yellow-500"}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{task.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{task.company}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <p className="text-xs text-slate-500">{task.due}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <Link href="/candidate/jobs">
                  <Button variant="outline" className="w-full justify-start">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Browse Jobs
                  </Button>
                </Link>
                <Link href="/candidate/schedule">
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Button>
                </Link>
                <Link href="/candidate/applications">
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Track Applications
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
