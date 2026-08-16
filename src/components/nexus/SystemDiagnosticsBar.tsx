import React from "react";
import { Server, Zap, Activity, HardDrive, Cpu, AlertCircle, Download } from "lucide-react";
import { DiagnosticsState, EngineMode } from "@/types/nexus";
import { WEBGPU_MODELS } from "@/utils/webLlmEngine";
import { Progress } from "@/components/ui/progress";

interface SystemDiagnosticsBarProps {
  diagnostics: DiagnosticsState;
  onToggleEngineMode: (mode: EngineMode) => void;
  onSelectOllamaModel: (model: string) => void;
  onSelectWebGpuModel: (model: string) => void;
  selectedOllamaModel: string;
  selectedWebGpuModel: string;
}

export function SystemDiagnosticsBar({
  diagnostics,
  onToggleEngineMode,
  onSelectOllamaModel,
  onSelectWebGpuModel,
  selectedOllamaModel,
  selectedWebGpuModel,
}: SystemDiagnosticsBarProps) {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 text-[11px] text-slate-400 flex flex-col gap-2 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Route:</span>
            <span className="text-slate-200 font-mono bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
              {diagnostics.activeRoute}
            </span>
          </div>

          {/* THREE-WAY ENGINE MODE TOGGLE */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
            <button
              onClick={() => onToggleEngineMode("webgpu")}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors flex items-center gap-1 ${
                diagnostics.engineMode === "webgpu"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cpu className="w-3 h-3 text-cyan-300" /> Native WebGPU (100% In-Browser)
            </button>
            <button
              onClick={() => onToggleEngineMode("cloud")}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                diagnostics.engineMode === "cloud"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Cloud Gateway
            </button>
            <button
              onClick={() => onToggleEngineMode("ollama")}
              className={`px-2 py-0.5 rounded-md font-bold transition-colors flex items-center gap-1 ${
                diagnostics.engineMode === "ollama"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <HardDrive className="w-3 h-3" /> Local Ollama
            </button>
          </div>

          {/* WEBGPU STATUS AND MODEL SELECTOR */}
          {diagnostics.engineMode === "webgpu" && (
            <div className="flex items-center gap-1.5">
              {diagnostics.isWebGpuSupported ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-cyan-400 font-bold">GPU Hardware Ready</span>
                  <select
                    value={selectedWebGpuModel}
                    onChange={(e) => onSelectWebGpuModel(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-[10px] text-cyan-300 rounded px-1.5 py-0.5 font-mono"
                  >
                    {WEBGPU_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <div className="flex items-center gap-1 text-rose-400 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>WebGPU not supported in this browser</span>
                </div>
              )}
            </div>
          )}

          {/* OLLAMA LOCAL ENGINE STATUS */}
          {diagnostics.engineMode === "ollama" && (
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  diagnostics.isOllamaOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                }`}
              />
              <span>Ollama Engine:</span>
              <span className={diagnostics.isOllamaOnline ? "text-emerald-400 font-bold" : "text-slate-500"}>
                {diagnostics.isOllamaOnline ? "Online (100% Offline AI)" : "Offline"}
              </span>

              {diagnostics.isOllamaOnline && diagnostics.ollamaModels.length > 0 && (
                <select
                  value={selectedOllamaModel}
                  onChange={(e) => onSelectOllamaModel(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-[10px] text-emerald-300 rounded px-1.5 py-0.5 font-mono"
                >
                  {diagnostics.ollamaModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-mono bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Developed by Aarnav
          </span>

          {diagnostics.lastLatencyMs !== null && (
            <div className="flex items-center gap-1 font-mono text-cyan-400">
              <Zap className="w-3 h-3" />
              <span>{diagnostics.lastLatencyMs}ms</span>
            </div>
          )}

          {diagnostics.fallbackCount > 0 && (
            <div className="flex items-center gap-1 text-amber-400 font-mono">
              <Activity className="w-3 h-3" />
              <span>{diagnostics.fallbackCount} Fallbacks</span>
            </div>
          )}
        </div>
      </div>

      {/* WEBGPU MODEL DOWNLOAD PROGRESS MONITOR */}
      {diagnostics.webGpuProgress.isLoading && (
        <div className="bg-slate-950/90 border border-indigo-500/30 p-2 rounded-xl flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-cyan-400 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 animate-bounce" /> Loading In-Browser AI Weights into VRAM/Cache...
            </span>
            <span className="font-mono text-slate-300">{Math.round(diagnostics.webGpuProgress.progress * 100)}%</span>
          </div>
          <Progress value={diagnostics.webGpuProgress.progress * 100} className="h-1.5 bg-slate-800" />
          <span className="text-[10px] text-slate-400 truncate font-mono">{diagnostics.webGpuProgress.text}</span>
        </div>
      )}
    </div>
  );
}