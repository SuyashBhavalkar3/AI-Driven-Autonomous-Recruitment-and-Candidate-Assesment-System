"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Trophy, 
  Target, 
  Clock, 
  ArrowRight,
  BarChart3,
  MessageSquare,
  Home
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";

interface AssessmentResult {
  assessment_id: number;
  score: number;
  completed_at: string;
  questions: any[];
  answers: any[];
}

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = Number(params.id);
  
  // Get initial data from URL params
  const urlScore = searchParams.get("score");
  const urlPassed = searchParams.get("passed") === "true";
  
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use URL params as initial state
  const [score, setScore] = useState(urlScore ? parseInt(urlScore) : 0);
  const [passed, setPassed] = useState(urlPassed);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(`http://localhost:8000/v1/assessment/result/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          // If we have URL params, use them instead of throwing error
          if (urlScore) {
            setLoading(false);
            return;
          }
          throw new Error("Failed to load assessment result");
        }

        const data: AssessmentResult = await response.json();
        setResult(data);
        setScore(data.score);
        setPassed(data.score >= 70);
      } catch (err) {
        // If we have URL params, use them as fallback
        if (urlScore) {
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : "Failed to load result");
        }
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchResult();
    }
  }, [applicationId, router, urlScore]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 90) return "from-green-500 to-green-600";
    if (score >= 70) return "from-blue-500 to-blue-600";
    if (score >= 50) return "from-yellow-500 to-yellow-600";
    return "from-red-500 to-red-600";
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8915C] mx-auto mb-4"></div>
          <p className="text-[#5A534A] dark:text-slate-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#2D2A24] dark:text-white mb-2">
              Error Loading Results
            </h2>
            <p className="text-[#5A534A] dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={() => router.push("/candidate/applications")}>
              Back to Applications
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
            passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
          }`}>
            {passed ? (
              <CheckCircle className="h-10 w-10 text-green-600" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600" />
            )}
          </div>
          
          <h1 className="text-3xl font-serif font-medium text-[#2D2A24] dark:text-white mb-2">
            Assessment {passed ? "Completed Successfully" : "Completed"}
          </h1>
          
          <p className="text-[#5A534A] dark:text-slate-400">
            {passed 
              ? "Congratulations! You've qualified for the next round."
              : "Thank you for completing the assessment."
            }
          </p>
        </motion.div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
                        className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                          {score}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Score
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-[#2D2A24] dark:text-white mb-2">
                      {getPerformanceLevel(score)}
                    </h3>
                    <Badge 
                      variant={passed ? "default" : "destructive"}
                      className={`text-sm px-4 py-1 ${
                        passed ? "bg-green-600 hover:bg-green-700" : ""
                      }`}
                    >
                      {passed ? "PASSED" : "NOT PASSED"}
                    </Badge>
                  </div>

                  <div className="text-[#5A534A] dark:text-slate-400">
                    {passed 
                      ? `You scored ${score}% and exceeded the 70% passing threshold.`
                      : `You scored ${score}%. A minimum of 70% is required to proceed.`
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {/* Performance Breakdown */}
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#B8915C]" />
                Performance Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Score</span>
                  <span className={getScoreColor(score)}>{score}%</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Passing Threshold</span>
                  <span>70%</span>
                </div>
                <Progress value={70} className="h-2" />
              </div>

              {result && (
                <div className="pt-2 border-t">
                  <div className="text-sm text-[#5A534A] dark:text-slate-400 space-y-1">
                    <div>Questions Answered: {result.questions?.length || 12}</div>
                    <div>MCQ Questions: {result.questions?.filter(q => q.type === "mcq").length || 10}</div>
                    <div>Coding Questions: {result.questions?.filter(q => q.type === "coding").length || 2}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-none bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[#B8915C]" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              {passed ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2D2A24] dark:text-white">
                        Interview Round
                      </h4>
                      <p className="text-sm text-[#5A534A] dark:text-slate-400">
                        You've qualified for the interview round. Check your applications page for interview scheduling.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2D2A24] dark:text-white">
                        Wait for Contact
                      </h4>
                      <p className="text-sm text-[#5A534A] dark:text-slate-400">
                        The hiring team will contact you soon to schedule your interview.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2D2A24] dark:text-white">
                        Application Closed
                      </h4>
                      <p className="text-sm text-[#5A534A] dark:text-slate-400">
                        Unfortunately, you didn't meet the minimum score requirement for this position.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Trophy className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2D2A24] dark:text-white">
                        Keep Improving
                      </h4>
                      <p className="text-sm text-[#5A534A] dark:text-slate-400">
                        Use this experience to improve your skills and apply for other opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={() => router.push("/candidate/applications")}
            className="bg-[#B8915C] hover:bg-[#9F7A4F] flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            View Applications
          </Button>
          
          {passed && (
            <Button
              variant="outline"
              onClick={() => router.push("/candidate/jobs")}
              className="border-[#B8915C] text-[#B8915C] hover:bg-[#B8915C]/10 flex items-center gap-2"
            >
              Browse More Jobs
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </motion.div>

        {/* Completion Time */}
        {result?.completed_at && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-8 text-sm text-[#5A534A] dark:text-slate-400"
          >
            Completed on {new Date(result.completed_at).toLocaleString()}
          </motion.div>
        )}
      </div>
    </div>
  );
}