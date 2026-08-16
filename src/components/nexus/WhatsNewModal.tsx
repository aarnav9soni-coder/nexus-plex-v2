import React from "react";
import { Sparkles, CheckCircle2, Zap, ShieldCheck, Cpu, Bell, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsNewModal({ isOpen, onClose }: WhatsNewModalProps) {
  const releaseNotes = [
    {
      version: "v2.5.0",
      date: "Latest Release",
      title: "Zero API Key Setup & Free Authentication",
      highlights: [
        "100% Free Keyless Gateway — No API key needed to start chatting or generating media.",
        "Seamless User Authentication — Google 1-Click & Email/Password login.",
        "Web Push Notification Opt-in — Stay updated with major AI feature drops.",
        "Advanced Custom Key Option — Power users can still provide custom Gemini API keys.",
      ],
    },
    {
      version: "v2.4.0",
      date: "Previous Update",
      title: "Theme Engine & Dual Canvas",
      highlights: [
        "6 High-Contrast Themes: Nexus Dark, Cyberpunk, Emerald Matrix, Sunset Synth, Nordic Slate, and Light Minimal.",
        "Live Dual Canvas Preview for Slide Decks (/ppt), Motion Video (/video), and Synth Audio (/music).",
        "Command Palette (Cmd + K) for rapid workspace navigation and quick templates.",
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-slate-950 border-slate-800 text-slate-100 p-6 rounded-3xl shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">What's New in Nexus Plex</h2>
              <p className="text-xs text-slate-400">Architected & Engineered by Aarnav</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-2.5 py-0.5">
            Up to date
          </Badge>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {releaseNotes.map((note) => (
            <div key={note.version} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                    {note.version}
                  </span>
                  <h3 className="text-xs font-bold text-slate-200">{note.title}</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{note.date}</span>
              </div>

              <ul className="space-y-2">
                {note.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex justify-end">
          <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl h-9 px-5">
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}