"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle, AlertTriangle, Send } from "lucide-react";

const assessment = {
  company: "TechCorp",
  position: "Senior Frontend Developer",
  duration: 3600,
  questions: [
    {
      id: 1,
      type: "coding",
      title: "Implement a debounce function",
      description: "Create a debounce function that delays the execution of a function until after a specified wait time has elapsed since the last time it was invoked.",
      points: 30,
      starterCode: `function debounce(func, wait) {\n  // Your code here\n}\n\n// Test\nconst log = debounce(() => console.log('Hello'), 1000);\nlog(); log(); log();`,
    },
    {
      id: 2,
      type: "coding",
      title: "Binary Tree Level Order Traversal",
      description: "Given the root of a binary tree, return the level order traversal of its nodes' values.",
      points: 40,
      starterCode: `function levelOrder(root) {\n  // Your code here\n}`,
    },
    {
      id: 3,
      type: "mcq",
      title: "React Hooks",
      description: "Which hook would you use to perform side effects in a functional component?",
      options: ["useState", "useEffect", "useContext", "useMemo"],
      points: 10,
    },
    {
      id: 4,
      type: "text",
      title: "System Design",
      description: "Explain how you would design a scalable URL shortener service. Include database design, caching, and handling high traffic.",
      points: 20,
    },
  ],
};

export default function AssessmentPage() {
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(assessment.duration);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (started && !submitted && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && started && !submitted) {
      handleSubmit();
    }
  }, [started, submitted, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    if (!submitted) {
      setSubmitted(true);
    }
  };

  const question = assessment.questions[currentQuestion];

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-2xl w-full border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl">{assessment.position} - Assessment</CardTitle>
            <p className="text-slate-600 dark:text-slate-400">{assessment.company}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Instructions</h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                <li>• Duration: {assessment.duration / 60} minutes</li>
                <li>• {assessment.questions.length} questions (coding, MCQ, and text-based)</li>
                <li>• Once started, the test cannot be paused</li>
                <li>• You can only take this assessment once</li>
                <li>• Auto-submits when time expires</li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-400">
                <strong>Important:</strong> Make sure you have a stable internet connection and are in a quiet environment before starting.
              </p>
            </div>

            <Button onClick={() => setStarted(true)} className="w-full h-12 text-lg">
              Start Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-lg w-full text-center border-slate-200 dark:border-slate-800">
          <CardContent className="p-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Assessment Submitted!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your answers are being evaluated. Results will be available within 24 hours.
            </p>
            <Button className="w-full">Back to Applications</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{assessment.position}</h1>
            <p className="text-slate-600 dark:text-slate-400">{assessment.company}</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border">
            <Clock className={`h-5 w-5 ${timeLeft < 300 ? "text-red-500" : "text-blue-600"}`} />
            <span className={`font-mono font-semibold ${timeLeft < 300 ? "text-red-500" : ""}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {assessment.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`flex-1 h-2 rounded-full transition-colors ${
                index === currentQuestion
                  ? "bg-blue-600"
                  : answers[assessment.questions[index].id]
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
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{question.type.toUpperCase()}</Badge>
                  <Badge variant="secondary">{question.points} points</Badge>
                </div>
                <CardTitle className="text-xl">{question.title}</CardTitle>
              </div>
              <span className="text-sm text-slate-500">
                {currentQuestion + 1} / {assessment.questions.length}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-2">{question.description}</p>
          </CardHeader>
          <CardContent>
            {question.type === "coding" && (
              <Textarea
                value={answers[question.id] || question.starterCode}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="font-mono text-sm min-h-[350px] bg-slate-50 dark:bg-slate-900"
              />
            )}

            {question.type === "mcq" && (
              <div className="space-y-3">
                {question.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setAnswers({ ...answers, [question.id]: index })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                      answers[question.id] === index
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {question.type === "text" && (
              <Textarea
                value={answers[question.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                className="min-h-[250px]"
                placeholder="Type your answer here..."
              />
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          {currentQuestion < assessment.questions.length - 1 ? (
            <Button onClick={() => setCurrentQuestion(currentQuestion + 1)}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Submit Assessment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
