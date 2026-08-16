import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar, ChatSession } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { BottomDock } from "@/components/BottomDock";
import { SettingsModal } from "@/components/SettingsModal";
import { ModelSelector } from "@/components/ModelSelector";
import { ThemeSelector } from "@/components/ThemeSelector";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { AuthModal, UserProfile } from "@/components/AuthModal";
import { getStoredUser, saveUser, clearUser } from "@/utils/userStore";
import { LiveVoiceModal } from "@/components/LiveVoiceModal";
import { Header } from "@/components/Header";
import { getStoredTheme, applyTheme } from "@/utils/theme";
import {
  ChatMessageData,
  streamChatResponse,
  generateImageClient,
  generateVideoClient,
  generatePptClient,
} from "@/utils/GeminiClient";
import { detectIntent } from "@/utils/intentDetection";
import { generateImage } from "@/utils/imageEngine";
import { generateAudio } from "@/utils/audioGeneration";
import { generateMusicTrack } from "@/utils/musicEngine";
import { generateSmartTitle } from "@/utils/titleGenerator";
import { resolveVisionModel } from "@/utils/visionEngine";
import { showSuccess, showError } from "@/utils/toast";
import { extractUrls, scrapeWebUrl, formatScrapedContext } from "@/utils/urlScraper";
import { checkCapabilityQuery } from "@/utils/capabilityRouter";
import { CapabilitiesModal } from "@/components/CapabilitiesModal";
import { ExportModal } from "@/components/ExportModal";
import { Cpu, Sparkles, Menu, Zap, Settings, Key, Radio, LogOut, User, Plus, Compass } from "lucide-react";

const BRAND_NAME = "Nexus Plex";
const STORAGE_KEY = "ai_workspace_sessions_v3";
const AUTH_KEY = "ai_workspace_user_auth";

