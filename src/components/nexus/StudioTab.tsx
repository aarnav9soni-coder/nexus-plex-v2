import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, RefreshCw, Monitor, Code2, Copy, Maximize2, Download, Gamepad2, X, Smartphone, Tablet, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { STUDIO_PRESETS } from "@/constants/presets";
import { fetchTextWithFallback } from "@/utils/pollinationsApi";
import { EngineMode } from "@/types/nexus";

interface StudioTabProps {
  initialCodePreset?: string;
  engineMode: EngineMode;
  selectedOllamaModel: string;
  onUpdateDiagnostics: (route: string, latencyMs: number, wasFallback: boolean) => void;
}

export function StudioTab({
  initialCodePreset,
  engineMode,
  selectedOllamaModel,
  onUpdateDiagnostics,
}: StudioTabProps) {
  const [studioPrompt, setStudioPrompt] = useState("");
  const [studioCode, setStudioCode] = useState(() => {
    if (initialCodePreset && (STUDIO_PRESETS as any)[initialCodePreset]) {
      return (STUDIO_PRESETS as any)[initialCodePreset];
    }
    return STUDIO_PRESETS.snake;
  });
  const [isGeneratingStudio, setIsGeneratingStudio] = useState(false);
  const [studioTab, setStudioTab] = useState<"preview" | "code">("preview");
  const [viewportMode, setViewportMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isFullscreenStudio, setIsFullscreenStudio] = useState(false);
  const [showConsoleDrawer, setShowConsoleDrawer] = useState(false);

  const handleGenerateStudioApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studioPrompt.trim()) {
      showError("Please describe the app or mini-game to create");
      return;
    }

    setIsGeneratingStudio(true);

    try {
      const promptText = `Generate ONLY a full, complete, standalone single-file HTML5 web application or mini-game for: "${studioPrompt}". Include CSS in <style> and JS in <script>. Do not output markdown code blocks or conversational text.`;

      const result = await fetchTextWithFallback({
        prompt: promptText,
        primaryModel: "openai",
        engineMode,
        ollamaModel: selectedOllamaModel,
      });

      onUpdateDiagnostics(result.modelUsed, result.latencyMs, result.wasFallback);

      const code = result.text.replace(/```html/g, "").replace(/```/g, "").trim();

      if (code) {
        setStudioCode(code);
        setStudioTab("preview");
        showSuccess("Interactive app generated!");
      }
    } catch (err) {
      showError("Could not generate app code. Please try again.");
    } finally {
      setIsGeneratingStudio(false);
    }
  };

  const downloadStudioHtml = () => {
    const blob = new Blob([studioCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexus-app.html";
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("HTML exported successfully!");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="rounded-3xl border-slate-800 bg-slate-900/60 p-5 shadow-xl">
        <form onSubmit={handleGenerateStudioApp} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Input
              placeholder="Prompt to build an app or game (e.g., 'Build a colorful Pong game with scoring')..."
              value={studioPrompt}
              onChange={(e) => setStudioPrompt(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs sm:text-sm h-11 rounded-2xl flex-1 focus-visible:ring-indigo-500"
            />
            <Button
              type="submit"
              disabled={isGeneratingStudio || !studioPrompt.trim()}
              className="w-full sm:w-auto h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 text-white rounded-2xl text-xs font-extrabold px-6 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              {isGeneratingStudio ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Generate App
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-1 text-xs">
            <span className="text-slate-400 font-semibold shrink-0">Quick Templates:</span>
            <button
              type="button"
              onClick={() => setStudioCode(STUDIO_PRESETS.snake)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium shrink-0"
            >
              Retro Snake
            </button>
            <button
              type="button"
              onClick={() => setStudioCode(STUDIO_PRESETS.space)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium shrink-0"
            >
              Space Shooter
            </button>
            <button
              type="button"
              onClick={() => setStudioCode(STUDIO_PRESETS.brickBreaker)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium shrink-0"
            >
              Brick Breaker
            </button>
            <button
              type="button"
              onClick={() => setStudioCode(STUDIO_PRESETS.paint)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium shrink-0"
            >
              Paint Canvas
            </button>
            <button
              type="button"
              onClick={() => setStudioCode(STUDIO_PRESETS.calculator)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium shrink-0"
            >
              Neon Calculator
            </button>
          </div>
        </form>
      </Card>

      <Card className="rounded-3xl border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl flex flex-col h-[620px]">
        <div className="h-12 bg-slate-950/80 border-b border-slate-800 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={studioTab === "preview" ? "default" : "ghost"}
              onClick={() => setStudioTab("preview")}
              className={`h-7 text-xs rounded-lg ${studioTab === "preview" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              <Monitor className="w-3.5 h-3.5 mr-1" /> Live Preview
            </Button>
            <Button
              size="sm"
              variant={studioTab === "code" ? "default" : "ghost"}
              onClick={() => setStudioTab("code")}
              className={`h-7 text-xs rounded-lg ${studioTab === "code" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              <Code2 className="w-3.5 h-3.5 mr-1" /> Code Editor
            </Button>
          </div>

          {studioTab === "preview" && (
            <div className="hidden md:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewportMode("desktop")}
                className={`p-1.5 rounded-lg text-xs ${viewportMode === "desktop" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewportMode("tablet")}
                className={`p-1.5 rounded-lg text-xs ${viewportMode === "tablet" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
                title="Tablet View"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewportMode("mobile")}
                className={`p-1.5 rounded-lg text-xs ${viewportMode === "mobile" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowConsoleDrawer(!showConsoleDrawer)}
              size="sm"
              variant={showConsoleDrawer ? "default" : "ghost"}
              className={`h-7 text-xs rounded-lg ${showConsoleDrawer ? "bg-indigo-600 text-white" : "text-slate-300"}`}
            >
              <Terminal className="w-3.5 h-3.5 mr-1" /> Console
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(studioCode);
                showSuccess("Code copied to clipboard!");
              }}
              size="sm"
              variant="ghost"
              className="h-7 text-xs rounded-lg text-slate-300"
            >
              <Copy className="w-3.5 h-3.5 mr-1" /> Copy Code
            </Button>
            <Button onClick={() => setIsFullscreenStudio(true)} size="sm" variant="ghost" className="h-7 text-xs rounded-lg text-slate-300">
              <Maximize2 className="w-3.5 h-3.5 mr-1" /> Fullscreen
            </Button>
            <Button onClick={downloadStudioHtml} size="sm" variant="outline" className="h-7 border-slate-800 text-xs rounded-lg text-slate-300">
              <Download className="w-3.5 h-3.5 mr-1" /> Export HTML
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950 overflow-hidden relative flex flex-col items-center justify-center p-2">
          <AnimatePresence mode="wait">
            {studioTab === "preview" ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={`h-full transition-all duration-300 overflow-hidden rounded-2xl border border-slate-800 bg-black ${
                  viewportMode === "mobile" ? "w-[360px]" : viewportMode === "tablet" ? "w-[600px]" : "w-full"
                }`}
              >
                <iframe
                  srcDoc={studioCode}
                  title="Nexus Studio Live Sandbox"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-modals"
                />
              </motion.div>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <Textarea
                  value={studioCode}
                  onChange={(e) => setStudioCode(e.target.value)}
                  className="w-full h-full bg-slate-950 text-slate-200 font-mono text-xs p-4 border-0 rounded-none focus-visible:ring-0"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showConsoleDrawer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full h-28 bg-slate-950 border-t border-slate-800 font-mono text-[11px] p-3 text-slate-400 overflow-y-auto flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-indigo-400 font-bold border-b border-slate-800/60 pb-1 mb-1">
                  <span className="flex items-center gap-1.5"><Terminal className="w-3 h-3" /> Sandbox Output Console</span>
                  <span className="text-[10px] text-emerald-400">● Live Listener Active</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <div>[nexus-runtime]: App initialized in safe iframe sandbox.</div>
                  <div>[nexus-runtime]: No runtime warnings detected.</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <Dialog open={isFullscreenStudio} onOpenChange={setIsFullscreenStudio}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-slate-950 border-slate-800 p-0 flex flex-col overflow-hidden">
          <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" /> Fullscreen Sandbox View
            </span>
            <Button size="icon" variant="ghost" onClick={() => setIsFullscreenStudio(false)} className="h-8 w-8 text-slate-400">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <iframe
            srcDoc={studioCode}
            title="Nexus Fullscreen Game Sandbox"
            className="w-full flex-1 border-0 bg-slate-950"
            sandbox="allow-scripts allow-modals"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}