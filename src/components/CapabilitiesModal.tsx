import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Globe,
  FileCode,
  Video,
  Sparkles,
  Mic,
  Layout,
  Music,
  Brain,
  ArrowRight,
  Shield,
  Layers,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";

export interface CapabilityItem {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  badge: string;
  description: string;
  samplePrompt: string;
  accentColor: string;
  borderColor: string;
  bgGradient: string;
}

const CAPABILITIES: CapabilityItem[] = [
  {
    id: "url-inspector",
    title: "URL & Web Inspector",
    category: "Live Web & DOM Extraction",
    icon: Globe,
    badge: "Universal Web",
    description: "Extract, clean, and summarize any live webpage or API documentation instantly.",
    samplePrompt: "Analyze this site: https://news.ycombinator.com and highlight top technology discussions",
    accentColor: "#06B6D4",
    borderColor: "rgba(6, 182, 212, 0.4)",
    bgGradient: "from-cyan-950/40 via-slate-900/40 to-slate-950",
  },
  {
    id: "file-refactor",
    title: "File & Code Refactor",
    category: "Developer Tooling",
    icon: FileCode,
    badge: "1-Click Download",
    description: "Upload any script or document with 'Fix this' or 'Refactor for speed' and download the cleaned file.",
    samplePrompt: "Refactor this Python script for concurrency, typing, and async performance\n\ndef fetch_all(urls):\n    res = []\n    for u in urls: res.append(requests.get(u))\n    return res",
    accentColor: "#8B5CF6",
    borderColor: "rgba(139, 92, 246, 0.4)",
    bgGradient: "from-purple-950/40 via-slate-900/40 to-slate-950",
  },
  {
    id: "video-gen",
    title: "AI Video Generation",
    category: "Motion & Media Engine",
    icon: Video,
    badge: "Async Polling 4K",
    description: "Generate 15s cinematic motion video loops with async generation ID polling.",
    samplePrompt: "/video Create a cinematic 4K video clip of a futuristic cyberpunk highway at dusk with neon light trails",
    accentColor: "#F43F5E",
    borderColor: "rgba(244, 63, 94, 0.4)",
    bgGradient: "from-rose-950/40 via-slate-900/40 to-slate-950",
  },
  {
    id: "vision-art",
    title: "High-Res Vision Art",
    category: "Generative Vision",
    icon: Sparkles,
    badge: "Dual-Path Synth",
    description: "Synthesize photorealistic 8K digital art, logos, and UI concepts with prompt enhancement.",
    samplePrompt: "/art Photorealistic 8K cyberpunk neon street with volumetric fog, rainy reflections, and glowing holograms",
    accentColor: "#06B6D4",
    borderColor: "rgba(6, 182, 212, 0.4)",
    bgGradient: "from-cyan-950/40 via-slate-900/40 to-slate-950",
  },
  {
    id: "live-voice",
    title: "Nexus Live Voice",
    category: "Continuous Audio",
    icon: Mic,
    badge: "Stutter-Tolerant",
    description: "Hands-free continuous conversational voice with real-time waveform equalizer and speech-then-text.",
    samplePrompt: "Explain how quantum entanglement enables quantum key distribution in simple terms",
    accentColor: "#10B981",
    borderColor: "rgba(16, 185, 129, 0.4)",
    bgGradient: "from-emerald-950/40 via-slate-900/40 to-slate-950",
  },
  {
    id: "presentation-deck",
    title: "Slide Deck Presentations",
    category: "Presentation Engine",
    icon: Layout,
    badge: "Interactive Deck",
    description: "Generate multi-slide structured presentation decks with speaker notes and full-screen viewer.",
    samplePrompt: "/ppt Pitch deck for an autonomous AI robotics startup raising Series A funding",
    accentColor: "#3B82F6",
    borderColor: "rgba(59, 130, 246, 0.4)",
    bgGradient: "from-blue-950/40 via-slate-900/40 to-slate-950",
  },
  {
    id: "websynth-audio",
    title: "WebSynth Audio & Music",
    category: "Audio Synthesis",
    icon: Music,
    badge: "124 BPM WebSynth",
    description: "Synthesize seeded soundscapes, cyberpunk tracks, and arpeggiated synth loops.",
    samplePrompt: "/music Synthesize an 80s synthwave arpeggiated soundtrack at 124 BPM genre:Synthwave bpm:124",
    accentColor: "#A855F7",
    borderColor: "rgba(168, 85, 247, 0.4)",
    bgGradient: "from-purple-950/40 via-slate-900/40 to-slate-950",
  },
  {
    id: "deep-reasoning",
    title: "Deep Reasoning Engine",
    category: "Chain-of-Thought",
    icon: Brain,
    badge: "Multi-Step Logic",
    description: "Execute deep chain-of-thought analysis with structured thought steps and code verification.",
    samplePrompt: "/reason Analyze the mathematical convergence of distributed consensus algorithms under Byzantine faults",
    accentColor: "#F59E0B",
    borderColor: "rgba(245, 158, 11, 0.4)",
    bgGradient: "from-amber-950/40 via-slate-900/40 to-slate-950",
  },
];

