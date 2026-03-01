"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Camera,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  WifiOff,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as faceapi from "face-api.js";

// Cloudinary configuration (replace with your own)
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Voice detection thresholds
const SPEECH_DETECTION_THRESHOLD = 0.01;      // Volume level (0-1) considered as speech
const SILENCE_DURATION_ORAL = 10;             // Seconds of silence before violation during oral
const SPEECH_DURATION_CODING = 5;              // Seconds of speech before violation during coding

const interview = {
  company: "TechCorp",
  position: "Senior Frontend Developer",
  questions: [
    {
      id: 1,
      type: "oral",
      question: "Tell me about yourself and your experience with React.",
      duration: 120,
    },
    {
      id: 2,
      type: "coding",
      question: "Write a function to find the longest palindromic substring in a given string.",
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
  ],
};

export default function InterviewPage() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(interview.questions[0].duration);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [answer, setAnswer] = useState("");
  const [completed, setCompleted] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState("");
  const [violations, setViolations] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [referenceDescriptor, setReferenceDescriptor] = useState<Float32Array | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  // Voice proctoring states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [speechTimer, setSpeechTimer] = useState<NodeJS.Timeout | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const [voiceViolationInProgress, setVoiceViolationInProgress] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceCheckInterval = useRef<NodeJS.Timeout>();
  const networkCheckInterval = useRef<NodeJS.Timeout>();
  const audioDataArray = useRef<Uint8Array>();

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
        console.log("FaceAPI models loaded");
      } catch (error) {
        console.error("Failed to load face models", error);
      }
    };
    loadModels();
  }, []);

  // Camera management
  useEffect(() => {
    if (started) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [started]);

  // Timer
  useEffect(() => {
    if (!isRecording || completed || disqualified) return;

    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else {
      handleNext();
    }
  }, [isRecording, timeLeft, completed, disqualified, currentQuestion]);

  // Proctoring: visibility change (tab switching / minimize)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabVisible(false);
        addViolation("Tab switched or minimized");
      } else {
        setTabVisible(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Proctoring: online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      addViolation("Network disconnected");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Proctoring: periodic face check (starts after reference captured)
  useEffect(() => {
    if (started && referenceDescriptor && !completed && !disqualified) {
      startFaceCheck();
    } else {
      stopFaceCheck();
    }
    return () => stopFaceCheck();
  }, [started, referenceDescriptor, completed, disqualified]);

  // Proctoring: voice monitoring (starts after camera/audio is ready)
  useEffect(() => {
    if (started && isMicOn && !completed && !disqualified && videoRef.current?.srcObject) {
      setupVoiceMonitoring();
    } else {
      cleanupVoiceMonitoring();
    }
    return () => cleanupVoiceMonitoring();
  }, [started, isMicOn, currentQuestion, completed, disqualified]);

  // Reset timers when question changes
  useEffect(() => {
    // Clear any pending voice timers
    if (silenceTimer) clearTimeout(silenceTimer);
    if (speechTimer) clearTimeout(speechTimer);
    setSilenceTimer(null);
    setSpeechTimer(null);
    setVoiceViolationInProgress(false);
  }, [currentQuestion]);

  // Stop face check
  const stopFaceCheck = () => {
    if (faceCheckInterval.current) clearInterval(faceCheckInterval.current);
  };

  // Capture reference face and upload to Cloudinary
  const captureReference = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      alert("No face detected. Please ensure your face is visible.");
      return false;
    }

    setReferenceDescriptor(detection.descriptor);

    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");

    try {
      const formData = new FormData();
      formData.append("file", imageData);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET!);
      formData.append("folder", "interview_references");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      console.log("Reference image uploaded to Cloudinary:", data.secure_url);
    } catch (error) {
      console.error("Cloudinary upload failed", error);
    }

    return true;
  };

  // Start periodic face verification
  const startFaceCheck = () => {
    faceCheckInterval.current = setInterval(async () => {
      if (!videoRef.current || !referenceDescriptor || completed || disqualified) return;

      try {
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          addViolation("No face detected");
          return;
        }

        const distance = faceapi.euclideanDistance(referenceDescriptor, detection.descriptor);
        if (distance > 0.6) {
          addViolation("Face mismatch - possible impersonation");
        }
      } catch (error) {
        console.error("Face check error", error);
      }
    }, 5000);
  };

  // Set up voice monitoring using Web Audio API
  const setupVoiceMonitoring = async () => {
    if (!videoRef.current?.srcObject) return;

    const stream = videoRef.current.srcObject as MediaStream;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      audioDataArray.current = dataArray;

      setAudioContext(context);
      setAudioAnalyser(analyser);

      // Start monitoring loop
      const checkVoice = () => {
        if (!analyser || completed || disqualified || !isMicOn) return;

        analyser.getByteFrequencyData(dataArray);
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 256; // Normalize to 0-1

        const speaking = avg > SPEECH_DETECTION_THRESHOLD;
        setIsSpeaking(speaking);

        // Voice proctoring logic based on question type
        const question = interview.questions[currentQuestion];
        if (question.type === "oral") {
          // During oral, expect speech. If silent too long -> violation
          if (!speaking && !voiceViolationInProgress) {
            if (!silenceTimer) {
              const timer = setTimeout(() => {
                addViolation("No speech detected during oral response");
                setVoiceViolationInProgress(false);
              }, SILENCE_DURATION_ORAL * 1000);
              setSilenceTimer(timer);
            }
          } else if (speaking) {
            // Reset silence timer if speaking
            if (silenceTimer) {
              clearTimeout(silenceTimer);
              setSilenceTimer(null);
            }
          }
        } else if (question.type === "coding") {
          // During coding, expect silence. If speech too long -> violation
          if (speaking && !voiceViolationInProgress) {
            if (!speechTimer) {
              const timer = setTimeout(() => {
                addViolation("Unexpected speech detected during coding");
                setVoiceViolationInProgress(false);
              }, SPEECH_DURATION_CODING * 1000);
              setSpeechTimer(timer);
            }
          } else if (!speaking) {
            // Reset speech timer if silence
            if (speechTimer) {
              clearTimeout(speechTimer);
              setSpeechTimer(null);
            }
          }
        }

        requestAnimationFrame(checkVoice);
      };

      checkVoice();
    } catch (error) {
      console.error("Voice monitoring setup failed", error);
    }
  };

  const cleanupVoiceMonitoring = () => {
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
      setAudioAnalyser(null);
    }
    if (silenceTimer) clearTimeout(silenceTimer);
    if (speechTimer) clearTimeout(speechTimer);
    setSilenceTimer(null);
    setSpeechTimer(null);
    setVoiceViolationInProgress(false);
  };

  // Add violation and check for disqualification
  const addViolation = (reason: string) => {
    setViolations((prev) => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        disqualify(`Exceeded maximum violations (3). Last: ${reason}`);
      }
      return newCount;
    });
  };

  const disqualify = (reason: string) => {
    setDisqualified(true);
    setDisqualificationReason(reason);
    setIsRecording(false);
    stopCamera();
    stopFaceCheck();
    cleanupVoiceMonitoring();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied:", err);
      disqualify("Camera access required");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    setStarted(true);
    // Allow camera to initialize
    setTimeout(async () => {
      const success = await captureReference();
      if (success) {
        setIsRecording(true);
      } else {
        disqualify("Could not capture reference face");
      }
    }, 2000);
  };

  const handleNext = () => {
    if (completed || disqualified) return;

    if (currentQuestion < interview.questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setTimeLeft(interview.questions[nextQuestion].duration);
      setAnswer("");
    } else {
      setCompleted(true);
      setIsRecording(false);
      stopCamera();
      cleanupVoiceMonitoring();
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOn;
      });
    }
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !isMicOn;
      });
    }
    // If mic is turned off manually, add a violation? Might be too strict, but you could if desired.
    // addViolation("Microphone manually disabled");
  };

  const question = interview.questions[currentQuestion];

  // Disqualification screen
  if (disqualified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-lg w-full border-red-200 dark:border-red-800">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Interview Disqualified</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{disqualificationReason}</p>
            <p className="text-sm text-slate-500 mb-6">
              If you believe this is an error, please contact support.
            </p>
            <Button className="w-full" variant="destructive">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Start screen
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-2xl w-full border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl">AI Interview - {interview.position}</CardTitle>
            <p className="text-slate-600 dark:text-slate-400">{interview.company}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Interview Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                <li>• Camera and microphone must remain on throughout</li>
                <li>• Mix of oral and coding questions</li>
                <li>• Each question has a time limit</li>
                <li>• AI proctored for fairness</li>
                <li>• Ensure quiet, well-lit environment</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Oral Questions</p>
                <p className="text-2xl font-bold text-blue-600">2</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Coding Questions</p>
                <p className="text-2xl font-bold text-purple-600">2</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-400">
                <strong>Important:</strong> Any violation (tab switch, face mismatch, network drop,
                unexpected silence/speech) will count against you. After 3 violations, you will be disqualified.
              </p>
            </div>

            <Button onClick={handleStart} className="w-full h-12 text-lg">
              <Camera className="h-5 w-5 mr-2" />
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion screen
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-lg w-full text-center border-slate-200 dark:border-slate-800">
          <CardContent className="p-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Interview Complete!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Your responses will be reviewed by our AI system and hiring team.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold mb-2">What's Next?</h3>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>✓ AI analysis (1-2 hours)</li>
                <li>✓ Team review (2-3 days)</li>
                <li>✓ Decision notification via email</li>
              </ul>
            </div>
            <Button className="w-full">Back to Applications</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main interview UI
  return (
    <div className="min-h-screen">
      {/* Hidden canvas for face capture */}
      <canvas ref={canvasRef} width="640" height="480" className="hidden" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header with proctoring status */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Interview</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Question {currentQuestion + 1} of {interview.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Proctoring badges */}
            <div className="flex items-center gap-2">
              {!isOnline && (
                <Badge variant="destructive" className="gap-1">
                  <WifiOff className="h-3 w-3" /> Offline
                </Badge>
              )}
              {!tabVisible && (
                <Badge variant="destructive" className="gap-1">
                  <EyeOff className="h-3 w-3" /> Tab Hidden
                </Badge>
              )}
              {isSpeaking ? (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <Volume2 className="h-3 w-3" /> Speaking
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <VolumeX className="h-3 w-3" /> Silent
                </Badge>
              )}
              <Badge
                variant={violations === 0 ? "outline" : violations === 1 ? "warning" : "destructive"}
                className="gap-1"
              >
                <AlertTriangle className="h-3 w-3" /> Violations: {violations}/3
              </Badge>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border">
              <Clock className={`h-5 w-5 ${timeLeft < 30 ? "text-red-500" : "text-blue-600"}`} />
              <span className={`font-mono font-semibold ${timeLeft < 30 ? "text-red-500" : ""}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {interview.questions.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full ${
                index < currentQuestion
                  ? "bg-green-500"
                  : index === currentQuestion
                  ? "bg-blue-600"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Camera panel */}
          <div className="lg:col-span-1">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-[3/4] bg-slate-900 rounded-lg overflow-hidden">
                  <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                  {!isCameraOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                      <VideoOff className="h-12 w-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={toggleCamera} className="flex-1">
                    {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={toggleMic} className="flex-1">
                    {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question panel */}
          <div className="lg:col-span-3">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{question.type === "oral" ? "ORAL" : "CODING"}</Badge>
                  <Badge variant="secondary">Question {currentQuestion + 1}</Badge>
                </div>
                <CardTitle className="text-xl">{question.question}</CardTitle>
              </CardHeader>
              <CardContent>
                {question.type === "oral" ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-8 rounded-lg text-center">
                      <Mic className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Speak your answer clearly. Your response is being recorded.
                      </p>
                      {!isSpeaking && (
                        <p className="text-sm text-amber-600 mt-2">
                          No voice detected – please speak.
                        </p>
                      )}
                    </div>
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="You can also type notes here..."
                      className="min-h-[150px]"
                    />
                  </div>
                ) : (
                  <>
                    <Textarea
                      value={answer || question.starterCode}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="font-mono text-sm min-h-[400px] bg-slate-50 dark:bg-slate-900"
                    />
                    {isSpeaking && (
                      <p className="text-sm text-amber-600 mt-2">
                        Unexpected speech detected – please remain silent during coding.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end mt-4">
              <Button onClick={handleNext}>
                {currentQuestion < interview.questions.length - 1 ? (
                  "Next Question"
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Complete Interview
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}