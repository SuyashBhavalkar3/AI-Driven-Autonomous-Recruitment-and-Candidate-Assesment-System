import { useState, useRef, useCallback } from 'react';

interface UseSarvamTTSProps {
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  backendUrl?: string;
}

export function useSarvamTTS({
  onSpeakingStart,
  onSpeakingEnd,
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000",
}: UseSarvamTTSProps = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const speak = useCallback(
    async (text: string) => {
      try {
        if (!text) return;
        setError(null);
        setIsLoading(true);

        // Call backend to convert text to speech
        const response = await fetch(`${backendUrl}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error(`TTS failed: ${response.statusText}`);
        }

        const data = await response.json();
        const audioBase64 = data.audio;

        if (!audioBase64) {
          throw new Error('No audio data returned from server');
        }

        // Convert base64 to audio buffer
        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create audio context if not exists
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }

        const audioContext = audioContextRef.current;

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);

        // Create and start audio source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        setIsLoading(false);
        setIsSpeaking(true);
        if (onSpeakingStart) onSpeakingStart();

        source.onended = () => {
          setIsSpeaking(false);
          if (onSpeakingEnd) onSpeakingEnd();
        };

        source.start();
        sourceRef.current = source;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'TTS conversion failed';
        setError(errorMsg);
        setIsLoading(false);
        console.error('TTS Error:', err);
      }
    },
    [onSpeakingStart, onSpeakingEnd]
  );

  const cancel = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      sourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return {
    speak,
    cancel,
    isSpeaking,
    isLoading,
    error,
  };
}
