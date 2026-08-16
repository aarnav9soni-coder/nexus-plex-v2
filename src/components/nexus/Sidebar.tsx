"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  ChevronRight,
  Library,
  Trash2,
  Edit3,
  X,
  Presentation,
  Film,
  Music,
  Image as ImageIcon,
  FolderOpen,
  Sparkles,
  Download,
  Search,
  Mic,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadPresentationFile } from "@/components/nexus/SlideDeck";
import { showSuccess } from "@/utils/toast";

export interface AssetRecord {
  id: string;
  type: "image" | "audio" | "video" | "deck";
  name: string;
  prompt: string;
  chatId: string;
  createdAt: string;
  messageId?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  chatHistory: ChatSession[];
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  activeChatId: string | null;
  activeTab: "chat" | "assets";
  onTabChange: (tab: "chat" | "assets") => void;
  assetCount: number;
  assets?: AssetRecord[];
  onSelectAsset?: (asset: AssetRecord) => void;
  onDeleteAsset?: (id: string) => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  chatHistory,
  onSelectChat,
  onDeleteChat,
  activeChatId,
  activeTab,
  onTabChange,
  assetCount,
  assets = [],
  onSelectAsset,
  onDeleteAsset,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredChatHistory = chatHistory.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const titleMatch = s.title?.toLowerCase().includes(q);
    const messageMatch = s.messages?.some((m) =>
      typeof m.text === "string" && m.text.toLowerCase().includes(q)
    );
    return titleMatch || messageMatch;
  });

  const groupByDate = (sessions: ChatSession[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    const todaySessions: ChatSession[] = [];
    const yesterdaySessions: ChatSession[] = [];
    const olderSessions: ChatSession[] = [];

    sessions.forEach((s) => {
      const date = new Date(s.updatedAt);
      if (date >= today) todaySessions.push(s);
      else if (date >= yesterday) yesterdaySessions.push(s);
      else olderSessions.push(s);
    });

    return { todaySessions, yesterdaySessions, olderSessions };
  };

  const { todaySessions, yesterdaySessions, olderSessions } = groupByDate(filteredChatHistory);

  const getAssetMeta = (type: AssetRecord["type"]) => {
    switch (type) {
      case "deck":
        return { label: "PPT Deck", icon: Presentation, badgeClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
      case "video":
        return { label: "Motion Video", icon: Film, badgeClass: "text-red-400 bg-red-500/10 border-red-500/20" };
      case "audio":
        return { label: "Audio Track", icon: Music, badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case "image":
        return { label: "Generated Vision", icon: ImageIcon, badgeClass: "text-pink-400 bg-pink-500/10 border-pink-500/20" };
      default:
        return { label: "Asset", icon: Sparkles, badgeClass: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
    }
  };

  const handleDownloadAsset = (e: React.MouseEvent, asset: AssetRecord) => {
    e.stopPropagation();
    if (asset.type === "deck") {
      downloadPresentationFile(asset.prompt || asset.name);
    } else if (asset.type === "image") {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(asset.prompt)}?width=800&height=600&nologo=true`;
      window.open(url, "_blank");
      showSuccess(`Opening high-res image for "${asset.name}"`);
    } else {
      showSuccess(`Asset "${asset.name}" exported!`);
    }
  };

  const renderDateGroup = (label: string, sessions: ChatSession[]) => {
    if (sessions.length === 0) return null;
    return (
      <div className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2">{label}</div>
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectChat(session.id)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              activeChatId === session.id ? "bg-indigo-600/20 text-indigo-300 font-semibold" : "hover:bg-slate-800 text-slate-400"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <div className="flex-1 min-w-0">
              {editingId === session.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingId(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-xs rounded px-2 py-0.5 text-slate-200"
                  autoFocus
                />
              ) : (
                <p className="text-xs truncate">{session.title}</p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(session.id);
                  setEditTitle(session.title);
                }}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(session.id);
                }}
                className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={onToggle} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-50 h-full bg-slate-950 border-r border-slate-800/80 flex flex-col transition-all duration-300 ${
          isOpen ? "w-72" : "w-0 lg:w-16"
        } overflow-hidden shrink-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-800">
          {isOpen && (
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Nexus Plex
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-7 w-7 text-slate-400 hover:text-white"
          >
            {isOpen ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
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

        {/* New Chat Button */}
        <div className="p-3">
          <Button
            onClick={onNewChat}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold h-10 shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isOpen && "New Chat"}
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-2">
          <button
            onClick={() => onTabChange("chat")}
            className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 ${
              activeTab === "chat"
                ? "text-indigo-400 border-indigo-500"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
            {isOpen && "Chats"}
          </button>
          <button
            onClick={() => onTabChange("assets")}
            className={`flex-1 py-2 text-xs font-bold transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === "assets"
                ? "text-indigo-400 border-indigo-500"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            <Library className="w-3.5 h-3.5 inline" />
            {isOpen && (
              <>
                <span>Assets</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-indigo-300 rounded-full font-mono">
                  {assets.length}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === "chat" ? (
            <div className="space-y-3">
              {isOpen && chatHistory.length > 0 && (
                <div className="relative flex items-center px-1 pt-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 text-slate-500 pointer-events-none shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 transition-all focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 p-0.5 text-slate-500 hover:text-slate-200 rounded transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {renderDateGroup("Today", todaySessions)}
              {renderDateGroup("Yesterday", yesterdaySessions)}
              {renderDateGroup("Previous 7 Days", olderSessions)}

              {chatHistory.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No saved conversations yet
                </div>
              ) : (
                filteredChatHistory.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-500 italic">
                    No conversations match "{searchQuery}"
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <FolderOpen className="w-10 h-10 mb-3 opacity-30 text-indigo-400" />
                  <p className="text-xs font-bold text-slate-300">No assets generated yet</p>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Try typing <code className="text-indigo-400 font-mono bg-indigo-500/10 px-1 rounded">/ppt</code>,{" "}
                    <code className="text-red-400 font-mono bg-red-500/10 px-1 rounded">/video</code>,{" "}
                    <code className="text-amber-400 font-mono bg-amber-500/10 px-1 rounded">/music</code>, or{" "}
                    <code className="text-pink-400 font-mono bg-pink-500/10 px-1 rounded">/vision</code> in chat!
                  </p>
                </div>
              ) : (
                assets.map((asset) => {
                  const meta = getAssetMeta(asset.type);
                  const Icon = meta.icon;

                  return (
                    <div
                      key={asset.id}
                      onClick={() => onSelectAsset && onSelectAsset(asset)}
                      className="group p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-all space-y-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider flex items-center gap-1 ${meta.badgeClass}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleDownloadAsset(e, asset)}
                            className="p-1 hover:bg-indigo-600/30 rounded text-indigo-400 hover:text-white transition-colors"
                            title="Download / Export Asset"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteAsset && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAsset(asset.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-opacity"
                              title="Delete asset"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs font-extrabold text-slate-200 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                        {asset.name || asset.prompt}
                      </p>

                      <p className="text-[10px] text-slate-400 line-clamp-2 font-mono bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/60">
                        "{asset.prompt}"
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Sidebar Footer Credit */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-bold">Nexus Plex</span>
          </div>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 font-medium">
            By Aarnav
          </span>
        </div>
      </div>
    </>
  );
}