export default function Index() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessageData[]>>({});
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.7-flash");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState<boolean>(false);
  const [isCapabilitiesOpen, setIsCapabilitiesOpen] = useState<boolean>(false);
  const [exportSessionId, setExportSessionId] = useState<string | null>(null);

  // User Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const getUserStorageKey = (email?: string) => {
    if (!email || !email.trim()) return "workspace_user_guest";
    const sanitized = email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    return `workspace_user_${sanitized}`;
  };

  // Load saved user & theme on mount
  useEffect(() => {
    applyTheme(getStoredTheme());
    try {
      const savedUser = getStoredUser();
      if (savedUser) {
        setUser(savedUser);
      } else {
        setIsAuthModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to load user auth:", err);
      setIsAuthModalOpen(true);
    }

    const handleUserAuthChange = (e: any) => {
      if (e.detail?.user !== undefined) {
        setUser(e.detail.user);
      }
    };

    const handleSessionTitleChange = (e: any) => {
      if (e.detail?.sessionId && e.detail?.title) {
        const { sessionId, title } = e.detail;
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
        );
      }
    };

    window.addEventListener("nexus-user-auth-change" as any, handleUserAuthChange);
    window.addEventListener("nexus-session-title-updated" as any, handleSessionTitleChange);
    return () => {
      window.removeEventListener("nexus-user-auth-change" as any, handleUserAuthChange);
      window.removeEventListener("nexus-session-title-updated" as any, handleSessionTitleChange);
    };
  }, []);

  // When user changes, load partitioned sessions & messages for that account
  useEffect(() => {
    const userKey = getUserStorageKey(user?.email);
    const savedSessions = localStorage.getItem(`${userKey}_sessions`);
    const savedMessagesMap = localStorage.getItem(`${userKey}_msgs`);

    let initialSessions: ChatSession[] = [];
    let initialMsgs: Record<string, ChatMessageData[]> = {};

    if (savedSessions) {
      try {
        initialSessions = JSON.parse(savedSessions);
      } catch {
        initialSessions = [];
      }
    }

    if (savedMessagesMap) {
      try {
        initialMsgs = JSON.parse(savedMessagesMap);
      } catch {
        initialMsgs = {};
      }
    }

    if (!initialSessions || initialSessions.length === 0) {
      const freshId = `session_${Date.now()}`;
      initialSessions = [
        {
          id: freshId,
          title: "New Agent Chat",
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          messagesCount: 0,
        },
      ];
      initialMsgs = { [freshId]: [] };
    }

    setSessions(initialSessions);
    setMessagesMap(initialMsgs);
    setActiveSessionId(initialSessions[0]?.id || "");
  }, [user?.email]);

  // Save user-partitioned sessions & messages to localStorage when updated
  useEffect(() => {
    const userKey = getUserStorageKey(user?.email);
    if (sessions.length > 0) {
      localStorage.setItem(`${userKey}_sessions`, JSON.stringify(sessions));
      localStorage.setItem(`${userKey}_msgs`, JSON.stringify(messagesMap));
    }
  }, [sessions, messagesMap, user?.email]);

  const handleLogin = (profile: UserProfile) => {
    setSessions([]);
    setMessagesMap({});
    setActiveSessionId("");

    setUser(profile);
    saveUser(profile);
    setIsAuthModalOpen(false);
    showSuccess(`Authenticated as ${profile.name} (${profile.email})`);
  };

  const handleSignOut = () => {
    const currentEmail = user?.email;
    setUser(null);
    setSessions([]);
    setMessagesMap({});
    setActiveSessionId("");
    clearUser();
    setShowProfileMenu(false);
    setIsAuthModalOpen(true);
    showSuccess(`Signed out from ${currentEmail || 'account'}`);
  };

  // Create a new Chat Session
  const createNewSession = () => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Agent Chat",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      messagesCount: 0,
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessagesMap((prev) => ({
      ...prev,
      [newId]: [],
    }));
  };

  // Select existing session
  const handleSelectSession = (id: string) => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
    setActiveSessionId(id);
  };

  // Delete single session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setMessagesMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    if (activeSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        createNewSession();
      }
    }
    showSuccess("Session deleted");
  };

  // Clear all sessions for active account
  const handleClearAll = () => {
    setSessions([]);
    setMessagesMap({});
    const userKey = getUserStorageKey(user?.email);
    localStorage.removeItem(`${userKey}_sessions`);
    localStorage.removeItem(`${userKey}_msgs`);
    createNewSession();
    showSuccess("Chat history cleared for active account");
  };

  // Delete single message or pair
  const handleDeleteSingleMessage = (msgId: string) => {
    if (!activeSessionId) return;
    setMessagesMap((prev) => {
      const sessionMsgs = prev[activeSessionId] || [];
      const targetIdx = sessionMsgs.findIndex((m) => m.id === msgId);
      if (targetIdx === -1) return prev;

      const targetMsg = sessionMsgs[targetIdx];
      const newMsgs = [...sessionMsgs];

      if (targetMsg.sender === "user") {
        if (targetIdx + 1 < newMsgs.length && newMsgs[targetIdx + 1].sender !== "user") {
          newMsgs.splice(targetIdx, 2);
        } else {
          newMsgs.splice(targetIdx, 1);
        }
      } else {
        newMsgs.splice(targetIdx, 1);
      }

      return {
        ...prev,
        [activeSessionId]: newMsgs,
      };
    });
    showSuccess("Message removed from thread");
  };

  // Regenerate Assistant response
  const handleRegenerateMessage = async (msgId: string) => {
    if (!activeSessionId || isGenerating) return;

    const sessionMsgs = messagesMap[activeSessionId] || [];
    const targetIdx = sessionMsgs.findIndex((m) => m.id === msgId);
    if (targetIdx === -1) return;

    let userPrompt = "";
    let cutIdx = targetIdx;

    if (sessionMsgs[targetIdx].sender === "user") {
      userPrompt = sessionMsgs[targetIdx].text;
      cutIdx = targetIdx + 1;
    } else {
      const prevUserMsg = sessionMsgs.slice(0, targetIdx).reverse().find((m) => m.sender === "user");
      if (prevUserMsg) {
        userPrompt = prevUserMsg.text;
      }
      cutIdx = targetIdx;
    }

    if (!userPrompt.trim()) {
      showError("No preceding user prompt found to regenerate.");
      return;
    }

    const updatedHistory = sessionMsgs.slice(0, cutIdx);
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const aiMsgId = `ai_${Date.now()}`;

    const aiMsgPlaceholder: ChatMessageData = {
      id: aiMsgId,
      sender: "assistant",
      text: "",
      timestamp,
      isStreaming: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: [...updatedHistory, aiMsgPlaceholder],
    }));

    setIsGenerating(true);
    showSuccess("Regenerating AI response...");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    await streamChatResponse({
      messages: updatedHistory,
      model: selectedModel,
      userEmail: user?.email,
      signal: abortController.signal,
      onChunk: (chunkText: string) => {
        setMessagesMap((prev) => {
          const sMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sMsgs.map((m) => (m.id === aiMsgId ? { ...m, text: m.text + chunkText } : m)),
          };
        });
      },
      onComplete: () => {
        setIsGenerating(false);
        abortControllerRef.current = null;
        setMessagesMap((prev) => {
          const sMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sMsgs.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m)),
          };
        });
      },
      onError: (errMsg: string) => {
        setIsGenerating(false);
        abortControllerRef.current = null;
        showError(errMsg);
        setMessagesMap((prev) => {
          const sMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sMsgs.map((m) =>
              m.id === aiMsgId
                ? { ...m, isStreaming: false, text: m.text ? `${m.text}\n\n⚠️ Stream error: ${errMsg}` : `⚠️ Error: ${errMsg}` }
                : m
            ),
          };
        });
      },
    });
  };

  // Handle Stop Streaming Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  };

  // Send message and handle media generators or LLM streaming
  const handleSendMessage = async (
    userText: string,
    attachedFiles: Array<{ name: string; type: string; dataUrl: string; textContent?: string }> = []
  ) => {
    if (!activeSessionId) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Extract text from document/code file attachments if present
    let formattedText = userText;
    attachedFiles.forEach((file) => {
      if (file.textContent) {
        formattedText += `\n\n--- Attached File Context: ${file.name} ---\n\`\`\`\n${file.textContent}\n\`\`\`\n`;
      }
    });

    // Create User Message
    const userMsg: ChatMessageData = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: formattedText,
      timestamp,
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
    };

    // Update active session messages
    const currentMsgs = messagesMap[activeSessionId] || [];
    const updatedUserMsgs = [...currentMsgs, userMsg];
    const activeSession = sessions.find((s) => s.id === activeSessionId);
    const isGenericTitle =
      !activeSession ||
      activeSession.title === "New Agent Chat" ||
      activeSession.title === "New Chat" ||
      activeSession.title === "New Conversation" ||
      activeSession.title.startsWith("New ");
    const isFirstMessage = currentMsgs.length === 0 || isGenericTitle;

    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: updatedUserMsgs,
    }));

    // Immediate temporary fallback title
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            title: isGenericTitle ? (userText.slice(0, 28) || "Chat Session") : s.title,
            messagesCount: updatedUserMsgs.length,
          };
        }
        return s;
      })
    );

    // Asynchronous background AI Smart Titling for session
    if (isFirstMessage) {
      const targetSessId = activeSessionId;
      generateSmartTitle(userText, user?.email).then((smartTitle) => {
        if (smartTitle && smartTitle !== "New Conversation" && smartTitle !== "New Chat") {
          setSessions((prev) =>
            prev.map((s) => (s.id === targetSessId ? { ...s, title: smartTitle } : s))
          );
        }
      });
    }

    const trimmedText = userText.trim();

    // Parse command parameters from user prompt
    const styleMatch = trimmedText.match(/\bstyle:([\w\s-]+)\b/i);
    const ratioMatch = trimmedText.match(/\bratio:(1:1|16:9|9:16)\b/i);
    const moodMatch = trimmedText.match(/\bmood:([\w\s-]+)\b/i);
    const slidesMatch = trimmedText.match(/\bslides:(\d+)\b/i);
    const durationMatch = trimmedText.match(/\bduration:(\d+)\b/i);
    const motionMatch = trimmedText.match(/\bmotion:([\w\s-]+)\b/i);
    const genreMatch = trimmedText.match(/\bgenre:([\w\s-]+)\b/i);
    const bpmMatch = trimmedText.match(/\bbpm:(\d+)\b/i);
    const vocalsMatch = trimmedText.match(/\b(vocals|vocal):([\w\s-]+)\b/i);

    const parsedStyle = styleMatch ? styleMatch[1].trim() : undefined;
    const parsedRatio = ratioMatch ? ratioMatch[1].trim() : undefined;
    const parsedMood = moodMatch ? moodMatch[1].trim() : undefined;
    const parsedSlides = slidesMatch ? parseInt(slidesMatch[1]) : 5;
    const parsedDuration = durationMatch ? parseInt(durationMatch[1]) : 5;
    const parsedMotion = motionMatch ? motionMatch[1].trim() : "Pan";
    const parsedGenre = genreMatch ? genreMatch[1].trim() : "Synth-Pop";
    const parsedBpm = bpmMatch ? parseInt(bpmMatch[1]) : 120;
    const parsedVocals = vocalsMatch ? vocalsMatch[2].trim() : "Instrumental";

    const cleanMediaPrompt = trimmedText
      .replace(/^\/(vision|art|ppt|slide|video|music|audio|reason|code)/gi, "")
      .replace(/\bstyle:[\w\s-]+\b/gi, "")
      .replace(/\bratio:(1:1|16:9|9:16)\b/gi, "")
      .replace(/\bmood:[\w\s-]+\b/gi, "")
      .replace(/\bslides:\d+\b/gi, "")
      .replace(/\bduration:\d+\b/gi, "")
      .replace(/\bmotion:[\w\s-]+\b/gi, "")
      .replace(/\bgenre:[\w\s-]+\b/gi, "")
      .replace(/\bbpm:\d+\b/gi, "")
      .replace(/\b(vocals|vocal):[\w\s-]+\b/gi, "")
      .trim();

    const detected = detectIntent(trimmedText);

    // Detect command / action intent type
    let initialCommandType = "general";
    if (trimmedText.startsWith("/vision") || trimmedText.startsWith("/art") || detected.type === "image" || attachedFiles.some((f) => f.type.startsWith("image/"))) {
      initialCommandType = attachedFiles.some((f) => f.type.startsWith("image/")) ? "vision" : "image";
    } else if (trimmedText.startsWith("/ppt") || trimmedText.startsWith("/slide") || detected.type === "presentation") {
      initialCommandType = "presentation";
    } else if (trimmedText.startsWith("/video") || detected.type === "video") {
      initialCommandType = "video";
    } else if (trimmedText.startsWith("/music") || trimmedText.startsWith("/audio") || detected.type === "audio") {
      initialCommandType = "audio";
    } else if (trimmedText.startsWith("/reason") || selectedModel.includes("pro") || selectedModel.includes("reason")) {
      initialCommandType = "reasoning";
    } else if (trimmedText.startsWith("/code") || trimmedText.startsWith("/app") || /\b(html|css|javascript|typescript|python|code|react|component|function|script|app)\b/i.test(trimmedText)) {
      initialCommandType = "code";
    }

    setIsGenerating(true);

    // Create placeholder AI Message
    const aiMsgId = `ai_${Date.now()}`;
    const aiMsg: ChatMessageData = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      commandType: initialCommandType,
      isStreaming: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: [...updatedUserMsgs, aiMsg],
    }));

    // 0. Capability Inquiry Check (e.g. "Can you make images?", "What can you generate?")
    const capabilityCheck = checkCapabilityQuery(trimmedText);
    if (capabilityCheck.isCapabilityQuery) {
      setMessagesMap((prev) => {
        const sessionMsgs = prev[activeSessionId] || [];
        return {
          ...prev,
          [activeSessionId]: sessionMsgs.map((m) => {
            if (m.id === aiMsgId) {
              return {
                ...m,
                text: capabilityCheck.responseMarkdown,
                isStreaming: false,
              };
            }
            return m;
          }),
        };
      });
      setIsGenerating(false);
      return;
    }

    // 1. Dual-Path Image Generation System (Path A: Direct Prompt & Path B: Pill Accelerators)
    if (trimmedText.startsWith("/vision") || trimmedText.startsWith("/art") || detected.type === "image") {
      const targetPrompt = cleanMediaPrompt || detected.extractedPrompt || "Futuristic cyber-cognitive artwork";
      try {
        const imageResult = await generateImage(targetPrompt, {
          style: parsedStyle,
          aspectRatio: parsedRatio,
          mood: parsedMood,
        });

        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => {
              if (m.id === aiMsgId) {
                return {
                  ...m,
                  text: `Synthesized artwork for prompt: **"${targetPrompt}"**`,
                  generatedImage: imageResult,
                  isStreaming: false,
                };
              }
              return m;
            }),
          };
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Image generation failed";
        showError(errorMsg);
        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false, text: `⚠️ Error: ${errorMsg}` } : m)),
          };
        });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // 2. Slide Deck Presentation Generator Action Tool
    if (trimmedText.startsWith("/ppt") || trimmedText.startsWith("/slide") || detected.type === "presentation") {
      const pptPrompt = cleanMediaPrompt || detected.extractedPrompt || "Nexus Plex Architecture & Execution";
      try {
        const deckResult = await generatePptClient(pptPrompt);
        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => {
              if (m.id === aiMsgId) {
                return {
                  ...m,
                  text: `Generated interactive slide deck presentation for topic: **"${pptPrompt}"** (${parsedSlides} slides)`,
                  generatedSlideDeck: deckResult,
                  isStreaming: false,
                };
              }
              return m;
            }),
          };
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Slide deck generation failed";
        showError(errorMsg);
        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false, text: `⚠️ Error: ${errorMsg}` } : m)),
          };
        });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // 3. AI Motion Video Tool
    if (trimmedText.startsWith("/video") || detected.type === "video") {
      const videoPrompt = cleanMediaPrompt || detected.extractedPrompt || "Cyberpunk city illuminated by neon cyan volumetric lights";
      try {
        const videoResult = await generateVideoClient(videoPrompt, {
          aspectRatio: parsedRatio || "16:9",
          durationSeconds: parsedDuration || 15,
          fps: 60,
        });
        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => {
              if (m.id === aiMsgId) {
                return {
                  ...m,
                  text: `Rendered AI video clip for prompt: **"${videoPrompt}"** (${parsedDuration}s • ${parsedMotion})`,
                  generatedVideo: {
                    ...videoResult,
                    durationSeconds: parsedDuration,
                  },
                  isStreaming: false,
                };
              }
              return m;
            }),
          };
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Video generation failed";
        showError(errorMsg);
        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false, text: `⚠️ Error: ${errorMsg}` } : m)),
          };
        });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // 4. AI Soundscape & Music Generator Tool (Dynamic Seeded & Cache-Busted)
    if (trimmedText.startsWith("/music") || trimmedText.startsWith("/audio") || detected.type === "audio") {
      const musicPrompt = cleanMediaPrompt || detected.extractedPrompt || "Cyberpunk synthwave ambient beat";
      try {
        const dynamicSeed = Math.floor(Math.random() * 1000000) + Date.now();
        const audioResult = await generateMusicTrack(musicPrompt, {
          seed: dynamicSeed,
          genre: parsedGenre,
          tempo: parsedBpm,
          vocalStyle: parsedVocals,
        });

        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => {
              if (m.id === aiMsgId) {
                return {
                  ...m,
                  text: `Synthesized unique audio track: **"${musicPrompt}"**`,
                  generatedAudio: {
                    url: audioResult.url,
                    prompt: musicPrompt,
                    genre: `${parsedGenre.toUpperCase()} • ${parsedVocals} • Nexus Music Engine`,
                    bpm: audioResult.bpm,
                  },
                  isStreaming: false,
                };
              }
              return m;
            }),
          };
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Audio generation failed";
        showError(errorMsg);
        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false, text: `⚠️ Error: ${errorMsg}` } : m)),
          };
        });
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // 5. Deep Reasoning System Instruction (/reason or reasoning model)
    const isReasoning = trimmedText.startsWith("/reason") || selectedModel.includes("pro") || selectedModel.includes("reason");
    const systemInstruction = isReasoning
      ? "You are a Deep Reasoning AI Engine. Before giving your final response, ALWAYS output an expandable step-by-step reasoning section formatted as:\n\n> **Thought Process:**\n> 1. Analyze constraints and prompt objectives.\n> 2. Formulate step-by-step logic.\n> 3. Verify correctness.\n\n---\n\nThen output your final answer."
      : undefined;

    // Automatic Live URL / Webpage Scraper & DOM Inspector
    const detectedUrls = extractUrls(trimmedText);
    const effectiveUserMsgs = [...updatedUserMsgs];

    if (detectedUrls.length > 0 || trimmedText.startsWith("/scrape")) {
      const targetUrl = detectedUrls[0] || trimmedText.replace(/^\/scrape\s*/i, "").trim();
      if (targetUrl && (targetUrl.startsWith("http://") || targetUrl.startsWith("https://"))) {
        try {
          const scraped = await scrapeWebUrl(targetUrl);
          if (scraped.status === "success" && scraped.content) {
            const formattedScrapedContext = formatScrapedContext(scraped);
            // Enrich latest user message with scraped context
            const lastIdx = effectiveUserMsgs.length - 1;
            effectiveUserMsgs[lastIdx] = {
              ...effectiveUserMsgs[lastIdx],
              text: `${effectiveUserMsgs[lastIdx].text}\n\n${formattedScrapedContext}`,
            };
            showSuccess(`Extracted live webpage context from ${scraped.title || targetUrl}`);
          }
        } catch (e) {
          console.warn("URL scraper encountered an issue:", e);
        }
      }
    }

    // Standard Streaming Chat API
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const visionResult = resolveVisionModel(selectedModel, attachedFiles);
    const effectiveModel = visionResult.recommendedModel;

    await streamChatResponse({
      messages: effectiveUserMsgs,
      model: effectiveModel,
      systemInstruction,
      userEmail: user?.email,
      signal: abortController.signal,
      onChunk: (chunkText: string) => {
        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => {
              if (m.id === aiMsgId) {
                return {
                  ...m,
                  text: m.text + chunkText,
                };
              }
              return m;
            }),
          };
        });
      },
      onComplete: () => {
        setIsGenerating(false);
        abortControllerRef.current = null;
        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m)),
          };
        });
      },
      onError: (errMsg: string) => {
        setIsGenerating(false);
        abortControllerRef.current = null;
        showError(errMsg);
        setMessagesMap((prev) => {
          const sessionMsgs = prev[activeSessionId] || [];
          return {
            ...prev,
            [activeSessionId]: sessionMsgs.map((m) => {
              if (m.id === aiMsgId) {
                return {
                  ...m,
                  isStreaming: false,
                  text: m.text ? `${m.text}\n\n⚠️ Stream error: ${errMsg}` : `⚠️ Error: ${errMsg}`,
                };
              }
              return m;
            }),
          };
        });
      },
    });
  };

  const currentMessages = messagesMap[activeSessionId] || [];

  return (
    <div
      className="flex h-screen w-screen overflow-hidden font-sans antialiased transition-colors"
      style={{ backgroundColor: "var(--app-bg)", color: "var(--app-text)" }}
    >
      {/* Auth Modal Barrier */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onLogin={handleLogin}
        brandName={BRAND_NAME}
      />

      {/* Gemini Live Voice Mode Modal */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        selectedModel={selectedModel}
        userEmail={user?.email}
      />

      {/* Interactive Capabilities Explorer Modal */}
      <CapabilitiesModal
        isOpen={isCapabilitiesOpen}
        onClose={() => setIsCapabilitiesOpen(false)}
        onSelectPrompt={(presetPrompt) => {
          setIsCapabilitiesOpen(false);
          handleSendMessage(presetPrompt);
        }}
      />

      {/* Left Sidebar */}
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={createNewSession}
        onDeleteSession={handleDeleteSession}
        onExportSession={(id) => setExportSessionId(id)}
        onClearAll={handleClearAll}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onOpenSettings={() => setIsSettingsOpen(true)}
        brandName={BRAND_NAME}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 transition-colors" style={{ backgroundColor: "var(--app-bg)" }}>
        {/* Top Header Bar */}
        <Header
          brandName={BRAND_NAME}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenCapabilities={() => setIsCapabilitiesOpen(true)}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onCreateNewSession={createNewSession}
          user={user}
          onLogout={handleSignOut}
        />

        {/* Center Canvas Streaming Chat Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSessionId}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex-1 flex flex-col min-h-0 min-w-0"
          >
            <ChatArea
              messages={currentMessages}
              isGenerating={isGenerating}
              onSendPreset={(presetPrompt) => handleSendMessage(presetPrompt)}
              onSelectModel={setSelectedModel}
              brandName={BRAND_NAME}
              sessionTitle={sessions.find((s) => s.id === activeSessionId)?.title || "Active Workspace Chat"}
              selectedModel={selectedModel}
              userEmail={user?.email}
              userName={user?.name || "Aarnav"}
              onRegenerateMessage={handleRegenerateMessage}
              onDeleteMessage={handleDeleteSingleMessage}
              onClearChat={() => {
                if (confirm("Are you sure you want to clear the active conversation thread?")) {
                  setMessagesMap((prev) => ({
                    ...prev,
                    [activeSessionId]: [],
                  }));
                  showSuccess("Conversation thread cleared");
                }
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Bottom Input Dock */}
        <BottomDock
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
          user={user}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Settings Modal (BYOK Key Manager) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        brandName={BRAND_NAME}
        userEmail={user?.email}
      />

      {/* Zero-Auth Cross-Account Export Modal */}
      {exportSessionId && (
        <ExportModal
          isOpen={!!exportSessionId}
          onClose={() => setExportSessionId(null)}
          messages={messagesMap[exportSessionId] || []}
          sessionTitle={sessions.find((s) => s.id === exportSessionId)?.title || "Chat Export"}
          selectedModel={selectedModel}
          userEmail={user?.email}
        />
      )}
    </div>
  );
}
