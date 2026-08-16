import React, { useEffect, useState } from "react";
import { Bot, Image as ImageIcon, Mic, Gamepad2, Sun, Moon, Trash2, Command, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: "chat" | "vision" | "talk" | "studio") => void;
  onToggleTheme: () => void;
  onClearChat: () => void;
  onLoadPreset: (presetKey: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  onToggleTheme,
  onClearChat,
  onLoadPreset,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const commands = [
    {
      id: "tab-chat",
      label: "Switch to Nexus Chat",
      category: "Navigation",
      icon: Bot,
      action: () => {
        onSelectTab("chat");
        onClose();
      },
    },
    {
      id: "tab-vision",
      label: "Switch to Nexus Vision",
      category: "Navigation",
      icon: ImageIcon,
      action: () => {
        onSelectTab("vision");
        onClose();
      },
    },
    {
      id: "tab-talk",
      label: "Switch to Nexus Talk Voice Suite",
      category: "Navigation",
      icon: Mic,
      action: () => {
        onSelectTab("talk");
        onClose();
      },
    },
    {
      id: "tab-studio",
      label: "Switch to Nexus Studio Sandbox",
      category: "Navigation",
      icon: Gamepad2,
      action: () => {
        onSelectTab("studio");
        onClose();
      },
    },
    {
      id: "theme",
      label: "Toggle Dark / Light Theme",
      category: "Actions",
      icon: Sun,
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: "clear-chat",
      label: "Reset & Clear Chat History",
      category: "Actions",
      icon: Trash2,
      action: () => {
        onClearChat();
        onClose();
      },
    },
    {
      id: "preset-snake",
      label: "Load Retro Cyber Snake Game",
      category: "Studio Templates",
      icon: Gamepad2,
      action: () => {
        onSelectTab("studio");
        onLoadPreset("snake");
        onClose();
      },
    },
    {
      id: "preset-space",
      label: "Load Space Shooter Game",
      category: "Studio Templates",
      icon: Gamepad2,
      action: () => {
        onSelectTab("studio");
        onLoadPreset("space");
        onClose();
      },
    },
    {
      id: "preset-brick",
      label: "Load Cyber Brick Breaker",
      category: "Studio Templates",
      icon: Gamepad2,
      action: () => {
        onSelectTab("studio");
        onLoadPreset("brickBreaker");
        onClose();
      },
    },
    {
      id: "preset-paint",
      label: "Load Neon Paint Studio",
      category: "Studio Templates",
      icon: Gamepad2,
      action: () => {
        onSelectTab("studio");
        onLoadPreset("paint");
        onClose();
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) || cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-slate-950 border-slate-800 p-0 overflow-hidden text-slate-200 rounded-3xl shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <Input
            placeholder="Type a command or search actions (e.g., 'Clear chat', 'Snake game', 'Vision')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 text-sm text-slate-100 placeholder:text-slate-500 h-8 p-0"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-400">
            <Command className="w-3 h-3" /> ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No matching commands found.</div>
          ) : (
            filteredCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full text-left px-3.5 py-2.5 rounded-2xl hover:bg-slate-900/90 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white">{cmd.label}</div>
                      <div className="text-[10px] text-slate-500">{cmd.category}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 group-hover:text-indigo-300 font-mono">Execute ↵</span>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}