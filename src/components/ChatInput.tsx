/**
 * ChatInput Bar
 * Nexus Plex Architecture
 *
 * Implements:
 * 1. Seamless direct prompt composition with raw user prompt transmission
 * 2. Multi-modal attachment support (Files, Photos, Code, Documents)
 * 3. Model selector, BYOK/Standard mode switch, and Live Voice triggers
 * 4. Voice dictation with interactive equalizer waveform
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Paperclip,
  Camera,
  Mic,
  Square,
  ArrowUp,
  X,
  FileText,
  Radio,
  User,
  Zap,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { MicPermissionModal } from "@/components/MicPermissionModal";
import { ModelSelector } from "@/components/ModelSelector";
import { UserProfile } from "@/components/AuthModal";
import { getStoredUser } from "@/utils/userStore";
import {
  getExecutionMode,
  setExecutionMode,
  hasValidKeyForModel,
  ExecutionMode,
} from "@/utils/executionStore";
import { showSuccess, showError } from "@/utils/toast";
import { analyzeFile } from "@/utils/fileAnalyzer";

export interface AttachedFile {
  name: string;
  type: string;
  dataUrl: string;
  textContent?: string;
}

export interface ChatInputProps {
  onSendMessage: (text: string, files: AttachedFile[]) => void;
  isGenerating: boolean;
  onStopGeneration?: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onOpenLiveVoice?: () => void;
  user?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenSettings?: () => void;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  selectedModel,
  onSelectModel,
  onOpenLiveVoice,
  user,
  onOpenAuth,
  onOpenSettings,
  placeholder,
}) => {
  const [inputPrompt, setInputPrompt] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [executionMode, setExecModeState] = useState<ExecutionMode>(getExecutionMode);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(user || getStoredUser());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  // Synchronize global events
  useEffect(() => {
    const handleModeChange = (e: any) => {
      if (e.detail?.mode) setExecModeState(e.detail.mode);
    };
    const handleUserChange = (e: any) => {
      if (e.detail?.user !== undefined) setCurrentUser(e.detail.user);
    };
    const handlePopulatePrompt = (e: any) => {
      if (e.detail?.text) {
        setInputPrompt(e.detail.text);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(e.detail.text.length, e.detail.text.length);
          }
        }, 50);
      }
    };

    window.addEventListener("nexus-execution-mode-change" as any, handleModeChange);
    window.addEventListener("nexus-user-auth-change" as any, handleUserChange);
    window.addEventListener("nexus-populate-prompt" as any, handlePopulatePrompt);

    return () => {
      window.removeEventListener("nexus-execution-mode-change" as any, handleModeChange);
      window.removeEventListener("nexus-user-auth-change" as any, handleUserChange);
      window.removeEventListener("nexus-populate-prompt" as any, handlePopulatePrompt);
    };
  }, []);

  const handleToggleMode = (mode: ExecutionMode) => {
    if (mode === "byok") {
      const hasKey = hasValidKeyForModel(selectedModel, user?.email);
      if (!hasKey) {
        showError("Please add a valid API key in Settings to use BYOK Mode.");
        if (onOpenSettings) onOpenSettings();
        return;
      }
      setExecutionMode("byok");
      setExecModeState("byok");
      showSuccess("BYOK Mode Active - Using custom API keys");
    } else {
      setExecutionMode("standard");
      setExecModeState("standard");
      showSuccess("Standard Mode Active - Platform Default Routing");
    }
  };

  const [isMicModalOpen, setIsMicModalOpen] = useState(false);
  const {
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    frequencyBands,
    permissionGranted,
    errorMessage: micError,
    requestMicAccess,
    startListening,
    stopListening,
    stopAndSubmit,
    cancelListening,
  } = useVoiceInput();

  const startVoiceDictation = async () => {
    const success = await startListening({
      continuous: true,
      interimResults: true,
      userEmail: user?.email,
      lang: "en-US",
    });
    if (success) {
      setIsMicModalOpen(false);
    }
  };

  const toggleVoice = async () => {
    if (isListening) {
      await handleVoiceDone();
    } else {
      if (permissionGranted === false || permissionGranted === null) {
        setIsMicModalOpen(true);
      } else {
        await startVoiceDictation();
      }
    }
  };

  // Mode A: Stop recording, populate transcribed text into input prompt for editing, no auto-send
  const handleVoiceDone = async () => {
    const finalSpeechPrompt = await stopListening();
    const cleanText = (finalSpeechPrompt || transcript || interimTranscript || "").trim();
    if (cleanText) {
      setInputPrompt((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
      showSuccess("Voice transcribed into prompt");
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 60);
  };

  // Mode B: Stop recording immediately and send prompt directly to AI
  const handleVoiceSubmit = async () => {
    const finalSpeechPrompt = await stopAndSubmit();
    const cleanText = (finalSpeechPrompt || transcript || interimTranscript || "").trim();
    const textToSend = (inputPrompt ? `${inputPrompt} ${cleanText}` : cleanText).trim();

    if (textToSend || attachedFiles.length > 0) {
      onSendMessage(textToSend, attachedFiles);
      setInputPrompt("");
      setAttachedFiles([]);
      showSuccess("Voice prompt submitted to Nexus Plex");
    } else {
      showError("No speech detected to send");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        showError(`File ${file.name} exceeds maximum 25MB limit.`);
        continue;
      }

      try {
        const analyzed = await analyzeFile(file);
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: analyzed.name,
            type: analyzed.type,
            dataUrl: analyzed.dataUrl || "",
            textContent: analyzed.textContent,
          },
        ]);
        showSuccess(`Attached ${file.name}`);
      } catch (err) {
        console.error("File analysis failed:", err);
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const result = uploadEvent.target?.result as string;
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              dataUrl: result,
            },
          ]);
        };
        reader.readAsDataURL(file);
      }
    }

    if (e.target) e.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const result = uploadEvent.target?.result as string;
            setAttachedFiles((prev) => [
              ...prev,
              {
                name: `Pasted_Image_${Date.now()}.png`,
                type: file.type,
                dataUrl: result,
              },
            ]);
            showSuccess("Pasted image attached");
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleSend = () => {
    if ((!inputPrompt.trim() && attachedFiles.length === 0) || isGenerating) return;

    onSendMessage(inputPrompt, attachedFiles);
    setInputPrompt("");
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pb-3 sm:pb-4 pt-1 z-20">
      <div className="relative flex flex-col gap-2">
        {/* Live Voice Floating Button Badge */}
        {onOpenLiveVoice && (
          <div className="flex items-center justify-end px-2">
            <button
              type="button"
              onClick={onOpenLiveVoice}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] text-white font-bold flex items-center gap-1.5 shrink-0 shadow-md text-xs hover:opacity-95 transition-all"
              title="Launch Nexus Live Real-Time Voice Mode"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Nexus Live Voice</span>
            </button>
          </div>
        )}

        {/* File Attachments Bar */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 overflow-x-auto p-2 rounded-2xl border bg-slate-900/60"
              style={{ borderColor: "var(--app-border)" }}
            >
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs max-w-xs shrink-0"
                  style={{
                    backgroundColor: "var(--app-card)",
                    borderColor: "var(--app-border)",
                    color: "var(--app-text)",
                  }}
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="w-6 h-6 object-cover rounded-lg"
                    />
                  ) : (
                    <FileText className="w-4 h-4 text-[#06B6D4]" />
                  )}
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-0.5 hover:text-rose-400 rounded transition-colors text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Iconic Prompt Floating Container */}
        <div
          className={`relative flex flex-col gap-2 border rounded-3xl p-3 shadow-2xl transition-all ${
            isListening ? "ring-2 ring-[#06B6D4] border-[#06B6D4]/80 shadow-cyan-500/20" : ""
          }`}
          style={{
            backgroundColor: "var(--app-panel)",
            borderColor: isListening ? "#06B6D4" : "var(--app-border)",
          }}
        >
          {/* Embedded Control Toolbar inside Prompt Box */}
          <div
            className="flex items-center justify-between gap-2 border-b pb-2 px-1 text-xs"
            style={{ borderColor: "var(--app-border)" }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {/* Embedded Model Selector */}
              <ModelSelector
                selectedModel={selectedModel}
                onSelectModel={onSelectModel}
                userEmail={user?.email}
              />

              {/* Execution Mode Switcher Pill */}
              <div className="flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-full border border-slate-800 text-[11px] shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleMode("standard")}
                  className={`px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold transition-all ${
                    executionMode === "standard"
                      ? "bg-[#06B6D4] text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Standard Mode: Central environment keys & public failover"
                >
                  <Zap className="w-3 h-3" />
                  <span className="hidden sm:inline">Standard</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode("byok")}
                  className={`px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold transition-all ${
                    executionMode === "byok"
                      ? "bg-[#8B5CF6] text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="BYOK Mode: Bring Your Own Key - strict user custom keys"
                >
                  <Key className="w-3 h-3" />
                  <span>BYOK</span>
                </button>
              </div>

              {/* Embedded User Sign-In / Account Badge Pill */}
              {currentUser ? (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all hover:bg-slate-800/60 shrink-0"
                  style={{ borderColor: "var(--app-border)", color: "var(--app-text)" }}
                  title="Google Account & Settings"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="font-semibold text-[11px] truncate max-w-[100px]">
                    {currentUser.name.split(" ")[0]}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 text-[#06B6D4] border border-[#06B6D4]/30 font-bold text-xs transition-all shrink-0 shadow-sm"
                  title="Sign In with Google"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Attachments & Capture Actions */}
            <div className="flex items-center gap-1">
              {/* File Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full transition-colors shrink-0 text-slate-400 hover:text-white hover:bg-slate-800/60"
                title="Attach images, documents or code files"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Camera Capture Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-1.5 rounded-full transition-colors shrink-0 text-cyan-400 hover:text-white hover:bg-cyan-950/60"
                title="Take photo with Camera"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />

          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* Prompt Input Row: Transforms to ChatGPT-style Minimalist Waveform when isListening */}
          <div className="relative flex items-center gap-2 px-1 min-h-[44px]">
            {isListening ? (
              /* Active Waveform Listening UI */
              <div className="flex-1 flex items-center justify-between gap-3 py-1.5 px-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-inner">
                {/* Left Live Indicator & Transcript Preview */}
                <div className="flex items-center gap-2 min-w-0 max-w-[45%] sm:max-w-[55%]">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#06B6D4]" />
                  </span>
                  <span className="text-xs text-slate-300 truncate select-none font-medium">
                    {interimTranscript || transcript || (
                      <span className="text-cyan-400 font-semibold animate-pulse">Listening...</span>
                    )}
                  </span>
                </div>

                {/* Center ChatGPT-style Minimalist Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1 h-7 px-2 shrink-0">
                  {frequencyBands.map((band, idx) => (
                    <motion.div
                      key={idx}
                      className="w-1 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full"
                      animate={{
                        height: `${Math.max(4, Math.min(26, band * 26 + (idx % 2 === 0 ? 4 : 2)))}px`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                    />
                  ))}
                </div>

                {/* Right-Hand Explicit Voice Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Button 1: Stop / Done Button (Square Icon - Paste & Edit, No Auto-Send) */}
                  <button
                    type="button"
                    onClick={handleVoiceDone}
                    className="h-9 w-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer group"
                    title="Done: Stop recording & paste text into box to edit"
                  >
                    <div className="w-3.5 h-3.5 rounded-sm bg-slate-300 group-hover:bg-white flex items-center justify-center transition-colors">
                      <Square className="w-2.5 h-2.5 fill-slate-900 text-slate-900" />
                    </div>
                  </button>

                  {/* Button 2: Direct Submit Button (Blue circle with Up Arrow - Instant Send) */}
                  <button
                    type="button"
                    onClick={handleVoiceSubmit}
                    className="h-9 w-9 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#2563EB] hover:from-[#0891B2] hover:to-[#1D4ED8] text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all shrink-0 cursor-pointer"
                    title="Direct Submit: Send voice prompt directly to AI"
                  >
                    <ArrowUp className="w-4 h-4 text-white stroke-[2.5]" />
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Prompt Textarea Row */
              <>
                <textarea
                  ref={textareaRef}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={
                    isTranscribing
                      ? "Transcribing voice..."
                      : placeholder ||
                        "Ask Nexus Plex anything, generate images, code, music, decks..."
                  }
                  rows={1}
                  disabled={isTranscribing}
                  className="flex-1 bg-transparent text-sm resize-none focus:outline-none max-h-32 py-2 px-1 scrollbar-none font-sans transition-opacity"
                  style={{
                    color: "var(--app-text)",
                  }}
                />

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  disabled={isTranscribing}
                  className={`p-2.5 rounded-full transition-all shrink-0 ${
                    isTranscribing
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 opacity-70 animate-pulse"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                  title="Voice dictation (Nexus Live)"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Send or Stop Generation Button */}
                {isGenerating ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                      }
                      onStopGeneration?.();
                    }}
                    className="bg-rose-600 hover:bg-rose-500 text-white rounded-full p-2 h-9 w-9 flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30 border border-rose-400/40 animate-pulse transition-all cursor-pointer"
                    title="Stop generation (Keep partial response)"
                  >
                    <Square className="w-4 h-4 fill-white shrink-0" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSend}
                    disabled={!inputPrompt.trim() && attachedFiles.length === 0}
                    className="disabled:opacity-30 text-white rounded-full p-2 h-9 w-9 flex items-center justify-center shrink-0 shadow-md transition-all bg-[#06B6D4] hover:bg-[#0891B2] cursor-pointer"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Smart Onboarding Microphone Permission Modal */}
      <MicPermissionModal
        isOpen={isMicModalOpen}
        onClose={() => setIsMicModalOpen(false)}
        onAllow={async () => {
          const stream = await requestMicAccess();
          if (stream) {
            await startVoiceDictation();
          }
        }}
        errorMessage={micError}
      />
    </div>
  );
};
