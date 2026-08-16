/**
 * Custom useChat Hook for Nexus Plex
 * Standardized message streaming, state management, retry handling, and AI auto-titling.
 * Engineered by Lead Developer & Architect Aarnav.
 */

import { useState, useRef, useCallback } from "react";
import { ChatMessageData } from "@/utils/GeminiClient";
import { streamGeminiChat } from "@/utils/geminiService";
import { resolveVisionModel } from "@/utils/visionEngine";
import { ProcessedFile } from "@/utils/fileHandler";
import { generateSmartTitle } from "@/utils/titleGenerator";
import { exportChatAsMarkdown, exportChatAsJson, exportChatAsPrintableDocument } from "@/utils/exportEngine";
import { classifyUserIntent, IntentAction } from "@/utils/intentDetection";
import { routeUserPrompt } from "@/utils/aiRouter";
import { checkCapabilityQuery } from "@/utils/capabilityRouter";
import { generateImage } from "@/utils/imageEngine";
import { startAsyncVideoGeneration, pollVideoGenerationStatus } from "@/utils/videoEngine";
import { generateMusicTrack } from "@/utils/musicEngine";

export interface UseChatOptions {
  sessionId?: string;
  initialMessages?: ChatMessageData[];
  model?: string;
  userEmail?: string;
  onTitleGenerated?: (title: string) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { initialMessages, model, userEmail, onTitleGenerated } = options;
  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages || []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(model || "gemini-3.7-flash");
  const [sessionTitle, setSessionTitle] = useState<string>("New Conversation");

  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (
      text: string,
      customOptions: {
        systemInstruction?: string;
        files?: Array<{ name: string; type: string; dataUrl: string; textContent?: string }>;
        model?: string;
      } = {}
    ) => {
      const promptText = text.trim();
      if (!promptText && (!customOptions.files || customOptions.files.length === 0)) return;

      setError(null);
      setIsLoading(true);

      const isFirstUserMessage = messages.filter((m) => m.sender === "user").length === 0;

      // Auto-Titling for first message
      if (isFirstUserMessage && promptText) {
        generateSmartTitle(promptText, userEmail).then((smartTitle) => {
          if (smartTitle) {
            setSessionTitle(smartTitle);
            if (onTitleGenerated) {
              onTitleGenerated(smartTitle);
            }
          }
        });
      }

      const userMsgId = `user_${Date.now()}`;
      const userMsg: ChatMessageData = {
        id: userMsgId,
        sender: "user",
        text: promptText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        files: customOptions.files,
      };

      // 1. Check if user is asking about capabilities (e.g. "Can you make images?", "What can you generate?")
      const capabilityCheck = checkCapabilityQuery(promptText);
      if (capabilityCheck.isCapabilityQuery) {
        const aiMsgId = `ai_${Date.now()}`;
        const aiMsg: ChatMessageData = {
          id: aiMsgId,
          sender: "ai",
          text: capabilityCheck.responseMarkdown,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isStreaming: false,
        };

        setMessages((prev) => [...prev, userMsg, aiMsg]);
        setIsLoading(false);
        return;
      }

      // 2. Zero-Shot Semantic Intent Routing for Direct Media Execution
      const hasUploadedFiles = customOptions.files && customOptions.files.length > 0;
      let semanticRoute = null;

      if (!hasUploadedFiles) {
        try {
          semanticRoute = await routeUserPrompt(promptText, { userEmail });
        } catch (routeErr) {
          console.warn("[Nexus Router] Semantic route error, falling back:", routeErr);
        }
      }

      const isMediaIntent =
        !hasUploadedFiles &&
        semanticRoute &&
        (semanticRoute.action === "GENERATE_IMAGE" ||
          semanticRoute.action === "GENERATE_VIDEO" ||
          semanticRoute.action === "GENERATE_MUSIC");

      if (isMediaIntent && semanticRoute) {
        const aiMsgId = `ai_${Date.now()}`;
        const commandType =
          semanticRoute.action === "GENERATE_IMAGE"
            ? "image"
            : semanticRoute.action === "GENERATE_VIDEO"
            ? "video"
            : "audio";

        const aiMsg: ChatMessageData = {
          id: aiMsgId,
          sender: "ai",
          text: "",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          commandType,
          isStreaming: true,
        };

        setMessages((prev) => [...prev, userMsg, aiMsg]);

        try {
          if (semanticRoute.action === "GENERATE_IMAGE") {
            const rawTargetPrompt = semanticRoute.extractedPrompt || promptText;
            const imgResult = await generateImage(rawTargetPrompt);

            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? {
                      ...m,
                      text: `✨ Generated high-fidelity visual artwork for "${rawTargetPrompt}" using **${imgResult.model}**.`,
                      isStreaming: false,
                      generatedImage: {
                        prompt: rawTargetPrompt,
                        url: imgResult.url,
                        model: imgResult.model,
                      },
                    }
                  : m
              )
            );
          } else if (semanticRoute.action === "GENERATE_VIDEO") {
            const fullVideoPrompt = semanticRoute.extractedPrompt || promptText;
            const videoTask = await startAsyncVideoGeneration(fullVideoPrompt, {
              motion: semanticRoute.parameters?.motion || "high",
              fps: semanticRoute.parameters?.fps || 60,
              aspectRatio: semanticRoute.parameters?.aspectRatio || "16:9",
              durationSeconds: 15,
              quality: "sora",
            });

            // Update intermediate progress states in the chat message
            const completedTask = await pollVideoGenerationStatus(videoTask, (progressTask) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        text: progressTask.stage || `🎥 Rendering 60FPS Latent Motion Frames (${progressTask.progress}%)...`,
                        generatedVideo: {
                          prompt: fullVideoPrompt,
                          originalPrompt: promptText,
                          enhancedPrompt: progressTask.enhancedPrompt,
                          videoUrl: progressTask.videoUrl || progressTask.url || "",
                          url: progressTask.url,
                          seed: progressTask.seed,
                          aspectRatio: progressTask.aspectRatio || "16:9",
                          durationSeconds: progressTask.durationSeconds || 15,
                          motion: progressTask.motion || "high",
                          fps: progressTask.fps || 60,
                          model: progressTask.model,
                          status: progressTask.status,
                          progress: progressTask.progress,
                          stage: progressTask.stage,
                        },
                      }
                    : m
                )
              );
            });

            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? {
                      ...m,
                      text: `🎬 Rendered motion video stream for "${fullVideoPrompt}" using **${completedTask.model || "Nexus Sora 2.0 / Kling HD Motion Engine"}** (Seed: ${completedTask.seed}).`,
                      isStreaming: false,
                      generatedVideo: {
                        prompt: fullVideoPrompt,
                        originalPrompt: promptText,
                        enhancedPrompt: completedTask.enhancedPrompt,
                        videoUrl: completedTask.videoUrl || completedTask.url || "",
                        url: completedTask.url,
                        seed: completedTask.seed,
                        aspectRatio: completedTask.aspectRatio || "16:9",
                        durationSeconds: completedTask.durationSeconds || 15,
                        motion: completedTask.motion || "high",
                        fps: completedTask.fps || 60,
                        model: completedTask.model,
                        status: "completed",
                        progress: 100,
                        stage: completedTask.stage,
                      },
                    }
                  : m
              )
            );
          } else if (semanticRoute.action === "GENERATE_MUSIC") {
            const fullMusicPrompt = semanticRoute.extractedPrompt || promptText;
            const genre = semanticRoute.parameters?.genre || "Synthwave / Cyberpunk";
            const bpm = semanticRoute.parameters?.tempo || semanticRoute.parameters?.bpm || 124;

            const musicResult = await generateMusicTrack(fullMusicPrompt, {
              genre,
              tempo: bpm,
            });

            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? {
                      ...m,
                      text: `🎵 Synthesized interactive audio track for "${fullMusicPrompt}" using **${musicResult.model}**.`,
                      isStreaming: false,
                      generatedAudio: {
                        prompt: fullMusicPrompt,
                        genre: musicResult.mood || genre,
                        bpm: musicResult.bpm || bpm,
                      },
                    }
                  : m
              )
            );
          }
        } catch (mediaErr: any) {
          console.error("[Nexus Media Interceptor] Generation error:", mediaErr);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    isStreaming: false,
                    text: `⚠️ Media generation error: ${mediaErr?.message || "Failed to render media"}`,
                  }
                : m
            )
          );
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Standard Text / LLM Flow
      const requestedModel = customOptions.model || selectedModel || "gemini-3.7-flash";

      // Transform files to ProcessedFile interface for vision check
      const processedFilesForVision: ProcessedFile[] = (customOptions.files || []).map((f) => ({
        name: f.name,
        type: f.type,
        size: 0,
        content: f.dataUrl || "",
        mimeType: f.type,
      }));

      const visionChoice = resolveVisionModel(requestedModel, processedFilesForVision);
      const activeModel = visionChoice.recommendedModel;

      const aiMsgId = `ai_${Date.now()}`;
      const aiMsg: ChatMessageData = {
        id: aiMsgId,
        sender: "ai",
        text: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isStreaming: true,
        modelUsed: activeModel,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      const updatedHistory = [...messages, userMsg];

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await streamGeminiChat({
          messages: updatedHistory,
          model: activeModel,
          systemInstruction: customOptions.systemInstruction,
          userEmail,
          signal: abortController.signal,
          onChunk: (chunkText: string) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, text: m.text + chunkText } : m))
            );
          },
          onComplete: () => {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m))
            );
          },
          onError: (errMessage: string) => {
            const displayErr = errMessage || "Model service temporarily busy. Re-attempting connection...";
            setError(displayErr);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId
                  ? {
                      ...m,
                      isStreaming: false,
                      text: m.text ? `${m.text}\n\n⚠️ ${displayErr}` : `⚠️ ${displayErr}`,
                    }
                  : m
              )
            );
          },
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Encountered an issue generating response.";
        console.error("[Nexus Router] API Error Details:", err);
        setError(errMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  text: m.text ? `${m.text}\n\n⚠️ ${errMsg}` : `⚠️ ${errMsg}`,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, selectedModel, userEmail, onTitleGenerated]
  );

  const retryMessage = useCallback(
    async (failedAiMsgId: string) => {
      const msgIndex = messages.findIndex((m) => m.id === failedAiMsgId);
      if (msgIndex === -1) return;

      let userMsg: ChatMessageData | null = null;
      for (let i = msgIndex - 1; i >= 0; i--) {
        if (messages[i].sender === "user") {
          userMsg = messages[i];
          break;
        }
      }

      if (!userMsg) return;

      const activeModel = selectedModel || "gemini-3.7-flash";

      setMessages((prev) =>
        prev.map((m) => (m.id === failedAiMsgId ? { ...m, text: "", isStreaming: true, modelUsed: activeModel } : m))
      );

      setIsLoading(true);
      setError(null);

      const historyUpToUser = messages.slice(0, msgIndex);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await streamGeminiChat({
          messages: historyUpToUser,
          model: activeModel,
          userEmail,
          signal: abortController.signal,
          onChunk: (chunkText: string) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === failedAiMsgId ? { ...m, text: m.text + chunkText } : m))
            );
          },
          onComplete: () => {
            setMessages((prev) =>
              prev.map((m) => (m.id === failedAiMsgId ? { ...m, isStreaming: false } : m))
            );
          },
          onError: (errMessage: string) => {
            setError(errMessage);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === failedAiMsgId
                  ? {
                      ...m,
                      isStreaming: false,
                      text: `⚠️ Error: ${errMessage}`,
                    }
                  : m
              )
            );
          },
        });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Retry failed";
        console.error("[Nexus Router] API Error Details:", errMsg);
        setError(errMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === failedAiMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  text: `⚠️ Error: ${errMsg}`,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, selectedModel, userEmail]
  );

  const exportCurrentChat = useCallback(
    (format: "markdown" | "json" | "pdf" = "markdown") => {
      const data = {
        sessionTitle,
        messages,
        selectedModel,
        userEmail,
      };
      if (format === "json") exportChatAsJson(data);
      else if (format === "pdf") exportChatAsPrintableDocument(data);
      else exportChatAsMarkdown(data);
    },
    [sessionTitle, messages, selectedModel, userEmail]
  );

  return {
    messages,
    setMessages,
    sessionTitle,
    setSessionTitle,
    isLoading,
    error,
    selectedModel,
    setSelectedModel,
    activeModelId: selectedModel,
    setActiveModelId: setSelectedModel,
    setModel: setSelectedModel,
    sendMessage,
    retryMessage,
    stopGeneration,
    exportCurrentChat,
  };
}
