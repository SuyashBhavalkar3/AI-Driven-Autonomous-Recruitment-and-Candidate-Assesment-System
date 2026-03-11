"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pause, 
  Play, 
  Square, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Settings,
  HelpCircle,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface InterviewControlPanelProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onEndInterview: () => void;
  onSkipQuestion: () => void;
  onToggleAudio: () => void;
  isAudioEnabled: boolean;
  canSkip: boolean;
  violations: number;
  maxViolations: number;
}

export default function InterviewControlPanel({
  isPaused,
  onPause,
  onResume,
  onEndInterview,
  onSkipQuestion,
  onToggleAudio,
  isAudioEnabled,
  canSkip,
  violations,
  maxViolations,
}: InterviewControlPanelProps) {
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleEndInterview = () => {
    if (showConfirmEnd) {\n      onEndInterview();\n      setShowConfirmEnd(false);\n    } else {\n      setShowConfirmEnd(true);\n      setTimeout(() => setShowConfirmEnd(false), 5000); // Auto-hide after 5s\n    }\n  };\n\n  const getViolationStatus = () => {\n    const percentage = (violations / maxViolations) * 100;\n    if (percentage >= 80) return { color: \"text-red-500\", icon: AlertTriangle, status: \"Critical\" };\n    if (percentage >= 50) return { color: \"text-yellow-500\", icon: AlertTriangle, status: \"Warning\" };\n    return { color: \"text-green-500\", icon: CheckCircle, status: \"Good\" };\n  };\n\n  const violationStatus = getViolationStatus();\n  const ViolationIcon = violationStatus.icon;\n\n  return (\n    <Card className=\"bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700\">\n      <CardHeader className=\"pb-3\">\n        <CardTitle className=\"text-sm flex items-center justify-between\">\n          <span>Interview Controls</span>\n          <button\n            onClick={() => setShowHelp(!showHelp)}\n            className=\"p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded\"\n            title=\"Help\"\n          >\n            <HelpCircle className=\"h-4 w-4 text-slate-500\" />\n          </button>\n        </CardTitle>\n      </CardHeader>\n\n      <CardContent className=\"space-y-4\">\n        {/* Help Panel */}\n        {showHelp && (\n          <div className=\"bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs\">\n            <h4 className=\"font-semibold text-blue-900 dark:text-blue-100 mb-2\">Quick Help:</h4>\n            <ul className=\"space-y-1 text-blue-700 dark:text-blue-300\">\n              <li>• Use pause if you need a moment</li>\n              <li>• Skip questions only if necessary</li>\n              <li>• Keep violations low for best results</li>\n              <li>• Speak clearly for voice recognition</li>\n            </ul>\n          </div>\n        )}\n\n        {/* Primary Controls */}\n        <div className=\"grid grid-cols-2 gap-2\">\n          <Button\n            onClick={isPaused ? onResume : onPause}\n            variant={isPaused ? \"default\" : \"outline\"}\n            size=\"sm\"\n            className=\"flex items-center gap-2\"\n          >\n            {isPaused ? (\n              <>\n                <Play className=\"h-4 w-4\" />\n                Resume\n              </>\n            ) : (\n              <>\n                <Pause className=\"h-4 w-4\" />\n                Pause\n              </>\n            )}\n          </Button>\n\n          <Button\n            onClick={onToggleAudio}\n            variant=\"outline\"\n            size=\"sm\"\n            className=\"flex items-center gap-2\"\n          >\n            {isAudioEnabled ? (\n              <>\n                <Volume2 className=\"h-4 w-4\" />\n                Audio On\n              </>\n            ) : (\n              <>\n                <VolumeX className=\"h-4 w-4\" />\n                Audio Off\n              </>\n            )}\n          </Button>\n        </div>\n\n        {/* Secondary Controls */}\n        <div className=\"space-y-2\">\n          <Button\n            onClick={onSkipQuestion}\n            disabled={!canSkip}\n            variant=\"outline\"\n            size=\"sm\"\n            className=\"w-full flex items-center gap-2\"\n            title={!canSkip ? \"Cannot skip this question\" : \"Skip current question\"}\n          >\n            <SkipForward className=\"h-4 w-4\" />\n            Skip Question\n          </Button>\n\n          <Button\n            onClick={handleEndInterview}\n            variant={showConfirmEnd ? \"destructive\" : \"outline\"}\n            size=\"sm\"\n            className=\"w-full flex items-center gap-2\"\n          >\n            <Square className=\"h-4 w-4\" />\n            {showConfirmEnd ? \"Confirm End\" : \"End Interview\"}\n          </Button>\n        </div>\n\n        {/* Status Indicators */}\n        <div className=\"border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3\">\n          {/* Violation Status */}\n          <div className=\"flex items-center justify-between\">\n            <div className=\"flex items-center gap-2\">\n              <ViolationIcon className={`h-4 w-4 ${violationStatus.color}`} />\n              <span className=\"text-sm font-medium\">Proctoring</span>\n            </div>\n            <div className=\"text-right\">\n              <div className={`text-sm font-bold ${violationStatus.color}`}>\n                {violationStatus.status}\n              </div>\n              <div className=\"text-xs text-slate-500\">\n                {violations}/{maxViolations} violations\n              </div>\n            </div>\n          </div>\n\n          {/* Interview Status */}\n          <div className=\"flex items-center justify-between\">\n            <div className=\"flex items-center gap-2\">\n              <div className={`h-2 w-2 rounded-full ${\n                isPaused ? \"bg-yellow-500\" : \"bg-green-500 animate-pulse\"\n              }`} />\n              <span className=\"text-sm font-medium\">Status</span>\n            </div>\n            <div className=\"text-sm font-medium\">\n              {isPaused ? \"Paused\" : \"Active\"}\n            </div>\n          </div>\n        </div>\n\n        {/* Warning Messages */}\n        {violations >= maxViolations * 0.8 && (\n          <div className=\"bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3\">\n            <div className=\"flex items-center gap-2 text-red-700 dark:text-red-300\">\n              <AlertTriangle className=\"h-4 w-4\" />\n              <span className=\"text-xs font-medium\">High Violation Warning</span>\n            </div>\n            <p className=\"text-xs text-red-600 dark:text-red-400 mt-1\">\n              Please maintain proper interview conduct to avoid disqualification.\n            </p>\n          </div>\n        )}\n\n        {showConfirmEnd && (\n          <div className=\"bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3\">\n            <div className=\"flex items-center gap-2 text-yellow-700 dark:text-yellow-300\">\n              <AlertTriangle className=\"h-4 w-4\" />\n              <span className=\"text-xs font-medium\">Confirm End Interview</span>\n            </div>\n            <p className=\"text-xs text-yellow-600 dark:text-yellow-400 mt-1\">\n              Click \"Confirm End\" again to finish the interview. This action cannot be undone.\n            </p>\n          </div>\n        )}\n      </CardContent>\n    </Card>\n  );\n}"