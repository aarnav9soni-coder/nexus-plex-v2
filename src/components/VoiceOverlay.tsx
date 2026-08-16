/**
 * VoiceOverlay Modal - Nexus Plex
 * High-craft voice modal featuring an animated minimalist audio waveform,
 * real-time transcript streaming, and Dual-Mode termination controls:
 * 1. Stop / Done (Square Icon): Paste into input prompt for editing (no auto-submit)
 * 2. Direct Submit (Blue Circle with Up Arrow): Immediate dispatch to AI
 */

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Square, ArrowUp, X, Mic, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/useVoiceInput";

export interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: (transcript: string) => void;
  onSubmit: (transcript: string) => void;
  userEmail?: string;
  lang?: string;
}

export const VoiceOverlay: React.FC<VoiceOverlayProps> = ({
  isOpen,
  onClose,
  onDone,
  onSubmit,
  userEmail,
  lang = "en-US",
}) => {
  const {
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    frequencyBands,
    startListening,
    stopListening,
    stopAndSubmit,
    cancelListening,
  } = useVoiceInput();

  const isListeningRef = useRef(isListening);
  isListeningRef.current = isListening;

  useEffect(() => {
    if (isOpen) {
      startListening({
        userEmail,
        lang,
        continuous: true,
        interimResults: true,
      });
    } else {
      if (isListeningRef.current) {
        cancelListening();
      }
    }
  }, [isOpen, userEmail, lang, startListening, cancelListening]);

  // Mode A: Stop recording, populate transcript into input box, close overlay
  const handleDone = async () => {
    const finalResult = await stopListening();
    onDone(finalResult || transcript || interimTranscript);
    onClose();
  };

  // Mode B: Stop recording and immediately send to AI model
  const handleSubmit = async () => {
    const finalResult = await stopAndSubmit();
    const textToSend = finalResult || transcript || interimTranscript;
    if (textToSend.trim()) {
      onSubmit(textToSend.trim());
    }
    onClose();
  };

  const handleCancel = () => {
    cancelListening();
    onClose();
  };

  if (!isOpen) return null;

  const currentDisplay = (transcript + (interimTranscript ? " " + interimTranscript : "")).trim();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md p-6 rounded-3xl border shadow-2xl overflow-hidden bg-slate-900/95 border-slate-800 text-slate-100"
          style={{
            boxShadow: "0 25px 50px -12px rgba(6, 182, 212, 0.15)",
          }}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide text-slate-100 flex items-center gap-1.5">
                  Nexus Voice Dictation
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isTranscribing
                    ? "Transcribing voice audio..."
                    : isListening
                    ? "Listening... Speak naturally"
                    : "Ready"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800/80 transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ChatGPT-style Minimalist Horizontal Waveform */}
          <div className="my-6 py-6 px-4 flex flex-col items-center justify-center rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-center gap-1.5 h-12 w-full">
              {frequencyBands.map((band, idx) => (
                <motion.div
                  key={idx}
                  className="w-1.5 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full"
                  animate={{
                    height: isTranscribing
                      ? [8, 28, 8]
                      : `${Math.max(6, Math.min(38, band * 38 + (idx % 2 === 0 ? 6 : 4)))}px`,
                  }}
                  transition={{
                    type: isTranscribing ? "tween" : "spring",
                    stiffness: 350,
                    damping: 20,
                    repeat: isTranscribing ? Infinity : 0,
                    duration: isTranscribing ? 0.7 : undefined,
                    delay: isTranscribing ? idx * 0.08 : 0,
                  }}
                />
              ))}
            </div>

            {/* Live Transcript Preview */}
            <div className="mt-4 min-h-[44px] max-h-28 overflow-y-auto w-full px-2 text-center">
              {currentDisplay ? (
                <p className="text-xs text-slate-200 leading-relaxed font-sans select-none">
                  "{currentDisplay}"
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic select-none">
                  Listening to your speech...
                </p>
              )}
            </div>
          </div>

          {/* Dual-Mode Action Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {/* Mode A: Stop / Done Button (Square Icon) */}
            <Button
              type="button"
              variant="outline"
              onClick={handleDone}
              className="flex-1 h-11 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600 rounded-2xl flex items-center justify-center gap-2 font-medium text-xs shadow-sm transition-all"
              title="Stop recording and paste text to edit before sending"
            >
              <div className="w-3.5 h-3.5 rounded-sm bg-slate-300 flex items-center justify-center">
                <Square className="w-2.5 h-2.5 fill-slate-900 text-slate-900" />
              </div>
              <span>Done & Edit</span>
            </Button>

            {/* Mode B: Direct Submit Button (Blue Circle with Up Arrow) */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!currentDisplay.trim()}
              className="flex-1 h-11 bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] hover:from-[#0891B2] hover:to-[#2563EB] text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-xs shadow-lg shadow-cyan-500/25 disabled:opacity-40 transition-all cursor-pointer"
              title="Stop recording and send prompt directly to AI"
            >
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                <ArrowUp className="w-3.5 h-3.5 text-white stroke-[2.5]" />
              </div>
              <span>Direct Submit</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VoiceOverlay;
