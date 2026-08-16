import React, { useState, useEffect } from "react";
import { Bookmark, Plus, Trash2, Sparkles, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { SavedPrompt } from "@/types/nexus";

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsePrompt: (promptText: string, category: "chat" | "vision" | "studio") => void;
}

export function PromptLibraryModal({ isOpen, onClose, onUsePrompt }: PromptLibraryModalProps) {
  const [filterCategory, setFilterCategory] = useState<"all" | "chat" | "vision" | "studio">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    const local = localStorage.getItem("nexus_saved_prompts");
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return [
      {
        id: "1",
        title: "Python Web Scraper",
        prompt: "Write a high-performance Python web scraper using BeautifulSoup and async requests with clean error handling.",
        category: "chat",
        createdAt: "Saved",
      },
      {
        id: "2",
        title: "Cyberpunk Rainy Metropolis",
        prompt: "A neon-lit cyberpunk metropolis in heavy rainfall, reflective puddles, flying cars, hyperrealistic 8k resolution, octane render.",
        category: "vision",
        createdAt: "Saved",
      },
      {
        id: "3",
        title: "Retro Space Invaders Game",
        prompt: "Build an interactive HTML5 arcade game inspired by Space Invaders with smooth controls, sound effects, particle explosions, and score display.",
        category: "studio",
        createdAt: "Saved",
      },
    ];
  });

  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newCategory, setNewCategory] = useState<"chat" | "vision" | "studio">("chat");

  useEffect(() => {
    localStorage.setItem("nexus_saved_prompts", JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) {
      showError("Please fill out both title and prompt text");
      return;
    }

    const item: SavedPrompt = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      prompt: newPrompt.trim(),
      category: newCategory,
      createdAt: new Date().toLocaleDateString(),
    };

    setSavedPrompts([item, ...savedPrompts]);
    setNewTitle("");
    setNewPrompt("");
    showSuccess("Prompt saved to personal library!");
  };

  const handleDelete = (id: string) => {
    setSavedPrompts(savedPrompts.filter((p) => p.id !== id));
    showSuccess("Prompt removed");
  };

  const filteredPrompts = savedPrompts.filter((p) => {
    const matchesCat = filterCategory === "all" || p.category === filterCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-100 p-6 rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-black tracking-tight">Saved Prompt Library</h2>
          </div>
        </div>

        <form onSubmit={handleAddPrompt} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Save New Prompt
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Prompt Title (e.g., Code Reviewer)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs rounded-xl h-9"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl h-9 px-3 text-slate-200"
            >
              <option value="chat">Category: Chat</option>
              <option value="vision">Category: Vision</option>
              <option value="studio">Category: Studio</option>
            </select>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs h-9 font-bold">
              Save Prompt
            </Button>
          </div>
          <Textarea
            placeholder="Type prompt text to bookmark for quick reuse..."
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            className="bg-slate-950 border-slate-800 text-xs rounded-xl min-h-[60px]"
          />
        </form>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {(["all", "chat", "vision", "studio"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-lg capitalize font-semibold ${
                    filterCategory === cat ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs pl-8 h-8 rounded-xl w-full sm:w-48"
              />
            </div>
          </div>

          {filteredPrompts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              No matching saved prompts found.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPrompts.map((p) => (
                <div key={p.id} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20 uppercase">
                        {p.category}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => {
                          onUsePrompt(p.prompt, p.category);
                          onClose();
                        }}
                        className="h-7 text-[11px] px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Use Prompt
                      </Button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                    {p.prompt}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}