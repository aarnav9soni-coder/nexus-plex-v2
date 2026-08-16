import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Bot,
  User,
  Image as ImageIcon,
  FileText,
  Loader2,
  Zap,
  Brain,
  Code2,
  Wand2,
  Music,
  Video,
  Layout,
  Eye,
  Globe,
  Cpu,
  Copy,
  Check,
  RotateCcw,
  Pencil,
  Trash2,
  Volume2,
  VolumeX,
  ArrowDown,
} from "lucide-react";
import { CodeBlock } from "./CodeBlock";
import { ChatMessageData } from "@/utils/GeminiClient";
import { SlideDeckViewer } from "./SlideDeckViewer";
import { VideoPlayerCard, AudioPlayerCard, ImageArtCard } from "./MediaGenerators";
import { sanitizeResponseText } from "@/utils/textSanitizer";
import { ChatHeader } from "./ChatHeader";
import { showSuccess, showError } from "@/utils/toast";

export function GenerationIndicatorBadge({
  commandType,
  text,
}: {
  commandType?: string;
  text?: string;
}) {
  let badgeText = "✨ Thinking & Streaming Response...";
  let bgClass = "bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/40";
  let IconComponent = Sparkles;

  const lowerText = (text || "").toLowerCase();

  if (
    commandType === "image" ||
    lowerText.includes("/vision") ||
    lowerText.includes("/art") ||
    lowerText.includes("image") ||
    lowerText.includes("artwork")
  ) {
    badgeText = "[ 🎨 Generating Image... ]";
    bgClass = "bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/40";
    IconComponent = ImageIcon;
  } else if (
    commandType === "vision" ||
    lowerText.includes("vision data") ||
    lowerText.includes("analyzing vision")
  ) {
    badgeText = "[ 👁️ Analyzing Vision Data... ]";
    bgClass = "bg-amber-500/15 text-amber-400 border-amber-500/40";
    IconComponent = Eye;
  } else if (
    commandType === "audio" ||
    commandType === "music" ||
    lowerText.includes("/music") ||
    lowerText.includes("/audio") ||
    lowerText.includes("synthesizing web audio")
  ) {
    badgeText = "[ 🎵 Synthesizing Audio Tracks... ]";
    bgClass = "bg-violet-500/15 text-violet-400 border-violet-500/40";
    IconComponent = Music;
  } else if (
    commandType === "video" ||
    lowerText.includes("/video") ||
    lowerText.includes("rendering html5 canvas")
  ) {
    badgeText = "[ 🎥 Rendering Motion Video Stream... ]";
    bgClass = "bg-rose-500/15 text-rose-400 border-rose-500/40";
    IconComponent = Video;
  } else if (
    commandType === "presentation" ||
    commandType === "ppt" ||
    lowerText.includes("/ppt") ||
    lowerText.includes("/slide") ||
    lowerText.includes("presentation deck")
  ) {
    badgeText = "[ 📊 Rendering Slide Deck... ]";
    bgClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/40";
    IconComponent = Layout;
  } else if (
    commandType === "open-source-failover" ||
    lowerText.includes("failover") ||
    lowerText.includes("open-source failover") ||
    lowerText.includes("computing open-source")
  ) {
    badgeText = "[ 🧠 Computing Open-Source Failover... ]";
    bgClass = "bg-purple-500/20 text-purple-300 border-purple-500/50";
    IconComponent = Cpu;
  } else if (
    commandType === "reasoning" ||
    lowerText.includes("/reason") ||
    lowerText.includes("chain-of-thought")
  ) {
    badgeText = "🧠 Computing Chain-of-Thought Analysis...";
    bgClass = "bg-amber-500/15 text-amber-300 border-amber-500/40";
    IconComponent = Brain;
  } else if (
    commandType === "code" ||
    lowerText.includes("/code") ||
    lowerText.includes("/app") ||
    lowerText.includes("compiling sandbox")
  ) {
    badgeText = "⚡ Compiling Sandbox Script...";
    bgClass = "bg-cyan-500/15 text-cyan-400 border-cyan-500/40";
    IconComponent = Code2;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${bgClass} animate-pulse shadow-md mb-2.5`}
    >
      <IconComponent className="w-3.5 h-3.5 animate-spin shrink-0" />
      <span>{badgeText}</span>
    </motion.div>
  );
}

export function GenerationSkeletonCard({ commandType }: { commandType?: string }) {
  if (
    commandType === "image" ||
    commandType === "vision" ||
    commandType === "video" ||
    commandType === "presentation"
  ) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="w-full my-3 p-6 rounded-2xl bg-[#090D16] border border-[#06B6D4]/30 animate-pulse flex flex-col items-center justify-center gap-3 min-h-[180px] shadow-2xl relative overflow-hidden"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#111827] flex items-center justify-center text-[#06B6D4] border border-[#06B6D4]/30">
          <Loader2 className="w-6 h-6 animate-spin text-[#06B6D4]" />
        </div>
        <div className="w-48 h-3 rounded-full bg-[#1F2937]" />
        <div className="w-32 h-2 rounded-full bg-[#1F2937]/70" />
      </motion.div>
    );
  }

  if (commandType === "audio" || commandType === "music") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="w-full my-3 p-5 rounded-2xl bg-[#090D16] border border-violet-500/30 animate-pulse flex flex-col justify-between gap-4 min-h-[120px] shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="w-36 h-3 rounded-full bg-[#1F2937]" />
          <div className="w-20 h-3 rounded-full bg-violet-500/20" />
        </div>
        <div className="flex items-center gap-1.5 h-10 justify-center">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => (
            <div
              key={i}
              className="w-1.5 bg-violet-400/50 rounded-full animate-bounce"
              style={{ height: `${(i % 5 + 1) * 6 + 8}px`, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full space-y-2.5 my-3"
    >
      <div className="w-3/4 h-3 rounded-full bg-[#1E2638] animate-pulse" />
      <div className="w-full h-3 rounded-full bg-[#1E2638] animate-pulse" />
      <div className="w-5/6 h-3 rounded-full bg-[#1E2638] animate-pulse" />
    </motion.div>
  );
}

const getModelBadgeLabel = (modelId?: string): string => {
  if (!modelId) return "Gemini 3.7 Flash";
  const id = modelId.toLowerCase();
  if (id.includes("3.1-pro")) return "Gemini 3.1 Pro";
  if (id.includes("3.1-flash-lite")) return "Gemini 3.1 Flash Lite";
  if (id.includes("gemini") || id.includes("3.7")) return "Gemini 3.7 Flash";
  if (id.includes("gpt-4o-mini")) return "GPT-4o Mini";
  if (id.includes("gpt-4o") || id.includes("openai")) return "GPT-4o";
  if (id.includes("claude-3-haiku")) return "Claude 3 Haiku";
  if (id.includes("claude") || id.includes("sonnet")) return "Claude 3.5 Sonnet";
  if (id.includes("deepseek-chat") || id.includes("v3")) return "DeepSeek V3";
  if (id.includes("deepseek") || id.includes("r1")) return "DeepSeek R1";
  if (id.includes("llama")) return "Llama 3.3 70B";
  if (id.includes("grok-beta")) return "Grok Beta";
  if (id.includes("grok")) return "Grok 2";
  return modelId.includes("/") ? modelId.split("/")[1] : modelId;
};

interface ChatAreaProps {
  messages: ChatMessageData[];
  isGenerating: boolean;
  onSendPreset?: (prompt: string) => void;
  onSelectModel?: (modelId: string) => void;
  brandName?: string;
  sessionTitle?: string;
  selectedModel?: string;
  userEmail?: string;
  userName?: string;
  onClearChat?: () => void;
  onRegenerateMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isGenerating,
  onSendPreset,
  onSelectModel,
  brandName = "Nexus Plex",
  sessionTitle = "Active Agent Workspace",
  selectedModel = "gemini-3.7-flash",
  userEmail,
  userName = "Aarnav",
  onClearChat,
  onRegenerateMessage,
  onDeleteMessage,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const derivedFirstName = (userName || "Aarnav").split(" ")[0] || "Aarnav";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showSuccess("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeak = (id: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      showError("Speech synthesis is not supported in this browser.");
      return;
    }
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sanitizeResponseText(text));
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  const handleEditPrompt = (text: string) => {
    window.dispatchEvent(new CustomEvent("nexus-populate-prompt", { detail: { text } }));
    showSuccess("Prompt populated into editor");
  };

  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessagesLengthRef = useRef(messages.length);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    // Detect if user has manually scrolled up (more than 90px from bottom)
    const isScrolledUp = distanceToBottom > 90;
    setIsUserScrolledUp(isScrolledUp);
    setShowScrollButton(isScrolledUp);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
      setIsUserScrolledUp(false);
      setShowScrollButton(false);
    }
  };

  // Auto-scroll on new message or stream chunk (pinned to bottom unless user scrolled up)
  useEffect(() => {
    if (!scrollRef.current) return;

    if (messages.length > prevMessagesLengthRef.current) {
      // New user message or AI response initiated: reset scroll lock & scroll to bottom
      setIsUserScrolledUp(false);
      setShowScrollButton(false);
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } else if (isGenerating && !isUserScrolledUp) {
      // Real-time stream generation: pin to bottom as new text streams in
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, isGenerating, isUserScrolledUp]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      {/* Subtle Top-Center Ambient Glow Aura */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl -z-10 rounded-full" />

      {/* Top Workspace Action Header with Export Dropdown */}
      <ChatHeader
        sessionTitle={sessionTitle}
        messages={messages}
        selectedModel={selectedModel}
        userEmail={userEmail}
        onClearChat={onClearChat}
      />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 md:px-8 pt-4 pb-36 space-y-6 scrollbar-thin transition-colors"
        style={{ backgroundColor: "var(--app-bg)", color: "var(--app-text)" }}
      >
        {/* Gemini-Style Centered Minimalist Welcome Screen */}
        <AnimatePresence mode="wait">
          {messages.length === 0 && (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="max-w-3xl mx-auto my-10 md:my-16 text-center space-y-8"
            >
              {/* Centered Gemini Hero Greeting */}
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20 mb-2">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                    Hello, {derivedFirstName}
                  </span>
                </h1>
                <p className="text-xl md:text-2xl font-medium text-neutral-400 max-w-xl mx-auto leading-relaxed">
                  Where would you like to start today?
                </p>
              </div>

              {/* Translucent Glass Suggestion Cards Grid */}
              {onSendPreset && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onSendPreset("/ppt Create a modern pitch deck presentation for AI workspace architecture")}
                    className="p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 hover:border-indigo-500/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1.5 text-indigo-400 group-hover:text-indigo-300">
                      <Layout className="w-4 h-4 shrink-0" />
                      <span>Create Presentation</span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      Build an interactive slide deck presentation with full visual controls.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onSendPreset("Write a full React component with Tailwind CSS for a sleek real-time analytics dashboard")}
                    className="p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 hover:border-cyan-500/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-cyan-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1.5 text-cyan-400 group-hover:text-cyan-300">
                      <Code2 className="w-4 h-4 shrink-0" />
                      <span>Analyze Code</span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      Write, review, or debug web application code with live syntax formatting.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onSendPreset("/reason Brainstorm 5 innovative features for an AI agent platform with streaming SSE")}
                    className="p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 hover:border-purple-500/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-purple-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1.5 text-purple-400 group-hover:text-purple-300">
                      <Brain className="w-4 h-4 shrink-0" />
                      <span>Brainstorm Ideas</span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      Execute deep chain-of-thought analysis and system architecture design.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onSendPreset("/vision Create a futuristic cyberpunk neon cityscape with volumetric fog and cyan highlights")}
                    className="p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 hover:border-emerald-500/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1.5 text-emerald-400 group-hover:text-emerald-300">
                      <Wand2 className="w-4 h-4 shrink-0" />
                      <span>Generate Artwork</span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      Synthesize visual graphics, digital illustrations, and artwork.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onSendPreset("Draft a comprehensive executive summary for a high-speed agentic software release")}
                    className="p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 hover:border-amber-500/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1.5 text-amber-400 group-hover:text-amber-300">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>Executive Brief</span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      Compose polished technical documents, specifications, and reports.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onSendPreset("/music Synthwave ambient beat for deep focus coding session")}
                    className="p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 hover:border-rose-500/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-rose-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1.5 text-rose-400 group-hover:text-rose-300">
                      <Music className="w-4 h-4 shrink-0" />
                      <span>Compose Audio</span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      Synthesize custom soundscapes, audio tracks, and synth tunes.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onSendPreset("Inspect and summarize key technology headlines from https://news.ycombinator.com")}
                    className="p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 hover:border-teal-500/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-teal-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1.5 text-teal-400 group-hover:text-teal-300">
                      <Globe className="w-4 h-4 shrink-0" />
                      <span>URL Inspector</span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      Extract and analyze live webpage DOM content, articles, and APIs.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => onSendPreset("/video Cyberpunk neon flying cars traversing through rainy futuristic skyscrapers")}
                    className="p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 hover:border-pink-500/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-pink-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2 font-bold text-xs mb-1.5 text-pink-400 group-hover:text-pink-300">
                      <Video className="w-4 h-4 shrink-0" />
                      <span>Motion Video</span>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      Generate cinematic AI motion clips with custom aspect ratio and duration.
                    </p>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Stream Container (Max-Width Constrained like Gemini) */}
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";
              const isCurrentlyGenerating = !isUser && (msg.isStreaming || (isGenerating && index === messages.length - 1));
              const hasNoContentYet = !msg.text.trim() && !msg.generatedImage && !msg.generatedVideo && !msg.generatedAudio && !msg.generatedSlideDeck;

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`flex items-start gap-3.5 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs shadow-md ${
                      isUser
                        ? "bg-[#1E2638] text-[#E2E8F0] border border-[#1E2638]"
                        : "bg-gradient-to-tr from-[#06B6D4] to-[#8B5CF6] text-white shadow-[#06B6D4]/20"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Content Bubble */}
                  <div
                    className={`flex flex-col max-w-[85%] rounded-2xl p-4 shadow-sm border text-sm leading-relaxed ${
                      isUser
                        ? "bg-[#1E2638] text-white border-[#1E2638] rounded-tr-none"
                        : "bg-transparent text-[#E2E8F0] border-transparent p-0 shadow-none"
                    } ${isCurrentlyGenerating ? "border-[#06B6D4]/40" : ""}`}
                  >
                    {/* Sender Header */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5 gap-2">
                      <div className="flex items-center gap-2">
                        <span className={isUser ? "text-[#06B6D4]" : "text-[#8B5CF6]"}>
                          {isUser ? "You" : brandName}
                        </span>
                        {!isUser && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#131A2A] border border-[#1E2638] text-slate-300">
                            {getModelBadgeLabel(msg.modelUsed || selectedModel)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] opacity-70 shrink-0">{msg.timestamp}</span>
                    </div>

                    {/* Real-time active generation indicator badge */}
                    {isCurrentlyGenerating && (
                      <GenerationIndicatorBadge commandType={msg.commandType} text={msg.text} />
                    )}

                    {/* Skeletons while compiling or empty */}
                    {isCurrentlyGenerating && hasNoContentYet && (
                      <GenerationSkeletonCard commandType={msg.commandType} />
                    )}

                    {/* File Attachment Previews */}
                    {msg.files && msg.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {msg.files.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-[#080B11] border border-[#1E2638] max-w-xs"
                          >
                            {file.type.startsWith("image/") ? (
                              <img
                                src={file.dataUrl}
                                alt={file.name}
                                className="w-12 h-12 object-cover rounded-lg border border-[#1E2638]"
                              />
                            ) : (
                              <FileText className="w-8 h-8 text-[#06B6D4] shrink-0" />
                            )}
                            <span className="text-xs text-white truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Markdown / Text Body or Universal Error Action Card */}
                    {(() => {
                      const trimmed = msg.text.trim();
                      if (!trimmed) return null;

                      const isRawError =
                        msg.isError ||
                        trimmed.startsWith("⚠️") ||
                        trimmed.startsWith('{ "error"') ||
                        trimmed.startsWith('{"error"') ||
                        trimmed.startsWith("Error: {") ||
                        trimmed.includes('"error":') ||
                        trimmed.includes("API key missing") ||
                        trimmed.includes("NOT_FOUND") ||
                        trimmed.includes("404") ||
                        trimmed.includes("503") ||
                        trimmed.includes("429") ||
                        trimmed.includes("RESOURCE_EXHAUSTED") ||
                        trimmed.includes("UNAVAILABLE");

                      if (isRawError) {
                        let statusTitle = "⚠️ AI Request Stream Interrupted";
                        let explanation = "The selected model endpoint encountered a temporary connection, key, or network issue.";

                        if (trimmed.includes("API key missing") || trimmed.includes("invalid")) {
                          statusTitle = "🔑 API Key Missing or Invalid";
                          explanation = "Please check your API key configuration in Settings or switch to a free model.";
                        } else if (trimmed.includes("404") || trimmed.includes("NOT_FOUND") || trimmed.includes("no longer available")) {
                          statusTitle = "⚠️ Model Endpoint Deprecated (404)";
                          explanation = "The requested model endpoint is unavailable. Please select Gemini 1.5 Flash or Pro.";
                        } else if (trimmed.includes("429") || trimmed.includes("RESOURCE_EXHAUSTED")) {
                          statusTitle = "⚡ Rate Limit Exceeded (429)";
                          explanation = "The model endpoint reached capacity. Switch to Gemini 1.5 Flash or Free Open Source.";
                        } else if (trimmed.includes("503") || trimmed.includes("UNAVAILABLE")) {
                          statusTitle = "⚡ Server Busy / Service Unavailable (503)";
                          explanation = "The upstream AI service is temporarily overloaded. Retry or switch models.";
                        }

                        try {
                          const cleanJson = trimmed.replace(/^Error:\s*/, "");
                          const parsed = JSON.parse(cleanJson);
                          if (parsed.error?.message) {
                            explanation = parsed.error.message;
                          } else if (typeof parsed.error === "string") {
                            explanation = parsed.error;
                          }
                        } catch {
                          if (trimmed.startsWith("⚠️")) {
                            explanation = trimmed.replace(/^⚠️\s*(Error:)?\s*/, "");
                          }
                        }

                        return (
                          <div className="p-4 my-2 rounded-2xl bg-[#16121D] border border-rose-500/40 text-rose-200 text-xs space-y-3 shadow-2xl">
                            <div className="flex items-center gap-2 font-extrabold text-rose-400 text-sm">
                              <Zap className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                              <span>{statusTitle}</span>
                            </div>
                            <p className="leading-relaxed opacity-90 text-xs text-rose-200/90">{explanation}</p>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {onRegenerateMessage && (
                                <button
                                  type="button"
                                  onClick={() => onRegenerateMessage(msg.id)}
                                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs border border-indigo-400/40 transition-all flex items-center gap-1.5 shadow-md hover:shadow-indigo-500/20"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-indigo-100" /> Retry Request
                                </button>
                              )}

                              {onSelectModel && onSendPreset && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectModel("gemini-3.7-flash");
                                    onSendPreset("Please retry with Gemini 3.7 Flash.");
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 font-bold text-xs border border-rose-500/40 transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <Zap className="w-3.5 h-3.5 text-rose-300" /> Retry with Gemini 3.7 Flash
                                </button>
                              )}

                              {onSelectModel && onSendPreset && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectModel("llama-3.3-free");
                                    onSendPreset("Please process request using the 100% Free Open Source model.");
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 text-[#06B6D4] font-bold text-xs border border-[#06B6D4]/40 transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <Globe className="w-3.5 h-3.5 text-[#06B6D4]" /> Switch to Free Open Source
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="markdown-body prose prose-invert max-w-none text-sm text-[#E2E8F0] leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ inline, className, children, ...props }: { inline?: boolean; className?: string; children?: React.ReactNode }) {
                                const match = /language-(\w+)/.exec(className || "");
                                const codeString = String(children || "").replace(/\n$/, "");
                                if (!inline && match) {
                                  return <CodeBlock language={match[1]} code={codeString} />;
                                }

                                const isClickablePrompt =
                                  codeString.startsWith('"') &&
                                  codeString.endsWith('"') &&
                                  codeString.length > 8 &&
                                  onSendPreset;

                                if (isClickablePrompt) {
                                  const cleanPrompt = codeString.slice(1, -1);
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => onSendPreset(cleanPrompt)}
                                      className="inline-flex items-center gap-1.5 my-1 px-2.5 py-1 rounded-lg bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#06B6D4] text-xs font-mono border border-[#06B6D4]/30 transition-all hover:scale-[1.02] cursor-pointer shadow-sm text-left group"
                                      title="Click to run this prompt immediately in Nexus Plex"
                                    >
                                      <span>{codeString}</span>
                                      <Zap className="w-3 h-3 text-[#06B6D4] opacity-70 group-hover:opacity-100 shrink-0" />
                                    </button>
                                  );
                                }

                                return (
                                  <code
                                    className="bg-[#080B11] text-[#06B6D4] px-1.5 py-0.5 rounded text-xs font-mono border border-[#1E2638]"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {sanitizeResponseText(msg.text)}
                          </ReactMarkdown>
                        </div>
                      );
                    })()}

                    {/* Generated Slide Deck Presentation */}
                    {msg.generatedSlideDeck && (
                      <SlideDeckViewer
                        title={msg.generatedSlideDeck.title}
                        description={msg.generatedSlideDeck.description}
                        slides={msg.generatedSlideDeck.slides}
                      />
                    )}

                    {/* Generated Video Player */}
                    {msg.generatedVideo && (
                      <VideoPlayerCard
                        prompt={msg.generatedVideo.prompt}
                        videoUrl={msg.generatedVideo.videoUrl}
                        animatedUrl={msg.generatedVideo.animatedUrl}
                        seed={msg.generatedVideo.seed}
                        aspectRatio={msg.generatedVideo.aspectRatio}
                        durationSeconds={msg.generatedVideo.durationSeconds}
                        motion={msg.generatedVideo.motion}
                        fps={msg.generatedVideo.fps}
                        model={msg.generatedVideo.model}
                        status={msg.generatedVideo.status}
                        progress={msg.generatedVideo.progress}
                        stage={msg.generatedVideo.stage}
                      />
                    )}

                    {/* Generated Audio Synth Track */}
                    {msg.generatedAudio && (
                      <AudioPlayerCard
                        prompt={msg.generatedAudio.prompt}
                        genre={msg.generatedAudio.genre}
                        bpm={msg.generatedAudio.bpm}
                      />
                    )}

                    {/* Generated Image Art Card */}
                    {msg.generatedImage && (
                      <ImageArtCard
                        prompt={msg.generatedImage.prompt}
                        imageUrl={msg.generatedImage.url}
                        model={msg.generatedImage.model}
                      />
                    )}

                    {/* Message Action Toolbar */}
                    <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        {msg.commandType && (
                          <span className="px-2 py-0.5 rounded-full bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30 text-[10px] font-mono">
                            {msg.commandType}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Speak / TTS Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleSpeak(msg.id, msg.text)}
                          className="p-1.5 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors flex items-center gap-1"
                          title={speakingId === msg.id ? "Stop reading" : "Read aloud"}
                        >
                          {speakingId === msg.id ? (
                            <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="p-1.5 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors flex items-center gap-1"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {copiedId === msg.id && <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>}
                        </button>

                        {/* Edit Prompt Button (User messages) */}
                        {isUser && (
                          <button
                            type="button"
                            onClick={() => handleEditPrompt(msg.text)}
                            className="p-1.5 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors flex items-center gap-1"
                            title="Edit prompt in input editor"
                          >
                            <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                        )}

                        {/* Regenerate / Retry Button (AI responses or latest user query) */}
                        {onRegenerateMessage && (!isUser || index === messages.length - 1) && (
                          <button
                            type="button"
                            onClick={() => onRegenerateMessage(msg.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-800/80 hover:text-white transition-colors flex items-center gap-1 text-purple-400 hover:text-purple-300"
                            title="Regenerate AI response for this prompt"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete Message Button */}
                        {onDeleteMessage && (
                          <button
                            type="button"
                            onClick={() => onDeleteMessage(msg.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-800/80 hover:text-rose-400 transition-colors"
                            title="Delete message from thread"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400/80" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Streaming / Generation Status Indicator */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 text-xs text-[#06B6D4] p-3 rounded-2xl bg-[#111622] border border-[#06B6D4]/30 w-fit animate-pulse shadow-lg"
              >
                <Loader2 className="w-4 h-4 animate-spin text-[#06B6D4]" />
                <span className="font-bold tracking-wide">
                  Generating real-time response...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-28 right-6 md:right-10 z-30 px-3.5 py-2 rounded-full bg-[#111622]/90 backdrop-blur-md border border-[#06B6D4]/50 text-[#06B6D4] hover:text-white hover:bg-[#06B6D4]/20 shadow-xl shadow-cyan-950/60 font-bold text-xs flex items-center gap-2 transition-all group cursor-pointer"
            title="Scroll to bottom of conversation"
          >
            <ArrowDown className="w-4 h-4 text-[#06B6D4] group-hover:translate-y-0.5 transition-transform" />
            <span>Scroll to bottom</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
