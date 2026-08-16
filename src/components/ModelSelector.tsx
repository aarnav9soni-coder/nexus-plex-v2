import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { SUPPORTED_MODELS, ModelOption, getModelConfig } from "../utils/modelConfig";

export { SUPPORTED_MODELS };
export type { ModelOption };

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  userEmail?: string;
  className?: string;
  dropUp?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  className = "",
  dropUp = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = getModelConfig(selectedModel);
  const Icon = currentModel.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Gemini-Style Pill Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium cursor-pointer shadow-sm hover:bg-[#1E2638]/60 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        style={{
          backgroundColor: "var(--app-panel)",
          borderColor: "var(--app-border)",
          color: "var(--app-text)",
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon className="w-3.5 h-3.5 shrink-0 text-[#06B6D4]" />
        <span className="font-semibold tracking-tight truncate max-w-[130px] sm:max-w-[180px]">{currentModel.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Floating Dropdown Menu (Opens Upwards by default to prevent viewport clipping) */}
      {isOpen && (
        <div
          className={`absolute left-0 w-72 rounded-2xl border p-1.5 shadow-2xl z-[9999] animate-in fade-in zoom-in-95 space-y-1 ${
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          }`}
          style={{
            backgroundColor: "var(--app-panel)",
            borderColor: "var(--app-border)",
            color: "var(--app-text)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/40 mb-1 flex items-center justify-between">
            <span>Select Intelligence Model</span>
            <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-mono">Nexus Plex</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 text-left scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {SUPPORTED_MODELS.map((model) => {
              const isSelected = model.id === selectedModel || model.apiModelId === selectedModel;
              const ModelIcon = model.icon;

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors text-xs cursor-pointer ${
                    isSelected
                      ? "bg-[#06B6D4]/15 border border-[#06B6D4]/30"
                      : "hover:bg-[#1E2638]/60 border border-transparent"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isSelected ? "bg-[#06B6D4] text-slate-950" : "bg-slate-800/60 text-slate-300"}`}>
                    <ModelIcon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-semibold text-xs truncate ${isSelected ? "text-[#06B6D4]" : "text-slate-200"}`}>
                        {model.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{model.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
