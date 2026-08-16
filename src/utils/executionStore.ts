import { getStoredApiKeys, ApiKeys } from "./apiKeyStore";

export type ExecutionMode = "standard" | "byok";

const EXECUTION_MODE_STORAGE_KEY = "nexus_execution_mode";

export function getExecutionMode(): ExecutionMode {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(EXECUTION_MODE_STORAGE_KEY);
      if (stored === "byok" || stored === "standard") {
        return stored;
      }
    }
  } catch (err) {
    console.error("Failed to read execution mode from localStorage:", err);
  }
  return "standard";
}

export function setExecutionMode(mode: ExecutionMode): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(EXECUTION_MODE_STORAGE_KEY, mode);
      window.dispatchEvent(
        new CustomEvent("nexus-execution-mode-change", { detail: { mode } })
      );
    }
  } catch (err) {
    console.error("Failed to save execution mode to localStorage:", err);
  }
}

/**
 * Checks whether user has an active custom key stored for a specific model provider
 */
export function hasValidKeyForModel(modelId: string, userEmail?: string): boolean {
  const keys = getStoredApiKeys(userEmail);
  const lower = (modelId || "").toLowerCase();

  if (lower.includes("gemini")) {
    return Boolean(keys.gemini && keys.gemini.trim());
  }
  if (lower.includes("gpt") || lower.includes("openai") || lower.includes("sora")) {
    return Boolean(keys.openai && keys.openai.trim());
  }
  if (lower.includes("claude") || lower.includes("anthropic")) {
    return Boolean(keys.anthropic && keys.anthropic.trim());
  }
  if (lower.includes("grok") || lower.includes("xai")) {
    return Boolean(keys.xai && keys.xai.trim());
  }
  if (
    lower.includes("deepseek") ||
    lower.includes("llama") ||
    lower.includes("openrouter") ||
    lower.includes("free")
  ) {
    return Boolean(
      (keys.openrouter && keys.openrouter.trim()) || (keys.gemini && keys.gemini.trim())
    );
  }

  // Fallback check if any key exists
  return Boolean(
    keys.gemini || keys.openrouter || keys.openai || keys.anthropic || keys.xai
  );
}

/**
 * Returns required provider name for a model
 */
export function getRequiredProviderForModel(modelId: string): keyof ApiKeys {
  const lower = (modelId || "").toLowerCase();
  if (lower.includes("gpt") || lower.includes("openai")) return "openai";
  if (lower.includes("claude") || lower.includes("anthropic")) return "anthropic";
  if (lower.includes("grok") || lower.includes("xai")) return "xai";
  if (lower.includes("deepseek") || lower.includes("llama") || lower.includes("openrouter")) {
    return "openrouter";
  }
  return "gemini";
}
