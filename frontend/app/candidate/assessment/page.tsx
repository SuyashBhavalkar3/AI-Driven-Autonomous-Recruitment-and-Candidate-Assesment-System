"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle as AlertIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Send,
} from "lucide-react";

import {
  applicationsAPI,
  assessmentAPI,
  AssessmentDSAQuestion,
  AssessmentMCQQuestion,
  AssessmentSubmitResponse,
  profileAPI,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type AssessmentQuestion =
  | {
      id: number;
      type: "mcq";
      title: string;
      description: string;
      points: number;
      options: string[];
    }
  | {
      id: number;
      type: "coding";
      title: string;
      description: string;
      points: number;
      starterCode: string;
    };

const buildCodingPrompt = (question: AssessmentDSAQuestion) => {
  const details = [
    question.question_text,
    question.example_input ? `Example input: ${question.example_input}` : null,
    question.example_output ? `Example output: ${question.example_output}` : null,
    question.constraints ? `Constraints: ${question.constraints}` : null,
    question.expected_time_complexity
      ? `Expected time complexity: ${question.expected_time_complexity}`
      : null,
    question.expected_space_complexity
      ? `Expected space complexity: ${question.expected_space_complexity}`
      : null,
  ].filter(Boolean);

  return details.join("\n\n");
};

const normalizeQuestions = (
  mcqQuestions: AssessmentMCQQuestion[],
  dsaQuestions: AssessmentDSAQuestion[]
): AssessmentQuestion[] => {
  const normalizedMcq: AssessmentQuestion[] = mcqQuestions.map((question, index) => ({
    id: question.id,
    type: "mcq",
    title: question.topic || `MCQ Question ${index + 1}`,
    description: question.question_text,
    points: question.marks,
    options: [
      question.option_a,
      question.option_b,
      question.option_c,
      question.option_d,
    ],
  }));

  const normalizedCoding: AssessmentQuestion[] = dsaQuestions.map((question, index) => ({
    id: question.id,
    type: "coding",
    title: question.topic || `Coding Question ${index + 1}`,
    description: buildCodingPrompt(question),
    points: question.marks,
    starterCode: "",
  }));

  return [...normalizedMcq, ...normalizedCoding];
};

export default function AssessmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationIdParam = searchParams.get("applicationId");
  const applicationId = applicationIdParam ? Number(applicationIdParam) : null;

  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [started, setStarted] = useState(false);
  const [startingAssessment, setStartingAssessment] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<AssessmentSubmitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applicationMeta, setApplicationMeta] = useState<{ company: string; position: string } | null>(null);
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfileStatus() {
      try {
        setLoadingProfile(true);
        const status = await profileAPI.getCandidateStatus();

        if (mounted) {
          setProfileCompleted(status.profile_completed);
        }
      } catch (profileError) {
        if (mounted) {
          setError(
            profileError instanceof Error
              ? profileError.message
              : "Failed to verify profile completion."
          );
          setProfileCompleted(false);
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfileStatus();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadApplicationMeta() {
      if (!applicationId) {
        return;
      }

      try {
        const detail = await applicationsAPI.getMyApplicationDetail(applicationId);
        if (mounted) {
          setApplicationMeta({
            company: detail.job?.title || "Tech Company",
            position: detail.job?.title || "Software Engineer",
          });
        }
      } catch {
        // Keep interview fallbacks if detail loading fails.
      }
    }

    loadApplicationMeta();

    return () => {
      mounted = false;
    };
  }, [applicationId]);

  useEffect(() => {
    if (profileCompleted === false) {
      const timer = setTimeout(() => {
        router.push("/candidate/profile");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [profileCompleted, router]);

  const questions = useMemo(() => assessmentQuestions, [assessmentQuestions]);
  const question = questions[currentQuestion];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartAssessment = async () => {
    if (!applicationId) {
      setError("Missing application ID. Open the assessment from your application card.");
      return;
    }

    try {
      setStartingAssessment(true);
      setError(null);

      const response = await assessmentAPI.startAssessment(applicationId);
      const normalizedQuestions = normalizeQuestions(
        response.mcq_questions,
        response.dsa_questions
      );

      setAssessmentQuestions(normalizedQuestions);
      setStarted(true);
      setTimeLeft(3600);
      setCurrentQuestion(0);
    } catch (startError) {
      setError(
        startError instanceof Error ? startError.message : "Failed to start assessment."
      );
    } finally {
      setStartingAssessment(false);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!applicationId) {
      setError("Missing application ID. Cannot submit assessment.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const mcq_answers = questions
        .filter((item): item is Extract<AssessmentQuestion, { type: "mcq" }> => item.type === "mcq")
        .map((question) => ({
          question_id: question.id,
          selected_option: ["A", "B", "C", "D"][Number(answers[question.id] ?? 0)] || "A",
        }));

      const dsa_submissions = questions
        .filter((item): item is Extract<AssessmentQuestion, { type: "coding" }> => item.type === "coding")
        .map((question) => ({
          question_id: question.id,
          code: String(answers[question.id] ?? question.starterCode ?? ""),
          language: "python3",
        }));

      const result = await assessmentAPI.submitAssessment(applicationId, {
        mcq_answers,
        dsa_submissions,
      });

      setSubmissionResult(result);
      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to submit assessment."
      );
    } finally {
      setSubmitting(false);
    }
  }, [applicationId, questions, answers]);

  useEffect(() => {
    if (started && !submitted && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((previous) => previous - 1), 1000);
      return () => clearInterval(timer);
    }

    if (timeLeft === 0 && started && !submitted && !submitting) {
      void handleSubmit();
    }
  }, [handleSubmit, started, submitted, submitting, timeLeft]);

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8915C]" />
      </div>
    );
  }

  if (profileCompleted === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-2xl border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AlertIcon className="h-6 w-6 text-amber-600" />
              Complete Your Profile First
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
              <p className="mb-4 text-amber-900 dark:text-amber-300">
                Your backend profile status is still marked incomplete. Redirecting to your
                profile page in 3 seconds...
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/candidate/profile" className="flex-1">
                <Button className="w-full">Complete Profile</Button>
              </Link>
              <Link href="/candidate/applications" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to Applications
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-lg border-slate-200 text-center dark:border-slate-800">
          <CardContent className="p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Assessment Submitted!</h2>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              Score: {submissionResult?.total_score ?? 0}/100
            </p>
            {submissionResult?.qualifies_for_interview ? (
              <div className="space-y-3">
                <p className="text-sm text-[#B8915C]">
                  Assessment cleared. You can start the AI interview now.
                </p>
                <Link
                  href={`/candidate/interview?applicationId=${applicationId}&company=${encodeURIComponent(
                    applicationMeta?.company || "Tech Company"
                  )}&position=${encodeURIComponent(
                    applicationMeta?.position || "Software Engineer"
                  )}`}
                >
                  <Button className="w-full">Start AI Interview</Button>
                </Link>
              </div>
            ) : (
              <Link href="/candidate/applications">
                <Button className="w-full">Back to Applications</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-2xl border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl">Assessment</CardTitle>
            <p className="text-slate-600 dark:text-slate-400">
              Application ID: {applicationId ?? "Unavailable"}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
              <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
                Instructions
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                <li>- Duration: 60 minutes</li>
                <li>- Questions are loaded dynamically from the backend when you start</li>
                <li>- Once started, the assessment cannot be paused</li>
                <li>- Auto-submits when time expires</li>
              </ul>
            </div>

            <div className="flex gap-3 rounded-lg bg-amber-50 p-4 dark:bg-amber-950/30">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800 dark:text-amber-400">
                Make sure your internet connection is stable before starting.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            <Button
              onClick={handleStartAssessment}
              disabled={startingAssessment}
              className="h-12 w-full text-lg"
            >
              {startingAssessment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Assessment"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-lg border-slate-200 dark:border-slate-800">
          <CardContent className="space-y-4 p-8">
            <p className="text-slate-600 dark:text-slate-400">
              No assessment questions were returned for this application.
            </p>
            <Link href="/candidate/applications">
              <Button>Back to Applications</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assessment</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Application ID: {applicationId}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 dark:bg-slate-900">
            <Clock className={`h-5 w-5 ${timeLeft < 300 ? "text-red-500" : "text-blue-600"}`} />
            <span className={`font-mono font-semibold ${timeLeft < 300 ? "text-red-500" : ""}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
          {questions.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setCurrentQuestion(index)}
              className={`h-2 flex-1 rounded-full transition-colors ${
                index === currentQuestion
                  ? "bg-blue-600"
                  : answers[item.id] !== undefined
                  ? "bg-green-500"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline">{question.type.toUpperCase()}</Badge>
                  <Badge variant="secondary">{question.points} points</Badge>
                </div>
                <CardTitle className="text-xl">{question.title}</CardTitle>
              </div>
              <span className="text-sm text-slate-500">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-slate-600 dark:text-slate-400">
              {question.description}
            </p>
          </CardHeader>
          <CardContent>
            {question.type === "coding" && (
              <Textarea
                value={String(answers[question.id] ?? question.starterCode)}
                onChange={(event) =>
                  setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                }
                className="min-h-[350px] bg-slate-50 font-mono text-sm dark:bg-slate-900"
              />
            )}

            {question.type === "mcq" && (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <button
                    key={option}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, [question.id]: index }))
                    }
                    className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                      answers[question.id] === index
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          {currentQuestion < questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>Next</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Assessment
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
