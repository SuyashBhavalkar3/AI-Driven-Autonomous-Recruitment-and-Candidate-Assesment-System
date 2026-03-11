"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Sparkles,
  Download,
  Loader2,
  Briefcase,
  Calendar,
  MapPin,
  Target,
  Settings,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Mock parsed data (in real app, this comes from backend)
const mockParsedData = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 234 567 890",
  summary: "Experienced Frontend Developer with 5+ years in React and TypeScript.",
  skills: ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "Node.js"],
  experience: [
    { company: "TechCorp", role: "Frontend Developer", duration: "2020-2023" },
    { company: "WebStudio", role: "UI Developer", duration: "2018-2020" },
  ],
  education: "B.Sc. Computer Science, University of Example",
  atsScore: 78,
  recommendations: [
    "Add more quantifiable achievements in your work experience.",
    "Include a summary section highlighting your key strengths.",
    "Add certifications to improve credibility.",
  ],
  lackings: [
    "Missing keywords: 'GraphQL', 'Docker'.",
    "No mention of leadership or mentorship experience.",
    "Resume length is less than 1 page; consider expanding.",
  ],
  skillMatch: [
    { skill: "React", required: true, match: 95 },
    { skill: "TypeScript", required: true, match: 80 },
    { skill: "Node.js", required: false, match: 60 },
    { skill: "GraphQL", required: true, match: 10 },
    { skill: "Docker", required: false, match: 0 },
  ],
  categoryScores: [
    { category: "Experience", score: 70 },
    { category: "Skills", score: 65 },
    { category: "Education", score: 85 },
    { category: "Formatting", score: 90 },
    { category: "Keywords", score: 55 },
  ],
};

// Color palette matching candidate dashboard
const COLORS = ["#B8915C", "#9F7A4F", "#8B6B46", "#7A5D3F", "#684F36"];

