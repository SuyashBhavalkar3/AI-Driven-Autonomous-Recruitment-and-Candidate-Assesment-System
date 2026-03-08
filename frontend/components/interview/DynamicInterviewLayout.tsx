"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CodeCompilerPanel from "./CodeCompilerPanel";
import CandidateProctoringPanel from "./CandidateProctoringPanel";
import ConversationPanel from "./ConversationPanel";
import { useCamera } from "@/hooks/useCamera";
import { useTimer } from "@/hooks/useTimer";
import { useProctoring } from "@/hooks/useProctoring";
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

const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS || "ws://localhost:8000";

export default function DynamicInterviewLayout({
  applicationId = "test",
  company = "Tech Company",
  position = "Software Engineer",
}: DynamicInterviewLayoutProps) {
  // Interview state
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

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // Camera & microphone
  const {
    videoRef,
    isCameraOn,
    toggleCamera,
    isMicOn,
    toggleMic,
    stream,
    error: cameraError,
  } = useCamera();

  // Proctoring
  const { violations, disqualify } = useProctoring({
    maxViolations: 3,
  });

  // Timer
  const { timeLeft } = useTimer({
    initialTime: context.totalDuration * 60,
    active: context.currentState !== "greeting",
    onExpire: () => {
      handleInterviewEnd();
    },
  });

  // Initialize WebSocket connection
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
        console.log("Backend message:", msg);
        handleBackendMessage(msg);
      };

      wsRef.current.onerror = () => {
        console.error("WebSocket error");
        addMessage("system", "Connection error occurred");
      };

      wsRef.current.onclose = () => {
        console.log("WebSocket disconnected");
      };

      return () => {
        if (wsRef.current) wsRef.current.close();
      };
    } catch (error) {
      console.error("WebSocket setup failed:", error);
      addMessage("system", "Failed to connect to interview server");
    }
  }, [applicationId, position, company]);

  // Add message to conversation
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
      return newMessage;
    },
    []
  );

  // Handle backend messages
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
        setIsWaitingForResponse(true);
        break;

      case "coding_challenge":
        setCurrentCodingProblem(msg.challenge);
        addMessage(
          "ai",
          `Coding Challenge: ${msg.challenge?.title}\n\n${msg.challenge?.description}`
        );
        setIsWaitingForResponse(true);
        break;

      case "code_evaluation":
        addMessage(
          "ai",
          `Score: ${msg.evaluation?.score}/100\nFeedback: ${msg.evaluation?.feedback}`
        );
        setContext((prev) => ({
          ...prev,
          score:
            (prev.score + (msg.evaluation?.score || 0)) /
            (prev.questionsAsked + 1),
        }));
        setIsWaitingForResponse(false);
        break;

      case "execution_result":
        addMessage(
          "system",
          `Execution Output:\n${msg.output || msg.error || "No output"}`,
          {
            executionResult: { output: msg.output, error: msg.error },
          }
        );
        break;

      case "interview_complete":
        handleInterviewEnd();
        break;

      case "error":
        addMessage("system", `Error: ${msg.message}`);
        if (msg.critical) {
          disqualify(msg.message);
        }
        break;
    }
  };

  // Send message via WebSocket
  const sendWebSocketMessage = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  // Handle candidate message submission
  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    addMessage("candidate", message);
    setIsWaitingForResponse(true);

    sendWebSocketMessage({
      type: "candidate_response",
      text: message,
      context: context,
    });

    setContext((prev) => ({
      ...prev,
      lastCandidateResponse: message,
      questionsAsked: prev.questionsAsked + 1,
    }));
  };

  // Handle code submission
  const handleCodeSubmit = (code: string, language: string) => {
    addMessage("candidate", `Submitted code in ${language}`);
    setIsWaitingForResponse(true);

    sendWebSocketMessage({
      type: "code_submission",
      code,
      language,
      problemId: currentCodingProblem?.id,
      context: context,
    });
  };

  // Handle interview end
  const handleInterviewEnd = () => {
    setCompleted(true);
    if (wsRef.current) wsRef.current.close();
  };

  // Screens
  if (disqualified) {
    return <DisqualificationScreen reason="Exceeded maximum violations" />;
  }

  if (completed) {
    return <CompletionScreen />;
  }

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-full mx-auto h-screen flex flex-col">
        {/* Header Stats */}
        <div className="mb-4 grid grid-cols-4 gap-2 text-sm">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400 text-xs">Time Left</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400 text-xs">Questions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {context.questionsAsked}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400 text-xs">Score</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {Math.round(context.score)}%
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400 text-xs">Violations</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {violations}/3
            </p>
          </div>
        </div>

        {/* Main Three-Panel Layout */}
        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          {/* Left Panel - Code Compiler (6 columns) */}
          <div className="col-span-6 min-h-0 overflow-hidden">
            <CodeCompilerPanel
              problem={currentCodingProblem}
              onCodeSubmit={handleCodeSubmit}
              sessionId={`app_${applicationId}`}
            />
          </div>

          {/* Middle Panel - Conversation (3 columns) */}
          <div className="col-span-3 min-h-0 overflow-hidden">
            <ConversationPanel
              messages={messages}
              context={context}
              onSendMessage={handleSendMessage}
              isWaitingForResponse={isWaitingForResponse}
              isAISpeaking={isAISpeaking}
            />
          </div>

          {/* Right Panel - Camera (3 columns) */}
          <div className="col-span-3 min-h-0 overflow-hidden">
            <CandidateProctoringPanel
              isCameraOn={isCameraOn}
              isMicOn={isMicOn}
              stream={stream || undefined}
              onCameraToggle={toggleCamera}
              onMicToggle={toggleMic}
              error={cameraError || undefined}
              isSpeaking={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
