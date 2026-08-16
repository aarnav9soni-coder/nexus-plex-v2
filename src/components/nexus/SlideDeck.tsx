"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Download, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";

export interface Slide {
  title: string;
  content: string;
  bullets: string[];
}

interface SlideDeckProps {
  topic: string;
  prompt?: string;
  customSlides?: Slide[];
}

const THEMES = {
  dark: { bg: "bg-slate-900", accent: "text-indigo-400", border: "border-slate-700" },
  indigo: { bg: "bg-gradient-to-br from-indigo-950 to-slate-950", accent: "text-indigo-300", border: "border-indigo-800" },
  cyberpunk: { bg: "bg-gradient-to-br from-fuchsia-950 to-slate-950", accent: "text-fuchsia-400", border: "border-fuchsia-800" },
};

export function generateSlidesForTopic(topic: string): Slide[] {
  const cleanTopic = topic.trim() || "Executive Overview";
  const words = cleanTopic.split(" ").slice(0, 4);
  const keyConcept = words.join(" ");

  return [
    {
      title: `1. Introduction to ${keyConcept}`,
      content: `An executive summary and high-level briefing on ${cleanTopic}.`,
      bullets: [
        `Core principles driving ${keyConcept}`,
        "Market importance and strategic relevance",
        "Key goals and intended audience outcomes",
      ],
    },
    {
      title: `2. Architecture & Design Principles`,
      content: `Examining the structural framework and technical pillars underpinning ${cleanTopic}.`,
      bullets: [
        "Modular framework and design patterns",
        "Scalability, performance, and reliability considerations",
        "Best practices for implementation and maintenance",
      ],
    },
    {
      title: `3. Key Features & Business Impact`,
      content: `How ${cleanTopic} delivers value across enterprise, research, and creative workflows.`,
      bullets: [
        "Primary capabilities and functional advantages",
        "Process optimization and efficiency gains",
        "Real-world case studies and operational metrics",
      ],
    },
    {
      title: `4. Implementation Roadmap & Challenges`,
      content: `Overcoming obstacles and establishing a structured deployment plan for ${cleanTopic}.`,
      bullets: [
        "Identified risks and mitigation strategies",
        "Phase-by-phase rollout milestones",
        "Resource allocation and team requirements",
      ],
    },
    {
      title: `5. Summary & Strategic Next Steps`,
      content: `Actionable recommendations to leverage ${cleanTopic} effectively moving forward.`,
      bullets: [
        "Executive takeaway highlights",
        "Immediate action items for integration",
        "Continuous improvement and long-term vision",
      ],
    },
  ];
}

export function downloadPresentationFile(topic: string, slides?: Slide[]) {
  const deckSlides = slides || generateSlidesForTopic(topic);
  const cleanTitle = topic.trim() || "Nexus Presentation";

  const slidesHtml = deckSlides
    .map(
      (s, idx) => `
    <div class="slide ${idx === 0 ? "active" : ""}" id="slide-${idx}">
      <div class="slide-header">
        <span class="badge">NEXUS PRESENTATION</span>
        <span class="slide-num">Slide ${idx + 1} of ${deckSlides.length}</span>
      </div>
      <h2>${s.title}</h2>
      <p class="description">${s.content}</p>
      <ul class="bullets">
        ${s.bullets.map((b) => `<li><span class="dot"></span>${b}</li>`).join("")}
      </ul>
    </div>`
    )
    .join("");

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle} - Presentation Deck</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #090d16;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .deck-container {
      width: 100%;
      max-width: 900px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: rgba(30, 41, 59, 0.8);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .title { font-weight: 800; font-size: 14px; color: #818cf8; text-transform: uppercase; tracking: 1px; }
    .slide-area { padding: 40px; min-height: 380px; position: relative; }
    .slide { display: none; animation: fadeIn 0.4s ease-in-out; }
    .slide.active { display: block; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .slide-header { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center; }
    .badge { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: bold; }
    .slide-num { font-size: 12px; color: #64748b; font-family: monospace; }
    h2 { font-size: 26px; color: #38bdf8; margin-bottom: 14px; font-weight: 800; }
    .description { font-size: 15px; color: #cbd5e1; margin-bottom: 24px; line-height: 1.6; }
    .bullets { list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .bullets li { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #94a3b8; }
    .dot { width: 8px; height: 8px; background: #818cf8; border-radius: 50%; flex-shrink: 0; }
    .footer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: #020617;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .btn {
      background: #6366f1;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 12px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn:hover { background: #4f46e5; transform: translateY(-1px); }
    .btn:disabled { background: #334155; opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="deck-container">
    <div class="top-bar">
      <span class="title">⚡ ${cleanTitle}</span>
      <span style="font-size:12px; color:#64748b;">Interactive HTML5 Presentation</span>
    </div>
    <div class="slide-area">
      ${slidesHtml}
    </div>
    <div class="footer-bar">
      <button class="btn" id="prevBtn" onclick="prevSlide()" disabled>← Previous</button>
      <span id="counter" style="font-size:13px; color:#94a3b8; font-family:monospace;">Slide 1 / ${deckSlides.length}</span>
      <button class="btn" id="nextBtn" onclick="nextSlide()">Next →</button>
    </div>
  </div>

  <script>
    let current = 0;
    const total = ${deckSlides.length};

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
  const fileName = `${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-presentation.html`;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showSuccess(`Downloaded "${fileName}"!`);
}

export function SlideDeck({ topic, prompt, customSlides }: SlideDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [theme, setTheme] = useState<keyof typeof THEMES>("dark");

  const slides: Slide[] = useMemo(() => {
    if (customSlides && customSlides.length > 0) return customSlides;
    return generateSlidesForTopic(topic);
  }, [topic, customSlides]);

  const themeColors = THEMES[theme];

  useEffect(() => {
    setCurrentSlide(0);
  }, [topic]);

  const handleExport = () => {
    downloadPresentationFile(topic, slides);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-indigo-300">Presentation Deck</span>
          <span className="text-[10px] text-slate-500 max-w-[200px] truncate">{topic}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as keyof typeof THEMES)}
            className="bg-slate-950 border border-slate-800 text-[10px] text-slate-400 rounded-lg px-2 py-1"
          >
            <option value="dark">Dark</option>
            <option value="indigo">Nexus Indigo</option>
            <option value="cyberpunk">Cyberpunk</option>
          </select>
          <Button
            size="sm"
            onClick={handleExport}
            className="h-7 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold px-2.5 flex items-center gap-1 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>📥 Export Presentation</span>
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className={`${themeColors.bg} p-6 min-h-[280px] transition-colors duration-300`}>
        <h2 className={`text-xl font-bold ${themeColors.accent} mb-3`}>{slides[currentSlide].title}</h2>
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">{slides[currentSlide].content}</p>
        <ul className="space-y-2">
          {slides[currentSlide].bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${themeColors.accent.replace("text-", "bg-")} mt-1.5 shrink-0`} />
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="h-7 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <span className="text-xs text-slate-500 font-mono">
            {currentSlide + 1} / {slides.length}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="h-7 text-slate-400 hover:text-white"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
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
      </div>
    </div>
  );
}