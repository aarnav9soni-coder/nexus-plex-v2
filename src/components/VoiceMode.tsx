import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, X, Radio, Disc, Loader2, Sparkles, AlertCircle, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech, VoicePersona } from "@/hooks/useTextToSpeech";
import { VoiceSelector } from "@/components/VoiceSelector";
import { apiRouter } from "@/utils/apiRouter";
import { sanitizeResponseText } from "@/utils/textSanitizer";

export type VoiceState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface VoiceModeProps {
  isOpen?: boolean;
  onClose?: () => void;
  selectedModel?: string;
  userEmail?: string;
}

export const VoiceMode: React.FC<VoiceModeProps> = ({
  isOpen = true,
  onClose,
  selectedModel = "gemini-3.7-flash",
  userEmail = "",
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [transcriptText, setTranscriptText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCapturedTextRef = useRef<string>("");
  const isMounted = useRef<boolean>(true);
  const hasGreetedRef = useRef<boolean>(false);

  // Refs to break circular callback initialization dependencies
  const startListeningCycleRef = useRef<() => void>(() => {});
  const triggerTextToSpeechRef = useRef<(text: string) => void>(() => {});

  const {
    isListening,
    audioLevel,
    errorMessage,
    startListening,
    stopListening,
  } = useSpeechToText();

  const {
    speak,
    stop: stopTts,
    selectedPersona,
    setSelectedPersona,
    changePersona,
  } = useTextToSpeech();

  const handleClose = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopListening();
    stopTts();
    setVoiceState("idle");
    if (onClose) onClose();
  }, [stopListening, stopTts, onClose]);

  // Voice Stop-words detector
  const checkIsStopCommand = useCallback((text: string): boolean => {
    if (!text) return false;
    const lower = text.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    const STOP_COMMANDS = [
      "stop",
      "bye",
      "goodbye",
      "cancel",
      "shut up",
      "pause session",
      "exit",
      "stop session",
      "turn off",
      "end session",
      "quit",
      "close",
    ];
    return STOP_COMMANDS.some(
      (cmd) =>
        lower === cmd ||
        lower.startsWith(`${cmd} `) ||
        lower.endsWith(` ${cmd}`) ||
        lower.includes(` ${cmd} `)
    );
  }, []);

  const triggerStopCommandFlow = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopListening();
    stopTts();
    if (!isMounted.current) return;
    setVoiceState("idle");
    const farewell = "Ending session. Goodbye!";
    setAiResponse(farewell);
    speak(farewell, {
      persona: selectedPersona,
      onEnd: () => {
        handleClose();
      },
      onError: () => {
        handleClose();
      },
    });
  }, [stopListening, stopTts, selectedPersona, speak, handleClose]);

  // Handle dynamic voice switching mid-speech
  const handleVoicePersonaChange = useCallback(
    (newPersona: VoicePersona) => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      stopTts();
      changePersona(newPersona);

      // If actively speaking or an AI response is loaded, re-synthesize instantly with the new persona
      if (aiResponse) {
        const sanitizedText = sanitizeResponseText(aiResponse)
          .replace(/[*#_`~[\]()]/g, "")
          .trim();

        if (sanitizedText) {
          setTimeout(() => {
            if (!isMounted.current) return;
            speak(sanitizedText, {
              persona: newPersona,
              onStart: () => {
                if (isMounted.current) setVoiceState("speaking");
              },
              onEnd: () => {
                if (isMounted.current && isOpen) {
                  setVoiceState("idle");
                  setTimeout(() => {
                    if (isMounted.current) startListeningCycleRef.current();
                  }, 400);
                }
              },
              onError: (err) => {
                console.warn("Speech Synthesis error:", err);
                if (isMounted.current && isOpen) {
                  setVoiceState("idle");
                  setTimeout(() => startListeningCycleRef.current(), 500);
                }
              },
            });
          }, 50);
        }
      }
    },
    [changePersona, stopTts, aiResponse, speak, isOpen]
  );

  // TTS handler
  const triggerTextToSpeech = useCallback(
    (textToSpeak: string) => {
      if (isMuted || !textToSpeak || typeof textToSpeak !== "string") {
        if (isMounted.current && isOpen) {
          setTimeout(() => startListeningCycleRef.current(), 500);
        }
        return;
      }

      const sanitizedText = sanitizeResponseText(textToSpeak)
        .replace(/[*#_`~[\]()]/g, "")
        .trim();

      if (!sanitizedText) {
        if (isMounted.current && isOpen) {
          startListeningCycleRef.current();
        }
        return;
      }

      speak(sanitizedText, {
        persona: selectedPersona,
        onStart: () => {
          if (isMounted.current) setVoiceState("speaking");
        },
        onEnd: () => {
          if (isMounted.current && isOpen) {
            setVoiceState("idle");
            setTimeout(() => {
              if (isMounted.current) startListeningCycleRef.current();
            }, 400);
          }
        },
        onError: (err) => {
          console.warn("Speech Synthesis error:", err);
          if (isMounted.current && isOpen) {
            setVoiceState("idle");
            setTimeout(() => startListeningCycleRef.current(), 500);
          }
        },
      });
    },
    [isMuted, selectedPersona, isOpen, speak]
  );

  useEffect(() => {
    triggerTextToSpeechRef.current = triggerTextToSpeech;
  }, [triggerTextToSpeech]);

  // Process LLM with user speech
  const processUserSpeechWithLlm = useCallback(
    async (userText: string) => {
      if (!userText || typeof userText !== "string" || !userText.trim()) return;

      const sanitizedInput = sanitizeResponseText(userText).trim();
      if (!sanitizedInput) return;

      if (checkIsStopCommand(sanitizedInput)) {
        triggerStopCommandFlow();
        return;
      }

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopListening();

      setVoiceState("thinking");
      setAiResponse("Thinking...");

      const effectiveUserScope = userEmail ? `workspace_user_${userEmail}` : "";

      try {
        console.log("Processing live voice prompt:", sanitizedInput);
        const rawResponse = await apiRouter.processPrompt(sanitizedInput, {
          selectedModel,
          systemPrompt:
            "You are Nexus Plex, an intelligent AI voice assistant designed and built by Lead Developer & Architect Aarnav. Answer the user's question directly, comprehensively, and naturally in 1 to 3 short conversational sentences maximum in plain natural spoken text. Do not repeat any greeting, re-introduce yourself, or add robotic meta-declarations like 'I have processed your request' or 'As Nexus Plex...'. Never say you are Aarnav's assistant; credit Aarnav strictly as the Lead Developer & Architect who created Nexus Plex.",
          userEmail: effectiveUserScope || userEmail,
        });

        if (!isMounted.current) return;

        const cleanResponse = sanitizeResponseText(rawResponse, sanitizedInput).trim();
        const finalResponse = cleanResponse || "I heard you, but I don't have a specific response right now.";

        setAiResponse(finalResponse);
        setVoiceState("speaking");
        triggerTextToSpeechRef.current(finalResponse);
      } catch (err: unknown) {
        if (!isMounted.current) return;

        console.error("Live Voice Mode LLM Rejection Error:", err);
        setVoiceState("error");

        const fallbackMsg = "I am unable to process that request right now. Please try again.";
        setAiResponse(fallbackMsg);
        triggerTextToSpeechRef.current(fallbackMsg);
      }
    },
    [selectedModel, userEmail, stopListening, checkIsStopCommand, triggerStopCommandFlow]
  );

  // Start continuous listening cycle
  const startListeningCycle = useCallback(async () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopTts();

    setTranscriptText("");
    lastCapturedTextRef.current = "";

    const success = await startListening({
      continuous: true,
      interimResults: true,
      onResult: (text) => {
        if (!text) return;

        if (checkIsStopCommand(text)) {
          triggerStopCommandFlow();
          return;
        }

        stopTts();
        setTranscriptText(text);
        lastCapturedTextRef.current = text;

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (lastCapturedTextRef.current.trim()) {
            processUserSpeechWithLlm(lastCapturedTextRef.current.trim());
          }
        }, 1300);
      },
      onEnd: (finalTranscript) => {
        const textToProcess = (finalTranscript || lastCapturedTextRef.current || "").trim();
        if (textToProcess) {
          if (checkIsStopCommand(textToProcess)) {
            triggerStopCommandFlow();
            return;
          }
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          processUserSpeechWithLlm(textToProcess);
        }
      },
      onError: (err) => {
        console.warn("Speech error:", err);
      },
    });

    if (success) {
      setVoiceState("listening");
    } else {
      setVoiceState("error");
    }
  }, [startListening, stopTts, processUserSpeechWithLlm, checkIsStopCommand, triggerStopCommandFlow]);

  useEffect(() => {
    startListeningCycleRef.current = startListeningCycle;
  }, [startListeningCycle]);

  useEffect(() => {
    isMounted.current = true;
    if (isOpen) {
      if (!hasGreetedRef.current) {
        hasGreetedRef.current = true;
        const defaultVoiceGreeting = "Hello! Welcome to Nexus Plex, built by Aarnav. How can I help you today?";
        setAiResponse(defaultVoiceGreeting);
        setVoiceState("speaking");

        const greetingTimer = setTimeout(() => {
          if (!isMounted.current) return;
          speak(defaultVoiceGreeting, {
            persona: selectedPersona,
            onStart: () => {
              if (isMounted.current) setVoiceState("speaking");
            },
            onEnd: () => {
              if (isMounted.current && isOpen) {
                setVoiceState("idle");
                setTimeout(() => {
                  if (isMounted.current) startListeningCycleRef.current();
                }, 400);
              }
            },
            onError: (err) => {
              console.warn("Welcome greeting synthesis error or skipped:", err);
              if (isMounted.current && isOpen) {
                startListeningCycleRef.current();
              }
            },
          });
        }, 100);

        return () => clearTimeout(greetingTimer);
      } else {
        setVoiceState("idle");
        const timer = setTimeout(() => {
          if (isMounted.current) startListeningCycleRef.current();
        }, 150);
        return () => clearTimeout(timer);
      }
    }
    return () => {
      isMounted.current = false;
      stopListening();
      stopTts();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  // Status Badge Metadata
  const getStatusMeta = () => {
    switch (voiceState) {
      case "listening":
        return {
          text: "Listening...",
          bg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
          Icon: Radio,
          pulse: true,
        };
      case "thinking":
        return {
          text: "Processing...",
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          Icon: Loader2,
          spin: true,
        };
      case "speaking":
        return {
          text: "Nexus Live Speaking...",
          bg: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          Icon: Disc,
          spin: true,
        };
      case "error":
        return {
          text: "Microphone Error",
          bg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
          Icon: AlertCircle,
          pulse: false,
        };
      case "idle":
      default:
        return {
          text: "Ready to Speak",
          bg: "bg-slate-800/80 text-slate-300 border-slate-700/80",
          Icon: MicOff,
          pulse: false,
        };
    }
  };

  const status = getStatusMeta();
  const StatusIcon = status.Icon;

  // Visual scale factor based on voice state and dynamic audio level
  const orbScale =
    voiceState === "speaking"
      ? 1.25
      : voiceState === "listening"
      ? 1 + Math.min(audioLevel * 0.8, 0.4)
      : voiceState === "thinking"
      ? 1.1
      : 1.0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-300 text-white font-sans overflow-hidden select-none">
      {/* Background Ambient Fluid Glow Spotlight */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-700 opacity-60 ${
            voiceState === "speaking"
              ? "bg-gradient-to-tr from-purple-600/40 via-indigo-600/40 to-fuchsia-600/30 scale-125"
              : voiceState === "listening"
              ? "bg-gradient-to-tr from-cyan-500/30 via-teal-500/30 to-indigo-600/30 scale-110"
              : voiceState === "thinking"
              ? "bg-gradient-to-tr from-amber-500/30 via-orange-500/30 to-purple-600/30 scale-110"
              : "bg-gradient-to-tr from-slate-800/30 to-indigo-950/20 scale-90"
          }`}
        />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full pt-1">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm sm:text-base text-white tracking-widest flex items-center gap-2">
              NEXUS LIVE VOICE
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono tracking-normal">
                Nexus Plex • Aarnav
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Real-time Conversational Voice Suite</span>
          </div>
        </div>

        {/* Top Right Controls & Voice Switcher */}
        <div className="flex items-center gap-3">
          <div className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md ${status.bg}`}>
            <StatusIcon className={`w-3.5 h-3.5 ${status.spin ? "animate-spin" : status.pulse ? "animate-pulse" : ""}`} />
            <span>{status.text}</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg"
            title="End Session"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Central Gemini Live Dynamic Fluid Orb */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center max-w-2xl mx-auto w-full">
        {/* Mobile Status Indicator */}
        <div className={`md:hidden mb-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md ${status.bg}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${status.spin ? "animate-spin" : status.pulse ? "animate-pulse" : ""}`} />
          <span>{status.text}</span>
        </div>

        <div className="relative flex items-center justify-center my-6 group cursor-pointer" onClick={startListeningCycle}>
          {/* Animated Concentric Waves */}
          <div
            className={`absolute w-80 h-80 rounded-full border border-cyan-500/20 transition-all duration-500 ${
              voiceState === "speaking"
                ? "scale-125 border-purple-500/40 animate-ping"
                : voiceState === "listening"
                ? "scale-110 border-cyan-400/30 animate-pulse"
                : "scale-90"
            }`}
          />
          <div
            className={`absolute w-64 h-64 rounded-full border border-indigo-500/30 transition-all duration-500 ${
              voiceState === "speaking"
                ? "rotate-180 scale-110 border-fuchsia-500/40"
                : voiceState === "listening"
                ? "rotate-45 scale-105 border-teal-400/30"
                : "scale-95"
            }`}
          />

          {/* Gemini Live Fluid Core Orb */}
          <div
            className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr transition-all duration-500 flex items-center justify-center p-1 shadow-2xl ${
              voiceState === "speaking"
                ? "from-purple-600 via-indigo-500 to-fuchsia-500 shadow-purple-500/50 ring-4 ring-purple-500/30"
                : voiceState === "listening"
                ? "from-cyan-400 via-teal-500 to-indigo-600 shadow-cyan-500/50 ring-4 ring-cyan-400/30"
                : voiceState === "thinking"
                ? "from-amber-400 via-orange-500 to-purple-600 shadow-amber-500/40 ring-4 ring-amber-500/20"
                : "from-slate-800 via-slate-900 to-slate-950 shadow-black/80 ring-2 ring-slate-800"
            }`}
            style={{ transform: `scale(${orbScale})` }}
          >
            <div className="w-full h-full rounded-full bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 relative overflow-hidden">
              {/* Inner Mesh Gradient Texture */}
              <div
                className={`absolute inset-0 opacity-40 transition-opacity ${
                  voiceState === "speaking"
                    ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/40 via-transparent to-transparent animate-pulse"
                    : voiceState === "listening"
                    ? "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-400/40 via-transparent to-transparent animate-pulse"
                    : "bg-transparent"
                }`}
              />

              <div className="relative z-10 flex flex-col items-center">
                {voiceState === "thinking" ? (
                  <Loader2 className="w-16 h-16 text-amber-300 animate-spin" />
                ) : voiceState === "speaking" ? (
                  <Disc className="w-16 h-16 text-purple-300 animate-spin" />
                ) : voiceState === "listening" ? (
                  <Radio className="w-16 h-16 text-cyan-400 animate-pulse" />
                ) : (
                  <Mic className="w-16 h-16 text-slate-300/80 group-hover:text-white transition-colors" />
                )}
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 mt-2">
                  {voiceState === "listening"
                    ? "Listening..."
                    : voiceState === "thinking"
                    ? "Thinking..."
                    : voiceState === "speaking"
                    ? "Speaking..."
                    : "Tap to Speak"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Frequency Waveform equalizer bars */}
        {(voiceState === "listening" || voiceState === "speaking") && (
          <div className="flex items-center gap-1.5 h-12 my-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((bar) => {
              const heightPx =
                voiceState === "speaking"
                  ? Math.floor(Math.random() * 36) + 12
                  : Math.max(8, Math.floor(audioLevel * 42) + Math.floor(Math.random() * 12));

              return (
                <div
                  key={bar}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    voiceState === "speaking"
                      ? "bg-gradient-to-t from-purple-500 to-fuchsia-400"
                      : "bg-gradient-to-t from-cyan-500 to-teal-300"
                  }`}
                  style={{
                    height: `${heightPx}px`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Translucent Subtitle Pill (Gemini Live Subtitles) */}
      <div className="relative z-10 max-w-xl mx-auto w-full px-4 mb-4">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {transcriptText && (
          <div className="p-4 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 text-sm sm:text-base text-slate-100 font-medium italic shadow-2xl text-center animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="text-cyan-400 font-bold not-italic mr-2">User:</span>
            "{transcriptText}"
          </div>
        )}

        {!transcriptText && aiResponse && (
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed shadow-2xl text-left animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Nexus Live Output:
            </div>
            {aiResponse}
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar (Gemini Live Floating Toolbar) */}
      <div className="relative z-10 flex items-center justify-between gap-3 max-w-lg mx-auto w-full p-2.5 rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 shadow-2xl">
        {/* Voice Persona Switcher Dropdown */}
        <div className="shrink-0">
          <VoiceSelector
            value={selectedPersona}
            onChange={handleVoicePersonaChange}
            disabled={voiceState === "thinking"}
          />
        </div>

        {/* Mute Output Toggle Button */}
        <button
          type="button"
          onClick={() => {
            const nextMuted = !isMuted;
            setIsMuted(nextMuted);
            if (nextMuted && typeof window !== "undefined" && window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
          }}
          className={`p-3 rounded-2xl transition-all ${
            isMuted
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-slate-800/80 border border-slate-700/80 text-slate-200 hover:bg-slate-700/80 hover:text-white"
          }`}
          title={isMuted ? "Unmute Spoken AI" : "Mute Spoken AI"}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Tap to Speak / Listening Action Button */}
        <Button
          type="button"
          onClick={startListeningCycle}
          disabled={voiceState === "thinking"}
          className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black px-5 py-3 rounded-2xl shadow-lg shadow-cyan-500/20 text-xs sm:text-sm flex items-center gap-2 flex-1 justify-center transition-all active:scale-95"
        >
          {voiceState === "listening" ? (
            <>
              <Radio className="w-4 h-4 animate-pulse text-slate-950" />
              <span>Listening...</span>
            </>
          ) : voiceState === "thinking" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-slate-950" />
              <span>Tap to Speak</span>
            </>
          )}
        </Button>

        {/* End Session Button */}
        <button
          type="button"
          onClick={handleClose}
          className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 hover:text-rose-200 transition-colors shadow-lg flex items-center justify-center shrink-0"
          title="End Live Voice Session"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

