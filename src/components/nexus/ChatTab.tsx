import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Image as ImageIcon,
  Mic,
  Zap,
  ShieldCheck,
  Menu,
  Moon,
  Sun,
  Gamepad2,
  Bookmark,
  Command,
  Sparkles,
  Brain,
  Music,
  Code,
  BookOpen,
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Send,
  RefreshCw,
  RotateCcw,
  Trash2,
  Plus,
  MessageSquare,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { showSuccess, showError } from "@/utils/toast";
import { AudioWorkspaceCard } from "@/components/nexus/AudioWorkspaceCard";
import { VisionTab } from "@/components/nexus/VisionTab";
import { StudioTab } from "@/components/nexus/StudioTab";
import { TalkTab } from "@/components/nexus/TalkTab";
import { CommandPalette } from "@/components/nexus/CommandPalette";
import { PromptLibraryModal } from "@/components/nexus/PromptLibraryModal";
import { SystemDiagnosticsBar } from "@/components/nexus/SystemDiagnosticsBar";
import { DiagnosticsState, EngineMode } from "@/types/nexus";
import { checkOllamaHealth } from "@/utils/ollamaApi";
import { checkWebGpuSupport, checkWebLlmAvailable, DEFAULT_WEBGPU_MODEL } from "@/utils/webLlmEngine";
import { InitProgressReport } from "@mlc-ai/web-llm";
import { ActionPills } from "@/components/nexus/ActionPills";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

export const PERSONAS = [
  { id: "general", label: "General AI Assistant", prompt: "You are Nexus Plex, an intelligent, helpful, and concise multimodal assistant created by Lead Developer & Architect Aarnav." },
  { id: "coder", label: "Software Architect", prompt: "You are a senior software architect. Provide optimized, production-ready code with clean syntax and architectural considerations." },
  { id: "writer", label: "Creative Storyteller", prompt: "You are a creative writer and storyteller. Use engaging, evocative language and vivid descriptions." },
  { id: "academic", label: "Academic Researcher", prompt: "You are a scientific researcher. Provide structured, evidence-based, logical explanations with key points." },
];

export const MODEL_OPTIONS = [
  { id: "gemini-3.7-flash", label: "♊ Gemini 3.7 Flash", provider: "google", description: "Default - Fast & Multimodal" },
  { id: "gemini-3.1-pro-preview", label: "♊ Gemini 3.1 Pro", provider: "google", description: "Complex Reasoning & Large Context" },
  { id: "deepseek-r1", label: "🧠 DeepSeek R1", provider: "pollinations", description: "Reasoning & Logic" },
  { id: "llama-3.3-70b", label: "🦙 Llama 3.3 70B", provider: "pollinations", description: "Open Source General" },
  { id: "claude-3.5-sonnet", label: "⚡ Claude 3.5 Sonnet", provider: "pollinations", description: "Code & Writing" },
];

