import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

interface UseFaceRecognitionProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled?: boolean;
  onViolation?: (type: string) => void;
}

export function useFaceRecognition({
  videoRef,
  enabled = true,
  onViolation,
}: UseFaceRecognitionProps) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);
  const [gazeAway, setGazeAway] = useState(false);
  const [faceBox, setFaceBox] = useState<faceapi.Box | null>(null);

  const detectionInterval = useRef<NodeJS.Timeout>();

  // Load models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
        console.log("Face models loaded");
      } catch (error) {
        console.error("Failed to load face models", error);
      }
    };
    loadModels();
  }, []);

  // Continuous detection
  useEffect(() => {
    if (!modelsLoaded || !enabled || !videoRef.current) return;

    const detect = async () => {
      if (!videoRef.current) return;

      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        const hasFace = detections.length > 0;
        setFaceDetected(hasFace);

        const multiple = detections.length > 1;
        setMultipleFaces(multiple);

        // Gaze away estimation (simplified)
        if (hasFace && detections[0].landmarks) {
          const landmarks = detections[0].landmarks;
          const nose = landmarks.getNose();
          if (nose.length > 0) {
            const noseTip = nose[3]; // approximate tip
            const videoWidth = videoRef.current.videoWidth;
            const centerX = videoWidth / 2;
            const threshold = videoWidth * 0.15; // 15% from center
            const isLookingAway = Math.abs(noseTip.x - centerX) > threshold;
            setGazeAway(isLookingAway);
          }
        }

        if (hasFace) {
          setFaceBox(detections[0].detection.box);
        }

        // Trigger violations
        if (!hasFace) onViolation?.("no_face");
        if (multiple) onViolation?.("multiple_faces");
        if (gazeAway) onViolation?.("gaze_away");
      } catch (error) {
        console.error("Face detection error", error);
      }
    };

    detectionInterval.current = setInterval(detect, 500);

    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, [modelsLoaded, enabled, videoRef, onViolation, gazeAway]);

  return {
    modelsLoaded,
    faceDetected,
    multipleFaces,
    gazeAway,
    faceBox,
  };
}