"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Video, Mic, MicOff, VideoOff, Camera, Clock, CheckCircle2, AlertTriangle, Send } from "lucide-react";

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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (started) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [started]);

  useEffect(() => {
    if (!isRecording || completed) return;
    
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else {
      handleNext();
    }
  }, [isRecording, timeLeft, completed, currentQuestion]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    setStarted(true);
    setIsRecording(true);
  };

  const handleNext = () => {
    if (completed) return;
    
    if (currentQuestion < interview.questions.length - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      setTimeLeft(interview.questions[nextQuestion].duration);
      setAnswer("");
    } else {
      setCompleted(true);
      setIsRecording(false);
      stopCamera();
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => { track.enabled = !isCameraOn; });
    }
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => { track.enabled = !isMicOn; });
    }
  };

  const question = interview.questions[currentQuestion];

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
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Interview Guidelines</h3>
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
                <strong>Important:</strong> Once started, the interview cannot be paused.
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

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Interview</h1>
            <p className="text-slate-600 dark:text-slate-400">
              Question {currentQuestion + 1} of {interview.questions.length}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border">
            <Clock className={`h-5 w-5 ${timeLeft < 30 ? "text-red-500" : "text-blue-600"}`} />
            <span className={`font-mono font-semibold ${timeLeft < 30 ? "text-red-500" : ""}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {interview.questions.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full ${
                index < currentQuestion ? "bg-green-500" : index === currentQuestion ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                    </div>
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="You can also type notes here..."
                      className="min-h-[150px]"
                    />
                  </div>
                ) : (
                  <Textarea
                    value={answer || question.starterCode}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="font-mono text-sm min-h-[400px] bg-slate-50 dark:bg-slate-900"
                  />
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