export const SLASH_COMMANDS = [
  { command: "/vision", label: "Vision", icon: ImageIcon, color: "bg-purple-500/20 text-purple-400 border-purple-500/30", description: "Generate AI images" },
  { command: "/music", label: "Music", icon: Music, color: "bg-amber-500/20 text-amber-400 border-amber-500/30", description: "Compose audio with Web Audio API" },
  { command: "/studio", label: "Studio", icon: Gamepad2, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", description: "Interactive code sandbox" },
  { command: "/story", label: "Story", icon: BookOpen, color: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30", description: "Creative narrative & storytelling" },
  { command: "/reason", label: "Reason", icon: Brain, color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", description: "Chain-of-thought reasoning" },
  { command: "/code", label: "Code", icon: Code, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", description: "Executable code snippets" },
];

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

export default function ChatTab() {
  const [activeTab, setActiveTab] = useState<"chat" | "vision" | "talk" | "studio">("chat");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [activePromptForTab, setActivePromptForTab] = useState<string>("");
  const [presetForStudio, setPresetForStudio] = useState<string>("");

  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    activeRoute: "Gemini 1.5 Flash (Keyless Gateway)",
    isOllamaOnline: false,
    ollamaModels: [],
    isWebGpuSupported: false,
    webGpuProgress: { progress: 0, text: "", isLoading: false },
    lastLatencyMs: null,
    fallbackCount: 0,
    engineMode: "cloud",
  });

  const [selectedOllamaModel, setSelectedOllamaModel] = useState<string>("llama3");
  const [selectedWebGpuModel, setSelectedWebGpuModel] = useState<string>(DEFAULT_WEBGPU_MODEL);
  const [inputMessage, setInputMessage] = useState("");
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Welcome to Nexus Plex! I'm your multimodal AI assistant. Ask me anything, generate code, create images, compose music, or try slash commands like `/story`, `/reason`, `/music`, `/vision`, `/studio`, `/code`.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [activeWidget, setActiveWidget] = useState<'studio' | 'usic' | 'vision' | 'code' | ''>('');
  const [activePrompt, setActivePrompt] = useState('');
  const [detectedSlashCommand, setDetectedSlashCommand] = useState<string | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const detectSlashCommand = useCallback((text: string) => {
    for (const cmd of SLASH_COMMANDS) {
      if (text.trim().startsWith(cmd.command)) return cmd.command;
    }
    return null;
  }, []);

  useEffect(() => {
    const cmd = detectSlashCommand(inputMessage);
    setDetectedSlashCommand(cmd);
  }, [inputMessage, detectSlashCommand]);

  const handleSendMessage = async (inputPrompt: string) => {
    if (!inputPrompt.trim()) return;

    // 1. Slash command interceptors (DO NOT call text LLM for widgets)
    if (inputPrompt.startsWith('/music')) return;
    if (inputPrompt.startsWith('/studio')) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', text: inputPrompt };
    const aiMsgId = (Date.now() + 1).toString();
    const initialAiMsg = { id: aiMsgId, sender: 'ai', text: 'Thinking...' };

    setMessages((prev) => [...prev, userMsg, initialAiMsg]);

    try {
      // 2. Call Puter AI (Keyless Gemini Completion)
      if (typeof window !== 'undefined' && (window as any).puter?.ai) {
        const response = await (window as any).puter.ai.chat(inputPrompt, {
          model: 'google/gemini-3.7-flash'
        });
        
        const replyText = typeof response === 'string' 
          ? response 
          : response?.message?.content || response?.toString() || "No response received.";

        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMsgId? {...msg, text: replyText } : msg))
        );
      } else {
        // Direct Fallback
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMsgId? {...msg, text: "Initializing Puter AI connection... Please type your message again." } : msg))
        );
      }
    } catch (err) {
      console.error("Puter AI error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, text: "Connection error. Please try again." }
            : msg
        )
      );
    }
  };

  const handleRegenerateLast = useCallback(() => {
    const userMsgs = messages.filter((m) => m.sender === "user");
    if (userMsgs.length > 0) {
      const lastUserMsg = userMsgs[userMsgs.length - 1].text;
      handleSendMessage(lastUserMsg);
    }
  }, [messages]);

  const handleClearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: "Welcome to Nexus Plex! I'm your multimodal AI assistant. Ask me anything, generate code, create images, compose music, or try slash commands like `/story`, `/reason`, `/music`, `/vision`, `/studio`, `/code`.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    showSuccess("Chat thread reset");
  }, []);

  const exportChatHistory = useCallback(() => {
    const exportData = JSON.stringify(messages, null, 2);
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-chat-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Chat history exported!");
  }, [messages]);

  const handleUpdateDiagnostics = useCallback((modelUsed: string, latencyMs: number, wasFallback: boolean) => {
    setDiagnostics((prev) => ({
      ...prev,
      activeRoute: modelUsed,
      lastLatencyMs: latencyMs,
      fallbackCount: wasFallback ? prev.fallbackCount + 1 : prev.fallbackCount,
      webGpuProgress: { ...prev.webGpuProgress, isLoading: false },
    }));
  }, []);

  const handleWebGpuProgress = useCallback((report: InitProgressReport) => {
    setDiagnostics((prev) => ({
      ...prev,
      webGpuProgress: { progress: report.progress, text: report.text, isLoading: report.progress < 1 },
    }));
  }, []);

  const handleLoadPresetFromPalette = (presetKey: string) => {
    setPresetForStudio(presetKey);
    setActiveWidget('studio');
  };

  const renderFormattedContent = useCallback((content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: Array<{ type: "text"; value: string } | { type: "code"; lang: string; value: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content))!== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", value: content.substring(lastIndex, match.index) });
      }
      parts.push({ type: "code", lang: match[1] || "code", value: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: "text", value: content.substring(lastIndex) });
    }

    if (parts.length === 0) {
      return <div className="whitespace-pre-wrap font-sans">{content}</div>;
    }

    return (
      <div className="space-y-3 font-sans">
        {parts.map((p, idx) => {
          if (p.type === "text") {
            return <div key={idx} className="whitespace-pre-wrap">{p.value}</div>;
          }
          return (
            <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs my-2">
              <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                  <Code className="w-3.5 h-3.5" /> {p.lang}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(p.value);
                    showSuccess("Code copied to clipboard!");
                  }}
                  className="hover:text-white flex items-center gap-1 text-[10px]"
                >
                  <Copy className="w-3 h-3" /> Copy Code
                </button>
              </div>
              <pre className="p-3 text-slate-200 overflow-x-auto leading-relaxed">{p.value}</pre>
            </div>
          );
        })}
      </div>
    );
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const isWebGpu = checkWebGpuSupport();
    let isMounted = true;
    const verifySystems = async () => {
      const health = await checkOllamaHealth();
      const gpuSupported = isWebGpu && (await checkWebLlmAvailable());
      if (isMounted) {
        let engineMode = "cloud";
        if (gpuSupported) engineMode = "webgpu";
        else if (health.online) engineMode = "ollama";
        setDiagnostics((prev) => ({
          ...prev,
          isWebGpuSupported: isWebGpu,
          isOllamaOnline: health.online,
          ollamaModels: health.models,
          engineMode,
          activeRoute: engineMode === "webgpu"
            ? `In-Browser WebGPU (${selectedWebGpuModel.split("-")[0]})`
            : engineMode === "ollama"
            ? `Local Ollama (${selectedOllamaModel})`
            : "Gemini 1.5 Flash (Keyless Gateway)",
        }));
        if (health.models.length > 0 && !health.models.includes(selectedOllamaModel)) {
          setSelectedOllamaModel(health.models[0]);
        }
      }
    };
    verifySystems();
    const interval = setInterval(verifySystems, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [selectedOllamaModel, selectedWebGpuModel]);

  const renderMessages = () => (
    <ChatMessages
      messages={messages}
      onCopyMessage={(id) => {
        navigator.clipboard.writeText(messages.find(m => m.id === id)?.text);
        showSuccess("Copied message!");
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }}
      onClearChat={handleClearChat}
    />
  );

  const renderInput = () => (
    <ChatInput
      messages={messages}
      setMessages={setMessages}
      handleSendMessage={handleSendMessage}
      isGeneratingText={isGeneratingText}
      detectedSlashCommand={detectedSlashCommand}
      setDetectedSlashCommand={setDetectedSlashCommand}
    />
  );

  const handleUpdateDiagnostics = useCallback((route: string, latencyMs: number, wasFallback: boolean) => {
    setDiagnostics((prev) => ({
      ...prev,
      activeRoute: route,
      lastLatencyMs: latencyMs,
      fallbackCount: wasFallback ? prev.fallbackCount + 1 : prev.fallbackCount,
    }));
  }, []);

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} flex flex-col transition-colors duration-200`}>
      <SystemDiagnosticsBar
        diagnostics={diagnostics}
        onToggleEngineMode={(mode: EngineMode) =>
          setDiagnostics((prev) => ({
            ...prev,
            engineMode: mode,
            activeRoute:
              mode === "webgpu"
                ? `In-Browser WebGPU (${selectedWebGpuModel.split("-")[0]})`
                : mode === "ollama"
                ? `Local Ollama (${selectedOllamaModel})`
                : "Gemini 1.5 Flash (Keyless Gateway)",
          }))
        }
        onSelectOllamaModel={(model: string) => {
          setSelectedOllamaModel(model);
          setDiagnostics((prev) => ({...prev, activeRoute: `Local Ollama (${model})` }));
        }}
        onSelectWebGpuModel={(model: string) => {
          setSelectedWebGpuModel(model);
          setDiagnostics((prev) => ({...prev, activeRoute: `In-Browser WebGPU (${model.split("-")[0]})` }));
        }}
        selectedOllamaModel={selectedOllamaModel}
        selectedWebGpuModel={selectedWebGpuModel}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
          {/* Header */}
          <ChatHeader
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            selectedPersona={selectedPersona}
            setSelectedPersona={setSelectedPersona}
            isCommandPaletteOpen={isCommandPaletteOpen}
            setIsCommandPaletteOpen={setIsCommandPaletteOpen}
            onSelectTab={setActiveTab}
            onClearChat={handleClearChat}
            onLoadPreset={handleLoadPresetFromPalette}
          />

          {/* Animated Tool View Switcher */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col space-y-6">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {renderMessages()}
                  </div>

                  {/* Input area */}
                  <div className="flex-1">
                    {renderInput()}
                  </div>
                </div>
              )}

              {activeTab === "vision" && <VisionTab />}

              {activeTab === "talk" && (
                <TalkTab
                  engineMode={diagnostics.engineMode}
                  selectedOllamaModel={selectedOllamaModel}
                  onUpdateDiagnostics={handleUpdateDiagnostics}
                />
              )}

              {activeTab === "studio" && (
                <StudioTab
                  engineMode={diagnostics.engineMode}
                  selectedOllamaModel={selectedOllamaModel}
                  onUpdateDiagnostics={handleUpdateDiagnostics}
                  initialCodePreset={presetForStudio}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab)}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onClearChat={handleClearChat}
        onLoadPreset={handleLoadPresetFromPalette}
      />

      <PromptLibraryModal
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onUsePrompt={handleUsePromptFromLibrary}
      />
    </div>
  );
}