import { useRef, useCallback, useState } from 'react';

interface UseWebSocketTTSProps {
  url?: string;
}

export function useWebSocketTTS({ url = 'ws://localhost:8000/tts' }: UseWebSocketTTSProps = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    socketRef.current = new WebSocket(url);
    socketRef.current.binaryType = 'arraybuffer';

    socketRef.current.onopen = () => {
      console.log('TTS WebSocket connected');
    };

    socketRef.current.onmessage = async (event) => {
      const audioData = event.data;
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      try {
        setIsSpeaking(true);
        const buffer = await audioContextRef.current.decodeAudioData(audioData);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          setIsSpeaking(false);
          sourceRef.current = null;
        };
        source.start();
        sourceRef.current = source;
      } catch (err) {
        console.error('Failed to play audio', err);
        setIsSpeaking(false);
      }
    };

    socketRef.current.onerror = (err) => {
      console.error('TTS WebSocket error', err);
      setIsSpeaking(false);
    };

    socketRef.current.onclose = () => {
      console.log('TTS WebSocket closed');
      setIsSpeaking(false);
    };
  }, [url]);

  const speak = useCallback((text: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      connect();
      setTimeout(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ text }));
        } else {
          console.error('WebSocket not connected');
        }
      }, 500);
    } else {
      socketRef.current.send(JSON.stringify({ text }));
    }
  }, [connect]);

  const cancel = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { speak, cancel, isSpeaking };
}