/**
 * Centralized Chat Session & Storage Engine
 * Nexus Plex Architecture - Engineered by Lead Developer & Architect Aarnav.
 */

import { generateSmartTitle } from "./titleGenerator";
import { getUserStorageKey } from "./apiKeyStore";

export interface ChatSessionItem {
  id: string;
  title: string;
  createdAt: string;
  messagesCount: number;
}

/**
 * Automatically triggers AI dynamic auto-titling for a session and notifies listeners
 */
export async function triggerSessionAutoTitle({
  sessionId,
  firstUserPrompt,
  userEmail,
  onTitleGenerated,
}: {
  sessionId: string;
  firstUserPrompt: string;
  userEmail?: string;
  onTitleGenerated?: (newTitle: string) => void;
}): Promise<string> {
  try {
    const generatedTitle = await generateSmartTitle(firstUserPrompt, userEmail);

    if (generatedTitle && generatedTitle.trim()) {
      // Update localStorage for active user
      const userKey = getUserStorageKey(userEmail);
      const rawSessions = localStorage.getItem(`${userKey}_sessions`);
      if (rawSessions) {
        try {
          const sessions: ChatSessionItem[] = JSON.parse(rawSessions);
          const updated = sessions.map((s) =>
            s.id === sessionId ? { ...s, title: generatedTitle } : s
          );
          localStorage.setItem(`${userKey}_sessions`, JSON.stringify(updated));
        } catch {
          // ignore parse error
        }
      }

      // Notify callback
      if (onTitleGenerated) {
        onTitleGenerated(generatedTitle);
      }

      // Dispatch global window event for cross-component sync
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("nexus-session-title-updated", {
            detail: { sessionId, title: generatedTitle },
          })
        );
      }

      return generatedTitle;
    }
  } catch (err) {
    console.warn("[chatStore] Auto-titling error:", err);
  }

  return "New Chat";
}
