"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Shield, 
  Camera, 
  Mic,
  Monitor,
  Activity,
  Clock
} from "lucide-react";

interface Warning {
  id: number;
  type: "tab_switch" | "copy_paste" | "visibility";
  message: string;
  timestamp: Date;
}

interface ProctoringPanelProps {
  isActive: boolean;
  warnings: Warning[];
  isTabActive: boolean;
  onWarning: (type: Warning["type"], message: string) => void;
}

export function ProctoringPanel({ 
  isActive, 
  warnings, 
  isTabActive, 
  onWarning 
}: ProctoringPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activityLevel, setActivityLevel] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const activityRef = useRef(0);

  // Monitor user activity
  useEffect(() => {
    if (!isActive) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
      activityRef.current = Math.min(activityRef.current + 1, 100);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Activity decay
    const activityInterval = setInterval(() => {
      activityRef.current = Math.max(activityRef.current - 1, 0);
      setActivityLevel(activityRef.current);
    }, 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(activityInterval);
    };
  }, [isActive]);

  // Check for inactivity
  useEffect(() => {
    if (!isActive) return;

    const inactivityCheck = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      const inactiveMinutes = Math.floor(timeSinceActivity / (1000 * 60));
      
      if (inactiveMinutes >= 5) {
        onWarning("visibility", "Extended inactivity detected. Please remain active during the assessment.");
        setLastActivity(Date.now()); // Reset to avoid repeated warnings
      }
    }, 60000); // Check every minute

    return () => clearInterval(inactivityCheck);
  }, [isActive, lastActivity, onWarning]);

  const getWarningTypeColor = (type: Warning["type"]) => {
    switch (type) {
      case "tab_switch":
        return "text-red-500";
      case "copy_paste":
        return "text-orange-500";
      case "visibility":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const getWarningTypeIcon = (type: Warning["type"]) => {
    switch (type) {
      case "tab_switch":
        return <Monitor className="h-3 w-3" />;
      case "copy_paste":
        return <Shield className="h-3 w-3" />;
      case "visibility":
        return <Eye className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* Floating Proctoring Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className="w-64 shadow-lg border-[#B8915C]/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#B8915C]" />
                Proctoring Active
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(!isVisible)}
                className="h-6 w-6 p-0"
              >
                {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </CardHeader>
          
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="pt-0 space-y-3">
                  {/* Status Indicators */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        Tab Focus
                      </span>
                      <Badge 
                        variant={isTabActive ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {isTabActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Activity
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#B8915C] transition-all duration-300"
                            style={{ width: `${activityLevel}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{activityLevel}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span>Warnings</span>
                      <Badge variant="outline" className="text-xs">
                        {warnings.length}/3
                      </Badge>
                    </div>
                    
                    {warnings.length > 0 ? (
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {warnings.slice(-3).map((warning) => (
                          <div 
                            key={warning.id}
                            className="flex items-start gap-2 text-xs p-1 rounded bg-red-50 dark:bg-red-900/20"
                          >
                            <div className={getWarningTypeColor(warning.type)}>
                              {getWarningTypeIcon(warning.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate text-red-700 dark:text-red-300">
                                {warning.message}
                              </div>
                              <div className="text-red-500 text-xs">
                                {warning.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        No violations detected
                      </div>
                    )}
                  </div>

                  {/* Security Features */}
                  <div className="border-t pt-2">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Copy/paste disabled
                      </div>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3 w-3" />
                        Tab switching monitored
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Window focus tracked
                      </div>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* Full Screen Warning Overlay */}
      <AnimatePresence>
        {!isTabActive && isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-500/20 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <Card className="max-w-md mx-4">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                  Assessment Tab Inactive
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  Please return to the assessment tab. Switching tabs during the assessment is not allowed and may result in disqualification.
                </p>
                <Badge variant="destructive" className="text-xs">
                  Warning: This violation has been recorded
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}