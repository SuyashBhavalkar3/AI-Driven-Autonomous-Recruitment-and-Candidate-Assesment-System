"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import StartScreen from "@/components/interview/StartScreen";
import DisqualificationScreen from "@/components/interview/DisqualificationScreen";
import CompletionScreen from "@/components/interview/CompletionScreen";
import InterviewHeader from "@/components/interview/InterviewHeader";
import ProgressBar from "@/components/interview/ProgressBar";
import CameraPanel from "@/components/interview/CameraPanel";
import QuestionPanel from "@/components/interview/QuestionPanel";
import { useFaceRecognition } from "@/hooks/useFaceRecognition";
import { useVoiceMonitoring } from "@/hooks/useVoiceMonitoring";
import { useProctoring } from "@/hooks/useProctoring";
import { useCamera } from "@/hooks/useCamera";
import { useTimer } from "@/hooks/useTimer";
import { useWebSocketTTS } from "@/hooks/useWebSocketTTS";
import type { Question } from "@/components/interview/StartScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

// Dummy questions for now (no API call)
const DUMMY_QUESTIONS: Question[] = [
  {
    id: 1,
    type: "oral",
    question: "Describe your experience with modern frontend frameworks.",
    duration: 120,
  },
  {
    id: 2,
    type: "coding",
    question:
      "Write a function to find the longest palindromic substring in a given string.",
    duration: 900,
    starterCode: `function longestPalindrome(s) {\n  // Your code here\n}\n\nconsole.log(longestPalindrome("babad"));`,
  },
  {
    id: 3,
    type: "oral",
    question: "Explain the concept of closures in JavaScript with an example.",
    duration: 180,
  },
  {
    id: 4,
    type: "coding",
    question: "Implement a function that flattens a nested array.",
    duration: 600,
    starterCode: `function flattenArray(arr) {\n  // Your code here\n}\n\nconsole.log(flattenArray([1, [2, [3, 4], 5]]));`,
  },
];

