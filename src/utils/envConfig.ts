/**
 * Environment Variable & Key Fallback Configuration
 * Nexus Plex Architecture - Engineered by Lead Developer & Architect Aarnav.
 *
 * Implements Zero-Crash safe fallbacks for missing environment variables:
 * 1. User BYOK LocalStorage ('nexus_plex_keys', 'gemini_api_key', 'openrouter_api_key')
 * 2. System Environment Variables (import.meta.env)
 * 3. Graceful public/demo router fallbacks (No runtime crash on startup)
 */

import { getStoredApiKeys } from "./apiKeyStore";

export interface EnvConfig {
  geminiApiKey: string;
  openrouterApiKey: string;
  replicateApiKey: string;
  pollinationsApiKey: string;
  stabilityApiKey: string;
  isCustomKeySet: boolean;
}

/**
 * Safely resolves an environment or localStorage key with zero runtime exceptions
 */
export function getSafeApiKey(keyName: string, userEmail?: string): string {
  try {
    // 1. Check BYOK user storage
    const stored = getStoredApiKeys(userEmail);
    const lower = keyName.toLowerCase();

    if (lower.includes("gemini") && stored.gemini) {
      return stored.gemini.trim();
    }
    if (lower.includes("openrouter") && stored.openrouter) {
      return stored.openrouter.trim();
    }
    if (lower.includes("openai") && stored.openai) {
      return stored.openai.trim();
    }
    if (lower.includes("anthropic") && stored.anthropic) {
      return stored.anthropic.trim();
    }
    if (lower.includes("xai") && stored.xai) {
      return stored.xai.trim();
    }

    // 2. Check standalone localStorage keys
    const directStorage =
      localStorage.getItem(`${lower}_api_key`) ||
      localStorage.getItem(keyName) ||
      localStorage.getItem(keyName.toUpperCase()) ||
      localStorage.getItem(`VITE_${keyName.toUpperCase()}`);
    if (directStorage && directStorage.trim()) {
      return directStorage.trim();
    }

    // 3. Check Vite / System Environment variables
    if (typeof import.meta !== "undefined" && import.meta.env) {
      const envKey =
        import.meta.env[`VITE_${keyName.toUpperCase()}`] ||
        import.meta.env[keyName.toUpperCase()] ||
        import.meta.env[keyName];
      if (envKey && typeof envKey === "string" && envKey.trim()) {
        return envKey.trim();
      }
    }
  } catch (err) {
    console.warn(`[Nexus Config] Safe key retrieval notice for ${keyName}:`, err);
  }

  // Graceful empty fallback - Zero Crash Guarantee
  return "";
}

export const ENV_CONFIG: EnvConfig = {
  get geminiApiKey() {
    return getSafeApiKey("GEMINI_API_KEY");
  },
  get openrouterApiKey() {
    return getSafeApiKey("OPENROUTER_API_KEY");
  },
  get replicateApiKey() {
    return getSafeApiKey("REPLICATE_API_KEY");
  },
  get pollinationsApiKey() {
    return getSafeApiKey("POLLINATIONS_API_KEY");
  },
  get stabilityApiKey() {
    return getSafeApiKey("STABILITY_API_KEY");
  },
  get isCustomKeySet() {
    const keys = getStoredApiKeys();
    return Boolean(keys.gemini || keys.openrouter || keys.openai || keys.anthropic || keys.xai);
  },
};

/**
 * Returns true if an API key is available, or false if it falls back to public routing
 */
export function hasUsableKey(service: "gemini" | "openrouter" | "pollinations"): boolean {
  if (service === "gemini") return Boolean(ENV_CONFIG.geminiApiKey);
  if (service === "openrouter") return Boolean(ENV_CONFIG.openrouterApiKey);
  if (service === "pollinations") return true; // Pollinations supports free tier by default
  return false;
}
