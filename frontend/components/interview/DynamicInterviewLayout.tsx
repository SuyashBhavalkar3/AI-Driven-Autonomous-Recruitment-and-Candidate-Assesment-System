"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CodeCompilerPanel from "./CodeCompilerPanel";
import CandidateProctoringPanel from "./CandidateProctoringPanel";
import ConversationPanel from "./ConversationPanel";
import AISpeakingAnimation from "./AISpeakingAnimation";
import InterviewProgressTracker from "./InterviewProgressTracker";
import { useCamera } from "@/hooks/useCamera";
import { useTimer } from "@/hooks/useTimer";
import { useProctoring } from "@/hooks/useProctoring";
import { useFaceRecognition } from "@/hooks/useFaceRecognition";
import { useSarvamTTS } from "@/hooks/useSarvamTTS";
import {
  ConversationMessage,
  InterviewContext,
  initialContext,
} from "@/services/conversationStateManager";
import { Card, CardContent } from "@/components/ui/card";
import DisqualificationScreen from "./DisqualificationScreen";
import CompletionScreen from "./CompletionScreen";

interface DynamicInterviewLayoutProps {
  applicationId?: string;
  company?: string;
  position?: string;
}

const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS || "ws://127.0.0.1:8000";
const MAX_VIOLATIONS = 3;

