"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Camera, CameraOff, AlertTriangle, CheckCircle } from "lucide-react";

interface InterviewQuestion {
  id: string;
  question: string;
  question_number: number;
  total_questions: number;
  time_limit: number;
  audio?: string;
}

interface InterviewResponse {
  type: string;
  message?: string;
  audio?: string;
  current_score?: number;
  total_score?: number;
  max_possible?: number;
  next_question?: InterviewQuestion;
  progress?: {
    current: number;
    total: number;
  };
  violations?: number;
  max_violations?: number;
}

const BACKEND_WS = process.env.NEXT_PUBLIC_BACKEND_WS || "ws://127.0.0.1:8000";
const MAX_VIOLATIONS = 3;

export default function RealTimeInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  // Core state
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [violations, setViolations] = useState(0);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  
  // Media state
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [faceVerified, setFaceVerified] = useState(false);
  
  // Proctoring state
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pauseDetectionRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize camera and microphone
  const initializeMedia = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOn(true);
      setIsMicOn(true);
      setFaceVerified(true); // Simplified for now
      
    } catch (error) {
      console.error("Media initialization failed:", error);
    }
  }, []);
  
  // WebSocket connection
  useEffect(() => {
    if (!isStarted) return;
    
    const wsUrl = `${BACKEND_WS}/ws/interview/${applicationId}`;
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log("Interview WebSocket connected");
    };
    
    wsRef.current.onmessage = (event) => {
      const data: InterviewResponse = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    wsRef.current.onclose = () => {
      console.log("Interview WebSocket disconnected");
    };
    
    return () => {
      wsRef.current?.close();
    };
  }, [isStarted, applicationId]);
  
  // Handle WebSocket messages
  const handleWebSocketMessage = (data: InterviewResponse) => {
    switch (data.type) {
      case "interview_started":
        if (data.audio) {
          playAudio(data.audio);
        }
        break;
        
      case "question":
        setCurrentQuestion(data as any);
        setTimeLeft(data.time_limit || 120);
        startQuestionTimer(data.time_limit || 120);
        if (data.audio) {
          playAudio(data.audio);
        }
        break;
        
      case "next_question":
        setScore(data.total_score || 0);
        setMaxScore(data.max_possible || 0);
        if (data.next_question) {
          setCurrentQuestion(data.next_question);
          setTimeLeft(data.next_question.time_limit);
          startQuestionTimer(data.next_question.time_limit);
        }
        break;
        
      case "interview_complete":
        setIsCompleted(true);
        setScore(data.total_score || 0);
        setMaxScore(data.max_possible || 0);
        stopAllMedia();
        setTimeout(() => {
          router.push("/candidate");
        }, 3000);
        break;
        
      case "violation_warning":
        setViolations(data.violations || 0);
        break;
        
      case "interview_terminated":
        setIsDisqualified(true);
        stopAllMedia();
        break;
        
      case "transcription":
        setCurrentResponse(data.message || "");
        break;
        
      case "results_stored":
        console.log("Interview results stored successfully");
        break;
    }
  };
  
  // Play audio response
  const playAudio = (audioBase64: string) => {
    setIsAISpeaking(true);
    const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
    audio.onended = () => setIsAISpeaking(false);
    audio.play().catch(console.error);
  };
  
  // Start question timer
  const startQuestionTimer = (duration: number) => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    let remaining = duration;
    setTimeLeft(remaining);
    
    questionTimerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(questionTimerRef.current!);
        handleTimeUp();
      }
    }, 1000);
  };
  
  // Handle time up
  const handleTimeUp = () => {
    if (isRecording) {
      stopRecording();
    }
    sendResponse("Time limit exceeded");
  };
  
  // Start recording
  const startRecording = async () => {
    if (!stream || isRecording) return;
    
    try {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        processAudioResponse(audioBlob);
      };
      
      mediaRecorder.start(1000);
      setIsRecording(true);
      startPauseDetection();
      
    } catch (error) {
      console.error("Recording failed:", error);
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopPauseDetection();
    }
  };
  
  // Process audio response
  const processAudioResponse = async (audioBlob: Blob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      wsRef.current?.send(JSON.stringify({
        type: "audio_data",
        audio: base64Audio
      }));
      
    } catch (error) {
      console.error("Audio processing failed:", error);
    }
  };
  
  // Send text response
  const sendResponse = (response: string) => {
    if (!response.trim()) return;
    
    wsRef.current?.send(JSON.stringify({
      type: "candidate_response",
      text: response
    }));
    
    setCurrentResponse("");
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
  };
  
  // Pause detection
  const startPauseDetection = () => {
    pauseDetectionRef.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({
        type: "pause_detected",
        duration: 3
      }));
    }, 3000);
  };
  
  const stopPauseDetection = () => {
    if (pauseDetectionRef.current) {
      clearTimeout(pauseDetectionRef.current);
    }
  };
  
  // Proctoring - Tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabActive(isVisible);
      
      if (!isVisible && isStarted && !isCompleted) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          wsRef.current?.send(JSON.stringify({
            type: "proctor_violation",
            violation_type: "tab_switch"
          }));
          return newCount;
        });
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isStarted, isCompleted]);
  
  // Proctoring - Copy/Paste prevention
  useEffect(() => {
    const preventCopyPaste = (e: Event) => {
      if (isStarted && !isCompleted) {
        e.preventDefault();
        wsRef.current?.send(JSON.stringify({
          type: "proctor_violation",
          violation_type: "copy_paste_attempt"
        }));
      }
    };
    
    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);
    document.addEventListener("cut", preventCopyPaste);
    
    return () => {
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
      document.removeEventListener("cut", preventCopyPaste);
    };
  }, [isStarted, isCompleted]);
  
  // Prevent page refresh/close during interview
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStarted && !isCompleted && !isDisqualified) {
        e.preventDefault();
        e.returnValue = "Are you sure you want to leave? Your interview progress will be lost.";
        return e.returnValue;
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isStarted, isCompleted, isDisqualified]);
  
  // Stop all media
  const stopAllMedia = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    stopPauseDetection();
  };
  
  // Start interview
  const startInterview = async () => {
    await initializeMedia();
    setIsStarted(true);
  };
  
  // Render completion screen
  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-4">Interview Completed!</h2>
            <p className="text-green-600 mb-6">
              Thank you for completing the interview. Your responses have been recorded and will be reviewed by our team.
            </p>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-green-700">
                Final Score: <span className="font-bold">{score}/{maxScore}</span> ({Math.round((score/maxScore)*100)}%)
              </p>
            </div>
            <p className="text-sm text-green-600">
              Redirecting to your applications...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render disqualification screen
  if (isDisqualified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-4">Interview Terminated</h2>
            <p className="text-red-600 mb-6">
              The interview has been terminated due to excessive violations of the proctoring rules.
            </p>
            <Button onClick={() => router.push("/candidate")} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render start screen
  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Ready for Interview?</h2>
            <div className="space-y-4 mb-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This interview requires camera and microphone access. Tab switching and copy/paste are monitored.
                </AlertDescription>
              </Alert>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Keep your camera on throughout the interview</p>
                <p>• Speak clearly and avoid long pauses</p>
                <p>• Do not switch tabs or use external resources</p>
                <p>• Maximum 3 violations allowed</p>
                <p>• Maximum 10 questions will be asked</p>
                <p>• Interview will be automatically saved</p>
              </div>
            </div>
            <Button onClick={startInterview} className="w-full" size="lg">
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Main interview interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">AI Interview</h1>
              <Badge variant={isTabActive ? "default" : "destructive"}>
                {isTabActive ? "Active" : "Tab Inactive"}
              </Badge>
              {isAISpeaking && (
                <Badge variant="secondary" className="animate-pulse">
                  🎤 AI Speaking...
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                Score: <span className="font-bold">{score}/{maxScore}</span>
              </div>
              <div className="text-sm">
                Violations: <span className={violations >= 2 ? "text-red-600 font-bold" : ""}>{violations}/{MAX_VIOLATIONS}</span>
              </div>
              <div className="text-sm">
                Time: <span className="font-mono">{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</span>
              </div>
            </div>
          </div>
          {currentQuestion && (
            <div className="mt-4">
              <Progress value={(currentQuestion.question_number / currentQuestion.total_questions) * 100} className="h-2" />
              <p className="text-sm text-gray-600 mt-1">
                Question {currentQuestion.question_number} of {currentQuestion.total_questions}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Question Panel */}
          <div className="col-span-2">
            <Card className="h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Current Question</h3>
                    {currentQuestion ? (
                      <p className="text-gray-700 leading-relaxed">
                        {currentQuestion.question}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic">
                        Waiting for first question...
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col justify-end">
                  <div className="mb-4">
                    <textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      placeholder="Your response will appear here as you speak, or you can type..."
                      className="w-full h-32 p-3 border rounded-lg resize-none"
                      disabled={isAISpeaking}
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isAISpeaking || !currentQuestion}
                      variant={isRecording ? "destructive" : "default"}
                      className="flex-1"
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Recording
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => sendResponse(currentResponse)}
                      disabled={!currentResponse.trim() || isAISpeaking || !currentQuestion}
                      variant="outline"
                    >
                      Submit Response
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Camera & Proctoring Panel */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Camera Feed</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsCameraOn(!isCameraOn)}
                      disabled
                    >
                      {isCameraOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsMicOn(!isMicOn)}
                      disabled
                    >
                      {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-48 bg-gray-900 rounded-lg object-cover"
                  />
                  <div className="absolute top-2 left-2 flex gap-2">
                    <Badge variant={faceVerified ? "default" : "destructive"} className="text-xs">
                      {faceVerified ? "Face Verified" : "Face Not Verified"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Proctoring Status */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Proctoring Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tab Switches</span>
                    <Badge variant={tabSwitches > 0 ? "destructive" : "default"}>
                      {tabSwitches}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Violations</span>
                    <Badge variant={violations >= 2 ? "destructive" : violations > 0 ? "secondary" : "default"}>
                      {violations}/{MAX_VIOLATIONS}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Camera Status</span>
                    <Badge variant={isCameraOn ? "default" : "destructive"}>
                      {isCameraOn ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Microphone</span>
                    <Badge variant={isMicOn ? "default" : "destructive"}>
                      {isMicOn ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}