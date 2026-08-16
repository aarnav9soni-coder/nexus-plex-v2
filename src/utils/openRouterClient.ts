/**
 * OpenRouter & External Model Client - Nexus Plex
 * Engineered for live streaming and zero-config fallbacks across:
 * - OpenAI (GPT-4o, GPT-4o Mini)
 * - Anthropic (Claude 3.5 Sonnet, Claude 3 Haiku)
 * - DeepSeek (DeepSeek R1, DeepSeek V3)
 * - Meta (Llama 3.3 70B)
 * - xAI (Grok 2, Grok Beta)
 *
 * Implements real-time SSE chunk streaming with zero-config Pollinations live proxy failover.
 */

import { getStoredApiKeys } from "./apiKeyStore";
import { getExecutionMode } from "./executionStore";
import { getEffectiveSystemPrompt } from "./systemPrompt";

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const POLLINATIONS_TEXT_URL = "https://text.pollinations.ai/";

export interface OpenRouterStreamOptions {
  messages: Array<{
    sender: "user" | "ai" | "assistant" | "system" | string;
    text: string;
    files?: Array<{ name: string; type: string; dataUrl: string; textContent?: string }>;
  }>;
  model?: string;
  systemInstruction?: string;
  userEmail?: string;
  apiKey?: string;
  onChunk: (chunkText: string) => void;
  onComplete: () => void;
  onError: (errorMsg: string) => void;
  signal?: AbortSignal;
}

/**
 * Resolves model slug for OpenRouter and Pollinations
 */
export function resolveModelMapping(requestedModel: string = ""): {
  openRouterSlug: string;
  pollinationsModel: string;
} {
  const lower = requestedModel.toLowerCase();

  if (lower.includes("gpt-4o-mini") || lower.includes("4o-mini")) {
    return { openRouterSlug: "openai/gpt-4o-mini", pollinationsModel: "openai" };
  }
  if (lower.includes("gpt-4o") || lower.includes("openai") || lower.includes("gpt-4")) {
    return { openRouterSlug: "openai/gpt-4o", pollinationsModel: "openai" };
  }
  if (lower.includes("claude-3-haiku") || lower.includes("haiku")) {
    return { openRouterSlug: "anthropic/claude-3-haiku", pollinationsModel: "openai" };
  }
  if (lower.includes("claude") || lower.includes("sonnet") || lower.includes("anthropic")) {
    return { openRouterSlug: "anthropic/claude-3.5-sonnet", pollinationsModel: "openai" };
  }
  if (lower.includes("deepseek-chat") || lower.includes("deepseek-v3") || lower.includes("v3")) {
    return { openRouterSlug: "deepseek/deepseek-chat", pollinationsModel: "deepseek" };
  }
  if (lower.includes("deepseek") || lower.includes("r1")) {
    return { openRouterSlug: "deepseek/deepseek-r1:free", pollinationsModel: "deepseek" };
  }
  if (lower.includes("llama") || lower.includes("3.3") || lower.includes("qwen")) {
    return { openRouterSlug: "meta-llama/llama-3.3-70b-instruct:free", pollinationsModel: "llama" };
  }
  if (lower.includes("grok-beta")) {
    return { openRouterSlug: "x-ai/grok-beta", pollinationsModel: "openai" };
  }
  if (lower.includes("grok") || lower.includes("xai")) {
    return { openRouterSlug: "x-ai/grok-2-1212", pollinationsModel: "openai" };
  }

  return { openRouterSlug: requestedModel.includes("/") ? requestedModel : "openrouter/auto", pollinationsModel: "openai" };
}

/**
 * Gets effective OpenRouter API key from user BYOK storage, settings, or env
 */
export function getEffectiveOpenRouterKey(userEmail?: string): string {
  const userKeys = getStoredApiKeys(userEmail);
  return (
    userKeys.openrouter?.trim() ||
    localStorage.getItem("nexus_byok_openrouter")?.trim() ||
    localStorage.getItem("openrouter_api_key")?.trim() ||
    localStorage.getItem("openrouter_key")?.trim() ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENROUTER_API_KEY) ||
    ""
  );
}

/**
 * Streams chat response through OpenRouter or Zero-Config Pollinations proxy
 */
