import { useState, useRef, useCallback, useEffect } from "react";

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioLevel: number; // 0 to 1 normalized level for real-time visual waveforms
  permissionGranted: boolean | null;
  errorMessage: string | null;
  startMicrophone: () => Promise<MediaStream | null>;
  stopMicrophone: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopMicrophone = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevel(0);
  }, []);

  const startMicrophone = useCallback(async (): Promise<MediaStream | null> => {
    stopMicrophone(); // Reset any existing active stream
    setErrorMessage(null);

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const err = "Browser mediaDevices API not supported in this environment.";
      setErrorMessage(err);
      setPermissionGranted(false);
      return null;
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
          if (status.state === "denied") {
            const err = "Microphone access is blocked in browser settings. Please allow microphone access for this site.";
            setErrorMessage(err);
            setPermissionGranted(false);
            return null;
          }
        } catch (permErr) {
          console.warn("Permissions query check skipped:", permErr);
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setPermissionGranted(true);
      setIsRecording(true);

      // Setup Web Audio API Analyser for real-time waveform visualization
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioCtxRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const updateVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalized = Math.min(1, average / 128); // 0 to 1
            setAudioLevel(normalized);

            animFrameRef.current = requestAnimationFrame(updateVolume);
          };

          updateVolume();
        }
      } catch (audioErr) {
        console.warn("AudioContext analyzer setup error:", audioErr);
      }

      return stream;
    } catch (err: unknown) {
      console.error("Microphone access permission error:", err);
      const errorStr = err instanceof Error ? err.message : String(err);
      let userFriendlyErr = "Microphone access denied or unavailable.";

      if (errorStr.includes("NotAllowedError") || errorStr.includes("Permission denied")) {
        userFriendlyErr = "Microphone permission denied by user or browser setting.";
      } else if (errorStr.includes("NotFoundError") || errorStr.includes("DevicesNotFoundError")) {
        userFriendlyErr = "No microphone input device found on this system.";
      }

      setErrorMessage(userFriendlyErr);
      setPermissionGranted(false);
      setIsRecording(false);
      return null;
    }
  }, [stopMicrophone]);

  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, [stopMicrophone]);

  return {
    isRecording,
    audioLevel,
    permissionGranted,
    errorMessage,
    startMicrophone,
    stopMicrophone,
  };
}