interface CapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const CapabilitiesModal: React.FC<CapabilitiesModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const handleSelectTemplate = (prompt: string) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    } else {
      window.dispatchEvent(
        new CustomEvent("nexus-populate-prompt", {
          detail: { text: prompt },
        })
      );
    }
    showSuccess("Template applied to prompt bar!");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden z-10"
            style={{
              backgroundColor: "var(--app-panel, #0D111A)",
              borderColor: "var(--app-border, #1E2638)",
              color: "var(--app-text, #E2E8F0)",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2638] bg-[#0A0D14]/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#06B6D4] via-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white shadow-lg shadow-[#06B6D4]/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <span>AI Capabilities Explorer</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30">
                      Nexus Plex Core
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Engineered by Lead Architect Aarnav • Select any capability template to launch instantly
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Close Explorer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Capabilities Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {CAPABILITIES.map((cap) => {
                  const Icon = cap.icon;
                  return (
                    <motion.div
                      key={cap.id}
                      whileHover={{ scale: 1.015, y: -2 }}
                      transition={{ duration: 0.15 }}
                      className={`p-4 rounded-2xl border bg-gradient-to-br ${cap.bgGradient} flex flex-col justify-between gap-3 shadow-lg transition-all group`}
                      style={{ borderColor: cap.borderColor }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md shrink-0"
                              style={{ backgroundColor: `${cap.accentColor}25`, color: cap.accentColor }}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-sm text-white tracking-tight">
                                {cap.title}
                              </h3>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {cap.category}
                              </span>
                            </div>
                          </div>

                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold"
                            style={{
                              backgroundColor: `${cap.accentColor}15`,
                              color: cap.accentColor,
                              borderColor: `${cap.accentColor}40`,
                            }}
                          >
                            {cap.badge}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {cap.description}
                        </p>
                      </div>

                      {/* Sample Prompt Box & Action */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400 font-mono italic truncate max-w-[240px] sm:max-w-[280px]">
                          "{cap.samplePrompt}"
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleSelectTemplate(cap.samplePrompt)}
                          className="h-7 px-3 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 shadow-sm"
                          style={{
                            backgroundColor: cap.accentColor,
                            color: "#080B11",
                          }}
                        >
                          <span>Use</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Identity & Architectural Footer Banner */}
              <div className="p-3.5 rounded-2xl bg-[#080B11] border border-[#1E2638] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#06B6D4]" />
                  <span>
                    <strong className="text-white">Nexus Plex Engine:</strong> Full multimodal support for Code, Live Web Scraping, 4K Video, and Real-time Voice.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8B5CF6]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Architect: Aarnav</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
