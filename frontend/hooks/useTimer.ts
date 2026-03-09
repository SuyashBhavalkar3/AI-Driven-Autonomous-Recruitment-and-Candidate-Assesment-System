import { useState, useEffect, useRef } from "react";

interface UseTimerProps {
  initialTime: number;
  active: boolean;
  onExpire: () => void;
}

export function useTimer({ initialTime, active, onExpire }: UseTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const timerRef = useRef<NodeJS.Timeout>();

  const resetTimer = (newTime: number) => {
    setTimeLeft(newTime);
  };

  useEffect(() => {
    if (!active) {
      console.log("Timer not active");
      return;
    }

    console.log("Timer active, timeLeft:", timeLeft);
    if (timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          console.log("Decrementing timer:", prev - 1);
          return prev - 1;
        });
      }, 1000);
    } else {
      console.log("Timer expired, calling onExpire");
      onExpire();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active, timeLeft, onExpire]); // <- missing brace was here? Actually the code above is complete.

  return { timeLeft, resetTimer };
}