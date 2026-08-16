import React, { useState } from "react";
import { Menu, Compass, Radio, Settings, Plus, User, LogOut } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { UserProfile } from "@/components/AuthModal";

export interface HeaderProps {
  brandName?: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenCapabilities: () => void;
  onOpenLiveVoice: () => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
  onCreateNewSession?: () => void;
  user: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  brandName = "Nexus Plex",
  isSidebarOpen,
  onToggleSidebar,
  onOpenCapabilities,
  onOpenLiveVoice,
  onOpenSettings,
  onOpenAuth,
  onCreateNewSession,
  user,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header
      className="h-14 border-b backdrop-blur-md px-4 flex items-center justify-between shrink-0 shadow-sm z-10 transition-colors"
      style={{
        backgroundColor: "var(--app-panel)",
        borderColor: "var(--app-border)",
        color: "var(--app-text)",
      }}
    >
      {/* Mobile Top Header (< 768px) */}
      <div className="flex md:hidden items-center justify-between w-full">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl transition-colors hover:bg-slate-800/40 text-slate-400 hover:text-white"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="font-extrabold text-[#06B6D4] text-base tracking-tight">
          {brandName}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className="p-2 rounded-xl transition-colors hover:bg-slate-800/40 text-[#06B6D4] hover:text-white"
            title="Nexus Live Voice"
          >
            <Radio className="w-5 h-5 animate-pulse text-[#06B6D4]" />
          </button>

          <button
            type="button"
            onClick={onOpenCapabilities}
            className="p-2 rounded-xl transition-colors hover:bg-slate-800/40 text-[#8B5CF6] hover:text-white"
            title="Capabilities Explorer"
          >
            <Compass className="w-5 h-5" />
          </button>

          {onCreateNewSession && (
            <button
              type="button"
              onClick={onCreateNewSession}
              className="p-2 rounded-xl transition-colors hover:bg-slate-800/40 text-[#06B6D4] hover:text-white"
              title="Start New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop/Tablet Top Header (>= 768px) */}
      <div className="hidden md:flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-xl transition-colors hover:bg-slate-800/40 text-slate-400 hover:text-white"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="font-extrabold text-sm sm:text-base tracking-tight"
              style={{ color: "var(--app-text)" }}
            >
              {brandName}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30">
              Live Voice 2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCapabilities}
            className="px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-bold hover:bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30 shadow-sm"
            title="Explore Nexus Multi-Modal Capabilities"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Capabilities</span>
          </button>

          <ThemeSwitcher align="right" />

          {/* Synchronized Nexus Live Voice Header Toggle */}
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className="px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 text-xs font-bold hover:bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/40 shadow-sm ring-1 ring-[#06B6D4]/20"
            title="Launch Nexus Live Real-Time Hands-Free Voice Mode"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#06B6D4]" />
            <span className="hidden sm:inline">Nexus Live Voice</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-full border transition-all flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/50 border-slate-800/60"
            title="BYOK & Workspace Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Google User Profile Menu */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-0.5 rounded-full transition-colors border hover:opacity-90 border-slate-700/60"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border"
                  style={{ borderColor: "var(--app-accent-border)" }}
                />
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 border rounded-2xl p-3 shadow-2xl space-y-2 z-50 animate-in fade-in zoom-in-95"
                  style={{
                    backgroundColor: "var(--app-panel)",
                    borderColor: "var(--app-border)",
                    color: "var(--app-text)",
                  }}
                >
                  <div
                    className="flex items-center gap-2.5 px-2 py-1.5 border-b pb-2"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border"
                      style={{ borderColor: "var(--app-accent-border)" }}
                    />
                    <div className="min-w-0">
                      <p
                        className="font-bold text-xs truncate"
                        style={{ color: "var(--app-text)" }}
                      >
                        {user.name}
                      </p>
                      <p
                        className="text-[10px] truncate"
                        style={{ color: "var(--app-text-muted)" }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-slate-800/40 transition-colors flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Workspace Settings</span>
                    </button>
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-rose-500/10 text-rose-400 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3 py-1.5 rounded-full bg-[#06B6D4] hover:bg-[#0891B2] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
