"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Wifi, WifiOff, Eye, EyeOff, Users, AlertTriangle, Shield, ShieldAlert } from "lucide-react";

interface CandidateProctoringPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isCameraOn: boolean;
  isMicOn: boolean;
  stream?: MediaStream | null;
  onCameraToggle: () => void;
  onMicToggle: () => void;
  error?: string | null;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isSpeaking?: boolean;
  faceDetected?: boolean;
  multipleFaces?: boolean;
  gazeAway?: boolean;
}

export default function CandidateProctoringPanel({
  videoRef,
  isCameraOn,
  isMicOn,
  stream,
  onCameraToggle,
  onMicToggle,
  error,
  canvasRef,
  isSpeaking,
  faceDetected,
  multipleFaces,
  gazeAway,
}: CandidateProctoringPanelProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">(
    stream ? "connected" : "disconnected"
  );
  const [violationHistory, setViolationHistory] = useState<Array<{type: string, time: string}>>([]);
  const [securityLevel, setSecurityLevel] = useState<"secure" | "warning" | "critical">("secure");

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      setConnectionStatus("connected");
    } else {
      setConnectionStatus("disconnected");
    }
  }, [stream, videoRef]);

  // Track violations and update security level
  useEffect(() => {
    const now = new Date().toLocaleTimeString();
    const newViolations = [];
    
    if (!faceDetected && isCameraOn) {
      newViolations.push({ type: "No face detected", time: now });
    }
    if (multipleFaces) {
      newViolations.push({ type: "Multiple faces", time: now });
    }
    if (gazeAway) {
      newViolations.push({ type: "Looking away", time: now });
    }
    
    if (newViolations.length > 0) {
      setViolationHistory(prev => [...prev.slice(-4), ...newViolations].slice(-5));
    }
    
    // Update security level
    const totalIssues = (faceDetected ? 0 : 1) + (multipleFaces ? 1 : 0) + (gazeAway ? 1 : 0);
    if (totalIssues >= 2) {
      setSecurityLevel("critical");
    } else if (totalIssues >= 1) {
      setSecurityLevel("warning");
    } else {
      setSecurityLevel("secure");
    }
  }, [faceDetected, multipleFaces, gazeAway, isCameraOn]);

  const getSecurityIcon = () => {
    switch (securityLevel) {
      case "secure": return <Shield className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical": return <ShieldAlert className="h-4 w-4 text-red-500" />;
    }
  };

  const getSecurityColor = () => {
    switch (securityLevel) {
      case "secure": return "text-green-500";
      case "warning": return "text-yellow-500";
      case "critical": return "text-red-500";
    }
  };

  return (
    <Card className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            {getSecurityIcon()}
            Proctoring Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            {connectionStatus === "connected" ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-xs font-medium ${
              connectionStatus === "connected" ? "text-green-400" : "text-red-400"
            }`}>
              {connectionStatus === "connected" ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>
        
        {/* Security Status Bar */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
          securityLevel === "secure" 
            ? "bg-green-900/20 border-green-700 text-green-300"
            : securityLevel === "warning"
            ? "bg-yellow-900/20 border-yellow-700 text-yellow-300"
            : "bg-red-900/20 border-red-700 text-red-300"
        }`}>
          {getSecurityIcon()}
          <span className="text-xs font-medium">
            {securityLevel === "secure" ? "Secure Session" : 
             securityLevel === "warning" ? "Minor Issues" : "Security Alert"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Enhanced Video Feed */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {isCameraOn && stream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Security Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Face Detection Border */}
                {faceDetected && (
                  <div className="absolute inset-4 border-2 border-green-400 rounded-lg">
                    <div className="absolute -top-6 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      Face Detected
                    </div>
                  </div>
                )}
                
                {/* Multiple Faces Warning */}
                {multipleFaces && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Multiple Faces
                  </div>
                )}
                
                {/* Gaze Away Warning */}
                {gazeAway && (
                  <div className="absolute bottom-4 left-4 bg-orange-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    Looking Away
                  </div>
                )}
                
                {/* Speaking Indicator */}
                {isSpeaking && (
                  <div className="absolute inset-0 border-4 border-green-500 rounded-lg">
                    <div className="absolute inset-0 rounded-lg bg-green-500 opacity-10 animate-pulse" />
                  </div>
                )}
              </div>
              
              {canvasRef && (
                <canvas
                  ref={canvasRef}
                  className="hidden"
                  width="640"
                  height="480"
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-4">
              <AlertCircle className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-sm font-medium mb-2">Camera Required</p>
              <p className="text-xs text-center opacity-75">
                Enable camera for proctoring
              </p>
              {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Status Panel */}
        <div className="border-t border-slate-700 p-4 space-y-3">
          {/* Device Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Camera
              </span>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  isCameraOn ? "bg-green-500" : "bg-red-500"
                }`} />
                <span className={isCameraOn ? "text-green-400" : "text-red-400"}>
                  {isCameraOn ? "ON" : "OFF"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Microphone</span>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  isMicOn ? "bg-green-500" : "bg-red-500"
                }`} />
                <span className={isMicOn ? "text-green-400" : "text-red-400"}>
                  {isMicOn ? "ON" : "MUTED"}
                </span>
              </div>
            </div>
          </div>

          {/* Proctoring Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Face Detection</span>
              <span className={faceDetected ? "text-green-400" : "text-red-400"}>
                {faceDetected ? "✓ Detected" : "✗ Not Found"}
              </span>
            </div>
            
            {multipleFaces && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Multiple Faces</span>
                <span className="text-yellow-400">⚠ Warning</span>
              </div>
            )}
            
            {gazeAway && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Eye Tracking</span>
                <span className="text-orange-400">⚠ Looking Away</span>
              </div>
            )}
          </div>

          {/* Recent Violations */}
          {violationHistory.length > 0 && (
            <div className="border-t border-slate-700 pt-3">
              <p className="text-xs text-slate-400 mb-2">Recent Issues:</p>
              <div className="space-y-1 max-h-16 overflow-y-auto">
                {violationHistory.slice(-3).map((violation, index) => (
                  <div key={index} className="text-xs text-red-300 flex justify-between">
                    <span>{violation.type}</span>
                    <span className="text-slate-500">{violation.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onCameraToggle}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all duration-200 ${
                isCameraOn
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-lg"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600"
              }`}
            >
              {isCameraOn ? "Stop Camera" : "Start Camera"}
            </button>
            <button
              onClick={onMicToggle}
              className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all duration-200 ${
                isMicOn
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-lg"
                  : "bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600"
              }`}
            >
              {isMicOn ? "Mute" : "Unmute"}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}