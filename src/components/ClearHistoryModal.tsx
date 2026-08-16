import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionsCount?: number;
}

export function ClearHistoryModal({
  isOpen,
  onClose,
  onConfirm,
  sessionsCount = 0,
}: ClearHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md p-6 overflow-hidden rounded-3xl border bg-slate-950 text-slate-100 shadow-2xl"
          style={{ borderColor: "var(--app-border, rgba(255,255,255,0.1))" }}
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold tracking-tight text-white">
                Clear All Conversation History?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                This will permanently remove {sessionsCount > 0 ? `${sessionsCount} chat session(s)` : "all chat threads"} and flushed local cache data for your active account.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <Button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="w-full h-11 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Clear All History</span>
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium rounded-2xl hover:bg-slate-900/60"
              >
                Cancel
              </button>
            </div>

            <p className="text-[10px] text-slate-500 pt-1 font-mono">
              Nexus Plex Workspace • Engineered by Aarnav
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
