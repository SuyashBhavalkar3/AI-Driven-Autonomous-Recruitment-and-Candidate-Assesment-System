import { useState, useEffect, useCallback, useRef } from "react";

interface UseProctoringProps {
  maxViolations?: number;
  violationCooldown?: number; // ms to ignore same violation type
}

export function useProctoring({ 
  maxViolations = 3, 
  violationCooldown = 2000 
}: UseProctoringProps = {}) {
  const [violations, setViolations] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // Cooldown tracking
  const lastViolationTime = useRef<Record<string, number>>({});

  const addViolation = useCallback((reason: string, type: string = 'general') => {
    const now = Date.now();
    const last = lastViolationTime.current[type];
    if (last && now - last < violationCooldown) {
      return; // Skip if within cooldown
    }
    lastViolationTime.current[type] = now;
    setViolations((prev) => prev + 1);
  }, [violationCooldown]);

  // Network monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      addViolation("Network disconnected", 'network');
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addViolation]);

  // Tab visibility monitoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabVisible(false);
        addViolation("Tab switched or minimized", 'visibility');
      } else {
        setIsTabVisible(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [addViolation]);

  // Copy/paste prevention
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("Copy attempt detected", 'copy');
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation("Paste attempt detected", 'paste');
    };
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation("Right-click detected", 'contextmenu');
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Ctrl+C, Ctrl+V, Ctrl+X, etc.
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          addViolation("Copy shortcut detected", 'copy');
        } else if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          addViolation("Paste shortcut detected", 'paste');
        } else if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          addViolation("Cut shortcut detected", 'cut');
        }
      }
      // Detect DevTools shortcuts
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || 
          (e.ctrlKey && e.shiftKey && e.key === 'J') || 
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        addViolation("Developer tools shortcut detected", 'devtools');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addViolation]);

  // DevTools detection via window size (heuristic)
  useEffect(() => {
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 200;
      const heightThreshold = window.outerHeight - window.innerHeight > 200;
      if (widthThreshold || heightThreshold) {
        if (!devToolsOpen) {
          setDevToolsOpen(true);
          addViolation("Developer tools detected", 'devtools');
        }
      } else {
        setDevToolsOpen(false);
      }
    };

    window.addEventListener('resize', detectDevTools);
    const interval = setInterval(detectDevTools, 1000); // check periodically

    return () => {
      window.removeEventListener('resize', detectDevTools);
      clearInterval(interval);
    };
  }, [addViolation, devToolsOpen]);

  const disqualify = useCallback((reason: string) => {
    // Force disqualification by setting violations to max
    setViolations(maxViolations);
  }, [maxViolations]);

  return {
    violations,
    isOnline,
    isTabVisible,
    devToolsOpen,
    addViolation,
    disqualify,
  };
}