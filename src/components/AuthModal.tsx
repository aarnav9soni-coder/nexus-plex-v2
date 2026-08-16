import React from "react";
import { Cpu, ShieldCheck, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { UserProfile, createGuestUser, saveUser } from "@/utils/userStore";

export type { UserProfile };

interface AuthModalProps {
  isOpen: boolean;
  onLogin: (profile: UserProfile) => void;
  brandName?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLogin,
  brandName = "Nexus Plex",
}) => {
  const { isLoading, triggerGoogleSignIn } = useGoogleAuth();

  if (!isOpen) return null;

  const handleContinueWithGoogle = () => {
    triggerGoogleSignIn({
      onSuccess: (user) => onLogin(user),
      onFallback: (guest) => onLogin(guest),
    });
  };

  const handleContinueAsGuest = () => {
    const guest = createGuestUser();
    saveUser(guest);
    onLogin(guest);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#111622] border border-[#1E2638] rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden space-y-6 text-center">
        {/* Glow ambient decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#06B6D4]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Icon Header */}
        <div className="space-y-3 relative z-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center shadow-xl shadow-[#06B6D4]/25">
            <Cpu className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6]">{brandName}</span>
          </h2>
          <p className="text-xs text-[#E2E8F0]/70 leading-relaxed max-w-xs mx-auto">
            Sign in with your Google Account to access your personal AI workspace with private, isolated state.
          </p>
        </div>

        <div className="space-y-3.5 relative z-10 pt-2">
          {/* Primary Continue with Google Button */}
          <Button
            type="button"
            disabled={isLoading}
            onClick={handleContinueWithGoogle}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 h-12 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-80"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-800" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
            )}
            <span className="text-sm tracking-tight">
              {isLoading ? "Authenticating with Google..." : "Continue with Google"}
            </span>
          </Button>

          {/* Secondary Guest Option */}
          <button
            type="button"
            onClick={handleContinueAsGuest}
            className="w-full text-xs text-[#E2E8F0]/60 hover:text-white py-2 flex items-center justify-center gap-1.5 transition-colors font-medium"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Continue as Guest</span>
          </button>
        </div>

        {/* Footer Security Badge */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#E2E8F0]/50 relative z-10">
          <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Google OAuth 2.0 • Isolated Private Session</span>
        </div>
      </div>
    </div>
  );
};

