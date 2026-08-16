/**
 * Intelligent Dynamic Chat Titling Engine
 * Nexus Plex Architecture - Engineered by Lead Developer & Architect Aarnav.
 *
 * Implements:
 * 1. AI-powered 2-to-4 word concise, professional topic summarization
 * 2. Multi-tier provider fallback (Gemini API -> Pollinations OpenRouter -> Rule-based extractor)
 * 3. Real-time background invocation and instant session state synchronization
 */

import { getStoredApiKeys } from "./apiKeyStore";
import { getApiModelId } from "./modelConfig";
import { fetchTextWithFallback } from "./pollinationsApi";

const SYSTEM_TITLING_DIRECTIVE =
  "Analyze the first user message and generate a concise, professional 2-to-4 word title reflecting the core topic. Output ONLY the short title. No quotes, no markdown, no punctuation.";

/**
 * Asynchronously generates a clean 2-to-4 word title for a chat session based on the first user prompt.
 */
export async function generateSmartTitle(
  userPrompt: string,
  userEmail?: string
): Promise<string> {
  const cleanInput = (userPrompt || "").trim();
  if (!cleanInput) return "New Conversation";

  // Tier 1: Try server-side streaming endpoint /api/chat with Gemini
  try {
    const userKeys = getStoredApiKeys(userEmail);
    const activeModelId = getApiModelId("gemini-3.7-flash");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            sender: "user",
            text: `${SYSTEM_TITLING_DIRECTIVE}\n\nFirst message: "${cleanInput.slice(0, 400)}"`,
          },
        ],
        model: activeModelId,
        systemInstruction: SYSTEM_TITLING_DIRECTIVE,
        userKeys,
      }),
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let fullTitleText = "";

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
          if (dataStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              fullTitleText += parsed.text;
            }
          } catch {
            // ignore stream chunk parse errors
          }
        }
      }

      const cleaned = cleanRawTitle(fullTitleText);
      if (isValidTitle(cleaned)) {
        return cleaned;
      }
    }
  } catch (err) {
    console.warn("[Nexus TitleGen] Direct server chat titling error, trying Tier 2 fallback:", err);
  }

  // Tier 2: Resilient text endpoint (Pollinations / OpenAI / Gemini proxy)
  try {
    const fallbackRes = await fetchTextWithFallback({
      prompt: `${SYSTEM_TITLING_DIRECTIVE}\n\nMessage: "${cleanInput.slice(0, 300)}"`,
      systemPrompt: SYSTEM_TITLING_DIRECTIVE,
      primaryModel: "openai",
      engineMode: "cloud",
    });

    const cleaned = cleanRawTitle(fallbackRes.text);
    if (isValidTitle(cleaned)) {
      return cleaned;
    }
  } catch (err) {
    console.warn("[Nexus TitleGen] Fallback API titling error:", err);
  }

  // Tier 3: High-speed heuristic rule-based topic extractor
  return fallbackRuleTitle(cleanInput);
}

/**
 * Sanitizes model output down to 2-4 clean title words
 */
function cleanRawTitle(raw: string): string {
  return raw
    .replace(/^["'`#*\-_–—\s]+|["'`#*\-_–—\s]+$/g, "")
    .replace(/^(title|topic|subject):\s*/i, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\w\s\d-]/g, "")
    .trim();
}

function isValidTitle(title: string): boolean {
  if (!title) return false;
  const words = title.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 6 && title.length < 50;
}

/**
 * Heuristic fallback when network is unavailable
 */
export function fallbackRuleTitle(prompt: string): string {
  const clean = prompt
    .replace(/^\/(vision|art|draw|image|ppt|slide|video|music|audio|reason|code|scrape)\s*/gi, "")
    .replace(/https?:\/\/[^\s]+/gi, "Web Resource")
    .replace(/[^\w\s]/gi, " ")
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length === 0) return "New Conversation";
  if (words.length <= 4) {
    return capitalizeWords(words.join(" "));
  }
  return capitalizeWords(words.slice(0, 4).join(" "));
}

function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
