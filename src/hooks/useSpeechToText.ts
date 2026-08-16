import { useState, useRef, useCallback, useEffect } from "react";
import { showError } from "@/utils/toast";
import { AudioBufferRecorder, transcribeAudioBlob } from "@/utils/voiceEngine";

export interface SpeechToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  userEmail?: string;
  silenceTimeoutMs?: number;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: (finalTranscript?: string) => void;
}

export interface UseSpeechToTextReturn {
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
  startListening: (options?: SpeechToTextOptions) => Promise<boolean>;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyBands, setFrequencyBands] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderRef = useRef<AudioBufferRecorder | null>(null);
  const fallbackRecognitionRef = useRef<any>(null);
  const isComponentMounted = useRef<boolean>(true);
  const activeOptionsRef = useRef<SpeechToTextOptions | undefined>(undefined);
  const isListeningRef = useRef<boolean>(false);
  const fallbackTranscriptRef = useRef<string>("");

  const isSupported =
    typeof window !== "undefined" &&
    !!(navigator.mediaDevices?.getUserMedia ||
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition);

  // Request microphone permission
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
        userFriendlyErr = "Microphone permission denied. Please allow microphone access in browser settings.";
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

  // Stop recording and process private audio buffer
  const stopListening = useCallback(async () => {
    if (!isListeningRef.current) return;
    isListeningRef.current = false;

    if (isComponentMounted.current) {
      setIsListening(false);
      setIsTranscribing(true);
      setAudioLevel(0);
      setFrequencyBands([0, 0, 0, 0, 0, 0]);
    }

    const currentOptions = activeOptionsRef.current;

    // Stop fallback recognition if active
    if (fallbackRecognitionRef.current) {
      try {
        fallbackRecognitionRef.current.stop();
      } catch {}
      fallbackRecognitionRef.current = null;
    }

    let finalTranscript = "";

    // 1. Finalize Audio Buffer & Transcribe
    if (recorderRef.current) {
      try {
        const audioBlob = await recorderRef.current.stop();
        if (audioBlob && audioBlob.size > 800) {
          try {
            const sttResult = await transcribeAudioBlob(audioBlob, {
              language: currentOptions?.lang || "en",
              userEmail: currentOptions?.userEmail,
            });
            finalTranscript = (sttResult.transcript || sttResult.text || "").trim();
          } catch (sttErr) {
            console.warn("[SpeechToText] Server transcription fallback:", sttErr);
          }
        }
      } catch (recErr) {
        console.warn("[SpeechToText] Recorder stop error:", recErr);
      }
      recorderRef.current = null;
    }

    // 2. Fallback to client-side transcript if server STT was empty
    if (!finalTranscript && fallbackTranscriptRef.current) {
      finalTranscript = fallbackTranscriptRef.current.trim();
    }

    if (isComponentMounted.current) {
      setIsTranscribing(false);
      if (finalTranscript) {
        setTranscript(finalTranscript);
        setInterimTranscript("");
        if (currentOptions?.onResult) {
          currentOptions.onResult(finalTranscript, true);
        }
      }
      if (currentOptions?.onEnd) {
        currentOptions.onEnd(finalTranscript);
      }
    }
  }, []);

  // Start private recording session
  const startListening = useCallback(
    async (options?: SpeechToTextOptions): Promise<boolean> => {
      if (isListeningRef.current) {
        stopListening();
        return false;
      }

      activeOptionsRef.current = options;
      fallbackTranscriptRef.current = "";

      if (isComponentMounted.current) {
        setTranscript("");
        setInterimTranscript("");
        setErrorMessage(null);
      }

      const stream = await requestMicAccess();
      if (!stream) {
        options?.onError?.("Microphone access not granted");
        return false;
      }

      isListeningRef.current = true;
      if (isComponentMounted.current) {
        setIsListening(true);
      }

      // Initialize Private Buffer Recorder
      try {
        const recorder = new AudioBufferRecorder({
          silenceThresholdMs: options?.silenceTimeoutMs || 2200,
          language: options?.lang || "en-US",
          onAudioLevel: ({ audioLevel: level, frequencyBands: bands }) => {
            if (isComponentMounted.current && isListeningRef.current) {
              setAudioLevel(level);
              setFrequencyBands(bands);
            }
          },
          onSilenceDetected: () => {
            // Auto-stop upon silence
            if (isListeningRef.current) {
              stopListening();
            }
          },
        });

        recorderRef.current = recorder;
        await recorder.start(stream);
      } catch (recInitErr) {
        console.warn("[SpeechToText] AudioBufferRecorder failed, falling back to Web Speech:", recInitErr);
      }

      // Concurrently run Web Speech API as seamless offline backup
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const recognition = new SpeechRec();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = options?.lang || "en-US";

          recognition.onresult = (event: any) => {
            let finalAccum = "";
            for (let i = 0; i < event.results.length; i++) {
              finalAccum += event.results[i][0]?.transcript || "";
            }
            fallbackTranscriptRef.current = finalAccum;
          };

          recognition.onerror = (e: any) => {
            console.warn("[WebSpeech Backup] Minor notice:", e?.error);
          };

          recognition.onend = () => {
            if (isListeningRef.current && !recorderRef.current) {
              stopListening();
            }
          };

          fallbackRecognitionRef.current = recognition;
          recognition.start();
        }
      } catch (wsErr) {
        // Safe to ignore if browser does not have webkitSpeechRecognition
      }

      return true;
    },
    [requestMicAccess, stopListening]
  );

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    fallbackTranscriptRef.current = "";
  }, []);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      if (recorderRef.current) {
        recorderRef.current.cleanup();
        recorderRef.current = null;
      }
      if (fallbackRecognitionRef.current) {
        try {
          fallbackRecognitionRef.current.stop();
        } catch {}
        fallbackRecognitionRef.current = null;
      }
    };
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
    resetTranscript,
  };
}
