import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, ShieldCheck, AlertCircle, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => Promise<void>;
  errorMessage?: string | null;
}

export function MicPermissionModal({
  isOpen,
  onClose,
  onAllow,
  errorMessage,
}: MicPermissionModalProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isOpen) return null;

  const handleGrant = async () => {
    setIsRequesting(true);
    try {
      await onAllow();
      onClose();
    } catch (err) {
      console.error("Mic permission grant failed:", err);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl border bg-slate-950 text-slate-100 shadow-2xl"
          style={{ borderColor: "var(--app-border, rgba(255,255,255,0.1))" }}
        >
          {/* Cyan/Purple Background Glow */}
          <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                <Mic className="w-8 h-8 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold">
                <Sparkles className="w-3 h-3" />
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold tracking-tight text-white">
                Enable Microphone Access for Voice Features
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Nexus Plex requires microphone permission to perform real-time low-latency speech dictation and Google-style live voice transcription.
              </p>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 p-3 text-left rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs w-full">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="w-full space-y-2 pt-2">
              <Button
                type="button"
                onClick={handleGrant}
                disabled={isRequesting}
                className="w-full h-11 bg-[#06B6D4] hover:bg-[#0891B2] text-slate-950 font-bold rounded-2xl text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isRequesting ? "Connecting Microphone..." : "Allow Microphone Access"}</span>
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>

            <p className="text-[10px] text-slate-500 pt-1">
              Nexus Plex Workspace • Engineered by Aarnav
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
