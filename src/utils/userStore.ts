export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  token?: string;
  authProvider?: "google" | "email" | "guest";
  notificationsEnabled?: boolean;
  createdAt?: string;
}

export const NEXUS_AUTH_USER_KEY = "nexus_plex_auth_user";
export const LEGACY_AUTH_KEY = "ai_workspace_user_auth";

export function getStoredUser(): UserProfile | null {
  try {
    if (typeof window === "undefined") return null;
    const raw =
      localStorage.getItem(NEXUS_AUTH_USER_KEY) ||
      localStorage.getItem(LEGACY_AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.email) {
        return parsed as UserProfile;
      }
    }
  } catch (err) {
    console.error("Error reading stored user from localStorage:", err);
  }
  return null;
}

export function saveUser(user: UserProfile): void {
  try {
    if (typeof window === "undefined") return;
    const serialized = JSON.stringify(user);
    localStorage.setItem(NEXUS_AUTH_USER_KEY, serialized);
    localStorage.setItem(LEGACY_AUTH_KEY, serialized);

    if (user.token) {
      sessionStorage.setItem("ai_workspace_oauth_token", user.token);
    }

    window.dispatchEvent(
      new CustomEvent("nexus-user-auth-change", { detail: { user } })
    );
  } catch (err) {
    console.error("Error saving user to localStorage:", err);
  }
}

export function clearUser(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(NEXUS_AUTH_USER_KEY);
    localStorage.removeItem(LEGACY_AUTH_KEY);
    sessionStorage.removeItem("ai_workspace_oauth_token");

    window.dispatchEvent(
      new CustomEvent("nexus-user-auth-change", { detail: { user: null } })
    );
  } catch (err) {
    console.error("Error clearing user from localStorage:", err);
  }
}

export function createGuestUser(customEmail?: string): UserProfile {
  const ts = Date.now();
  const email = (customEmail || `guest_${ts}@workspace.ai`).toLowerCase().trim();
  return {
    id: `usr_guest_${ts}`,
    name: "Guest Workspace User",
    email,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
    authProvider: "guest",
    notificationsEnabled: true,
    createdAt: new Date().toLocaleDateString(),
  };
}
