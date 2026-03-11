"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, Clock, AlertTriangle } from "lucide-react";

interface InterviewStage {
  id: string;
  name: string;
  description: string;
  status: "completed" | "current" | "upcoming" | "skipped";
  duration?: number;
  score?: number;
}

interface InterviewProgressTrackerProps {
  currentState: string;
  questionsAsked: number;
  totalDuration: number;
  timeLeft: number;
  score: number;
}

export default function InterviewProgressTracker({
  currentState,
  questionsAsked,
  totalDuration,
  timeLeft,
  score,
}: InterviewProgressTrackerProps) {
  const [stages, setStages] = useState<InterviewStage[]>([
    {
      id: "greeting",
      name: "Welcome",
      description: "Initial setup and introduction",
      status: "completed",
    },
    {
      id: "introduction",
      name: "Introduction",
      description: "Personal background questions",
      status: "upcoming",
    },
    {
      id: "technical_question",
      name: "Technical Round",
      description: "Technical knowledge assessment",
      status: "upcoming",
    },
    {
      id: "coding_question",
      name: "Coding Challenge",
      description: "Live coding problem solving",
      status: "upcoming",
    },
    {
      id: "behavioral_question",
      name: "Behavioral Round",
      description: "Situational and behavioral questions",
      status: "upcoming",
    },
    {
      id: "interview_complete",
      name: "Completion",
      description: "Interview wrap-up and next steps",
      status: "upcoming",
    },
  ]);

  useEffect(() => {
    setStages(prev => prev.map(stage => {
      if (stage.id === currentState) {
        return { ...stage, status: "current" as const };
      } else if (shouldMarkCompleted(stage.id, currentState)) {
        return { ...stage, status: "completed" as const };
      } else {
        return { ...stage, status: "upcoming" as const };
      }
    }));
  }, [currentState]);

  const shouldMarkCompleted = (stageId: string, currentState: string): boolean => {
    const stageOrder = ["greeting", "introduction", "technical_question", "coding_question", "behavioral_question", "interview_complete"];
    const currentIndex = stageOrder.indexOf(currentState);
    const stageIndex = stageOrder.indexOf(stageId);
    return stageIndex < currentIndex;
  };

  const getStageIcon = (stage: InterviewStage) => {
    switch (stage.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "current":
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case "skipped":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStageColor = (stage: InterviewStage) => {
    switch (stage.status) {
      case "completed":
        return "text-green-700 dark:text-green-300";
      case "current":
        return "text-blue-700 dark:text-blue-300";
      case "skipped":
        return "text-yellow-700 dark:text-yellow-300";
      default:
        return "text-slate-500 dark:text-slate-400";
    }
  };

  const getProgressPercentage = () => {
    const completedStages = stages.filter(s => s.status === "completed").length;
    const currentStage = stages.find(s => s.status === "current");
    const totalStages = stages.length;
    
    let progress = (completedStages / totalStages) * 100;
    if (currentStage) {
      progress += (1 / totalStages) * 50; // Add 50% for current stage
    }
    
    return Math.min(progress, 100);
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Interview Progress
          </h3>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {Math.round(getProgressPercentage())}% Complete
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Stage List */}
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {getStageIcon(stage)}
                {index < stages.length - 1 && (
                  <div className={`w-px h-6 mt-2 ${
                    stage.status === "completed" ? "bg-green-300" : "bg-slate-300 dark:bg-slate-600"
                  }`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${getStageColor(stage)}`}>
                    {stage.name}
                  </h4>
                  {stage.status === "current" && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {stage.description}
                </p>
                {stage.score && (
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Score: {stage.score}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Questions</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {questionsAsked}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Time Left</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {Math.floor(timeLeft / 60)}m
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Score</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {Math.round(score)}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}