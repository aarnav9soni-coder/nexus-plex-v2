/**
 * Dual-Mode Voice Transcription & Audio Visualizer Hook - Nexus Plex
 * Engineered for high-fidelity speech recognition, live interim transcripts,
 * real-time frequency analysis, and dual-mode termination (Paste & Edit vs Auto-Send).
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { showError } from "@/utils/toast";
import { AudioBufferRecorder, transcribeAudioBlob } from "@/utils/voiceEngine";

export interface VoiceInputOptions {
  lang?: string;
  userEmail?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onInterimTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
  isListening: boolean;
  isTranscribing: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  audioLevel: number;
  frequencyBands: number[];
  permissionGranted: boolean | null;
  errorMessage: string | null;
  requestMicAccess: () => Promise<MediaStream | null>;
  startListening: (options?: VoiceInputOptions) => Promise<boolean>;
  stopListening: () => Promise<string>;
  stopAndSubmit: () => Promise<string>;
  cancelListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyBands, setFrequencyBands] = useState<number[]>([
    0.2, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.4, 0.6, 0.3, 0.5,
  ]);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderRef = useRef<AudioBufferRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef<boolean>(true);
  const isListeningRef = useRef<boolean>(false);
  const activeOptionsRef = useRef<VoiceInputOptions | undefined>(undefined);
  const accumulatedTranscriptRef = useRef<string>("");
  const currentInterimRef = useRef<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    !!(
      navigator.mediaDevices?.getUserMedia ||
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  // Clean up on unmount
  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (recorderRef.current) {
        recorderRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Request microphone access
  const requestMicAccess = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Audio capture API not supported in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (isComponentMounted.current) {
        setPermissionGranted(true);
        setErrorMessage(null);
      }
      return stream;
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      let userFriendlyErr = "Microphone access denied.";

      if (errorStr.includes("NotAllowedError") || errorStr.includes("Permission denied")) {
        userFriendlyErr =
          "Microphone permission denied. Please allow microphone access in browser settings.";
      } else if (errorStr.includes("NotFoundError") || errorStr.includes("DevicesNotFoundError")) {
        userFriendlyErr = "No microphone hardware detected on this device.";
      }

      if (isComponentMounted.current) {
        setPermissionGranted(false);
        setErrorMessage(userFriendlyErr);
        showError(userFriendlyErr);
      }
      return null;
    }
  }, []);

  // Real-time audio frequency visualizer loop
  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateFrequency = () => {
        if (!isListeningRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        // Compute overall volume level (0 to 1)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 255;
        const clampedLevel = Math.min(1, Math.max(0.05, avg * 1.5));

        // Group into 12 distinct frequency bands
        const bandCount = 12;
        const step = Math.floor(bufferLength / bandCount) || 1;
        const bands: number[] = [];

        for (let i = 0; i < bandCount; i++) {
          const sliceIndex = Math.min(i * step, bufferLength - 1);
          const rawVal = dataArray[sliceIndex] / 255;
          // Apply dynamic organic variance for ChatGPT waveform aesthetic
          const dynamicVal = Math.min(
            1,
            Math.max(0.15, rawVal * 1.4 + (Math.sin(Date.now() / 150 + i) * 0.1 + 0.1))
          );
          bands.push(dynamicVal);
        }

        if (isComponentMounted.current) {
          setAudioLevel(clampedLevel);
          setFrequencyBands(bands);
        }

        animFrameRef.current = requestAnimationFrame(updateFrequency);
      };

      updateFrequency();
    } catch (e) {
      console.warn("[VoiceInput] Audio context visualizer error:", e);
    }
  }, []);

  // Initialize SpeechRecognition with Web Speech API
  const initSpeechRecognition = useCallback((options?: VoiceInputOptions) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = options?.continuous !== false;
      recognition.interimResults = options?.interimResults !== false;
      recognition.lang = options?.lang || "en-US";
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let interim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          const transcriptChunk = res[0].transcript;
          if (res.isFinal) {
            finalChunk += transcriptChunk;
          } else {
            interim += transcriptChunk;
          }
        }

        if (finalChunk) {
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current +
            " " +
            finalChunk
          ).trim();
          if (isComponentMounted.current) {
            setTranscript(accumulatedTranscriptRef.current);
            setInterimTranscript("");
          }
          if (options?.onFinalTranscript) {
            options.onFinalTranscript(accumulatedTranscriptRef.current);
          }
        }

        currentInterimRef.current = interim;
        if (isComponentMounted.current) {
          setInterimTranscript(interim);
        }
        if (options?.onInterimTranscript && interim) {
          options.onInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[VoiceInput] Speech recognition event error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          if (isComponentMounted.current) {
            setErrorMessage("Microphone permission denied.");
            setPermissionGranted(false);
          }
        }
        if (options?.onError) {
          options.onError(event.error);
        }
      };

      recognition.onend = () => {
        // If continuous recognition was requested and user is still speaking, restart
        if (isListeningRef.current && recognitionRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      return recognition;
    } catch (e) {
      console.warn("[VoiceInput] SpeechRecognition initialization error:", e);
      return null;
    }
  }, []);

  // Start voice dictation
  const startListening = useCallback(
    async (options?: VoiceInputOptions): Promise<boolean> => {
      if (isListeningRef.current) return true;

      activeOptionsRef.current = options;
      accumulatedTranscriptRef.current = "";
      currentInterimRef.current = "";

      if (isComponentMounted.current) {
        setTranscript("");
        setInterimTranscript("");
        setErrorMessage(null);
      }

      // 1. Request microphone stream
      const stream = await requestMicAccess();
      if (!stream) return false;

      mediaStreamRef.current = stream;
      isListeningRef.current = true;

      if (isComponentMounted.current) {
        setIsListening(true);
        setIsTranscribing(false);
      }

      // 2. Start Audio Frequency Analysis for live waveform
      startAudioAnalysis(stream);

      // 3. Start In-Memory Audio Buffer Recorder (for Whisper/Gemini fallback)
      try {
        const recorder = new AudioBufferRecorder({
          language: options?.lang || "en",
          userEmail: options?.userEmail,
          silenceThresholdMs: 4000,
        });
        await recorder.start(stream);
        recorderRef.current = recorder;
      } catch (recErr) {
        console.warn("[VoiceInput] Buffer recorder error:", recErr);
      }

      // 4. Start Web Speech API recognition
      const recognition = initSpeechRecognition(options);
      if (recognition) {
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("[VoiceInput] Recognition start error:", e);
        }
      }

      return true;
    },
    [requestMicAccess, startAudioAnalysis, initSpeechRecognition]
  );

  // Internal helper to stop recording and compute final text
  const finalizeRecording = useCallback(async (): Promise<string> => {
    if (!isListeningRef.current) {
      return (
        accumulatedTranscriptRef.current ||
        currentInterimRef.current ||
        transcript ||
        ""
      ).trim();
    }

    isListeningRef.current = false;

    if (isComponentMounted.current) {
      setIsListening(false);
      setIsTranscribing(true);
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Stop Web Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    let recognizedText = (
      accumulatedTranscriptRef.current +
      (currentInterimRef.current ? " " + currentInterimRef.current : "")
    ).trim();

    // If local speech recognition was empty or short, run high-fidelity server STT
    if (!recognizedText && recorderRef.current) {
      try {
        const audioBlob = await recorderRef.current.stop();
        if (audioBlob && audioBlob.size > 800) {
          const sttResult = await transcribeAudioBlob(audioBlob, {
            language: activeOptionsRef.current?.lang || "en",
            userEmail: activeOptionsRef.current?.userEmail,
          });
          recognizedText = (sttResult.transcript || sttResult.text || "").trim();
        }
      } catch (err) {
        console.warn("[VoiceInput] Server transcription error:", err);
      }
      recorderRef.current = null;
    } else if (recorderRef.current) {
      recorderRef.current.stop().catch(() => {});
      recorderRef.current = null;
    }

    // Stop all media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }

    if (isComponentMounted.current) {
      setIsTranscribing(false);
      setTranscript(recognizedText);
      setInterimTranscript("");
      setAudioLevel(0);
      setFrequencyBands([0.2, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.4, 0.6, 0.3, 0.5]);
    }

    return recognizedText;
  }, [transcript]);

  // Mode A: Stop recording, populate prompt as editable text, cancel auto-submit
  const stopListening = useCallback(async (): Promise<string> => {
    const finalResult = await finalizeRecording();
    return finalResult;
  }, [finalizeRecording]);

  // Mode B: Stop recording immediately and return string ready for direct submission
  const stopAndSubmit = useCallback(async (): Promise<string> => {
    const finalResult = await finalizeRecording();
    return finalResult;
  }, [finalizeRecording]);

  // Cancel and discard recording
  const cancelListening = useCallback(() => {
    isListeningRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.stop().catch(() => {});
      recorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    accumulatedTranscriptRef.current = "";
    currentInterimRef.current = "";

    if (isComponentMounted.current) {
      setIsListening(false);
      setIsTranscribing(false);
      setTranscript("");
      setInterimTranscript("");
      setAudioLevel(0);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    accumulatedTranscriptRef.current = "";
    currentInterimRef.current = "";
    if (isComponentMounted.current) {
      setTranscript("");
      setInterimTranscript("");
    }
  }, []);

  return {
    isListening,
    isTranscribing,
    isSupported,
    transcript,
    interimTranscript,
    audioLevel,
    frequencyBands,
    permissionGranted,
    errorMessage,
    requestMicAccess,
    startListening,
    stopListening,
    stopAndSubmit,
    cancelListening,
    resetTranscript,
  };
}

export default useVoiceInput;
