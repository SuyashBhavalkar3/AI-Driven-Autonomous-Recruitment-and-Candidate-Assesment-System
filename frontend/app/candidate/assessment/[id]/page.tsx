"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  Code,
  HelpCircle,
  Lock,
} from "lucide-react";
import { getAuthToken } from "@/lib/auth";
import { MCQQuestion } from "@/components/assessment/MCQQuestion";
import { CodingQuestion } from "@/components/assessment/CodingQuestion";
import { ProctoringPanel } from "@/components/assessment/ProctoringPanel";

interface Question {
  id: number;
  type: "mcq" | "coding";
  title: string;
  description: string;
  points: number;
  options?: string[];
  starter_code?: string;
  category?: string;
  difficulty?: string;
}

interface Assessment {
  id: number;
  application_id: number;
  questions: Question[];
  completed: boolean;
  score?: number;
  started_at?: string;
  completed_at?: string;
}

interface Warning {
  id: number;
  type: "tab_switch" | "copy_paste" | "visibility";
  message: string;
  timestamp: Date;
}

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = Number(params.id);

  // Assessment state
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proctoring state
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [isTabActive, setIsTabActive] = useState(true);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [currentWarning, setCurrentWarning] = useState<Warning | null>(null);
  const [isDisqualified, setIsDisqualified] = useState(false);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes
  const [timerActive, setTimerActive] = useState(false);

  // Refs
  const warningCountRef = useRef(0);
  const lastActivityRef = useRef(Date.now());

  // Constants
  const MAX_WARNINGS = 3;
  const ASSESSMENT_TIME_LIMIT = 3600; // 60 minutes in seconds

  // Add warning
  const addWarning = useCallback((type: Warning["type"], message: string) => {
    if (isDisqualified) return;

    warningCountRef.current += 1;
    const warning: Warning = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date(),
    };

    setWarnings(prev => [...prev, warning]);
    setCurrentWarning(warning);
    setShowWarningDialog(true);

    console.log(`Warning ${warningCountRef.current}/${MAX_WARNINGS}: ${message}`);

    // Check if max warnings reached
    if (warningCountRef.current >= MAX_WARNINGS) {
      setIsDisqualified(true);
      handleDisqualification();
    }
  }, [isDisqualified]);

  // Handle disqualification
  const handleDisqualification = useCallback(async () => {
    console.log("Candidate disqualified - too many warnings");
    
    try {
      const token = getAuthToken();
      if (!token) return;

      // Submit assessment with failure status
      await fetch(`http://localhost:8000/v1/assessment/submit/${assessment?.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: answers,
          disqualified: true,
          reason: "Too many proctoring violations"
        }),
      });

      // Redirect to failure page
      router.push(`/candidate/applications?disqualified=true`);
    } catch (error) {
      console.error("Error submitting disqualification:", error);
    }
  }, [assessment?.id, answers, router]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabActive(isVisible);

      if (!isVisible && timerActive && !isDisqualified) {
        addWarning("tab_switch", "You switched away from the assessment tab. This is not allowed during the test.");
      }
    };

    const handleFocus = () => setIsTabActive(true);
    const handleBlur = () => {
      if (timerActive && !isDisqualified) {
        addWarning("visibility", "Assessment window lost focus. Please keep the assessment window active.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [timerActive, isDisqualified, addWarning]);

  // Prevent copy/paste
  useEffect(() => {
    const preventCopyPaste = (e: ClipboardEvent) => {
      if (timerActive && !isDisqualified) {
        e.preventDefault();
        addWarning("copy_paste", "Copy/paste operations are not allowed during the assessment.");
      }
    };

    const preventRightClick = (e: MouseEvent) => {
      if (timerActive && !isDisqualified) {
        e.preventDefault();
      }
    };

    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      if (timerActive && !isDisqualified) {
        // Prevent common shortcuts
        if (
          (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') || // Dev tools
          e.key === 'F12' || // Dev tools
          (e.ctrlKey && e.shiftKey && e.key === 'C') || // Dev tools
          (e.ctrlKey && e.key === 'u') // View source
        ) {
          e.preventDefault();
          addWarning("copy_paste", "Keyboard shortcuts are disabled during the assessment.");
        }
      }
    };

    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);
    document.addEventListener("cut", preventCopyPaste);
    document.addEventListener("contextmenu", preventRightClick);
    document.addEventListener("keydown", preventKeyboardShortcuts);

    return () => {
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
      document.removeEventListener("cut", preventCopyPaste);
      document.removeEventListener("contextmenu", preventRightClick);
      document.removeEventListener("keydown", preventKeyboardShortcuts);
    };
  }, [timerActive, isDisqualified, addWarning]);

  // Timer effect
  useEffect(() => {
    if (!timerActive || isDisqualified) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, isDisqualified]);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch assessment
  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(`http://localhost:8000/v1/assessment/start/${applicationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to load assessment");
        }

        const data: Assessment = await response.json();
        setAssessment(data);
        setTimeRemaining(ASSESSMENT_TIME_LIMIT);
        setTimerActive(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assessment");
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchAssessment();
    }
  }, [applicationId, router]);

  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    lastActivityRef.current = Date.now();
  };

  // Handle submit assessment
  const handleSubmitAssessment = async () => {
    if (!assessment || submitting) return;

    setSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token");

      const response = await fetch(`http://localhost:8000/v1/assessment/submit/${assessment.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit assessment");
      }

      const result = await response.json();
      
      // Redirect to results page
      router.push(`/candidate/assessment-result/${applicationId}?score=${result.score}&passed=${result.passed}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation handlers
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < (assessment?.questions.length || 0)) {
      setCurrentQuestionIndex(index);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8915C] mx-auto mb-4"></div>
          <p className="text-[#5A534A] dark:text-slate-400">Loading assessment...</p>
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
              Assessment Error
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

  if (!assessment) {
    return (
      <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-[#5A534A] dark:text-slate-400">Assessment not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-[#F9F6F0] dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-[#D6CDC2] dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="h-6 w-6 text-[#B8915C]" />
              <h1 className="text-xl font-semibold text-[#2D2A24] dark:text-white">
                Technical Assessment
              </h1>
              <Badge variant="outline" className="border-[#B8915C] text-[#B8915C]">
                Proctored
              </Badge>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Timer */}
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#B8915C]" />
                <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-500' : 'text-[#2D2A24] dark:text-white'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              {/* Progress */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#5A534A] dark:text-slate-400">
                  {currentQuestionIndex + 1} of {assessment.questions.length}
                </span>
                <Progress value={progress} className="w-24" />
              </div>
              
              {/* Warnings */}
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${warnings.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${warnings.length > 0 ? 'text-red-500' : 'text-[#5A534A] dark:text-slate-400'}`}>
                  {warnings.length}/{MAX_WARNINGS}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
                  {assessment.questions.map((question, index) => {
                    const isAnswered = answers[question.id.toString()] !== undefined;
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <Button
                        key={question.id}
                        variant={isCurrent ? "default" : "outline"}
                        size="sm"
                        className={`relative ${
                          isCurrent 
                            ? "bg-[#B8915C] hover:bg-[#9F7A4F]" 
                            : isAnswered 
                              ? "border-green-500 text-green-600" 
                              : ""
                        }`}
                        onClick={() => goToQuestion(index)}
                      >
                        {index + 1}
                        {question.type === "coding" && (
                          <Code className="h-3 w-3 ml-1" />
                        )}
                        {isAnswered && !isCurrent && (
                          <CheckCircle className="h-3 w-3 absolute -top-1 -right-1 text-green-500 bg-white rounded-full" />
                        )}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-[#5A534A] dark:text-slate-400 space-y-1">
                    <div>Answered: {answeredCount}/{assessment.questions.length}</div>
                    <div>MCQ Questions: {assessment.questions.filter(q => q.type === "mcq").length}</div>
                    <div>Coding Questions: {assessment.questions.filter(q => q.type === "coding").length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-[#B8915C]/10 text-[#B8915C]">
                          {currentQuestion.type === "mcq" ? "Multiple Choice" : "Coding"}
                        </Badge>
                        <Badge variant="outline">
                          {currentQuestion.points} points
                        </Badge>
                        {currentQuestion.category && (
                          <Badge variant="outline">
                            {currentQuestion.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-[#5A534A] dark:text-slate-400">
                        Question {currentQuestionIndex + 1} of {assessment.questions.length}
                      </div>
                    </div>
                    <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentQuestion.type === "mcq" ? (
                      <MCQQuestion
                        question={currentQuestion}
                        selectedAnswer={answers[currentQuestion.id.toString()]}
                        onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id.toString(), answer)}
                        disabled={isDisqualified}
                      />
                    ) : (
                      <CodingQuestion
                        question={currentQuestion}
                        code={answers[currentQuestion.id.toString()] || currentQuestion.starter_code || ""}
                        onCodeChange={(code) => handleAnswerChange(currentQuestion.id.toString(), code)}
                        disabled={isDisqualified}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0 || isDisqualified}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {currentQuestionIndex === assessment.questions.length - 1 ? (
                  <Button
                    onClick={handleSubmitAssessment}
                    disabled={submitting || isDisqualified}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? "Submitting..." : "Submit Assessment"}
                  </Button>
                ) : (
                  <Button
                    onClick={goToNextQuestion}
                    disabled={currentQuestionIndex === assessment.questions.length - 1 || isDisqualified}
                    className="bg-[#B8915C] hover:bg-[#9F7A4F]"
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Proctoring Warning
            </DialogTitle>
            <DialogDescription>
              {currentWarning?.message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Warning {warnings.length} of {MAX_WARNINGS}. 
                {warnings.length >= MAX_WARNINGS 
                  ? " You have been disqualified from this assessment."
                  : ` You have ${MAX_WARNINGS - warnings.length} warning(s) remaining.`
                }
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => setShowWarningDialog(false)}
              className="w-full"
              disabled={isDisqualified}
            >
              {isDisqualified ? "Assessment Terminated" : "I Understand"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proctoring Panel */}
      <ProctoringPanel
        isActive={timerActive}
        warnings={warnings}
        isTabActive={isTabActive}
        onWarning={addWarning}
      />
    </div>
  );
}