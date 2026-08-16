export interface ApiKeys {
  gemini: string;
  openai: string;
  anthropic: string;
  xai: string;
  openrouter: string;
}

export type KeyStatusMap = Record<keyof ApiKeys, string>;

export const NEXUS_PLEX_KEYS_KEY = "nexus_plex_keys";
const DEFAULT_STORAGE_KEY = "workspace_user_guest";

export function getStorageKey(userEmail?: string): string {
  if (userEmail && userEmail.trim()) {
    return `workspace_user_${userEmail.trim().toLowerCase()}`;
  }
  return DEFAULT_STORAGE_KEY;
}

export function getStoredApiKeys(userEmail?: string): ApiKeys {
  let keys: ApiKeys = {
    gemini: "",
    openai: "",
    anthropic: "",
    xai: "",
    openrouter: "",
  };

  try {
    // Read from primary nexus_plex_keys first
    const rawGlobal = localStorage.getItem(NEXUS_PLEX_KEYS_KEY);
    if (rawGlobal) {
      const parsedGlobal = JSON.parse(rawGlobal);
      if (typeof parsedGlobal === "object" && parsedGlobal !== null) {
        keys = { ...keys, ...parsedGlobal };
      }
    }

    // Also check account-specific key if provided
    const storageKey = getStorageKey(userEmail);
    const rawAccount = localStorage.getItem(storageKey);
    if (rawAccount) {
      const parsed = JSON.parse(rawAccount);
      if (parsed.user_custom_api_keys) {
        keys = { ...keys, ...parsed.user_custom_api_keys };
      } else if (typeof parsed === "object") {
        keys = { ...keys, ...parsed };
      }
    }
  } catch (err) {
    console.error("Failed to read API keys from localStorage:", err);
  }

  // Fallbacks for standalone keys or legacy storage
  if (!keys.openrouter) {
    const standaloneOr =
      localStorage.getItem("openrouter_api_key") ||
      localStorage.getItem("openrouter_key") ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_OPENROUTER_API_KEY) ||
      "";
    if (standaloneOr) keys.openrouter = standaloneOr;
  }

  if (!keys.gemini) {
    const standaloneGemini =
      localStorage.getItem("gemini_api_key") ||
      localStorage.getItem("gemini_key") ||
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
      "";
    if (standaloneGemini) keys.gemini = standaloneGemini;
  }

  return keys;
}

export function getStoredKeyStatuses(userEmail?: string): KeyStatusMap {
  const defaultStatuses: KeyStatusMap = {
    gemini: "",
    openai: "",
    anthropic: "",
    xai: "",
    openrouter: "",
  };

  try {
    const storageKey = getStorageKey(userEmail);
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.keyStatuses) {
        return { ...defaultStatuses, ...parsed.keyStatuses };
      }
    }
  } catch (err) {
    console.error("Failed to read key statuses from localStorage:", err);
  }

  return defaultStatuses;
}

export function saveStoredApiKeys(
  keys: Partial<ApiKeys>,
  userEmail?: string,
  statuses?: Partial<KeyStatusMap>
): ApiKeys {
  const current = getStoredApiKeys(userEmail);
  const updated = { ...current, ...keys };
  const currentStatuses = getStoredKeyStatuses(userEmail);
  const updatedStatuses = { ...currentStatuses, ...statuses };

  try {
    // Save to nexus_plex_keys global key
    localStorage.setItem(NEXUS_PLEX_KEYS_KEY, JSON.stringify(updated));

    // Save to user storage key
    const storageKey = getStorageKey(userEmail);
    const raw = localStorage.getItem(storageKey);
    let obj: any = {};
    if (raw) {
      try {
        obj = JSON.parse(raw);
      } catch {
        obj = {};
      }
    }

    obj.user_custom_api_keys = updated;
    obj.keyStatuses = updatedStatuses;
    localStorage.setItem(storageKey, JSON.stringify(obj));

    // Also sync standalone keys for legacy global handlers
    if (updated.openrouter) {
      localStorage.setItem("openrouter_api_key", updated.openrouter);
    } else {
      localStorage.removeItem("openrouter_api_key");
    }

    if (updated.gemini) {
      localStorage.setItem("gemini_api_key", updated.gemini);
    } else {
      localStorage.removeItem("gemini_api_key");
    }

    // Trigger custom event for reactive UI updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nexus-api-keys-updated", { detail: updated }));
    }
  } catch (err) {
    console.error("Failed to save API keys to localStorage:", err);
  }
  return updated;
}