export default function CandidateResumeParserPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<typeof mockParsedData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);

  // Generate decorative particles (client-side only)
  useEffect(() => {
    const newParticles: React.ReactNode[] = [];
    for (let i = 0; i < 15; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      newParticles.push(
        <div
          key={`dot-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-[#B8915C]/10 dark:bg-[#B8915C]/5"
          style={{ top: `${top}%`, left: `${left}%`, filter: "blur(1px)" }}
        />
      );
    }
    setParticles(newParticles);
  }, []);

  // GSAP animations after data loads
  useEffect(() => {
    if (parsedData) {
      const ctx = gsap.context(() => {
        gsap.from(".ats-score-circle", {
          scale: 0,
          opacity: 0,
          duration: 1,
          ease: "back.out(1.2)",
        });
        gsap.from(".stat-card", {
          y: 20,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
        });
      }, containerRef);
      return () => ctx.revert();
    }
  }, [parsedData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setParsedData(mockParsedData);
    setUploading(false);
  };

  const resetParser = () => {
    setFile(null);
    setParsedData(null);
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-gradient-to-br from-[#F9F5F0] to-[#F0E9E0] dark:from-stone-950 dark:to-stone-900">
      {/* Decorative particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">{particles}</div>

      {/* Soft gradient blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#B8915C]/5 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#9F7A4F]/5 rounded-full blur-3xl -z-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-4xl font-medium text-[#2D2A24] dark:text-white flex items-center gap-2">
              Resume Parser
              <Sparkles className="h-6 w-6 text-[#B8915C] animate-pulse" />
            </h1>
            <p className="text-[#5A534A] dark:text-slate-400 mt-1">
              Upload your resume for ATS analysis and personalized recommendations
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-[#B8915C]/30 text-[#B8915C] bg-white/50 backdrop-blur-sm"
          >
            <Calendar className="h-3 w-3 mr-1" />
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </Badge>
        </div>

        {/* Upload Card (shown when no data) */}
        {!parsedData && (
          <Card className="border-none bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="p-4 bg-[#B8915C]/10 rounded-full">
                  <Upload className="h-8 w-8 text-[#B8915C]" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-medium text-[#2D2A24] dark:text-white mb-2">
                    Upload Resume
                  </h2>
                  <p className="text-[#5A534A] dark:text-slate-400 mb-4">
                    Supported formats: PDF, DOCX, TXT (Max 5MB)
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-[#5A534A] dark:text-slate-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-[#B8915C]/10 file:text-[#B8915C]
                      dark:file:bg-[#B8915C]/20 dark:file:text-[#B8915C]
                      hover:file:bg-[#B8915C]/20 dark:hover:file:bg-[#B8915C]/30
                      cursor-pointer"
                  />
                  <Button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="bg-[#B8915C] hover:bg-[#9F7A4F] text-white shadow-lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Parse Resume
                      </>
                    )}
                  </Button>
                </div>
                {file && !uploading && (
                  <p className="text-sm text-[#5A534A] dark:text-slate-400">
                    Selected: {file.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {parsedData && (
          <div className="space-y-6">
            {/* Header with ATS Score and actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#2D2A24] dark:text-white">
                  Analysis Results
                </h2>
                <p className="text-[#5A534A] dark:text-slate-400">
                  for {parsedData.name} • {parsedData.email}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetParser}
                  className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                >
                  New Analysis
                </Button>
                <Button className="bg-[#B8915C] hover:bg-[#9F7A4F] text-white shadow-lg">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>

            {/* ATS Score Card */}
            <Card className="border-none bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Circular progress for ATS score */}
                  <div className="ats-score-circle relative w-40 h-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        className="text-stone-200 dark:text-stone-700"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-[#B8915C]"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - parsedData.atsScore / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-[#2D2A24] dark:text-white">
                        {parsedData.atsScore}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-[#2D2A24] dark:text-white mb-2">
                      ATS Compatibility Score
                    </h3>
                    <p className="text-[#5A534A] dark:text-slate-400 mb-4">
                      Your resume scores {parsedData.atsScore}% on ATS readability.{" "}
                      {parsedData.atsScore >= 80
                        ? "Great job! Minor improvements can make it perfect."
                        : "There's room for improvement. See recommendations below."}
                    </p>
                    <Progress
                      value={parsedData.atsScore}
                      className="h-2 bg-stone-200 dark:bg-stone-700"
                      indicatorClassName="bg-gradient-to-r from-[#B8915C] to-[#9F7A4F]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Analysis Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm border border-[#D6CDC2] dark:border-stone-800">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-[#B8915C]/10 data-[state=active]:text-[#B8915C]"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="skills"
                  className="data-[state=active]:bg-[#B8915C]/10 data-[state=active]:text-[#B8915C]"
                >
                  Skills Match
                </TabsTrigger>
                <TabsTrigger
                  value="recommendations"
                  className="data-[state=active]:bg-[#B8915C]/10 data-[state=active]:text-[#B8915C]"
                >
                  Recommendations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Scores Radar Chart */}
                  <Card className="border-none bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-[#2D2A24] dark:text-white">
                        Category Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={parsedData.categoryScores}>
                          <PolarGrid stroke="#D6CDC2" />
                          <PolarAngleAxis dataKey="category" tick={{ fill: '#5A534A', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#5A534A' }} />
                          <Radar
                            name="Score"
                            dataKey="score"
                            stroke="#B8915C"
                            fill="#B8915C"
                            fillOpacity={0.6}
                          />
                          <Tooltip contentStyle={{ backgroundColor: '#FFF', borderColor: '#D6CDC2' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Key Info Card */}
                  <Card className="border-none bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-[#2D2A24] dark:text-white">
                        Extracted Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-[#5A534A] dark:text-slate-400">Summary</p>
                        <p className="text-[#2D2A24] dark:text-white">{parsedData.summary}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#5A534A] dark:text-slate-400">Education</p>
                        <p className="text-[#2D2A24] dark:text-white">{parsedData.education}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#5A534A] dark:text-slate-400">Experience</p>
                        <ul className="list-disc list-inside text-[#2D2A24] dark:text-white">
                          {parsedData.experience.map((exp, idx) => (
                            <li key={idx}>
                              {exp.role} at {exp.company} ({exp.duration})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="skills" className="space-y-4">
                <Card className="border-none bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-[#2D2A24] dark:text-white">
                      Skill Match Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={parsedData.skillMatch} layout="vertical" margin={{ left: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#D6CDC2" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#5A534A' }} />
                        <YAxis dataKey="skill" type="category" tick={{ fill: '#5A534A' }} width={100} />
                        <Tooltip contentStyle={{ backgroundColor: '#FFF', borderColor: '#D6CDC2' }} />
                        <Legend />
                        <Bar dataKey="match" fill="#B8915C" name="Match %" />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {parsedData.skills.map((skill) => (
                        <Badge
                          key={skill}
                          className="bg-[#B8915C]/10 text-[#B8915C] border-none"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recommendations */}
                  <Card className="border-none bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-[#2D2A24] dark:text-white flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {parsedData.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-2 text-[#2D2A24] dark:text-stone-300">
                            <span className="text-emerald-500">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Lackings */}
                  <Card className="border-none bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-[#2D2A24] dark:text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-[#B8915C]" />
                        Areas for Improvement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {parsedData.lackings.map((lack, idx) => (
                          <li key={idx} className="flex gap-2 text-[#2D2A24] dark:text-stone-300">
                            <span className="text-[#B8915C]">•</span>
                            {lack}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}