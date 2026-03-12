"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import CodeCompilerPanel from "./CodeCompilerPanel";
import CandidateProctoringPanel from "./CandidateProctoringPanel";
import ConversationPanel from "./ConversationPanel";
import { useCamera } from "@/hooks/useCamera";
import { useTimer } from "@/hooks/useTimer";
import { useProctoring } from "@/hooks/useProctoring";
import { proctoringAPI } from "@/lib/api";
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
  const router = useRouter();
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
  const [sessionArmed, setSessionArmed] = useState(false);
  const [primaryAgreementAccepted, setPrimaryAgreementAccepted] = useState(false);
  const [secondaryAgreementAccepted, setSecondaryAgreementAccepted] = useState(false);

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // TTS Hook
  const {
    speak: speakText,
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
    retry: retryCamera,
  } = useCamera();

  // Proctoring
  const {
    violations,
    faceCount,
    isFullscreen,
    requestFullscreen,
    disqualify,
  } = useProctoring({
    maxViolations: 3,
    active: !completed && !disqualified,
    requireFullscreen: true,
    videoElementRef: videoRef,
    onViolation: ({ reason, type }) => {
      if (applicationId && applicationId !== "test") {
        void proctoringAPI.reportViolation(
          Number(applicationId),
          type,
          new Date().toISOString(),
          reason,
          "interview"
        );
      }

      sendWebSocketMessage({
        type: "proctor_event",
        event: {
          type,
          reason,
          timestamp: new Date().toISOString(),
        },
      });
    },
  });

  // Timer
  const { timeLeft } = useTimer({
    initialTime: context.totalDuration * 60,
    active: context.currentState !== "greeting",
    onExpire: () => {
      handleInterviewEnd();
    },
  });

  useEffect(() => {
    void requestFullscreen();
  }, [requestFullscreen]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!sessionArmed || !isCameraOn || !isFullscreen) {
      return;
    }

    const sessionId = `app_${applicationId}_${Date.now()}`;

    try {
      const wsUrl = `${BACKEND_WS}/ws/interview/${sessionId}?applicationId=${encodeURIComponent(
        applicationId
      )}&position=${encodeURIComponent(
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
  }, [applicationId, company, isCameraOn, isFullscreen, position, sessionArmed]);

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

  useEffect(() => {
    if (violations > 3 && !disqualified) {
      setDisqualified(true);
      void (async () => {
        if (applicationId && applicationId !== "test") {
          await proctoringAPI.terminateSession(
            Number(applicationId),
            "interview",
            "auto_concluded_violation",
            "Exceeded maximum interview violations",
            violations
          ).catch((error) => console.error("Failed to terminate interview", error));
        }

        if (wsRef.current) {
          sendWebSocketMessage({
            type: "proctor_event",
            event: {
              type: "auto_disqualification",
              reason: "Exceeded maximum interview violations",
              timestamp: new Date().toISOString(),
            },
          });
          wsRef.current.close();
        }

        router.push("/candidate/applications");
      })();
    }
  }, [applicationId, disqualified, router, violations]);

  useEffect(() => {
    if (sessionArmed && !completed && !disqualified && !isCameraOn) {
      if (applicationId && applicationId !== "test") {
        void proctoringAPI.reportViolation(
          Number(applicationId),
          "webcam_disabled",
          new Date().toISOString(),
          "Webcam disabled during AI interview",
          "interview"
        ).catch((error) => console.error("Failed to report interview webcam violation", error));
      }

      sendWebSocketMessage({
        type: "proctor_event",
        event: {
          type: "webcam_disabled",
          reason: "Webcam disabled during AI interview",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }, [applicationId, completed, disqualified, isCameraOn, sessionArmed]);

  // Screens
  if (disqualified) {
    return <DisqualificationScreen reason="Exceeded maximum violations" />;
  }

  if (completed) {
    return <CompletionScreen />;
  }

  if ((!isCameraOn || !isFullscreen || !sessionArmed) && context.currentState === "greeting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Secure Interview Setup</h2>
            <p className="text-slate-600 mb-6">
              Please enable your camera and enter fullscreen mode to start the interview.
            </p>
            <div className="space-y-3 text-left">
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                This is a proctored test. Webcam monitoring, tab switching detection, and
                activity tracking are active. If more than 3 violations occur, the session will
                automatically end.
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                This is a proctored test. Webcam monitoring, tab switching detection, and
                activity tracking are active. If more than 3 violations occur, the session will
                automatically end.
              </div>
              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={primaryAgreementAccepted}
                  onChange={(event) => setPrimaryAgreementAccepted(event.target.checked)}
                  className="mt-1"
                />
                I understand this AI interview is proctored and can be auto-concluded on violations.
              </label>
              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={secondaryAgreementAccepted}
                  onChange={(event) => setSecondaryAgreementAccepted(event.target.checked)}
                  className="mt-1"
                />
                I agree to webcam monitoring, fullscreen enforcement, and activity tracking.
              </label>
              <button
                onClick={toggleCamera}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
              >
                Enable Camera
              </button>
              <button
                onClick={() => void requestFullscreen()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg font-medium"
              >
                Enter Fullscreen
              </button>
              {cameraError && (
                <button
                  onClick={() => void retryCamera()}
                  className="w-full border border-slate-300 hover:bg-slate-100 py-2 rounded-lg font-medium"
                >
                  Retry Camera Access
                </button>
              )}
              <button
                onClick={() => setSessionArmed(true)}
                disabled={
                  !isCameraOn ||
                  !isFullscreen ||
                  !primaryAgreementAccepted ||
                  !secondaryAgreementAccepted
                }
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-2 rounded-lg font-medium"
              >
                Start AI Interview
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-full mx-auto h-screen flex flex-col">
        {/* Header Stats */}
        <div className="mb-4 grid grid-cols-2 gap-2 text-sm lg:grid-cols-6">
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
              {violations}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400 text-xs">Fullscreen</p>
            <p className={`text-2xl font-bold ${isFullscreen ? "text-green-600" : "text-red-500"}`}>
              {isFullscreen ? "On" : "Off"}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
            <p className="text-slate-600 dark:text-slate-400 text-xs">Faces</p>
            <p
              className={`text-2xl font-bold ${
                faceCount === null || faceCount === 1 ? "text-green-600" : "text-red-500"
              }`}
            >
              {faceCount === null ? "-" : faceCount}
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
              videoRef={videoRef}
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