export default function InterviewPage() {
  // Interview questions state – use dummy directly
  const [questions, setQuestions] = useState<Question[]>(DUMMY_QUESTIONS);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false); // No loading

  // Interview state
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [completed, setCompleted] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState("");

  // Code compilation state
  const [compileOutput, setCompileOutput] = useState<string>("");
  const [isCompiling, setIsCompiling] = useState(false);

  // Camera & mic controls (auto-starts on mount)
  const {
    videoRef,
    isCameraOn,
    toggleCamera,
    isMicOn,
    toggleMic,
    stream,
    error: cameraError,
    retry: retryCamera, // renamed for clarity
  } = useCamera();

  // TTS via WebSocket
  const {
    speak,
    cancel: cancelTTS,
    isSpeaking: isAISpeaking,
  } = useWebSocketTTS({ url: "ws://localhost:8000/tts" });

  // Proctoring (violations, visibility, network)
  const { violations, addViolation, disqualify } = useProctoring({
    maxViolations: 3,
  });

  // Face recognition (proctoring)
  const {
    modelsLoaded,
    referenceDescriptor,
    captureReference,
    startFaceCheck,
    stopFaceCheck,
    canvasRef,
  } = useFaceRecognition({ videoRef: videoRef as React.RefObject<HTMLVideoElement> });

  // Voice monitoring (proctoring)
  const { isSpeaking, setupVoiceMonitoring, cleanupVoiceMonitoring } =
    useVoiceMonitoring({
      stream,
      isMicOn,
      questionType: questions[currentIndex]?.type,
      onViolation: addViolation,
    });

  // Create a ref to hold the resetTimer function (to break circular dependency)
  const resetTimerRef = useRef<(newTime: number) => void | null>(null);

  // Define handleNext BEFORE useTimer, using the ref to call resetTimer
  const handleNext = useCallback(() => {
    if (completed || disqualified) return;

    if (currentIndex < questions.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      // Use the ref to call resetTimer with the new question's duration
      if (resetTimerRef.current) {
        resetTimerRef.current(questions[next].duration);
      }
    } else {
      setCompleted(true);
      cancelTTS();
      stopFaceCheck();
      cleanupVoiceMonitoring();
    }
  }, [
    completed,
    disqualified,
    currentIndex,
    questions,
    cancelTTS,
    stopFaceCheck,
    cleanupVoiceMonitoring,
  ]);

  // Timer - now handleNext is defined, so we can pass it
  const { timeLeft, resetTimer } = useTimer({
    initialTime: questions[currentIndex]?.duration || 0,
    active: started && !completed && !disqualified,
    onExpire: handleNext,
  });

  // After useTimer, store resetTimer in the ref
  useEffect(() => {
    resetTimerRef.current = resetTimer;
  }, [resetTimer]);

  // Effect to handle disqualification when violations reach limit
  useEffect(() => {
    if (violations >= 3) {
      setDisqualified(true);
      setDisqualificationReason(`Exceeded maximum violations (3).`);
    }
  }, [violations]);

  // Cleanup when disqualified
  useEffect(() => {
    if (disqualified) {
      stopFaceCheck();
      cleanupVoiceMonitoring();
      cancelTTS();
    }
  }, [disqualified, stopFaceCheck, cleanupVoiceMonitoring, cancelTTS]);

  // Handle camera error
  useEffect(() => {
    if (cameraError) {
      disqualify(cameraError);
    }
  }, [cameraError, disqualify]);

  // Auto-start first question when interview starts
  useEffect(() => {
    if (
      started &&
      questions.length > 0 &&
      !referenceDescriptor &&
      !disqualified &&
      !completed
    ) {
      const timeout = setTimeout(async () => {
        const success = await captureReference();
        if (success) {
          resetTimer(questions[0].duration);
          speak(questions[0].question);
        } else {
          disqualify("Could not capture reference face");
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [
    started,
    questions,
    referenceDescriptor,
    disqualified,
    completed,
    captureReference,
    resetTimer,
    speak,
    disqualify,
  ]);

  // Speak question when it changes (for subsequent questions)
  useEffect(() => {
    if (
      started &&
      questions.length > 0 &&
      referenceDescriptor &&
      !disqualified &&
      !completed &&
      currentIndex > 0
    ) {
      speak(questions[currentIndex].question);
    }
  }, [
    currentIndex,
    started,
    questions,
    referenceDescriptor,
    disqualified,
    completed,
    speak,
  ]);

  // Start face checks after reference captured
  useEffect(() => {
    if (started && referenceDescriptor && !completed && !disqualified) {
      startFaceCheck((reason) => addViolation(reason));
    } else {
      stopFaceCheck();
    }
    return stopFaceCheck;
  }, [
    started,
    referenceDescriptor,
    completed,
    disqualified,
    addViolation,
    startFaceCheck,
    stopFaceCheck,
  ]);

  // Start voice monitoring
  useEffect(() => {
    if (started && isMicOn && !completed && !disqualified) {
      setupVoiceMonitoring();
    } else {
      cleanupVoiceMonitoring();
    }
    return cleanupVoiceMonitoring;
  }, [
    started,
    isMicOn,
    currentIndex,
    completed,
    disqualified,
    setupVoiceMonitoring,
    cleanupVoiceMonitoring,
  ]);

  // Reset answer on question change
  useEffect(() => {
    setAnswer("");
    setCompileOutput("");
  }, [currentIndex]);

  // Handle start interview
  const handleStart = () => {
    setStarted(true);
  };

  // Handle code compilation
  const handleRunCode = useCallback(async () => {
    setIsCompiling(true);
    setCompileOutput("");
    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: answer, language: "javascript" }),
      });
      const data = await response.json();
      setCompileOutput(data.output || data.error || "No output");
    } catch (error) {
      setCompileOutput("Compilation request failed");
    } finally {
      setIsCompiling(false);
    }
  }, [answer]);

  // Disqualification screen
  if (disqualified) {
    return <DisqualificationScreen reason={disqualificationReason} />;
  }

  // Start screen
  if (!started) {
    return (
      <StartScreen
        questions={questions}
        onStart={handleStart}
        modelsLoaded={modelsLoaded}
      />
    );
  }

  // Completion screen
  if (completed) {
    return <CompletionScreen />;
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading interview questions...
          </p>
        </div>
      </div>
    );
  }

  // Main interview UI
  return (
    <div className="min-h-screen">
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <InterviewHeader
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          timeLeft={timeLeft}
          violations={violations}
          isSpeaking={isSpeaking}
          isAISpeaking={true}
        />
        <ProgressBar
          currentIndex={currentIndex}
          totalQuestions={questions.length}
        />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <CameraPanel
            videoRef={videoRef as React.RefObject<HTMLVideoElement>}
            stream={stream}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            onToggleCamera={toggleCamera}
            onToggleMic={toggleMic}
            error={cameraError}
            onRetry={retryCamera}
          />
          <QuestionPanel
            question={currentQuestion}
            answer={answer}
            setAnswer={setAnswer}
            onNext={handleNext}
            isLast={currentIndex === questions.length - 1}
            isSpeaking={isSpeaking}
            onRunCode={handleRunCode}
            isCompiling={isCompiling}
            compileOutput={compileOutput}
          />
        </div>
      </div>
    </div>
  );
}