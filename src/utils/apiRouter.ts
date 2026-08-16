/**
 * API Router & Model Definition Module
 * Standardizes OpenRouter, Pollinations, and Gemini model endpoints, keys, and headers.
 */

import { getStoredApiKeys } from "./apiKeyStore";
import { getExecutionMode } from "./executionStore";
import { getEffectiveSystemPrompt, isIdentityQuestion, getIdentityResponse } from "./systemPrompt";
import { getApiModelId } from "./modelConfig";

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const POLLINATIONS_TEXT_URL = "https://text.pollinations.ai/";
export const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const OPEN_SOURCE_MODEL_SLUGS = {
  deepseekR1: "deepseek/deepseek-r1:free",
  deepseekChat: "deepseek/deepseek-chat",
  llama: "meta-llama/llama-3.3-70b-instruct:free",
  gpt4oMini: "openai/gpt-4o-mini",
  gpt4o: "openai/gpt-4o",
  claudeSonnet: "anthropic/claude-3.5-sonnet",
  claudeHaiku: "anthropic/claude-3-haiku",
  grok2: "x-ai/grok-2-1212",
  grokBeta: "x-ai/grok-beta",
  openrouterAuto: "openrouter/auto",
};

/**
 * Resolves the active Gemini API key from user BYOK storage, standalone storage, or environment default
 */
export function getEffectiveGeminiKey(userEmail?: string): string {
  const userKeys = getStoredApiKeys(userEmail);

  const keyFromStorage =
    localStorage.getItem("nexus_byok_key")?.trim() ||
    localStorage.getItem("gemini_api_key")?.trim() ||
    localStorage.getItem("gemini_key")?.trim() ||
    "";

  return (
    userKeys.gemini?.trim() ||
    keyFromStorage ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
    ""
  );
}

/**
 * Resolves the active OpenRouter API key from user BYOK storage, standalone storage, or environment default
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
 * Returns standardized request headers required for open-source AI routers
 */
export function getStandardApiHeaders(
  apiKey?: string,
  userEmail?: string
): Record<string, string> {
  const resolvedKey = apiKey?.trim() || getEffectiveOpenRouterKey(userEmail);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "HTTP-Referer": "https://nexusplex.ai",
    "X-Title": "Nexus Plex Workspace",
  };

  if (resolvedKey) {
    headers["Authorization"] = `Bearer ${resolvedKey}`;
  }

  return headers;
}

/**
 * Maps model parameter names to OpenRouter free slugs or Pollinations models
 */
export function resolveOpenSourceModelSlug(requestedModel: string): {
  openRouterSlug: string;
  pollinationsModel: string;
} {
  const lower = (requestedModel || "").toLowerCase();

  if (lower.includes("gpt-4o-mini") || lower.includes("mini")) {
    return {
      openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.gpt4oMini,
      pollinationsModel: "openai",
    };
  }
  if (lower.includes("gpt-4o") || lower.includes("openai")) {
    return {
      openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.gpt4o,
      pollinationsModel: "openai",
    };
  }
  if (lower.includes("claude-3-haiku") || lower.includes("haiku")) {
    return {
      openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.claudeHaiku,
      pollinationsModel: "openai",
    };
  }
  if (lower.includes("claude") || lower.includes("sonnet") || lower.includes("anthropic")) {
    return {
      openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.claudeSonnet,
      pollinationsModel: "openai",
    };
  }
  if (lower.includes("deepseek-chat") || lower.includes("v3")) {
    return {
      openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.deepseekChat,
      pollinationsModel: "deepseek",
    };
  }
  if (lower.includes("deepseek") || lower.includes("r1")) {
    return {
      openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.deepseekR1,
      pollinationsModel: "deepseek",
    };
  }
  if (lower.includes("llama") || lower.includes("3.3") || lower.includes("qwen")) {
    return {
      openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.llama,
      pollinationsModel: "llama",
    };
  }
  if (lower.includes("grok-beta")) {
    return {
      openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.grokBeta,
      pollinationsModel: "openai",
    };
  }
  if (lower.includes("grok") || lower.includes("xai")) {
    return {
      openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.grok2,
      pollinationsModel: "openai",
    };
  }

  return {
    openRouterSlug: OPEN_SOURCE_MODEL_SLUGS.openrouterAuto,
    pollinationsModel: "qwen",
  };
}

/**
 * Standardizes UI dropdown model selections to valid official API endpoints
 */
export function resolveModelEndpoint(requestedModel: string = "gemini-3.7-flash"): string {
  return getApiModelId(requestedModel);
}

/**
 * Unified processPrompt handler for apiRouter
 */
export async function processPrompt(
  prompt: string,
  options: {
    selectedModel?: string;
    systemPrompt?: string;
    userEmail?: string;
    signal?: AbortSignal;
  } = {}
): Promise<string> {
  if (isIdentityQuestion(prompt)) {
    return getIdentityResponse();
  }
  const resolvedModel = resolveModelEndpoint(options.selectedModel || "gemini-3.7-flash");
  console.log(`[Nexus Plex Router] Dispatching request to model: ${resolvedModel}`);

  const { executeLlmWithCircuitBreaker } = await import("./llmService");
  return executeLlmWithCircuitBreaker({
    messages: [{ sender: "user", text: prompt }],
    selectedModel: resolvedModel,
    systemPrompt: getEffectiveSystemPrompt(options.systemPrompt),
    userEmail: options.userEmail || "",
    signal: options.signal,
  });
}

export const apiRouter = {
  processPrompt,
  getStandardApiHeaders,
  resolveOpenSourceModelSlug,
  resolveModelEndpoint,
  getEffectiveGeminiKey,
  getEffectiveOpenRouterKey,
};


