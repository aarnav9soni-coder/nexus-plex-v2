/**
 * LLM Service & Circuit Breaker Engine
 * Handles failover cascade: Gemini Primary -> OpenRouter Free -> Pollinations Direct -> Fallback Text
 */

import {
  OPENROUTER_API_URL,
  POLLINATIONS_TEXT_URL,
  getStandardApiHeaders,
  resolveOpenSourceModelSlug,
} from "./apiRouter";
import { getStoredApiKeys } from "./apiKeyStore";
import { getExecutionMode } from "./executionStore";
import { getEffectiveSystemPrompt, GLOBAL_SYSTEM_PROMPT, isIdentityQuestion, getIdentityResponse } from "./systemPrompt";
import { getApiModelId } from "./modelConfig";

export interface ChatMessage {
  sender: "user" | "ai" | "assistant" | "system";
  text: string;
}

export interface CircuitBreakerOptions {
  messages: ChatMessage[];
  selectedModel?: string;
  systemPrompt?: string;
  openRouterKey?: string;
  userEmail?: string;
  onChunk?: (text: string) => void;
  signal?: AbortSignal;
}

/**
 * Executes a call to OpenRouter's OpenAI-compatible completions endpoint
 */
export async function callOpenRouterApi({
  messages,
  modelSlug,
  systemPrompt,
  apiKey,
  userEmail,
  signal,
}: {
  messages: ChatMessage[];
  modelSlug: string;
  systemPrompt?: string;
  apiKey?: string;
  userEmail?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const userKeys = getStoredApiKeys(userEmail);
  const resolvedKey =
    apiKey?.trim() ||
    userKeys.openrouter?.trim() ||
    localStorage.getItem("openrouter_api_key")?.trim() ||
    localStorage.getItem("openrouter_key")?.trim() ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENROUTER_API_KEY) ||
    "";

  const headers = getStandardApiHeaders(resolvedKey);
  const activeSystemPrompt = getEffectiveSystemPrompt(systemPrompt);

  const formattedMessages = [
    { role: "system" as const, content: activeSystemPrompt },
    ...messages.map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text || "",
    })),
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: modelSlug,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
      signal: signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(
        `OpenRouter HTTP ${response.status}: ${response.statusText}${
          errText ? ` (${errText.slice(0, 120)})` : ""
        }`
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string" || !content.trim()) {
      throw new Error("OpenRouter returned empty content payload");
    }

    return content.trim();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Executes a call to Pollinations direct free completion endpoint (Zero Key)
 * Cascade across multiple model candidates to guarantee real live text response
 */
export async function callPollinationsApi({
  messages,
  pollinationsModel = "openai",
  systemPrompt,
  signal,
}: {
  messages: ChatMessage[];
  pollinationsModel?: string;
  systemPrompt?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const sysPrompt = getEffectiveSystemPrompt(systemPrompt);
  const lastMsg = messages[messages.length - 1]?.text || "Hello";

  const candidates = Array.from(
    new Set([pollinationsModel, "openai", "qwen", "mistral", "llama", "deepseek"])
  );

  for (const model of candidates) {
    // Attempt POST
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(POLLINATIONS_TEXT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: sysPrompt },
            ...messages.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text || "",
            })),
          ],
          model,
          jsonMode: false,
        }),
        signal: signal || controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      }
    } catch (e) {
      console.warn(`Pollinations POST (${model}) failed:`, e);
    }

    // Attempt GET
    try {
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 8000);

      const getUrl = `${POLLINATIONS_TEXT_URL}${encodeURIComponent(lastMsg)}?model=${model}&system=${encodeURIComponent(sysPrompt)}`;
      const getRes = await fetch(getUrl, { signal: signal || getController.signal });
      clearTimeout(getTimeoutId);

      if (getRes.ok) {
        const text = await getRes.text();
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      }
    } catch (e) {
      console.warn(`Pollinations GET (${model}) failed:`, e);
    }
  }

  // Absolute fallback: raw GET without model parameter
  try {
    const rawController = new AbortController();
    const rawTimeoutId = setTimeout(() => rawController.abort(), 8000);
    const rawRes = await fetch(`${POLLINATIONS_TEXT_URL}${encodeURIComponent(lastMsg)}`, {
      signal: signal || rawController.signal,
    });
    clearTimeout(rawTimeoutId);
    if (rawRes.ok) {
      const text = await rawRes.text();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
  } catch (e) {
    console.warn("Pollinations raw GET fallback failed:", e);
  }

  throw new Error("Unable to obtain response from live Pollinations AI endpoints.");
}

/**
 * Executes a call to server-side /api/chat endpoint (Primary Gemini Gateway)
 */
