"use client";

import React from "react";
import { Image as ImageIcon, Music, Film, Presentation, FolderOpen, Download, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Asset {
  id: string;
  type: "image" | "audio" | "video" | "deck";
  name: string;
  prompt: string;
  chatId: string;
  createdAt: string;
}

interface AssetLibraryProps {
  assets: Asset[];
  onDeleteAsset: (id: string) => void;
}

type FilterType = "all" | "image" | "audio" | "video" | "deck";

export function AssetLibrary({ assets, onDeleteAsset }: AssetLibraryProps) {
  const [filter, setFilter] = React.useState<FilterType>("all");

  const filteredAssets = filter === "all" ? assets : assets.filter((a) => a.type === filter);

  const typeIcons = {
    image: <ImageIcon className="w-5 h-5 text-pink-400" />,
    audio: <Music className="w-5 h-5 text-amber-400" />,
    video: <Film className="w-5 h-5 text-red-400" />,
    deck: <Presentation className="w-5 h-5 text-indigo-400" />,
  };

  const typeColors = {
    image: "border-pink-800/50 bg-pink-950/30",
    audio: "border-amber-800/50 bg-amber-950/30",
    video: "border-red-800/50 bg-red-950/30",
    deck: "border-indigo-800/50 bg-indigo-950/30",
  };

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
        <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No assets generated yet</p>
        <p className="text-xs mt-1">Use /video, /ppt, /music, or /vision to create assets</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-800">
        <Filter className="w-3.5 h-3.5 text-slate-500" />
        <div className="flex gap-1">
          {(["all", "image", "audio", "video", "deck"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-slate-500">{filteredAssets.length} items</span>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className={`rounded-xl border p-3 space-y-2 ${typeColors[asset.type]}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">{typeIcons[asset.type]}</div>
                <button
                  onClick={() => onDeleteAsset(asset.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-300 truncate">{asset.name}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{asset.prompt}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-600">{asset.createdAt}</span>
                <Button size="sm" variant="ghost" className="h-6 text-slate-400" onClick={() => {}}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}