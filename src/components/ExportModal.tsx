/**
 * Comprehensive Cross-Account Chat Export Modal
 * Nexus Plex Architecture - Engineered by Lead Developer & Architect Aarnav.
 *
 * Provides a zero-auth export suite:
 * - Markdown (.md)
 * - JSON Backup (.json)
 * - Printable PDF / HTML View
 * - Direct Google Account / Email Transfer
 * - 1-Click Clipboard Copy
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  FileText,
  FileCode,
  Printer,
  Mail,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Send,
  ExternalLink,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageData } from "@/utils/GeminiClient";
import {
  exportChatAsMarkdown,
  exportChatAsJson,
  exportChatAsPlainText,
  exportChatAsPrintableDocument,
  transferToGoogleAccount,
  copyTranscriptToClipboard,
} from "@/utils/exportEngine";
import { showSuccess } from "@/utils/toast";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageData[];
  sessionTitle: string;
  selectedModel?: string;
  userEmail?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  messages,
  sessionTitle,
  selectedModel = "Gemini 3.7 Flash",
  userEmail = "guest",
}) => {
  const [destinationEmail, setDestinationEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"download" | "transfer">("download");

  if (!isOpen) return null;

  const exportData = {
    sessionTitle,
    messages,
    selectedModel,
    userEmail,
  };

  const handleCopy = async () => {
    await copyTranscriptToClipboard(exportData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransfer = async () => {
    await transferToGoogleAccount({
      ...exportData,
      destinationEmail: destinationEmail.trim() || undefined,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border bg-slate-900/95 shadow-2xl p-6 text-slate-100 z-10"
          style={{ borderColor: "var(--app-border)" }}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[#06B6D4]">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                  Export Chat Transcript
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-xs font-mono">
                  {sessionTitle} ({messages.length} messages)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Zero-Auth Badge Notification */}
          <div className="my-3.5 p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Zero-Auth Engine:</strong> Instant cross-account export with no OAuth popups or account login blocks.
            </span>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("download")}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "download"
                  ? "bg-[#06B6D4] text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Direct File Formats</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transfer")}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "transfer"
                  ? "bg-[#8B5CF6] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Transfer to Google / Email</span>
            </button>
          </div>

          {/* Content Area */}
          {activeTab === "download" ? (
            <div className="space-y-2.5">
              {/* Option 1: Markdown (.md) */}
              <button
                type="button"
                onClick={() => {
                  exportChatAsMarkdown(exportData);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/50 hover:border-cyan-500/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      Export as Markdown (.md)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Clean formatted document with headings, timestamps & model metadata
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </button>

              {/* Option 2: JSON Backup (.json) */}
              <button
                type="button"
                onClick={() => {
                  exportChatAsJson(exportData);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/50 hover:border-purple-500/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                      Export as JSON Backup (.json)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Full raw conversation state with message objects & media URLs
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </button>

              {/* Option 3: PDF / Document Print View */}
              <button
                type="button"
                onClick={() => {
                  exportChatAsPrintableDocument(exportData);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/50 hover:border-amber-500/40 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                      Save as PDF / Document Print View
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Branded Nexus Plex document formatted for browser printing & PDF export
                    </div>
                  </div>
                </div>
                <Printer className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </button>

              {/* Option 4: Plain Text (.txt) */}
              <button
                type="button"
                onClick={() => {
                  exportChatAsPlainText(exportData);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/50 hover:border-slate-600 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors">
                      Export as Plain Text (.txt)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Lightweight UTF-8 raw text transcript
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="p-3 rounded-2xl border border-purple-500/20 bg-purple-950/20 text-xs text-purple-200">
                Send this conversation directly to any Google email account, mobile share sheet, or save to your Google Drive without signing in again.
              </div>

              {/* Destination Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Destination Google Email (Optional):
                </label>
                <input
                  type="email"
                  value={destinationEmail}
                  onChange={(e) => setDestinationEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com (or leave empty to open share sheet)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 focus:border-[#8B5CF6] focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              {/* Transfer Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  onClick={handleTransfer}
                  className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transfer / Email</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    window.open("https://drive.google.com", "_blank");
                    exportChatAsMarkdown(exportData);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700"
                  title="Download transcript and open Google Drive"
                >
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open Google Drive</span>
                </Button>
              </div>
            </div>
          )}

          {/* Bottom Clipboard Bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown to Clipboard</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-slate-200 font-bold px-3 py-1.5"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
