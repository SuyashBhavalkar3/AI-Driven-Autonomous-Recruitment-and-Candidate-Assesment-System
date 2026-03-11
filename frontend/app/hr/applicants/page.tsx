"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  TrendingUp,
  Mail,
  Phone,
  FileText,
  Award,
  CheckCircle,
  Sparkles,
  Calendar,
  Briefcase,
} from "lucide-react";
import Loader from "@/components/Loader";

type ApplicantStatus =
  | "under_review"
  | "assessment_completed"
  | "interview_completed"
  | "offered"
  | "rejected";

type Applicant = {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: string;
  appliedDate: string;
  matchScore: number;
  assessmentScore: number | null;
  interviewScore: number | null;
  status: ApplicantStatus;
  experience: string;
  skills: string[];
};

const applicants: Applicant[] = [
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

const statusConfig: Record<ApplicantStatus, { label: string; color: string }> = {
  under_review: {
    label: "Under Review",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  },
  assessment_completed: {
    label: "Assessment Done",
    color: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300 border-0",
  },
  interview_completed: {
    label: "Interview Done",
    color: "bg-amber-200 text-amber-800 dark:bg-amber-800/30 dark:text-amber-200 border-0",
  },
  offered: {
    label: "Offered",
    color: "bg-amber-600 text-white dark:bg-amber-700 dark:text-white border-0",
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-0",
  },
};

export default function ApplicantsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("matchScore");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // Simulate API loading
  useEffect(() => {
    const loadApplicants = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1300));
        setLoading(false);
      } catch (error) {
        console.error('Failed to load applicants:', error);
        setLoading(false);
      }
    };
    loadApplicants();
  }, []);

  const filteredAndSorted = applicants
    .filter((app) => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || app.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "matchScore") return b.matchScore - a.matchScore;
      if (sortBy === "assessmentScore")
        return (b.assessmentScore || 0) - (a.assessmentScore || 0);
      if (sortBy === "interviewScore")
        return (b.interviewScore || 0) - (a.interviewScore || 0);
      return 0;
    });

  const getOverallScore = (app: typeof applicants[0]) => {
    const scores = [app.matchScore, app.assessmentScore, app.interviewScore].filter(
      (s) => s !== null
    ) as number[];
    return scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : app.matchScore;
  };

  const sendOffer = (applicantId: number) => {
    console.log("Sending offer to:", applicantId);
    setSelectedApplicant(null);
  };

  if (loading) {
    return <Loader fullPage={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-900 dark:text-white flex items-center gap-2">
            Applicants
            <Sparkles className="h-5 w-5 text-amber-500" />
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1">
            Review and manage all applicants
          </p>
        </div>

        {/* Filters Card */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search by name or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matchScore">Match Score</SelectItem>
                  <SelectItem value="assessmentScore">Assessment Score</SelectItem>
                  <SelectItem value="interviewScore">Interview Score</SelectItem>
                </SelectContent>
              </Select>
              {/* Filter by status */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-amber-500/20">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="assessment_completed">Assessment Done</SelectItem>
                  <SelectItem value="interview_completed">Interview Done</SelectItem>
                  <SelectItem value="offered">Offered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applicant Cards */}
        <div className="space-y-4">
          {filteredAndSorted.map((applicant) => (
            <Card
              key={applicant.id}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Name and Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-stone-900 dark:text-white">
                        {applicant.name}
                      </h3>
                      <Badge className={statusConfig[applicant.status].color}>
                        {statusConfig[applicant.status].label}
                      </Badge>
                    </div>
                    {/* Position */}
                    <p className="text-stone-600 dark:text-stone-400 mb-3">
                      {applicant.position}
                    </p>

                    {/* Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                        <span className="text-stone-600 dark:text-stone-400">
                          Match:
                        </span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {applicant.matchScore}%
                        </span>
                      </div>
                      {applicant.assessmentScore && (
                        <div className="flex items-center gap-2 text-sm bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                          <FileText className="h-4 w-4 text-stone-500" />
                          <span className="text-stone-600 dark:text-stone-400">
                            Assessment:
                          </span>
                          <span className="font-semibold text-stone-600 dark:text-stone-400">
                            {applicant.assessmentScore}%
                          </span>
                        </div>
                      )}
                      {applicant.interviewScore && (
                        <div className="flex items-center gap-2 text-sm bg-stone-50 dark:bg-stone-800/50 p-2 rounded-md">
                          <Award className="h-4 w-4 text-amber-500" />
                          <span className="text-stone-600 dark:text-stone-400">
                            Interview:
                          </span>
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {applicant.interviewScore}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta info: Overall score, experience, applied date */}
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-stone-500 dark:text-stone-400">
                          Overall:
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            getOverallScore(applicant) >= 90
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                              : getOverallScore(applicant) >= 80
                              ? "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                          }`}
                        >
                          {getOverallScore(applicant)}%
                        </span>
                      </div>
                      <span className="text-stone-400">•</span>
                      <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                        <Briefcase className="h-4 w-4" />
                        {applicant.experience}
                      </div>
                      <span className="text-stone-400">•</span>
                      <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400">
                        <Calendar className="h-4 w-4" />
                        Applied {new Date(applicant.appliedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplicant(applicant)}
                      className="border-stone-200 dark:border-stone-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      View Details
                    </Button>
                    {applicant.status === "interview_completed" &&
                      getOverallScore(applicant) >= 85 && (
                        <Button
                          size="sm"
                          onClick={() => sendOffer(applicant.id)}
                          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-300"
                        >
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

        {/* Applicant Details Dialog */}
        <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
          <DialogContent className="max-w-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-stone-900 dark:text-white">
                {selectedApplicant?.name}
              </DialogTitle>
            </DialogHeader>
            {selectedApplicant && (
              <div className="space-y-5">
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                    Contact
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-amber-500" />
                      <span className="text-stone-700 dark:text-stone-300">
                        {selectedApplicant.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-amber-500" />
                      <span className="text-stone-700 dark:text-stone-300">
                        {selectedApplicant.phone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplicant.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Scores */}
                <div>
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                    Scores
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                      <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Match</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {selectedApplicant.matchScore}%
                      </p>
                    </div>
                    {selectedApplicant.assessmentScore && (
                      <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-center">
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Assessment</p>
                        <p className="text-2xl font-bold text-stone-600 dark:text-stone-400">
                          {selectedApplicant.assessmentScore}%
                        </p>
                      </div>
                    )}
                    {selectedApplicant.interviewScore && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-center">
                        <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Interview</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {selectedApplicant.interviewScore}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {selectedApplicant.status === "interview_completed" &&
                    getOverallScore(selectedApplicant) >= 85 && (
                      <Button
                        onClick={() => sendOffer(selectedApplicant.id)}
                        className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Send Offer
                      </Button>
                    )}
                  <Button
                    variant="outline"
                    className="border-stone-200 dark:border-stone-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}