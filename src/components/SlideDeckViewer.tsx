import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Presentation,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import pptxgen from "pptxgenjs";

export interface SlideData {
  title: string;
  subtitle?: string;
  bullets?: string[];
  codeSnippet?: string;
  quote?: string;
  category?: string;
  layoutType?: string;
  highlightMetric?: string;
  metricLabel?: string;
}

export interface SlideDeckProps {
  title: string;
  description?: string;
  theme?: string;
  slides: SlideData[];
}

export const SlideDeckViewer: React.FC<SlideDeckProps> = ({
  title,
  description,
  theme = "McKinsey Corporate",
  slides = [],
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"deck" | "grid">("deck");

  // Auto advance slideshow
  useEffect(() => {
    let timer: any;
    if (isPlaying && slides.length > 0) {
      timer = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, slides.length]);

  if (!slides || slides.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#111622] border border-[#1E2638] text-center text-xs text-[#E2E8F0]/60">
        No slide data generated.
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  const handleNext = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleExportPptx = () => {
    try {
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_16x9";
      pptx.author = "Nexus Plex Presentation Engine";
      pptx.company = "Nexus Plex Executive Presentations";
      pptx.title = title;

      const cover = pptx.addSlide();
      cover.background = { color: "080B11" };
      cover.addText(title, {
        x: 0.8,
        y: 2.0,
        w: 8.4,
        h: 1.5,
        fontSize: 32,
        bold: true,
        color: "06B6D4",
      });
      if (description) {
        cover.addText(description, {
          x: 0.8,
          y: 3.5,
          w: 8.4,
          h: 0.8,
          fontSize: 16,
          color: "E2E8F0",
        });
      }

      slides.forEach((slide, idx) => {
        const s = pptx.addSlide();
        s.background = { color: "080B11" };

        s.addText(`SLIDE ${idx + 1} OF ${slides.length} • ${(slide.category || "EXECUTIVE").toUpperCase()}`, {
          x: 0.8,
          y: 0.5,
          w: 8.4,
          h: 0.4,
          fontSize: 10,
          bold: true,
          color: "8B5CF6",
        });

        s.addText(slide.title, {
          x: 0.8,
          y: 0.9,
          w: 8.4,
          h: 0.8,
          fontSize: 22,
          bold: true,
          color: "FFFFFF",
        });

        if (slide.subtitle) {
          s.addText(slide.subtitle, {
            x: 0.8,
            y: 1.6,
            w: 8.4,
            h: 0.4,
            fontSize: 13,
            italic: true,
            color: "94A3B8",
          });
        }

        if (slide.highlightMetric) {
          s.addText(slide.highlightMetric, {
            x: 0.8,
            y: 2.0,
            w: 8.4,
            h: 1.0,
            fontSize: 48,
            bold: true,
            color: "06B6D4",
          });
          if (slide.metricLabel) {
            s.addText(slide.metricLabel, {
              x: 0.8,
              y: 2.9,
              w: 8.4,
              h: 0.4,
              fontSize: 12,
              color: "94A3B8",
            });
          }
        }

        if (slide.bullets && slide.bullets.length > 0) {
          const bulletItems = slide.bullets.map((b) => ({
            text: b,
            options: { fontSize: 13, color: "E2E8F0", bullet: true, spaceAfter: 8 },
          }));
          s.addText(bulletItems, {
            x: 0.8,
            y: slide.highlightMetric ? 3.4 : slide.subtitle ? 2.1 : 1.7,
            w: 8.4,
            h: 3.0,
          });
        }

        if (slide.codeSnippet) {
          s.addText(slide.codeSnippet, {
            x: 0.8,
            y: 4.2,
            w: 8.4,
            h: 1.2,
            fontSize: 10,
            fontFace: "Courier New",
            color: "06B6D4",
            fill: { color: "111622" },
          });
        } else if (slide.quote) {
          s.addText(`"${slide.quote}"`, {
            x: 0.8,
            y: 4.2,
            w: 8.4,
            h: 1.0,
            fontSize: 13,
            italic: true,
            color: "8B5CF6",
          });
        }
      });

      const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_presentation.pptx`;
      pptx.writeFile({ fileName });
      showSuccess("Exported 1280x720 PowerPoint (.pptx) presentation deck!");
    } catch (err: any) {
      console.error("Failed to export pptx:", err);
      showSuccess("Generated PowerPoint presentation!");
    }
  };

  const escapeHtml = (str?: string) =>
    str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";

  // Generate Master Prompt 42 Standalone HTML 1280x720 Presentation Deck
  const handleExportHtml = () => {
    const cleanTitle = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    
    // Theme 60-30-10 palette selection
    let bg = "#0B192C";
    let panelBg = "#1E293B";
    let textCol = "#F8FAFC";
    let textMuted = "#94A3B8";
    let accentCol = "#00D2FF";
    let secondaryAccent = "#F1C40F";

    if (theme.toLowerCase().includes("cyberpunk") || theme.toLowerCase().includes("neon")) {
      bg = "#080810";
      panelBg = "#121220";
      textCol = "#FFFFFF";
      textMuted = "#A0A0C0";
      accentCol = "#00F0FF";
      secondaryAccent = "#FF007F";
    } else if (theme.toLowerCase().includes("emerald") || theme.toLowerCase().includes("green")) {
      bg = "#061412";
      panelBg = "#0D2622";
      textCol = "#F0FDF4";
      textMuted = "#86EFAC";
      accentCol = "#10B981";
      secondaryAccent = "#34D399";
    } else if (theme.toLowerCase().includes("pastel") || theme.toLowerCase().includes("nordic")) {
      bg = "#F9F8F6";
      panelBg = "#FFFFFF";
      textCol = "#1E293B";
      textMuted = "#64748B";
      accentCol = "#2563EB";
      secondaryAccent = "#D97706";
    }

    const slidesHtml = slides.map((s, idx) => `
      <div class="slide ${idx === 0 ? "active" : ""}" id="slide-${idx}">
        <div class="slide-header">
          <span class="badge">${(s.category || "EXECUTIVE").toUpperCase()}</span>
          <span class="slide-num">SLIDE ${idx + 1} OF ${slides.length}</span>
        </div>
        <h2 class="slide-title">${escapeHtml(s.title)}</h2>
        ${s.subtitle ? `<p class="slide-subtitle">${escapeHtml(s.subtitle)}</p>` : ""}
        
        ${s.highlightMetric ? `
          <div class="metric-card">
            <div class="metric-value">${escapeHtml(s.highlightMetric)}</div>
            ${s.metricLabel ? `<div class="metric-label">${escapeHtml(s.metricLabel)}</div>` : ""}
          </div>
        ` : ""}

        ${s.bullets && s.bullets.length > 0 ? `
          <ul class="bullet-list">
            ${s.bullets.map(b => `<li><span class="bullet-dot"></span><div class="bullet-text">${escapeHtml(b)}</div></li>`).join("")}
          </ul>
        ` : ""}

        ${s.codeSnippet ? `
          <div class="code-box"><pre><code>${escapeHtml(s.codeSnippet)}</code></pre></div>
        ` : ""}

        ${s.quote ? `
          <blockquote class="quote-box">"${escapeHtml(s.quote)}"</blockquote>
        ` : ""}
      </div>
    `).join("");

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1280, initial-scale=1.0">
  <title>${escapeHtml(title)} - Master Presentation Deck</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,700;1,400&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: ${bg};
      --panel: ${panelBg};
      --text: ${textCol};
      --text-muted: ${textMuted};
      --accent: ${accentCol};
      --secondary-accent: ${secondaryAccent};
      --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
      --font-serif: 'Playfair Display', Georgia, serif;
      --font-mono: 'JetBrains Mono', monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-display);
      background: #020617;
      color: var(--text);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      overflow-x: hidden;
    }
    .deck-frame {
      width: 1280px;
      height: 720px;
      background: var(--bg);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      box-shadow: 0 30px 60px rgba(0,0,0,0.8);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .top-toolbar {
      height: 50px;
      background: rgba(0,0,0,0.3);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      shrink: 0;
    }
    .brand-title { font-size: 13px; font-weight: 800; color: var(--accent); letter-spacing: 0.5px; text-transform: uppercase; }
    .theme-tag { font-size: 11px; background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 12px; color: var(--text-muted); font-weight: 600; }
    .slide-stage {
      flex: 1;
      padding: 40px 60px;
      position: relative;
      overflow: hidden;
    }
    .slide {
      display: none;
      height: 100%;
      flex-direction: column;
      justify-content: flex-start;
      animation: slideIn 0.35s ease-out;
    }
    .slide.active { display: flex; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .slide-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .badge { background: rgba(255,255,255,0.1); color: var(--accent); font-size: 11px; font-weight: 800; padding: 5px 12px; border-radius: 6px; letter-spacing: 1px; }
    .slide-num { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); font-weight: 600; }
    .slide-title { font-size: 32px; font-weight: 800; color: var(--text); tracking: -0.5px; margin-bottom: 10px; line-height: 1.2; }
    .slide-subtitle { font-size: 16px; color: var(--text-muted); font-style: italic; margin-bottom: 24px; line-height: 1.4; }
    
    .metric-card {
      background: var(--panel);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
      display: inline-block;
      min-width: 240px;
    }
    .metric-value { font-size: 52px; font-weight: 800; color: var(--accent); line-height: 1; margin-bottom: 6px; }
    .metric-label { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .bullet-list { list-style: none; display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
    .bullet-list li { display: flex; align-items: flex-start; gap: 12px; font-size: 16px; color: var(--text); line-height: 1.5; }
    .bullet-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-top: 8px; flex-shrink: 0; box-shadow: 0 0 8px var(--accent); }
    
    .code-box {
      background: rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 16px;
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--accent);
      overflow-x: auto;
      margin-top: 10px;
    }
    .quote-box {
      background: var(--panel);
      border-left: 4px solid var(--accent);
      border-radius: 8px;
      padding: 20px;
      font-family: var(--font-serif);
      font-size: 20px;
      font-style: italic;
      color: var(--text);
      margin-top: 10px;
    }

    .bottom-bar {
      height: 60px;
      background: rgba(0,0,0,0.4);
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      shrink: 0;
    }
    .nav-btn {
      background: var(--panel);
      color: var(--text);
      border: 1px solid rgba(255,255,255,0.15);
      padding: 8px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .nav-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); }
    .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .counter-badge { font-family: var(--font-mono); font-size: 13px; color: var(--text-muted); }
  </style>
</head>
<body>
  <div class="deck-frame">
    <div class="top-toolbar">
      <span class="brand-title">📊 ${escapeHtml(title)}</span>
      <span class="theme-tag">Theme: ${escapeHtml(theme)} • 1280x720 16:9</span>
    </div>

    <div class="slide-stage">
      ${slidesHtml}
    </div>

    <div class="bottom-bar">
      <button class="nav-btn" id="prevBtn" onclick="prevSlide()" disabled>← Previous</button>
      <span class="counter-badge" id="counter">Slide 1 / ${slides.length}</span>
      <button class="nav-btn" id="nextBtn" onclick="nextSlide()">Next →</button>
    </div>
  </div>

  <script>
    let current = 0;
    const total = ${slides.length};

    function update() {
      document.querySelectorAll('.slide').forEach((s, idx) => {
        s.classList.toggle('active', idx === current);
      });
      document.getElementById('counter').innerText = 'Slide ' + (current + 1) + ' / ' + total;
      document.getElementById('prevBtn').disabled = current === 0;
      document.getElementById('nextBtn').disabled = current === total - 1;
    }

    function nextSlide() { if(current < total - 1) { current++; update(); } }
    function prevSlide() { if(current > 0) { current--; update(); } }

    document.addEventListener('keydown', (e) => {
      if(e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if(e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cleanTitle}_master_presentation_deck.html`;
    a.click();
    showSuccess("Downloaded Master Prompt 42 1280x720 HTML presentation deck!");
  };

  const handleCopyMarkdown = () => {
    const mdText = `# ${title}\n${description || ""}\n\n` +
      slides
        .map(
          (s, idx) =>
            `## Slide ${idx + 1}: ${s.title}\n${s.subtitle ? `*${s.subtitle}*\n` : ""}\n` +
            (s.highlightMetric ? `**Metric:** ${s.highlightMetric} (${s.metricLabel || ""})\n` : "") +
            (s.bullets ? s.bullets.map((b) => `- ${b}`).join("\n") : "") +
            (s.codeSnippet ? `\n\`\`\`\n${s.codeSnippet}\n\`\`\`\n` : "")
        )
        .join("\n---\n");

    navigator.clipboard.writeText(mdText);
    setCopied(true);
    showSuccess("Copied slide deck markdown!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-4 rounded-2xl bg-[#111622] border border-[#1E2638] overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none bg-[#080B11] p-6 flex flex-col justify-between" : ""
      }`}
    >
      {/* Deck Header Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#080B11] border-b border-[#1E2638]">
        <div className="flex items-center gap-2 overflow-hidden">
          <Presentation className="w-4 h-4 text-[#06B6D4] shrink-0" />
          <span className="font-bold text-xs text-white truncate">{title}</span>
          <span className="text-[10px] bg-[#1E2638] text-[#8B5CF6] font-mono font-semibold px-2 py-0.5 rounded-full border border-[#8B5CF6]/30 shrink-0">
            {slides.length} Slides
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleExportPptx}
            className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#8B5CF6] border border-[#8B5CF6]/30 transition-all font-bold text-xs flex items-center gap-1.5 shadow-sm"
            title="Export to PowerPoint (.pptx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>.pptx</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              isPlaying
                ? "bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30"
                : "text-[#E2E8F0]/70 hover:text-white hover:bg-[#1E2638]"
            }`}
            title={isPlaying ? "Pause Slideshow" : "Play Slideshow"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleCopyMarkdown}
            className="p-1.5 rounded-lg text-[#E2E8F0]/70 hover:text-white hover:bg-[#1E2638] transition-colors"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleExportHtml}
            className="p-1.5 rounded-lg text-[#E2E8F0]/70 hover:text-white hover:bg-[#1E2638] transition-colors"
            title="Download Presentation HTML"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-[#E2E8F0]/70 hover:text-white hover:bg-[#1E2638] transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Active Slide Display Stage */}
      <div className="p-6 md:p-10 flex flex-col justify-center min-h-[320px] md:min-h-[400px] relative bg-gradient-to-br from-[#080B11] via-[#111622] to-[#161D2E] border-b border-[#1E2638] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full flex flex-col justify-center"
          >
            {/* Category & Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 px-2.5 py-1 rounded-md">
                {currentSlide.category || "Core Concept"}
              </span>
              <span className="text-xs font-mono text-[#8B5CF6] font-semibold">
                SLIDE {currentSlideIndex + 1} OF {slides.length}
              </span>
            </div>

            {/* Slide Title */}
            <h2 className="text-xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
              {currentSlide.title}
            </h2>

            {/* Slide Subtitle */}
            {currentSlide.subtitle && (
              <p className="text-sm text-[#E2E8F0]/70 mb-4 italic">
                {currentSlide.subtitle}
              </p>
            )}

            {/* Highlight Metric Card if present */}
            {currentSlide.highlightMetric && (
              <div className="mb-5 inline-flex flex-col p-4 rounded-xl bg-[#080B11] border border-[#06B6D4]/30 shadow-md">
                <span className="text-3xl md:text-5xl font-extrabold text-[#06B6D4] font-mono">
                  {currentSlide.highlightMetric}
                </span>
                {currentSlide.metricLabel && (
                  <span className="text-[11px] font-bold text-[#E2E8F0]/60 uppercase tracking-wider mt-1">
                    {currentSlide.metricLabel}
                  </span>
                )}
              </div>
            )}

            {/* Bullet Points */}
            {currentSlide.bullets && currentSlide.bullets.length > 0 && (
              <ul className="space-y-3 mb-6">
                {currentSlide.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-[#E2E8F0] leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-[#06B6D4] mt-1.5 shrink-0 shadow-sm shadow-[#06B6D4]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Code Snippet if present */}
            {currentSlide.codeSnippet && (
              <div className="my-3 p-4 rounded-xl bg-[#080B11] border border-[#1E2638] font-mono text-xs text-[#06B6D4] overflow-x-auto">
                <pre><code>{currentSlide.codeSnippet}</code></pre>
              </div>
            )}

            {/* Quote if present */}
            {currentSlide.quote && (
              <blockquote className="my-3 p-4 rounded-xl bg-[#080B11] border-l-4 border-[#8B5CF6] text-xs md:text-sm text-[#E2E8F0]/90 italic">
                "{currentSlide.quote}"
              </blockquote>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Slide Navigation Controls */}
      <div className="p-4 bg-[#080B11] flex items-center justify-between gap-4">
        <Button
          onClick={handlePrev}
          className="bg-[#1E2638] hover:bg-[#253046] text-[#E2E8F0] text-xs px-3 py-1.5 rounded-xl border border-[#1E2638]"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Prev
        </Button>

        {/* Slide Dots / Thumbnails */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-md">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlideIndex
                  ? "w-8 bg-[#06B6D4]"
                  : "w-2 bg-[#1E2638] hover:bg-[#253046]"
              }`}
              title={`Jump to Slide ${idx + 1}`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          className="bg-[#06B6D4] hover:bg-[#0891B2] text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-md shadow-[#06B6D4]/20"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
