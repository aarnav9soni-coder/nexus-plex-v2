import React, { useState } from "react";
import { ShieldCheck, Mail, Lock, User, Sparkles, Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { UserProfile } from "@/types/auth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { saveUser } from "@/utils/userStore";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notificationsOptIn, setNotificationsOptIn] = useState(true);

  const { isLoading, triggerGoogleSignIn } = useGoogleAuth();

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showError("Please enter your email and password");
      return;
    }

    if (tab === "signup" && !name.trim()) {
      showError("Please enter your full name");
      return;
    }

    const userName = name.trim() || email.split("@")[0] || "Nexus Member";
    const user: UserProfile = {
      id: Date.now().toString(),
      name: userName,
      email: email.trim(),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userName)}`,
      notificationsEnabled: notificationsOptIn,
      createdAt: new Date().toLocaleDateString(),
    };

    saveUser(user as any);
    onLoginSuccess(user);
    showSuccess(tab === "signup" ? "Account created successfully!" : "Welcome back to Nexus Plex!");
    onClose();
  };

  const handleGoogleOneClick = () => {
    triggerGoogleSignIn({
      onSuccess: (u) => {
        saveUser(u);
        onLoginSuccess(u as any);
        onClose();
      },
      onFallback: (g) => {
        saveUser(g);
        onLoginSuccess(g as any);
        onClose();
      },
    });
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100 p-6 rounded-3xl shadow-2xl space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black tracking-tight">Welcome to Nexus Plex</h2>
          <p className="text-xs text-slate-400">100% Free Multimodal AI Platform</p>
        </div>

        {/* GOOGLE 1-CLICK BUTTON */}
        <Button
          type="button"
          disabled={isLoading}
          onClick={handleGoogleOneClick}
          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold h-11 rounded-2xl flex items-center justify-center gap-2.5 shadow-md disabled:opacity-80"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isLoading ? "Authenticating with Google..." : "Continue with Google"}</span>
        </Button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-950 px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            or email
          </span>
        </div>

        {/* TAB TOGGLE */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              tab === "login" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              tab === "signup" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {tab === "signup" && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Full Name</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <Input
                  placeholder="Your Name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs pl-9 h-10 rounded-xl"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs pl-9 h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs pl-9 h-10 rounded-xl"
              />
            </div>
          </div>

          {/* NOTIFICATION OPT-IN CHECKBOX */}
          <label className="flex items-start gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsOptIn}
              onChange={(e) => setNotificationsOptIn(e.target.checked)}
              className="mt-0.5 rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0"
            />
            <span className="text-[11px] text-slate-400 leading-tight">
              Opt-in to app updates & new feature push notifications
            </span>
          </label>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 rounded-xl mt-2">
            {tab === "login" ? "Sign In to Workspace" : "Create Free Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}