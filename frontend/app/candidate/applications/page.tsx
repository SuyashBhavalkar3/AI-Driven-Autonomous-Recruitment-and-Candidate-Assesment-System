"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Code, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const applications = [
  {
    id: 1,
    company: "TechCorp",
    position: "Senior Frontend Developer",
    appliedDate: "2024-02-15",
    stage: "assessment_pending",
  },
  {
    id: 2,
    company: "InnovateLabs",
    position: "Full Stack Engineer",
    appliedDate: "2024-02-10",
    stage: "interview_scheduled",
    interviewDate: "2024-03-05T14:00:00",
  },
  {
    id: 3,
    company: "DataFlow Inc",
    position: "Backend Developer",
    appliedDate: "2024-02-20",
    stage: "under_review",
  },
  {
    id: 4,
    company: "CloudTech",
    position: "DevOps Engineer",
    appliedDate: "2024-02-08",
    stage: "offer",
    offerDetails: { salary: "$140k - $160k", deadline: "2024-03-10" },
  },
  {
    id: 5,
    company: "StartupXYZ",
    position: "Frontend Developer",
    appliedDate: "2024-02-18",
    stage: "rejected",
    rejectionReason: "Experience requirements not met",
  },
];

const stageConfig = {
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  assessment_pending: { label: "Assessment Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  assessment_scheduled: { label: "Assessment Scheduled", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  interview_scheduled: { label: "Interview Scheduled", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  offer: { label: "Offer Received", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  rejected: { label: "Not Selected", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

export default function ApplicationsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [scheduleDialog, setScheduleDialog] = useState<number | null>(null);

  const scheduleAssessment = (appId: number) => {
    console.log("Scheduling assessment for", appId, selectedDate, selectedTime);
    setScheduleDialog(null);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Applications</h1>
          <p className="text-slate-600 dark:text-slate-400">Track your application progress</p>
        </div>

        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{app.position}</h3>
                      <Badge className={stageConfig[app.stage].color}>{stageConfig[app.stage].label}</Badge>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{app.company}</p>
                    <p className="text-sm text-slate-500 mt-1">Applied: {new Date(app.appliedDate).toLocaleDateString()}</p>

                    {app.stage === "assessment_pending" && (
                      <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Action Required: Schedule Assessment</p>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">Please schedule your assessment test to proceed.</p>
                        <Button size="sm" onClick={() => setScheduleDialog(app.id)} variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Schedule Now
                        </Button>
                      </div>
                    )}

                    {app.stage === "assessment_scheduled" && (
                      <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="h-4 w-4 text-purple-600" />
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-300">Assessment Ready</p>
                        </div>
                        <Link href="/candidate/assessment">
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Start Assessment</Button>
                        </Link>
                      </div>
                    )}

                    {app.stage === "interview_scheduled" && (
                      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-indigo-600" />
                          <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">AI Interview Scheduled</p>
                        </div>
                        <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-3">{new Date(app.interviewDate!).toLocaleString()}</p>
                        <Link href="/candidate/interview">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Join Interview</Button>
                        </Link>
                      </div>
                    )}

                    {app.stage === "offer" && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium text-green-900 dark:text-green-300">Congratulations!</p>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-400 mb-1">Salary: {app.offerDetails?.salary}</p>
                        <p className="text-xs text-green-600 dark:text-green-500 mb-3">Respond by: {new Date(app.offerDetails?.deadline!).toLocaleDateString()}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">Accept</Button>
                          <Button size="sm" variant="outline">Decline</Button>
                        </div>
                      </div>
                    )}

                    {app.stage === "rejected" && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <p className="text-sm font-medium text-red-900 dark:text-red-300">Application Closed</p>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-400">{app.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={scheduleDialog !== null} onOpenChange={() => setScheduleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Assessment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? selectedDate.toDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
              </PopoverContent>
            </Popover>
            <div className="grid grid-cols-3 gap-2">
              {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"].map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
            <Button
              onClick={() => scheduleAssessment(scheduleDialog!)}
              disabled={!selectedDate || !selectedTime}
              className="w-full"
            >
              Confirm Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