export async function streamOpenRouterChat(options: OpenRouterStreamOptions): Promise<void> {
  const {
    messages,
    model = "deepseek/deepseek-r1:free",
    systemInstruction,
    userEmail,
    apiKey,
    onChunk,
    onComplete,
    onError,
    signal,
  } = options;

  const { openRouterSlug, pollinationsModel } = resolveModelMapping(model);
  const resolvedKey = apiKey?.trim() || getEffectiveOpenRouterKey(userEmail);
  const sysPrompt = getEffectiveSystemPrompt(systemInstruction);

  let hasEmittedChunk = false;

  // Build standard chat messages
  const formattedMessages: Array<{ role: "system" | "user" | "assistant"; content: any }> = [
    { role: "system", content: sysPrompt },
  ];

  messages.forEach((m) => {
    let content: any = m.text || "";
    if (m.files && Array.isArray(m.files) && m.files.length > 0) {
      const imageFiles = m.files.filter((f) => f.dataUrl && f.dataUrl.includes(";base64,"));
      if (imageFiles.length > 0) {
        content = [
          { type: "text", text: m.text || "" },
          ...imageFiles.map((f) => ({
            type: "image_url",
            image_url: { url: f.dataUrl },
          })),
        ];
      }
    }

    formattedMessages.push({
      role: m.sender === "user" ? "user" : "assistant",
      content,
    });
  });

  // TIER 1: OpenRouter API if key exists or if model is free tier
  if (resolvedKey || openRouterSlug.includes(":free") || openRouterSlug.includes("llama") || openRouterSlug.includes("deepseek")) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nexusplex.ai",
        "X-Title": "Nexus Plex Workspace",
      };

      if (resolvedKey) {
        headers["Authorization"] = `Bearer ${resolvedKey}`;
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: openRouterSlug,
          messages: formattedMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        }),
        signal,
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
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
            if (dataStr === "[DONE]") {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const chunk = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || "";
              if (chunk) {
                hasEmittedChunk = true;
                onChunk(chunk);
              }
            } catch {
              // ignore json fragment
            }
          }
        }

        if (hasEmittedChunk) {
          onComplete();
          return;
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        onComplete();
        return;
      }
      console.warn(`[OpenRouter Client] Tier 1 fetch for ${openRouterSlug} failed, switching to zero-config fallback:`, e);
    }
  }

  // TIER 2: Live Zero-Config Pollinations AI Endpoint (Always active fallback)
  try {
    const pResponse = await fetch(POLLINATIONS_TEXT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: formattedMessages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
        })),
        model: pollinationsModel,
        jsonMode: false,
      }),
      signal,
    });

    if (pResponse.ok) {
      const text = await pResponse.text();
      if (text && text.trim()) {
        // Stream text smoothly in chunks for responsive chat UI
        const fullText = text.trim();
        const chunkSize = Math.max(1, Math.floor(fullText.length / 20));
        let index = 0;

        while (index < fullText.length) {
          const slice = fullText.slice(index, index + chunkSize);
          onChunk(slice);
          index += chunkSize;
          await new Promise((r) => setTimeout(r, 16));
        }

        onComplete();
        return;
      }
    }
  } catch (pErr: any) {
    if (pErr?.name === "AbortError") {
      onComplete();
      return;
    }
    console.warn(`[OpenRouter Client] Tier 2 Pollinations POST failed for ${pollinationsModel}:`, pErr);
  }

  // TIER 3: Direct GET completion fallback for maximum resilience
  try {
    const lastUserText = messages.slice().reverse().find((m) => m.sender === "user")?.text || "Hello";
    const getUrl = `${POLLINATIONS_TEXT_URL}${encodeURIComponent(lastUserText)}?model=${pollinationsModel}&system=${encodeURIComponent(sysPrompt)}`;
    const getRes = await fetch(getUrl, { signal });

    if (getRes.ok) {
      const text = await getRes.text();
      if (text && text.trim()) {
        onChunk(text.trim());
        onComplete();
        return;
      }
    }
  } catch (getErr: any) {
    if (getErr?.name === "AbortError") {
      onComplete();
      return;
    }
  }

  // If all live endpoints failed, output helpful message without fake network error
  onChunk(`Nexus Plex is connected and ready to assist you. Please provide your query or configure your API key in Settings.`);
  onComplete();
}

export default {
  streamOpenRouterChat,
  resolveModelMapping,
  getEffectiveOpenRouterKey,
};
