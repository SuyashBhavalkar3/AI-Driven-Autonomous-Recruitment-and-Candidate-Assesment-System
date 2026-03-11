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
import { resumeAnalysisService, ResumeAnalysis } from "@/services/resumeAnalysis";
import { getAuthToken, isAuthenticated } from "@/lib/auth";

// Color palette matching candidate dashboard
const COLORS = ["#B8915C", "#9F7A4F", "#8B6B46", "#7A5D3F", "#684F36"];

export default function CandidateResumeParserPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ResumeAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<React.ReactNode[]>([]);

  // Load existing analysis on component mount
  useEffect(() => {
    // Check if user is logged in first
    if (!isAuthenticated()) {
      setError("Please log in to view your resume analysis");
      setLoading(false);
      return;
    }
    
    loadExistingAnalysis();
  }, []);

  const loadExistingAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      
      if (!token) {
        throw new Error("Please log in to view your resume analysis");
      }
      
      // Always fetch fresh data with timestamp to prevent caching
      const response = await fetch(`http://localhost:8000/resume-analysis/analyze?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
      });

      if (response.status === 401) {
        // Token expired or invalid
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Network error" }));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch resume analysis`);
      }

      const result = await response.json();
      
      // Log the complete data for debugging
      console.log('Fresh Resume Analysis:', result);
      console.log('Raw Extracted Data:', result.raw_extracted_data);
      console.log('Data Completeness:', result.metadata?.data_completeness);
      
      setParsedData(result.data);
    } catch (err) {
      console.error('Resume analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load resume analysis";
      
      // Handle specific error cases
      if (errorMessage.includes("Session expired") || errorMessage.includes("log in")) {
        setError("Your session has expired. Please refresh the page and log in again.");
      } else if (errorMessage.includes("No resume found")) {
        setError("No resume found. Please upload your resume first from the profile section.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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
    
    if (!isAuthenticated()) {
      setError("Please log in to upload and analyze your resume");
      return;
    }
    
    const token = getAuthToken();
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      // Test authentication first
      const authResponse = await fetch('http://localhost:8000/resume-analysis/test-auth', {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!authResponse.ok) {
        throw new Error("Authentication failed. Please log in again.");
      }
      
      // In a real implementation, you'd upload the file first
      // For now, we'll just trigger the analysis of existing resume
      await loadExistingAnalysis();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze resume');
    } finally {
      setUploading(false);
    }
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
        {!parsedData && !loading && (
          <Card className="border-none bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="p-4 bg-[#B8915C]/10 rounded-full">
                  <Upload className="h-8 w-8 text-[#B8915C]" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-medium text-[#2D2A24] dark:text-white mb-2">
                    Resume Analysis
                  </h2>
                  {error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                      <p className="text-red-600 dark:text-red-400 font-medium mb-1">Analysis Error</p>
                      <p className="text-red-500 dark:text-red-400 text-sm mb-3">{error}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={loadExistingAnalysis}
                          className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          Retry Analysis
                        </button>
                        {error.includes("Session expired") && (
                          <button 
                            onClick={() => window.location.reload()}
                            className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            Refresh Page
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[#5A534A] dark:text-slate-400 mb-4">
                      Analyze your existing resume with fresh data extraction
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <Button
                    onClick={loadExistingAnalysis}
                    disabled={uploading}
                    className="bg-[#B8915C] hover:bg-[#9F7A4F] text-white shadow-lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Get Fresh Analysis
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="border-none bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm shadow-lg">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center gap-6">
                <Loader2 className="h-8 w-8 text-[#B8915C] animate-spin" />
                <div className="text-center">
                  <p className="text-[#5A534A] dark:text-slate-400 font-medium">Loading your resume analysis...</p>
                  <p className="text-xs text-[#5A534A] dark:text-slate-400 mt-1">Fetching fresh data from database</p>
                </div>
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
                <h2 className="text-2xl font-semibold text-[#2D2A24] dark:text-white flex items-center gap-2">
                  Analysis Results
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                    Fresh Data
                  </span>
                </h2>
                <p className="text-[#5A534A] dark:text-slate-400">
                  AI-powered analysis with complete data extraction
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={loadExistingAnalysis}
                  disabled={loading}
                  className="border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Analysis
                    </>
                  )}
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
                      <CardTitle className="text-lg font-medium text-[#2D2A24] dark:text-white flex items-center gap-2">
                        Extracted Information
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                          Complete Data
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-[#5A534A] dark:text-slate-400 font-medium">Professional Summary</p>
                        <p className="text-[#2D2A24] dark:text-white leading-relaxed">{parsedData.summary}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#5A534A] dark:text-slate-400 font-medium">Education Background</p>
                        <p className="text-[#2D2A24] dark:text-white">{parsedData.education}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#5A534A] dark:text-slate-400 font-medium">Work Experience</p>
                        <div className="space-y-2">
                          {parsedData.experience.map((exp, idx) => (
                            <div key={idx} className="bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg">
                              <p className="text-[#2D2A24] dark:text-white font-medium">
                                {exp.role} at {exp.company}
                              </p>
                              <p className="text-sm text-[#5A534A] dark:text-slate-400">
                                {exp.duration}
                              </p>
                            </div>
                          ))}
                        </div>
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
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-[#5A534A] dark:text-slate-400 mb-3">All Extracted Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.map((skill, index) => (
                          <Badge
                            key={`${skill}-${index}`}
                            className="bg-[#B8915C]/10 text-[#B8915C] border-none hover:bg-[#B8915C]/20 transition-colors"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-[#5A534A] dark:text-slate-400 mt-2">
                        {parsedData.skills.length} skills identified from your resume
                      </p>
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
                        AI Recommendations
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full ml-auto">
                          {parsedData.recommendations.length} Tips
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {parsedData.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-[#2D2A24] dark:text-stone-300">{rec}</span>
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
                        <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full ml-auto">
                          {parsedData.lackings.length} Areas
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {parsedData.lackings.map((lack, idx) => (
                          <li key={idx} className="flex gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-[#B8915C] mt-0.5 flex-shrink-0" />
                            <span className="text-[#2D2A24] dark:text-stone-300">{lack}</span>
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