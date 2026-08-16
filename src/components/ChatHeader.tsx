/**
 * ChatHeader Component
 * Nexus Plex Architecture - Engineered by Lead Developer & Architect Aarnav.
 *
 * Implements:
 * 1. Active conversation title & isolated user account badge
 * 2. 1-Click Zero-Auth Export Modal launcher (Markdown, JSON, Print/PDF, Email/Google Drive Transfer)
 * 3. Quick Action toolbar
 */

import React, { useState } from "react";
import {
  Download,
  Trash2,
  Shield,
  Share2,
  FileText,
  FileCode,
  Printer,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessageData } from "@/utils/GeminiClient";
import { ExportModal } from "@/components/ExportModal";

interface ChatHeaderProps {
  sessionTitle?: string;
  messages: ChatMessageData[];
  selectedModel?: string;
  userEmail?: string;
  onClearChat?: () => void;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  sessionTitle = "Active Workspace Chat",
  messages,
  selectedModel = "gemini-3.7-flash",
  userEmail,
  onClearChat,
  className = "",
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const userScopeBadge = userEmail
    ? `workspace_user_${userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")}`
    : "workspace_guest_active";

  return (
    <>
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b shadow-sm transition-colors ${className}`}
        style={{
          backgroundColor: "var(--app-panel)",
          borderColor: "var(--app-border)",
          color: "var(--app-text)",
        }}
      >
        {/* Session Title & Isolated User Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-pulse shrink-0" />
          <h2
            className="text-xs sm:text-sm font-extrabold truncate"
            style={{ color: "var(--app-text)" }}
          >
            {sessionTitle}
          </h2>
          <span
            className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border truncate"
            style={{
              backgroundColor: "var(--app-bg)",
              borderColor: "var(--app-border)",
              color: "var(--app-accent)",
            }}
            title="Isolated User Partitioning Scope"
          >
            <Shield className="w-3 h-3" />
            <span>{userScopeBadge}</span>
          </span>
        </div>

        {/* Action Bar Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Main Export & Share Modal Button */}
          <Button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-xl text-xs font-bold transition-all border disabled:opacity-40 shadow-sm"
            style={{
              backgroundColor: "var(--app-accent-bg)",
              borderColor: "var(--app-accent-border)",
              color: "var(--app-accent)",
            }}
            title="Export, Print, or Transfer conversation without OAuth"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Chat</span>
          </Button>

          {/* Clear Chat Button */}
          {onClearChat && (
            <button
              type="button"
              onClick={onClearChat}
              className="p-1.5 rounded-xl border text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              style={{ borderColor: "var(--app-border)" }}
              title="Clear Chat Thread"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Zero-Auth Export & Transfer Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        messages={messages}
        sessionTitle={sessionTitle}
        selectedModel={selectedModel}
        userEmail={userEmail}
      />
    </>
  );
};
