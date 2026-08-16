"use client";

import React from "react";
import { Monitor, Layout, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";

type LayoutMode = "focus" | "dual" | "studio";

interface LayoutSwitcherProps {
  currentMode: LayoutMode;
  onModeChange: (mode: LayoutMode) => void;
}

export function LayoutSwitcher({ currentMode, onModeChange }: LayoutSwitcherProps) {
  const modes: { id: LayoutMode; label: string; icon: React.ReactNode; description: string }[] = [
    { id: "focus", label: "Focus", icon: <Monitor className="w-3.5 h-3.5" />, description: "Single column chat" },
    { id: "dual", label: "Dual Canvas", icon: <Layout className="w-3.5 h-3.5" />, description: "Chat + Preview split" },
    { id: "studio", label: "Studio Grid", icon: <Grid className="w-3.5 h-3.5" />, description: "Visual gallery grid" },
  ];

  return (
    <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 p-0.5 gap-0.5">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentMode === mode.id
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
          title={mode.description}
        >
          {mode.icon}
          <span className="hidden sm:inline">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}