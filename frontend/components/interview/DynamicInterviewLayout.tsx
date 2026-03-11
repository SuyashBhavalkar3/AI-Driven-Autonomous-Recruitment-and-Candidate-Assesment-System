"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CodeCompilerPanel from "./CodeCompilerPanel";
import CandidateProctoringPanel from "./CandidateProctoringPanel";
import ConversationPanel from "./ConversationPanel";
import { useCamera } from "@/hooks/useCamera";
import { useTimer } from "@/hooks/useTimer";
import { useProctoring } from "@/hooks/useProctoring";
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
  const isCleaningUpRef = useRef(false);

  // TTS Hook
  const {
    speak: speakText,
    isSpeaking: ttsIsSpeaking,
  } = useSarvamTTS({
    onSpeakingStart: () => setIsAISpeaking(true),
    onSpeakingEnd: () => {
      setIsAISpeaking(false);
      setIsWaitingForResponse(false);
    },
  });

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

  // Add message to conversation (no dependencies issue)
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

      // Auto-speak AI messages on arrival
      if (role === "ai" && content) {
        setTimeout(() => {
          speakText(content);
        }, 100);
      }

      return newMessage;
    },
    [speakText]
  );

  // Handle backend messages
  const handleBackendMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case "interview_started":
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "ai",
            content: `Welcome! Starting interview for ${msg.position || position} at ${msg.company || company}`,
            timestamp: Date.now(),
          },
        ]);
        setIsWaitingForResponse(false);
        break;

      case "section_started":
      case "behavioral_question":
      case "follow_up_question":
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "ai",
            content: msg.text || msg.question,
            timestamp: Date.now(),
          },
        ]);
        if (msg.text || msg.question) {
          setTimeout(() => speakText(msg.text || msg.question), 100);
        }
        break;

      case "coding_challenge":
        setCurrentCodingProblem(msg.challenge);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "ai",
            content: `Coding Challenge: ${msg.challenge?.title}\n\n${msg.challenge?.description}`,
            timestamp: Date.now(),
          },
        ]);
        break;

      case "code_evaluation":
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "ai",
            content: `Score: ${msg.evaluation?.score}/100\nFeedback: ${msg.evaluation?.feedback}`,
            timestamp: Date.now(),
          },
        ]);
        setContext((prev) => ({
          ...prev,
          score:
            (prev.score + (msg.evaluation?.score || 0)) /
            (prev.questionsAsked + 1),
        }));
        setIsWaitingForResponse(false);
        break;

      case "execution_result":
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "system",
            content: `Execution Output:\n${msg.output || msg.error || "No output"}`,
            timestamp: Date.now(),
            metadata: {
              executionResult: { output: msg.output, error: msg.error },
            },
          },
        ]);
        break;

      case "interview_complete":
      case "interview_ended":
        setCompleted(true);
        break;

      case "error":
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "system",
            content: `Error: ${msg.message}`,
            timestamp: Date.now(),
          },
        ]);
        if (msg.critical) {
          disqualify(msg.message);
        }
        break;
    }
  }, [position, company, speakText, disqualify]);

  // Initialize WebSocket connection
  useEffect(() => {
    const sessionId = `app_${applicationId}_${Date.now()}`;
    let ws: WebSocket | null = null;
    let mounted = true;

    console.log("🔌 Initializing WebSocket connection...");

    try {
      const wsUrl = `${BACKEND_WS}/ws/interview/${sessionId}?position=${encodeURIComponent(
        position
      )}&company=${encodeURIComponent(company)}`;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mounted) return;
        console.log("✅ WebSocket connected");
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "system",
            content: "Interview started. Connecting to AI interviewer...",
            timestamp: Date.now(),
          },
        ]);
      };

      ws.onmessage = (event) => {
        if (!mounted) return;
        const msg = JSON.parse(event.data);
        console.log("📨 Backend message:", msg);
        handleBackendMessage(msg);
      };

      ws.onerror = (error) => {
        if (!mounted) return;
        console.error("❌ WebSocket error:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "system",
            content: "Connection error occurred",
            timestamp: Date.now(),
          },
        ]);
      };

      ws.onclose = (event) => {
        console.log("🔌 WebSocket closed:", event.code, event.reason);
      };
    } catch (error) {
      console.error("❌ WebSocket setup failed:", error);
      if (mounted) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: "system",
            content: "Failed to connect to interview server",
            timestamp: Date.now(),
          },
        ]);
      }
    }

    // Cleanup on unmount or navigation
    return () => {
      mounted = false;
      console.log("🧹 Cleaning up WebSocket connection...");
      
      if (ws) {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          console.log("🔌 Closing WebSocket (state:", ws.readyState, ")");
          ws.close(1000, "Component unmounted");
        }
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
      }
      
      wsRef.current = null;
      console.log("✅ WebSocket cleanup complete");
    };
  }, [applicationId, position, company, handleBackendMessage]);

  // Handle browser navigation/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log("🚪 Page unloading, closing WebSocket...");
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Page unload");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("👁️ Page hidden");
      } else {
        console.log("👁️ Page visible");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Send message via WebSocket
  const sendWebSocketMessage = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ WebSocket not open, cannot send message");
    }
  }, []);

  // Handle candidate message submission
  const handleSendMessage = useCallback((message: string) => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        role: "candidate",
        content: message,
        timestamp: Date.now(),
      },
    ]);
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
  }, [context, sendWebSocketMessage]);

  // Handle code submission
  const handleCodeSubmit = useCallback((code: string, language: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        role: "candidate",
        content: `Submitted code in ${language}`,
        timestamp: Date.now(),
      },
    ]);
    setIsWaitingForResponse(true);

    sendWebSocketMessage({
      type: "code_submission",
      code,
      language,
      problemId: currentCodingProblem?.id,
      context: context,
    });
  }, [context, currentCodingProblem, sendWebSocketMessage]);

  // Handle interview end
  const handleInterviewEnd = useCallback(() => {
    console.log("🏁 Interview ending...");
    setCompleted(true);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("🔌 Closing WebSocket on interview end");
      wsRef.current.close(1000, "Interview completed");
      wsRef.current = null;
    }
  }, []);

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
              backendUrl={BACKEND_WS.replace('ws://', 'http://').replace('wss://', 'https://')}
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
