"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, TrendingUp, Mail, Phone, FileText, Award, CheckCircle } from "lucide-react";

const applicants = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 234 567 8900",
    position: "Senior Frontend Developer",
    appliedDate: "2024-02-15",
    matchScore: 92,
    assessmentScore: 88,
    interviewScore: 90,
    status: "interview_completed",
    experience: "6 years",
    skills: ["React", "TypeScript", "Next.js"],
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1 234 567 8901",
    position: "Full Stack Engineer",
    appliedDate: "2024-02-14",
    matchScore: 88,
    assessmentScore: 85,
    interviewScore: null,
    status: "assessment_completed",
    experience: "5 years",
    skills: ["Node.js", "React", "PostgreSQL"],
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    phone: "+1 234 567 8902",
    position: "Backend Developer",
    appliedDate: "2024-02-16",
    matchScore: 85,
    assessmentScore: null,
    interviewScore: null,
    status: "under_review",
    experience: "4 years",
    skills: ["Python", "Django", "Redis"],
  },
  {
    id: 4,
    name: "Sarah Williams",
    email: "sarah@example.com",
    phone: "+1 234 567 8903",
    position: "Senior Frontend Developer",
    appliedDate: "2024-02-13",
    matchScore: 95,
    assessmentScore: 92,
    interviewScore: 94,
    status: "interview_completed",
    experience: "7 years",
    skills: ["React", "TypeScript", "GraphQL"],
  },
  {
    id: 5,
    name: "David Brown",
    email: "david@example.com",
    phone: "+1 234 567 8904",
    position: "DevOps Engineer",
    appliedDate: "2024-02-12",
    matchScore: 78,
    assessmentScore: 75,
    interviewScore: null,
    status: "assessment_completed",
    experience: "5 years",
    skills: ["Docker", "Kubernetes", "AWS"],
  },
];

const statusConfig = {
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  assessment_completed: { label: "Assessment Done", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  interview_completed: { label: "Interview Done", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  offered: { label: "Offered", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

export default function ApplicantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("matchScore");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedApplicant, setSelectedApplicant] = useState<typeof applicants[0] | null>(null);

  const filteredAndSorted = applicants
    .filter((app) => {
      const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || app.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "matchScore") return b.matchScore - a.matchScore;
      if (sortBy === "assessmentScore") return (b.assessmentScore || 0) - (a.assessmentScore || 0);
      if (sortBy === "interviewScore") return (b.interviewScore || 0) - (a.interviewScore || 0);
      return 0;
    });

  const getOverallScore = (app: typeof applicants[0]) => {
    const scores = [app.matchScore, app.assessmentScore, app.interviewScore].filter(s => s !== null) as number[];
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : app.matchScore;
  };

  const sendOffer = (applicantId: number) => {
    console.log("Sending offer to:", applicantId);
    setSelectedApplicant(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Applicants</h1>
        <p className="text-slate-600 dark:text-slate-400">Review and manage all applicants</p>
      </div>

      <Card className="mb-6 border-slate-200 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search applicants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="matchScore">Match Score</SelectItem>
                <SelectItem value="assessmentScore">Assessment Score</SelectItem>
                <SelectItem value="interviewScore">Interview Score</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="assessment_completed">Assessment Done</SelectItem>
                <SelectItem value="interview_completed">Interview Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredAndSorted.map((applicant) => (
          <Card key={applicant.id} className="border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{applicant.name}</h3>
                    <Badge className={statusConfig[applicant.status].color}>
                      {statusConfig[applicant.status].label}
                    </Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-3">{applicant.position}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-slate-600 dark:text-slate-400">Match:</span>
                      <span className="font-semibold text-blue-600">{applicant.matchScore}%</span>
                    </div>
                    {applicant.assessmentScore && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span className="text-slate-600 dark:text-slate-400">Assessment:</span>
                        <span className="font-semibold text-purple-600">{applicant.assessmentScore}%</span>
                      </div>
                    )}
                    {applicant.interviewScore && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-indigo-600" />
                        <span className="text-slate-600 dark:text-slate-400">Interview:</span>
                        <span className="font-semibold text-indigo-600">{applicant.interviewScore}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Overall Score:</span>
                      <span className={`font-bold ${getOverallScore(applicant) >= 90 ? 'text-green-600' : getOverallScore(applicant) >= 80 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {getOverallScore(applicant)}%
                      </span>
                    </div>
                    <span className="text-slate-400">•</span>
                    <span className="text-sm text-slate-500">{applicant.experience} experience</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-sm text-slate-500">Applied {new Date(applicant.appliedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedApplicant(applicant)}>
                    View Details
                  </Button>
                  {applicant.status === "interview_completed" && getOverallScore(applicant) >= 85 && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => sendOffer(applicant.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Send Offer
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedApplicant?.name}</DialogTitle>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span>{selectedApplicant.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>{selectedApplicant.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedApplicant.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Scores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Match Score</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedApplicant.matchScore}%</p>
                  </div>
                  {selectedApplicant.assessmentScore && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Assessment</p>
                      <p className="text-2xl font-bold text-purple-600">{selectedApplicant.assessmentScore}%</p>
                    </div>
                  )}
                  {selectedApplicant.interviewScore && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg">
                      <p className="text-sm text-slate-600 dark:text-slate-400">Interview</p>
                      <p className="text-2xl font-bold text-indigo-600">{selectedApplicant.interviewScore}%</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {selectedApplicant.status === "interview_completed" && getOverallScore(selectedApplicant) >= 85 && (
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => sendOffer(selectedApplicant.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Send Offer
                  </Button>
                )}
                <Button variant="outline">Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
