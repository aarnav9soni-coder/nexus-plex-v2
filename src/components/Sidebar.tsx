import React, { useState, useEffect } from "react";
import {
  Plus,
  MessageSquare,
  Settings,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  PanelLeft,
  Square,
  Mic,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClearHistoryModal } from "@/components/ClearHistoryModal";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messagesCount: number;
}

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onExportSession?: (id: string) => void;
  onClearAll: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  onOpenSettings?: () => void;
  brandName?: string;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onExportSession,
  onClearAll,
  onOpenSettings,
  brandName = "Nexus Plex",
  isOpen,
  onToggleOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  useEffect(() => {
    const handleVoiceState = (e: any) => {
      if (e?.detail?.isListening !== undefined) {
        setIsVoiceListening(!!e.detail.isListening);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("nexus-voice-state", handleVoiceState);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("nexus-voice-state", handleVoiceState);
      }
    };
  }, []);

  const handleStopVoice = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("nexus-stop-voice"));
    }
    setIsVoiceListening(false);
  };

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return session.title.toLowerCase().includes(query);
  });

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay (< 768px) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onToggleOpen}
        />
      )}

      {/* Slide-Over Drawer Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col border-r transition-all duration-300 md:static ${
          isOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full md:translate-x-0 md:w-16"
        }`}
        style={{
          backgroundColor: "var(--app-panel)",
          borderColor: "var(--app-border)",
          color: "var(--app-text)",
        }}
      >
        {/* Top Navigation Bar inside Sidebar */}
        <div
          className={`flex items-center h-16 border-b ${isOpen ? "justify-between px-4" : "justify-center px-2"}`}
          style={{ borderColor: "var(--app-border)" }}
        >
          {isOpen ? (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <PanelLeft className="w-5 h-5 text-[#06B6D4] shrink-0" />
                <span className="font-extrabold text-sm tracking-tight truncate" style={{ color: "var(--app-text)" }}>
                  {brandName}
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleOpen}
                className="p-1.5 rounded-xl transition-colors hover:bg-slate-800/40 text-slate-400 hover:text-white"
                title="Collapse Drawer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onToggleOpen}
              className="w-10 h-10 rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 hover:bg-[#06B6D4]/20 flex items-center justify-center transition-all shadow-sm text-[#06B6D4]"
              title="Expand Drawer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Global Voice Kill-Switch Banner */}
        {isVoiceListening && (
          <div className="mx-3 my-2 p-2.5 bg-rose-950/70 border border-rose-500/60 rounded-2xl flex items-center justify-between gap-2 animate-in fade-in duration-200 shadow-xl shadow-rose-950/40">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              {isOpen && (
                <div className="truncate">
                  <p className="text-xs font-bold text-rose-100 flex items-center gap-1">
                    <Mic className="w-3 h-3 text-rose-400" />
                    Listening...
                  </p>
                  <p className="text-[10px] text-rose-300/80 font-mono">Nexus Audio Active</p>
                </div>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleStopVoice}
              className="h-8 px-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow shrink-0 flex items-center gap-1.5"
              title="Stop Microphone & End Audio Stream"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              {isOpen && <span>Stop Listening</span>}
            </Button>
          </div>
        )}

        {/* Gemini-Style Floating Action "New Chat" Button */}
        <div className={`p-3 ${!isOpen ? "flex justify-center" : ""}`}>
          <Button
            type="button"
            onClick={() => {
              onNewChat();
              // Auto close drawer on mobile after starting new chat
              if (window.innerWidth < 768) {
                onToggleOpen();
              }
            }}
            className={`font-semibold shadow-lg transition-all ${
              isOpen
                ? "w-full justify-start px-4 py-3 h-11 rounded-2xl text-xs sm:text-sm bg-[#1E2638] hover:bg-[#28324A] text-white border border-[#2A3650]"
                : "w-10 h-10 p-0 flex items-center justify-center rounded-2xl bg-[#1E2638] hover:bg-[#28324A] text-white border border-[#2A3650]"
            }`}
            title="Start New Chat Session"
          >
            <Plus className="w-4 h-4 shrink-0 text-[#06B6D4]" />
            {isOpen && <span className="ml-2.5 font-bold tracking-tight">New chat</span>}
          </Button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 scrollbar-thin">
          {isOpen && (
            <div className="space-y-2 mb-2">
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between text-slate-400">
                <span>Recent Conversations</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-slate-800/60 bg-slate-900/40 text-[#06B6D4]">
                  {searchQuery.trim() ? `${filteredSessions.length}/${sessions.length}` : sessions.length}
                </span>
              </div>

              {/* Keyword Search Filter Input */}
              <div className="px-1">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 pointer-events-none text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chat history..."
                    className="w-full border rounded-xl pl-8 pr-7 py-1.5 text-xs transition-all focus:outline-none focus:border-[#06B6D4]"
                    style={{
                      backgroundColor: "var(--app-bg)",
                      borderColor: "var(--app-border)",
                      color: "var(--app-text)",
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 p-0.5 hover:opacity-80 rounded text-slate-400"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {filteredSessions.length === 0 ? (
            isOpen && (
              <div className="px-3 py-6 text-center text-xs italic text-slate-400">
                {searchQuery.trim()
                  ? `No conversations match "${searchQuery.trim()}"`
                  : "No previous conversations."}
              </div>
            )
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) {
                      onToggleOpen();
                    }
                  }}
                  className={`group relative flex items-center transition-all ${
                    isOpen
                      ? "justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium"
                      : "justify-center w-10 h-10 mx-auto rounded-xl cursor-pointer"
                  }`}
                  style={{
                    backgroundColor: isActive ? "var(--app-accent-bg)" : "transparent",
                    borderColor: isActive ? "var(--app-accent-border)" : "transparent",
                    color: "var(--app-text)",
                  }}
                  title={session.title}
                >
                  <div className={`flex items-center ${isOpen ? "gap-2.5 min-w-0 overflow-hidden" : "justify-center"}`}>
                    <MessageSquare
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? "var(--app-accent)" : "var(--app-text-muted)" }}
                    />
                    {isOpen && <span className="truncate">{session.title}</span>}
                  </div>

                  {isOpen && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onExportSession && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExportSession(session.id);
                          }}
                          className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                          title="Export & Share Transcript"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Minimal Bottom Drawer Footer (Clear History & Universal Settings) */}
        <div className={`p-3 border-t ${!isOpen ? "flex flex-col items-center gap-2" : "flex items-center justify-between"}`} style={{ borderColor: "var(--app-border)" }}>
          {isOpen ? (
            <>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="text-xs text-rose-400/80 hover:text-rose-300 flex items-center gap-1.5 transition-colors font-medium"
                title="Clear all conversation history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>

              <button
                type="button"
                onClick={() => (onOpenSettings ? onOpenSettings() : null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                title="Workspace Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => (onOpenSettings ? onOpenSettings() : null)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors border border-slate-800/50"
              title="Workspace Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Clear History Confirmation Modal */}
      <ClearHistoryModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={onClearAll}
        sessionsCount={sessions.length}
      />
    </>
  );
};