export default function DynamicInterviewLayout({
  applicationId = "test",
  company = "Tech Company",
  position = "Software Engineer",
}: DynamicInterviewLayoutProps) {
  // ---------- State ----------
  const [context, setContext] = useState<InterviewContext>({
    ...initialContext,
    position,
    company,
  });
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [currentCodingProblem, setCurrentCodingProblem] = useState<any>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);

  // ---------- Hooks (order matters) ----------
  // TTS
  const { speak: speakText } = useSarvamTTS({
    onSpeakingStart: () => setIsAISpeaking(true),
    onSpeakingEnd: () => {
      setIsAISpeaking(false);
      setIsWaitingForResponse(false);
    },
  });

  // Camera
  const {
    videoRef,
    isCameraOn,
    toggleCamera,
    isMicOn,
    toggleMic,
    stream,
    error: cameraError,
  } = useCamera();

  // Proctoring (must be before the effect that uses disqualify)
  const { violations: proctoringViolations, disqualify } = useProctoring({
    maxViolations: MAX_VIOLATIONS,
  });

  // Face Recognition
  const {
    faceDetected,
    multipleFaces,
    gazeAway,
  } = useFaceRecognition({
    videoRef,
    enabled: isCameraOn && !disqualified && !completed,
    onViolation: (type) => console.log(`Face violation: ${type}`),
  });

  // Local face violations count
  const [faceViolations, setFaceViolations] = useState(0);

  // ---------- Function Definitions (all before useTimer) ----------
  const addMessage = useCallback(
    (role: "candidate" | "ai" | "system", content: string, metadata?: any) => {
      const newMessage: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random()}`,
        role,
        content,
        timestamp: Date.now(),
        metadata,
      };
      setMessages((prev) => [...prev, newMessage]);
      if (role === "ai" && content) {
        setTimeout(() => speakText(content), 100);
      }
      return newMessage;
    },
    [speakText]
  );

  const sendWebSocketMessage = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  const handleInterviewEnd = () => {
    setCompleted(true);
    wsRef.current?.close();
  };

  const handleBackendMessage = (msg: any) => {
    switch (msg.type) {
      case "interview_started":
        addMessage("ai", `Welcome! Starting interview for ${position} at ${company}`);
        setIsWaitingForResponse(false);
        break;
      case "section_started":
      case "behavioral_question":
      case "follow_up_question":
        addMessage("ai", msg.text || msg.question);
        break;
      case "coding_challenge":
        setCurrentCodingProblem(msg.challenge);
        addMessage(
          "ai",
          `Coding Challenge: ${msg.challenge?.title}\n\n${msg.challenge?.description}`
        );
        break;
      case "code_evaluation":
        addMessage(
          "ai",
          `Score: ${msg.evaluation?.score}/100\nFeedback: ${msg.evaluation?.feedback}`
        );
        setContext((prev) => ({
          ...prev,
          score: (prev.score + (msg.evaluation?.score || 0)) / (prev.questionsAsked + 1),
        }));
        setIsWaitingForResponse(false);
        break;
      case "execution_result":
        addMessage("system", `Execution Output:\n${msg.output || msg.error || "No output"}`, {
          executionResult: { output: msg.output, error: msg.error },
        });
        break;
      case "interview_complete":
        handleInterviewEnd();
        break;
      case "error":
        addMessage("system", `Error: ${msg.message}`);
        if (msg.critical) {
          disqualify(msg.message);
          setDisqualified(true);
        }
        break;
    }
  };

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;
    addMessage("candidate", message);
    setIsWaitingForResponse(true);
    sendWebSocketMessage({ type: "candidate_response", text: message, context });
    setContext((prev) => ({
      ...prev,
      lastCandidateResponse: message,
      questionsAsked: prev.questionsAsked + 1,
    }));
  };

  const handleCodeSubmit = (code: string, language: string) => {
    addMessage("candidate", `Submitted code in ${language}`);
    setIsWaitingForResponse(true);
    sendWebSocketMessage({
      type: "code_submission",
      code,
      language,
      problemId: currentCodingProblem?.id,
      context,
    });
  };

  // ---------- Timer (uses handleInterviewEnd, defined above) ----------
  const { timeLeft } = useTimer({
    initialTime: context.totalDuration * 60,
    active: context.currentState !== "greeting",
    onExpire: handleInterviewEnd,
  });

  // ---------- WebSocket ----------
  useEffect(() => {
    const sessionId = `app_${applicationId}_${Date.now()}`;
    try {
      const wsUrl = `${BACKEND_WS}/ws/interview/${sessionId}?position=${encodeURIComponent(
        position
      )}&company=${encodeURIComponent(company)}`;
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        addMessage("system", "Interview started. Connecting to AI interviewer...");
      };
      wsRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleBackendMessage(msg);
      };
      wsRef.current.onerror = () => {
        console.error("WebSocket error");
        addMessage("system", "Connection error occurred");
      };
      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
      };
      return () => wsRef.current?.close();
    } catch (error) {
      console.error("WebSocket setup failed:", error);
      addMessage("system", "Failed to connect to interview server");
    }
  }, [applicationId, position, company]);

  // ---------- Face violation counter ----------
  useEffect(() => {
    if (!isCameraOn || disqualified || completed) return;

    let violationDetected = false;
    if (!faceDetected) violationDetected = true;
    else if (multipleFaces) violationDetected = true;
    else if (gazeAway) violationDetected = true;

    if (violationDetected) {
      setFaceViolations(prev => {
        const newCount = Math.min(prev + 1, MAX_VIOLATIONS);
        if (newCount >= MAX_VIOLATIONS) {
          disqualify("Excessive face-related violations");
          setDisqualified(true);
        }
        return newCount;
      });
    }
  }, [faceDetected, multipleFaces, gazeAway, isCameraOn, disqualified, completed, disqualify]);

  const totalViolations = Math.min(proctoringViolations + faceViolations, MAX_VIOLATIONS);

  // ---------- Screen rendering ----------
  if (disqualified) return <DisqualificationScreen reason="Exceeded maximum violations" />;
  if (completed) return <CompletionScreen />;
  if (!isCameraOn && context.currentState === "greeting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Camera Required</h2>
            <p className="text-slate-600 mb-6">
              Please enable your camera to start the interview.
            </p>
            <button
              onClick={toggleCamera}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
            >
              Enable Camera
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- Main layout ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Enhanced Header with Interview Progress */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {position} Interview
              </h1>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {company}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Interview Status Indicator */}
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Live Interview
                </span>
              </div>
              {/* AI Speaking Indicator */}
              {isAISpeaking && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                  <AISpeakingAnimation width={16} height={16} />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    AI Speaking
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-6 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <p className="text-blue-700 dark:text-blue-300 text-xs font-medium">Time Remaining</p>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-purple-700 dark:text-purple-300 text-xs font-medium">Questions Asked</p>
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {context.questionsAsked}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-green-700 dark:text-green-300 text-xs font-medium">Current Score</p>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {Math.round(context.score)}%
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-orange-700 dark:text-orange-300 text-xs font-medium">Interview Stage</p>
              </div>
              <p className="text-sm font-bold text-orange-900 dark:text-orange-100 capitalize">
                {context.currentState.replace('_', ' ')}
              </p>
            </div>
            
            <div className={`bg-gradient-to-r p-4 rounded-xl border ${
              totalViolations >= MAX_VIOLATIONS * 0.8 
                ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
                : 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${
                  totalViolations >= MAX_VIOLATIONS * 0.8 ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <p className={`text-xs font-medium ${
                  totalViolations >= MAX_VIOLATIONS * 0.8 
                    ? 'text-red-700 dark:text-red-300' 
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>Violations</p>
              </div>
              <p className={`text-2xl font-bold ${
                totalViolations >= MAX_VIOLATIONS * 0.8 
                  ? 'text-red-900 dark:text-red-100' 
                  : 'text-yellow-900 dark:text-yellow-100'
              }`}>
                {totalViolations}/{MAX_VIOLATIONS}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/20 dark:to-slate-700/20 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${
                  faceDetected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">Proctoring Status</p>
              </div>
              <p className={`text-sm font-bold ${
                faceDetected ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
              }`}>
                {faceDetected ? 'Active' : 'Issues'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-full mx-auto p-6 h-[calc(100vh-200px)]">
        <div className="flex gap-6 h-full">
          {/* Left Panel - Code Compiler (45%) */}
          <div className="flex-[45] min-h-0">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 h-full overflow-hidden">
              <CodeCompilerPanel
                problem={currentCodingProblem}
                onCodeSubmit={handleCodeSubmit}
                sessionId={`app_${applicationId}`}
              />
            </div>
          </div>

          {/* Middle Panel - Conversation (30%) */}
          <div className="flex-[30] min-h-0">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 h-full overflow-hidden">
              <ConversationPanel
                messages={messages}
                context={context}
                onSendMessage={handleSendMessage}
                isWaitingForResponse={isWaitingForResponse}
                isAISpeaking={isAISpeaking}
                backendUrl={BACKEND_WS.replace('ws://', 'http://').replace('wss://', 'https://')}
              />
            </div>
          </div>

          {/* Right Panel - Enhanced Proctoring & Progress (25%) */}
          <div className="flex-[25] min-h-0 space-y-4">
            {/* Proctoring Panel */}
            <div className="flex-[3] bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <CandidateProctoringPanel
                videoRef={videoRef}
                isCameraOn={isCameraOn}
                isMicOn={isMicOn}
                stream={stream || undefined}
                onCameraToggle={toggleCamera}
                onMicToggle={toggleMic}
                error={cameraError || undefined}
                isSpeaking={false}
                faceDetected={faceDetected}
                multipleFaces={multipleFaces}
                gazeAway={gazeAway}
              />
            </div>
            
            {/* Interview Progress Tracker */}
            <div className="flex-[1]">
              <InterviewProgressTracker
                currentState={context.currentState}
                questionsAsked={context.questionsAsked}
                totalDuration={context.totalDuration}
                timeLeft={timeLeft}
                score={context.score}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}