export function getStoredCustomKey(
  provider: keyof ApiKeys | string,
  userEmail?: string
): string {
  const keys = getStoredApiKeys(userEmail);
  const normalized = (provider || "").toLowerCase() as keyof ApiKeys;
  return keys[normalized] || "";
}

export function clearStoredApiKeys(userEmail?: string): void {
  try {
    localStorage.removeItem(NEXUS_PLEX_KEYS_KEY);
    const storageKey = getStorageKey(userEmail);
    localStorage.removeItem(storageKey);
    localStorage.removeItem("openrouter_api_key");
    localStorage.removeItem("gemini_api_key");

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nexus-api-keys-updated", { detail: {} }));
    }
  } catch (err) {
    console.error("Failed to clear API keys from localStorage:", err);
  }
}

export interface KeyTestResult {
  valid: boolean;
  status: "Verified & Active" | "Refused Connection" | "Saved (Unverified)";
  message: string;
  statusCode?: number;
}

/**
  Real Verification Engine:
  Lightweight network pings against official provider endpoints before saving
 */
export async function testApiKey(
  provider: keyof ApiKeys,
  key: string
): Promise<KeyTestResult> {
  const cleanKey = key ? key.trim() : "";
  if (!cleanKey) {
    return {
      valid: false,
      status: "Refused Connection",
      message: "Please enter a valid API key.",
    };
  }

  try {
    let url = "";
    let headers: Record<string, string> = {};

    if (provider === "gemini") {
      url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
    } else if (provider === "openrouter") {
      url = "https://openrouter.ai/api/v1/models";
      headers = { Authorization: `Bearer ${cleanKey}` };
    } else if (provider === "openai") {
      url = "https://api.openai.com/v1/models";
      headers = { Authorization: `Bearer ${cleanKey}` };
    } else if (provider === "anthropic") {
      url = "https://api.anthropic.com/v1/models";
      headers = {
        "x-api-key": cleanKey,
        "anthropic-version": "2023-06-01",
      };
    } else if (provider === "xai") {
      url = "https://api.x.ai/v1/models";
      headers = { Authorization: `Bearer ${cleanKey}` };
    } else {
      url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { method: "GET", headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok || res.status === 200) {
      return {
        valid: true,
        status: "Verified & Active",
        message: `${provider.toUpperCase()} API Key Verified & Active`,
        statusCode: res.status,
      };
    } else {
      let errDetail = "";
      try {
        const json = await res.json();
        errDetail = json.error?.message || json.message || JSON.stringify(json);
      } catch {
        errDetail = await res.text().catch(() => "");
      }
      const rawErrorMsg = errDetail
        ? `HTTP ${res.status}: ${errDetail.slice(0, 150)}`
        : `HTTP ${res.status}: Provider Refused Connection`;

      return {
        valid: false,
        status: "Refused Connection",
        message: rawErrorMsg,
        statusCode: res.status,
      };
    }
  } catch (err: any) {
    console.warn(`Key validation network/CORS fallback triggered for ${provider}:`, err);
    // CORS or Network restriction - Fallback to allow saving with Saved (Unverified) warning
    return {
      valid: true,
      status: "Saved (Unverified)",
      message: "Key saved (Unverified due to browser CORS network policy)",
    };
  }
}
