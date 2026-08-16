"use client";

import React, { useState } from "react";
import { Download, Maximize2, RefreshCw, ChevronLeft, ChevronRight, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { downloadPresentation } from "@/utils/presentationGeneration";

interface GeneratedPresentationProps {
  htmlUrl: string;
  slides: Array<{title: string, content: string, bullets: string[]}>;
  topic: string;
  model: string;
  messageId: string;
}

export function GeneratedPresentation({ htmlUrl, slides, topic, model, messageId }: GeneratedPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    downloadPresentation(htmlUrl, topic);
    setDownloadSuccess(true);
    showSuccess("Presentation downloaded!");
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const handleRegenerate = () => {
    window.dispatchEvent(new CustomEvent("nexus-regenerate-presentation", { 
      detail: { topic, messageId } 
    }));
  };

  return (
    <div className="relative group rounded-2xl border border-slate-700/50 overflow-hidden bg-slate-950/50 shadow-xl">
      {/* Slide Preview */}
      <div className="relative aspect-[4/3] bg-slate-900">
        <iframe
          src={htmlUrl}
          className="w-full h-full border-0"
          title={`Presentation: ${topic}`}
          sandbox="allow-scripts allow-same-origin"
        />
        
        {/* Overlay Controls */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl bg-black/60 backdrop-blur-sm text-white hover:bg-black/80"
            onClick={handleDownload}
            disabled={downloadSuccess}
            title="Download HTML Presentation"
          >
            {downloadSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl bg-black/60 backdrop-blur-sm text-white hover:bg-black/80"
            onClick={() => window.open(htmlUrl, "_blank")}
            title="Open Full Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl bg-black/60 backdrop-blur-sm text-white hover:bg-black/80"
            onClick={handleRegenerate}
            title="Regenerate Variation"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Slide Navigator */}
      <div className="p-3 border-t border-slate-800/50 bg-slate-900/50 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-300 font-mono truncate max-w-[200px]">{topic}</p>
          <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-800 font-mono">{model}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          
          <div className="flex items-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentSlide ? "bg-indigo-400" : "bg-slate-700 hover:bg-slate-500"
                }`}
              />
            ))}
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        <div className="text-[10px] text-slate-500 text-center">
          Slide {currentSlide + 1} of {slides.length} • {slides[currentSlide]?.title}
        </div>
      </div>
    </div>
  );
}