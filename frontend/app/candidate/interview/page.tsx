"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import StartScreen from "@/components/interview/StartScreen";
import DisqualificationScreen from "@/components/interview/DisqualificationScreen";
import CompletionScreen from "@/components/interview/CompletionScreen";
import InterviewHeader from "@/components/interview/InterviewHeader";
import ProgressBar from "@/components/interview/ProgressBar";
import CameraPanel from "@/components/interview/CameraPanel";
import { useFaceRecognition } from "@/hooks/useFaceRecognition";
import { useVoiceMonitoring } from "@/hooks/useVoiceMonitoring";
import { useProctoring } from "@/hooks/useProctoring";
import { useCamera } from "@/hooks/useCamera";
import { useTimer } from "@/hooks/useTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS || "ws://localhost:8000";

interface InterviewScript {
  title: string;
  totalDuration: number;
  sections: Section[];
}

interface Section {
  name: string;
  duration: number;
  type: string;
  content?: string;
  questions?: Question[];
  challenges?: Challenge[];
}

interface Question {
  id: number;
  question: string;
  timeLimit: number;
  difficulty?: string;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  language: string;
  timeLimit: number;
  starterCode: string;
}


export default function InterviewPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const company = searchParams.get("company");
  const position = searchParams.get("position");

  // Interview state
  const [script, setScript] = useState<InterviewScript | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileOutput, setCompileOutput] = useState("");

  // WebSocket
  const wsRef = useRef<WebSocket | null>(null);

  // Camera & mic
  const { videoRef, isCameraOn, toggleCamera, isMicOn, toggleMic, stream, error: cameraError, retry: retryCamera } = useCamera();

  // Proctoring
  const { violations, addViolation, disqualify } = useProctoring({ maxViolations: 3 });

  // Face recognition
  const { modelsLoaded, referenceDescriptor, captureReference, startFaceCheck, stopFaceCheck, canvasRef } = useFaceRecognition({ videoRef: videoRef as React.RefObject<HTMLVideoElement> });

  // Voice monitoring
  const { isSpeaking, setupVoiceMonitoring, cleanupVoiceMonitoring } = useVoiceMonitoring({ stream, isMicOn, questionType: "oral", onViolation: addViolation });

  // Timer
  const { timeLeft } = useTimer({
    initialTime: 45,
    active: started && !completed && !disqualified,
    onExpire: () => {
      setCompleted(true);
      if (wsRef.current) wsRef.current.close();
    },
  });

  // Play audio
  const playAudio = (audioBase64: string) => {
    if (!audioBase64) return;
    try {
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      setIsAISpeaking(true);
      audio.onended = () => setIsAISpeaking(false);
      audio.play().catch(() => {});
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  // Connect to WebSocket
  useEffect(() => {
    if (!started || !sessionId) return;

    try {
      const wsUrl = `${BACKEND_WS}/ws/interview/${sessionId}?position=${encodeURIComponent(position || "Engineer")}&company=${encodeURIComponent(company || "Tech")}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => console.log("Connected");

      wsRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log("Backend:", msg.type);

        if (msg.type === "interview_started") {
          setScript(msg.script);
        } else if (msg.type === "section_started" || msg.type === "follow_up_question") {
          setCurrentQuestion(msg.text);
          playAudio(msg.audio);
        } else if (msg.type === "behavioral_question") {
          setCurrentQuestion(msg.question);
          playAudio(msg.audio);
        } else if (msg.type === "coding_challenge") {
          setAnswer(msg.starterCode || "");
        } else if (msg.type === "code_evaluation") {
          const evaluation = msg.evaluation;
          setCompileOutput(`Score: ${evaluation.score}/100\nFeedback: ${evaluation.feedback}`);
        } else if (msg.type === "execution_result") {
          setCompileOutput(msg.output || msg.error || "");
          setIsCompiling(false);
        } else if (msg.type === "interview_complete") {
          setCompleted(true);
        } else if (msg.type === "interview_closing") {
          playAudio(msg.audio);
          setTimeout(() => setCompleted(true), 3000);
        } else if (msg.type === "error") {
          disqualify(msg.message);
        }
      };

      wsRef.current.onerror = () => console.log("Connection error");
      wsRef.current.onclose = () => console.log("Disconnected");

      return () => {
        if (wsRef.current) wsRef.current.close();
      };
    } catch (error) {
      console.log("Connection failed", error);
    }
  }, [started, sessionId, position, company, disqualify]);

  // Create session
  useEffect(() => {
    if (!sessionId && applicationId) {
      setSessionId(`app_${applicationId}_${Date.now()}`);
    }
  }, [sessionId, applicationId]);

  // Violations (DISABLED FOR TESTING)
  // useEffect(() => {
  //   if (violations >= 3) {
  //     setDisqualified(true);
  //     setDisqualificationReason("Exceeded maximum violations");
  //   }
  // }, [violations]);

  // Cleanup
  useEffect(() => {
    if (disqualified) {
      stopFaceCheck();
      cleanupVoiceMonitoring();
      if (wsRef.current) wsRef.current.close();
    }
  }, [disqualified, stopFaceCheck, cleanupVoiceMonitoring]);

  // Camera error (DISABLED FOR TESTING)
  // useEffect(() => {
  //   if (cameraError) disqualify(cameraError);
  // }, [cameraError, disqualify]);

  // Face checks (DISABLED FOR TESTING)
  // useEffect(() => {
  //   if (started && referenceDescriptor && !completed && !disqualified) {
  //     startFaceCheck((reason) => addViolation(reason));
  //   } else {
  //     stopFaceCheck();
  //   }
  // }, [started, referenceDescriptor, completed, disqualified, addViolation, startFaceCheck, stopFaceCheck]);

  // Voice monitoring (DISABLED FOR TESTING)
  // useEffect(() => {
  //   if (started && isMicOn && !completed && !disqualified) {
  //     setupVoiceMonitoring();
  //   } else {
  //     cleanupVoiceMonitoring();
  //   }
  // }, [started, isMicOn, completed, disqualified, setupVoiceMonitoring, cleanupVoiceMonitoring]);

  // Handlers
  const handleStart = async () => {
    // DISABLED FOR TESTING - skip face capture
    setStarted(true);
    // const success = await captureReference();
    // if (success) {
    //   setStarted(true);
    // } else {
    //   disqualify("Could not capture reference face");
    // }
  };

  const sendResponse = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "candidate_response", text: answer }));
      setAnswer("");
    }
  };

  const handleNextSection = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "move_to_next_section" }));
    }
  };

  const handleRunCode = () => {
    setIsCompiling(true);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "run_code", code: answer, language: "javascript" }));
    }
  };

  const handleSubmitCode = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "code_submission", code: answer, language: "javascript" }));
    }
  };

  // Screens
  if (disqualified) return <DisqualificationScreen reason={disqualificationReason} />;
  if (completed) return <CompletionScreen />;

  if (!started) {
    return (
      <StartScreen
        questions={script?.sections || [{ name: "Loading...", type: "intro", duration: 45 } as any]}
        onStart={handleStart}
        modelsLoaded={true}
      />
    );
  }

  if (!script) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Generating interview script...</p>
        </div>
      </div>
    );
  }

  const section = script.sections[currentSection];
  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <InterviewHeader
          currentIndex={currentSection}
          totalQuestions={script.sections.length}
          timeLeft={timeLeft}
          violations={violations}
          isSpeaking={isSpeaking}
          isAISpeaking={isAISpeaking}
        />
        <ProgressBar currentIndex={currentSection} totalQuestions={script.sections.length} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
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

          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">{section.name}</h2>
                <p className="text-sm text-gray-600 mb-6">Duration: {section.duration} min</p>

                {section.type === "intro" && (
                  <div className="space-y-4">
                    <p className="text-lg">{currentQuestion}</p>
                    <Button onClick={handleNextSection} className="w-full">Start Assessment</Button>
                  </div>
                )}

                {section.type === "technical" && (
                  <div className="space-y-4">
                    <p className="text-lg font-semibold">{currentQuestion}</p>
                    <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Your answer..." className="w-full h-32 p-4 border rounded-lg" />
                    <div className="flex gap-2">
                      <Button onClick={sendResponse} className="flex-1">Submit</Button>
                      <Button onClick={handleNextSection} variant="outline" className="flex-1">Next</Button>
                    </div>
                  </div>
                )}

                {section.type === "coding" && (
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-lg mb-4">
                      <h3 className="font-bold mb-2">Problem:</h3>
                      <p>{section.challenges?.[0]?.description}</p>
                    </div>
                    <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Code here..." className="w-full h-40 p-4 border rounded-lg font-mono text-sm" />
                    <div className="flex gap-2">
                      <Button onClick={handleRunCode} className="flex-1">Run</Button>
                      <Button onClick={handleSubmitCode} className="flex-1 bg-green-600">Submit</Button>
                    </div>
                    {compileOutput && <div className="bg-gray-100 p-4 rounded-lg"><pre className="text-sm">{compileOutput}</pre></div>}
                  </div>
                )}

                {section.type === "behavioral" && (
                  <div className="space-y-4">
                    <p className="text-lg font-semibold">{currentQuestion}</p>
                    <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Tell us..." className="w-full h-32 p-4 border rounded-lg" />
                    <div className="flex gap-2">
                      <Button onClick={sendResponse} className="flex-1">Submit</Button>
                      <Button onClick={handleNextSection} variant="outline" className="flex-1">Next</Button>
                    </div>
                  </div>
                )}

                {section.type === "closing" && (
                  <div className="space-y-4">
                    <p className="text-lg">{currentQuestion}</p>
                    <Button onClick={() => setCompleted(true)} className="w-full">Complete</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}