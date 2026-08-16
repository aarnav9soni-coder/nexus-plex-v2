import React, { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Send, Mic, Paperclip, X, User, Zap, Key, Square, ArrowUp, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/utils/toast";
import { ProcessedFile, processFile } from "@/utils/fileHandler";
import { detectIntent, getIntentLabel, getIntentIcon, IntentType } from "@/utils/intentDetection";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { MicPermissionModal } from "@/components/MicPermissionModal";
import { ModelSelector } from "@/components/ModelSelector";
import { CameraCaptureModal } from "@/components/CameraCaptureModal";
import {
  getExecutionMode,
  setExecutionMode,
  hasValidKeyForModel,
  ExecutionMode,
} from "@/utils/executionStore";
import { getStoredUser, UserProfile } from "@/utils/userStore";

type ChatInputProps = {
  onSend?: (prompt: string, files: ProcessedFile[], intent?: IntentType) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  streamingContent?: string;
  detectedIntent?: IntentType | null;
  onIntentChange?: (intent: IntentType | null) => void;
  onEnhancePrompt?: () => void;
  attachments?: ProcessedFile[];
  onRemoveAttachment?: (index: number) => void;
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  user?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenSettings?: () => void;
};

export function ChatInput({
  onSend,
  isGenerating,
  onStopGeneration,
  streamingContent,
  detectedIntent,
  onIntentChange,
  onEnhancePrompt,
  attachments,
  onRemoveAttachment,
  selectedModel = "gemini-3.7-flash",
  onSelectModel,
  user: initialUser,
  onOpenAuth,
  onOpenSettings,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isEnhancing] = useState(false);
  const [executionMode, setExecModeState] = useState<ExecutionMode>(getExecutionMode);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialUser || getStoredUser());

  useEffect(() => {
    const handleModeChange = (e: any) => {
      if (e.detail?.mode) {
        setExecModeState(e.detail.mode);
      }
    };
    const handleUserChange = (e: any) => {
      if (e.detail?.user !== undefined) {
        setCurrentUser(e.detail.user);
      }
    };
    window.addEventListener("nexus-execution-mode-change" as any, handleModeChange);
    window.addEventListener("nexus-user-auth-change" as any, handleUserChange);
    return () => {
      window.removeEventListener("nexus-execution-mode-change" as any, handleModeChange);
      window.removeEventListener("nexus-user-auth-change" as any, handleUserChange);
    };
  }, []);

  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

  const handleToggleMode = (mode: ExecutionMode) => {
    if (mode === "byok") {
      const hasKey = hasValidKeyForModel("gemini-3.7-flash");
      if (!hasKey) {
        showError("Please add a valid API key in Settings to use BYOK Mode.");
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
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

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

  const startVoiceDictation = useCallback(async () => {
    const success = await startListening({
      continuous: true,
      interimResults: true,
      userEmail: currentUser?.email,
      lang: "en-US",
    });
    if (success) {
      setIsMicModalOpen(false);
    }
  }, [currentUser?.email, startListening]);

  const toggleVoice = useCallback(async () => {
    if (isListening) {
      await handleVoiceDone();
    } else {
      if (permissionGranted === false || permissionGranted === null) {
        setIsMicModalOpen(true);
      } else {
        await startVoiceDictation();
      }
    }
  }, [isListening, permissionGranted, startVoiceDictation]);

  // Mode A: Stop recording, populate transcribed text into input prompt for editing, no auto-send
  const handleVoiceDone = useCallback(async () => {
    const finalSpeechPrompt = await stopListening();
    const cleanText = (finalSpeechPrompt || transcript || interimTranscript || "").trim();
    if (cleanText) {
      setInputMessage((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
      showSuccess("Voice transcribed into prompt");
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }, 60);
  }, [stopListening, transcript, interimTranscript]);

  // Mode B: Stop recording immediately and send prompt directly to AI
  const handleVoiceSubmit = useCallback(async () => {
    const finalSpeechPrompt = await stopAndSubmit();
    const cleanText = (finalSpeechPrompt || transcript || interimTranscript || "").trim();
    const safeAttachments = Array.isArray(attachments) ? attachments : [];
    const promptToSend = (inputMessage ? `${inputMessage} ${cleanText}` : cleanText).trim();

    if (promptToSend || safeAttachments.length > 0) {
      const intent = detectIntent(promptToSend).type;
      if (onIntentChange) onIntentChange(intent);
      if (onSend) onSend(promptToSend, safeAttachments, intent);
      setInputMessage("");
      showSuccess("Voice prompt submitted");
    } else {
      showError("No speech detected to send");
    }
  }, [stopAndSubmit, transcript, interimTranscript, attachments, inputMessage, onIntentChange, onSend]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const safeAttachments = Array.isArray(attachments) ? attachments : [];
    const prompt = inputMessage.trim();
    if (!prompt && safeAttachments.length === 0) return;
    const intent = detectIntent(prompt).type;
    if (onIntentChange) onIntentChange(intent);
    if (onSend) onSend(prompt, safeAttachments, intent);
    setInputMessage("");
  }, [inputMessage, attachments, onSend, onIntentChange]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processFile(file);
      window.dispatchEvent(new CustomEvent("nexus-file-attached", { detail: processed }));
    } catch (error) {
      showError("Failed to process file");
    }
    e.target.value = "";
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  // Auto-detect intent as user types
  useEffect(() => {
    if (inputMessage.trim()) {
      const intent = detectIntent(inputMessage).type;
      if (onIntentChange) onIntentChange(intent);
    } else {
      if (onIntentChange) onIntentChange(null);
    }
  }, [inputMessage, onIntentChange]);

  return (
    <div className="relative flex flex-col gap-2">
      {/* Prompt Bar Toolbar Header */}
      <div className="flex items-center justify-between px-1 py-0.5 text-xs">
        <div className="flex items-center gap-2">
          {onSelectModel && (
            <ModelSelector
              selectedModel={selectedModel}
              onSelectModel={onSelectModel}
            />
          )}

          {/* Execution Mode Toggle */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-full border border-slate-800/80 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => handleToggleMode("standard")}
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                executionMode === "standard"
                  ? "bg-indigo-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Standard Mode: Uses platform defaults"
            >
              <Zap className="w-3 h-3" />
              <span>Standard</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("byok")}
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                executionMode === "byok"
                  ? "bg-violet-600 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="BYOK Mode: Bring Your Own Key"
            >
              <Key className="w-3 h-3" />
              <span>BYOK</span>
            </button>
          </div>
        </div>

        {/* Embedded User Sign-In / Account Badge Pill */}
        {currentUser ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium text-slate-200 transition-all hover:bg-slate-800 shrink-0"
            title="Account & Settings"
          >
            <img src={currentUser.avatar} alt={currentUser.name} className="w-4 h-4 rounded-full object-cover" />
            <span className="font-semibold text-[11px] truncate max-w-[110px]">{currentUser.name.split(" ")[0]}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 font-bold text-xs transition-all shrink-0 shadow-sm"
            title="Continue with Google"
          >
            <User className="w-3.5 h-3.5" />
            <span>Continue with Google</span>
          </button>
        )}
      </div>

      {/* Attachments Preview */}
      {Array.isArray(attachments) && attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-slate-900/50 border border-slate-800/50 rounded-xl animate-slide-in">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-slate-400">📎</span>
              <span className="text-xs font-medium text-slate-200 truncate max-w-[150px]">{file.name}</span>
              <Button size="icon" variant="ghost" className="h-5 w-5 text-slate-400 hover:text-rose-400" onClick={() => onRemoveAttachment && onRemoveAttachment(index)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Intent Badge */}
      {detectedIntent && detectedIntent !== "chat" && (
        <div className="absolute left-3 top-2 z-10 animate-slide-in">
          <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px] px-2 py-1 rounded-lg font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
            {React.createElement(getIntentIcon(detectedIntent), { className: "w-3 h-3" })}
            {getIntentLabel(detectedIntent)}
          </Badge>
        </div>
      )}

      {/* Main Input Container */}
      <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
        <div className="flex-1 relative flex items-center min-h-[56px]">
          {isListening ? (
            /* ChatGPT-style Minimalist Waveform Listening UI */
            <div className="w-full min-h-[56px] rounded-2xl border border-cyan-500/50 bg-slate-900/95 p-3 flex items-center justify-between gap-3 shadow-lg shadow-cyan-950/40">
              {/* Left Live Indicator & Transcript Preview */}
              <div className="flex items-center gap-2.5 min-w-0 max-w-[45%] sm:max-w-[60%]">
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

              {/* Center Waveform Visualizer */}
              <div className="flex items-center justify-center gap-1 h-7 px-2 shrink-0">
                {frequencyBands.map((band, idx) => (
                  <motion.div
                    key={idx}
                    className="w-1 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full"
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
            /* Standard Prompt Textarea */
            <div className="w-full relative flex items-end">
              <textarea
                ref={textareaRef}
                placeholder="Ask Nexus Plex or type a prompt..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[56px] max-h-48 rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 text-xs sm:text-sm p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all pl-20 pr-12"
                disabled={isGenerating || isTranscribing}
              />
              
              {/* Tools inside textarea */}
              <div className="absolute left-2 bottom-2 flex items-center gap-1">
                {/* Direct Paperclip Attachment Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload File or Photo"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                {/* Direct Camera Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-cyan-400 hover:text-white hover:bg-cyan-950/60 rounded-xl shrink-0"
                  onClick={() => {
                    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
                      nativeCameraInputRef.current?.click();
                    } else {
                      setIsCameraModalOpen(true);
                    }
                  }}
                  title="Take Photo with Camera"
                >
                  <Camera className="w-4 h-4" />
                </Button>

                {/* Hidden Input for Standard File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,image/gif,.txt,.md,.js,.ts,.tsx,.py,.json,.csv,.html,.css,.xml,.yaml,.yml,.pdf,.mp3,.wav,.mp4"
                  multiple
                />

                {/* Hidden Input for Native Mobile Camera Direct Capture */}
                <input
                  ref={nativeCameraInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                />
              </div>

              {/* Voice button */}
              <div className="absolute right-2 bottom-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl transition-colors text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={toggleVoice}
                  disabled={isGenerating || isTranscribing}
                  title="Voice dictation (Nexus Live)"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {!isListening && (
          isGenerating ? (
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onStopGeneration?.();
              }}
              className="h-14 px-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-rose-600/30 border border-rose-400/40 animate-pulse transition-all cursor-pointer"
              title="Stop generation (Keep partial response)"
            >
              <Square className="w-4 h-4 fill-white shrink-0" />
              <span className="hidden sm:inline font-mono uppercase text-[11px] tracking-wider">Stop</span>
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={(!inputMessage.trim() && (!Array.isArray(attachments) || attachments.length === 0))}
              className="h-14 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/25 disabled:opacity-40 cursor-pointer"
            >
              {streamingContent ? (
                <>
                  <span className="w-4 h-4">▌</span>
                  <span className="hidden sm:inline">Streaming...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </Button>
          )
        )}
      </form>

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

      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={(photoFile) => {
          window.dispatchEvent(new CustomEvent("nexus-file-attached", { detail: photoFile }));
        }}
      />
    </div>
  );
}
