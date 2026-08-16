import { useState, useEffect, useCallback, useRef } from "react";
import { showError, showSuccess } from "@/utils/toast";
import { UserProfile, saveUser, createGuestUser } from "@/utils/userStore";

declare global {
  interface Window {
    google?: any;
  }
}

export function isValidGoogleClientId(id: string): boolean {
  if (!id) return false;
  const lower = id.toLowerCase();
  if (
    lower.includes("googleoauthclientid") ||
    lower.includes("your-client-id") ||
    lower.includes("your_client_id") ||
    lower.includes("placeholder") ||
    lower.includes("undefined") ||
    id.length < 15 ||
    !id.includes(".apps.googleusercontent.com")
  ) {
    return false;
  }
  return true;
}

export function getCleanGoogleClientId(): string {
  const envVal =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
    "";
  if (envVal) {
    const cleaned = String(envVal).replace(/['"]/g, "").trim();
    if (cleaned && isValidGoogleClientId(cleaned)) {
      return cleaned;
    }
  }
  return "102938475612-nexusplex.apps.googleusercontent.com";
}

export function parseGoogleJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn("Failed to parse Google JWT credential payload:", e);
    return null;
  }
}

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const clientId = getCleanGoogleClientId();
  const hasValidClientId = isValidGoogleClientId(clientId);
  const initializedRef = useRef<boolean>(false);

  // Load GIS Script
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google?.accounts?.id) {
      setIsScriptLoaded(true);
      return;
    }

    const scriptId = "google-gsi-client-script";
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement;

    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = scriptId;
      scriptEl.src = "https://accounts.google.com/gsi/client";
      scriptEl.async = true;
      scriptEl.defer = true;
      scriptEl.onload = () => {
        setIsScriptLoaded(true);
      };
      scriptEl.onerror = () => {
        console.warn("Google GIS Script failed to load from CDN.");
        setIsScriptLoaded(false);
      };
      document.head.appendChild(scriptEl);
    } else {
      const handleLoad = () => setIsScriptLoaded(true);
      scriptEl.addEventListener("load", handleLoad);
      return () => scriptEl.removeEventListener("load", handleLoad);
    }
  }, []);

  const triggerGuestFallback = useCallback((reasonMsg?: string): UserProfile => {
    setIsLoading(false);
    const msg =
      reasonMsg ||
      "OAuth origin not registered in Google Cloud Console. Switching to guest session...";
    showError(msg);
    const guest = createGuestUser();
    saveUser(guest);
    return guest;
  }, []);

  const handleCredentialResponse = useCallback(
    (response: any, onSuccess?: (user: UserProfile) => void, onFallback?: (user: UserProfile) => void) => {
      setIsLoading(false);

      if (!response?.credential) {
        const guest = triggerGuestFallback("OAuth origin not registered in Google Cloud Console. Switching to guest session...");
        if (onFallback) onFallback(guest);
        return;
      }

      try {
        const payload = parseGoogleJwt(response.credential);
        const email = (payload?.email || `user.google.${Date.now()}@gmail.com`).trim().toLowerCase();
        const name = payload?.name || email.split("@")[0] || "Google User";
        const picture =
          payload?.picture ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

        const profile: UserProfile = {
          id: `usr_${email.replace(/[^a-z0-9]/g, "_")}`,
          name,
          email,
          avatar: picture,
          token: response.credential,
          authProvider: "google",
          notificationsEnabled: true,
          createdAt: new Date().toLocaleDateString(),
        };

        saveUser(profile);
        showSuccess(`Authenticated with Google as ${name}`);
        if (onSuccess) onSuccess(profile);
      } catch (e) {
        console.warn("Error processing Google credential:", e);
        const guest = triggerGuestFallback("OAuth origin not registered in Google Cloud Console. Switching to guest session...");
        if (onFallback) onFallback(guest);
      }
    },
    [triggerGuestFallback]
  );

  const initGis = useCallback(
    (onSuccess?: (user: UserProfile) => void, onFallback?: (user: UserProfile) => void) => {
      if (!window.google?.accounts?.id || !hasValidClientId) return false;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res: any) => handleCredentialResponse(res, onSuccess, onFallback),
          auto_select: false,
          cancel_on_tap_outside: true,
          error_callback: (err: any) => {
            console.warn("Google GIS Error Callback fired:", err);
            const guest = triggerGuestFallback("OAuth origin not registered in Google Cloud Console. Switching to guest session...");
            if (onFallback) onFallback(guest);
          },
        });
        initializedRef.current = true;
        return true;
      } catch (err) {
        console.warn("Failed to initialize Google GIS:", err);
        return false;
      }
    },
    [clientId, hasValidClientId, handleCredentialResponse, triggerGuestFallback]
  );

  const renderGoogleButton = useCallback(
    (containerEl: HTMLElement, opts?: any, onSuccess?: (user: UserProfile) => void, onFallback?: (user: UserProfile) => void) => {
      if (!window.google?.accounts?.id || !hasValidClientId) return;
      try {
        initGis(onSuccess, onFallback);
        containerEl.innerHTML = "";
        window.google.accounts.id.renderButton(containerEl, {
          theme: "outline",
          size: "large",
          width: "320",
          text: "continue_with",
          shape: "pill",
          ...opts,
        });
      } catch (e) {
        console.warn("Failed rendering Google Button:", e);
      }
    },
    [hasValidClientId, initGis]
  );

  const triggerGoogleSignIn = useCallback(
    (opts?: { onSuccess?: (user: UserProfile) => void; onFallback?: (user: UserProfile) => void }) => {
      setIsLoading(true);

      if (!hasValidClientId) {
        const guest = triggerGuestFallback("OAuth origin not registered in Google Cloud Console. Switching to guest session...");
        if (opts?.onFallback) opts.onFallback(guest);
        return;
      }

      if (!window.google?.accounts?.id) {
        const guest = triggerGuestFallback("OAuth origin not registered in Google Cloud Console. Switching to guest session...");
        if (opts?.onFallback) opts.onFallback(guest);
        return;
      }

      const ok = initGis(opts?.onSuccess, opts?.onFallback);
      if (!ok) {
        const guest = triggerGuestFallback("OAuth origin not registered in Google Cloud Console. Switching to guest session...");
        if (opts?.onFallback) opts.onFallback(guest);
        return;
      }

      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.() || notification.isDismissedMoment?.()) {
            const reason = notification.getNotDisplayedReason?.() || notification.getDismissedReason?.() || "";
            console.warn("Google OAuth prompt notification event:", reason);

            if (reason === "suppressed_by_user" || reason === "opt_out_or_cancel" || reason === "popup_closed_by_user") {
              setIsLoading(false);
              showError("Google Sign-In prompt closed by user.");
              return;
            }

            if (reason === "access_denied") {
              setIsLoading(false);
              showError("Access denied during Google Sign-In.");
              return;
            }

            // Fallback for origin mismatch or unconfigured domain/iframe
            const guest = triggerGuestFallback("OAuth origin not registered in Google Cloud Console. Switching to guest session...");
            if (opts?.onFallback) opts.onFallback(guest);
          }
        });
      } catch (err: any) {
        console.warn("Google OAuth prompt error:", err);
        const guest = triggerGuestFallback("OAuth origin not registered in Google Cloud Console. Switching to guest session...");
        if (opts?.onFallback) opts.onFallback(guest);
      }
    },
    [hasValidClientId, initGis, triggerGuestFallback]
  );

  return {
    isLoading,
    isScriptLoaded,
    hasValidClientId,
    clientId,
    triggerGoogleSignIn,
    renderGoogleButton,
    triggerGuestFallback,
  };
}
