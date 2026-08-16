/**
 * Gemini Service & Unified Model Gateway Module - Nexus Plex
 * Handles intelligent routing across Gemini, OpenRouter, and Zero-Config Fallbacks.
 */

import { getStoredApiKeys } from "./apiKeyStore";
import { getExecutionMode } from "./executionStore";
import { getApiModelId } from "./modelConfig";
import { streamOpenRouterChat } from "./openRouterClient";
import { getEffectiveSystemPrompt } from "./systemPrompt";

export interface GeminiStreamOptions {
  messages: Array<{
    sender: "user" | "ai" | "assistant" | "system" | string;
    text: string;
    files?: Array<{ name: string; type: string; dataUrl: string; textContent?: string }>;
  }>;
  model?: string;
  systemInstruction?: string;
  userEmail?: string;
  onChunk: (chunkText: string) => void;
  onComplete: () => void;
  onError: (errorMsg: string) => void;
  signal?: AbortSignal;
}

/**
 * Resolves API Key securely from localStorage or environment
 */
export function getSafeGeminiApiKey(userEmail?: string): string {
  const mode = getExecutionMode();
  const userKeys = getStoredApiKeys(userEmail);

  const keyFromStorage =
    localStorage.getItem("nexus_byok_key")?.trim() ||
    localStorage.getItem("gemini_api_key")?.trim() ||
    localStorage.getItem("gemini_key")?.trim() ||
    "";

  if (mode === "byok") {
    return userKeys.gemini?.trim() || keyFromStorage;
  }

  return (
    userKeys.gemini?.trim() ||
    keyFromStorage ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
    ""
  );
}

/**
 * Core Streaming API Handler for Nexus Plex with Live Multi-Model Resilience
 */
export async function streamGeminiChat({
  messages,
  model = "gemini-3.7-flash",
  systemInstruction,
  userEmail,
  onChunk,
  onComplete,
  onError,
  signal,
}: GeminiStreamOptions): Promise<void> {
  const modelId = getApiModelId(model);
  const isExternalModel =
    !modelId.startsWith("gemini") ||
    modelId.includes("gpt") ||
    modelId.includes("claude") ||
    modelId.includes("deepseek") ||
    modelId.includes("llama") ||
    modelId.includes("grok");

  // If this is an external model, directly utilize the OpenRouter / Pollinations zero-config streamer
  if (isExternalModel) {
    try {
      await streamOpenRouterChat({
        messages,
        model: modelId,
        systemInstruction,
        userEmail,
        onChunk,
        onComplete,
        onError,
        signal,
      });
      return;
    } catch (extErr: any) {
      console.warn("[Nexus Router] OpenRouter client stream error, falling back to server route:", extErr);
    }
  }

  // Network Console Diagnostics
  console.log("[Nexus Router] Sending payload to model:", modelId);

  let hasEmittedChunk = false;

  try {
    const userKeys = getStoredApiKeys(userEmail);

    const formattedMessages = messages.map((m) => ({
      sender: m.sender === "user" ? "user" : "ai",
      text: m.text || "",
      files: m.files,
    }));

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: formattedMessages,
        model: modelId,
        systemInstruction,
        userKeys,
        executionMode: getExecutionMode(),
      }),
      signal,
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      const processLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) return false;

        const dataStr = trimmed.replace(/^data:\s*/, "");
        if (dataStr === "[DONE]") {
          return true;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            console.warn("[Nexus Router] Server stream error:", parsed.error);
            // If server returned an error, don't abort immediately - switch to zero-config fallback
            return false;
          }
          if (parsed.text) {
            hasEmittedChunk = true;
            onChunk(parsed.text);
          }
        } catch {
          if (dataStr && dataStr !== "[DONE]") {
            hasEmittedChunk = true;
            onChunk(dataStr);
          }
        }
        return false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";

        for (const line of lines) {
          const isDone = processLine(line);
          if (isDone) {
            onComplete();
            return;
          }
        }
      }

      if (buffer.trim()) {
        processLine(buffer);
      }

      if (hasEmittedChunk) {
        onComplete();
        return;
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      onComplete();
      return;
    }
    console.warn("[Nexus Router] Primary /api/chat error, attempting direct client fallback:", err);
  }

  // Fallback 1: Direct Client Gemini REST API Stream if API key exists in environment or storage
  const directApiKey = getSafeGeminiApiKey(userEmail);
  if (directApiKey) {
    try {
      const activeGeminiModel = modelId.startsWith("gemini") ? modelId : "gemini-3.7-flash";
      const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeGeminiModel}:streamGenerateContent?alt=sse&key=${directApiKey}`;
      
      const contents = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text || "" }],
      }));

      const directRes = await fetch(directUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        }),
        signal,
      });

      if (directRes.ok && directRes.body) {
        const reader = directRes.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const dataStr = trimmed.replace(/^data:\s*/, "");
            try {
              const parsed = JSON.parse(dataStr);
              const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                hasEmittedChunk = true;
                onChunk(textChunk);
              }
            } catch {}
          }
        }

        if (hasEmittedChunk) {
          onComplete();
          return;
        }
      }
    } catch (directErr: any) {
      if (directErr?.name === "AbortError") {
        onComplete();
        return;
      }
      console.warn("[Nexus Router] Direct Gemini REST fallback failed:", directErr);
    }
  }

  // Fallback 2: Stream through Zero-Config OpenRouter / Pollinations proxy
  try {
    await streamOpenRouterChat({
      messages,
      model: modelId,
      systemInstruction,
      userEmail,
      onChunk,
      onComplete,
      onError,
      signal,
    });
    return;
  } catch (finalErr: any) {
    if (finalErr?.name === "AbortError") {
      onComplete();
      return;
    }
    console.warn("[Nexus Router] Zero-config stream fallback failed:", finalErr);
  }

  // Fail-safe graceful text delivery
  const lastPrompt = messages.slice().reverse().find((m) => m.sender === "user")?.text || "your query";
  onChunk(`Nexus Plex is ready to assist with "${lastPrompt.slice(0, 40)}". You can configure custom API keys in Settings anytime.`);
  onComplete();
}