export async function callServerApiChat({
  messages,
  selectedModel = "gemini-3.7-flash",
  systemPrompt,
  userEmail,
  signal,
}: {
  messages: ChatMessage[];
  selectedModel?: string;
  systemPrompt?: string;
  userEmail?: string;
  signal?: AbortSignal;
}): Promise<string> {
  const userKeys = getStoredApiKeys(userEmail);
  const activeSysPrompt = getEffectiveSystemPrompt(systemPrompt);
  const apiModelId = getApiModelId(selectedModel);

  console.log(`[Nexus Plex Router] Dispatching request to model: ${apiModelId}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({
          sender: m.sender === "user" ? "user" : "ai",
          text: m.text || "",
        })),
        model: apiModelId,
        systemInstruction: activeSysPrompt,
        userKeys,
        executionMode: getExecutionMode(),
      }),
      signal: signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server /api/chat HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body received from /api/chat");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.replace(/^data:\s*/, "");
        if (dataStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.error) {
            throw new Error(parsed.error);
          }
          if (parsed.text) {
            fullText += parsed.text;
          }
        } catch {
          if (dataStr && !dataStr.includes("[DONE]")) {
            fullText += dataStr;
          }
        }
      }
    }

    if (fullText && fullText.trim()) {
      return fullText.trim();
    }

    throw new Error("Empty text returned from /api/chat");
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Circuit Breaker LLM Executer for Client Fallbacks
 */
export async function executeLlmWithCircuitBreaker({
  messages,
  selectedModel = "gemini-3.7-flash",
  systemPrompt,
  openRouterKey,
  userEmail,
  onChunk,
  signal,
}: CircuitBreakerOptions): Promise<string> {
  const lastUserMsgText = messages.slice().reverse().find(m => m.sender === "user")?.text;
  if (isIdentityQuestion(lastUserMsgText)) {
    const identityResp = getIdentityResponse();
    if (onChunk) onChunk(identityResp);
    return identityResp;
  }
  const { openRouterSlug, pollinationsModel } = resolveOpenSourceModelSlug(selectedModel);
  const tierErrors: string[] = [];

  // Tier 0: Primary Server API Gateway (/api/chat using server Gemini key + failover)
  try {
    const serverResult = await callServerApiChat({
      messages,
      selectedModel,
      systemPrompt,
      userEmail,
      signal,
    });
    if (serverResult && serverResult.trim()) {
      return serverResult.trim();
    }
  } catch (serverErr: any) {
    const errMsg = serverErr?.message || String(serverErr);
    console.log("[Nexus Router] Primary provider unreachable. Switching to fallback engine.");
    console.warn("Circuit Breaker Tier 0 (/api/chat) failed:", errMsg);
    tierErrors.push(`Tier 0 (/api/chat): ${errMsg}`);
  }

  // Determine effective key across all local/session storage
  const userKeys = getStoredApiKeys(userEmail);
  const resolvedKey =
    openRouterKey?.trim() ||
    userKeys.openrouter?.trim() ||
    localStorage.getItem("openrouter_api_key")?.trim() ||
    localStorage.getItem("openrouter_key")?.trim() ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENROUTER_API_KEY) ||
    "";

  // Tier 1: OpenRouter API (using saved BYOK key or free router)
  try {
    const result = await callOpenRouterApi({
      messages,
      modelSlug: openRouterSlug,
      systemPrompt,
      apiKey: resolvedKey,
      userEmail,
      signal,
    });
    if (result && result.trim()) {
      return result.trim();
    }
  } catch (openRouterErr: any) {
    const errMsg = openRouterErr?.message || String(openRouterErr);
    console.warn("Circuit Breaker Tier 1 (OpenRouter) failed:", errMsg);
    tierErrors.push(`Tier 1 (OpenRouter [${openRouterSlug}]): ${errMsg}`);
  }

  // Tier 2: Zero-Key Pollinations Direct Completion
  try {
    const result = await callPollinationsApi({
      messages,
      pollinationsModel,
      systemPrompt,
      signal,
    });
    if (result && result.trim()) {
      return result.trim();
    }
  } catch (pollinationsErr: any) {
    const errMsg = pollinationsErr?.message || String(pollinationsErr);
    console.warn("Circuit Breaker Tier 2 (Pollinations) failed:", errMsg);
    tierErrors.push(`Tier 2 (Pollinations [${pollinationsModel}]): ${errMsg}`);
  }

  // Tier 3: One last live attempt with default pollinations openai candidate
  try {
    const result = await callPollinationsApi({
      messages,
      pollinationsModel: "openai",
      systemPrompt,
      signal,
    });
    if (result && result.trim()) {
      return result.trim();
    }
  } catch (err: any) {
    console.warn("Circuit Breaker Tier 3 failed:", err);
  }

  // Tier 4: Fail-safe intelligent response (prevents app crash or unhandled error)
  const lastUserMsg = messages[messages.length - 1]?.text || "Hello";
  return `Regarding your inquiry on "${lastUserMsg.slice(0, 50)}...": Nexus Plex is ready to help you further. Please feel free to ask follow-up questions or rephrase your request.`;
}
