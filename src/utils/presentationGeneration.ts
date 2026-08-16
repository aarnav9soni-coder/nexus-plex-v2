export interface Slide {
  title: string;
  content: string;
  bullets: string[];
}

export interface PresentationResult {
  slides: Slide[];
  htmlUrl: string;
  topic: string;
}

export async function generatePresentation(topic: string): Promise<PresentationResult> {
  const slides = await generateSlidesWithAI(topic);
  const htmlUrl = generatePresentationHTML(topic, slides);
  
  return { slides, htmlUrl, topic };
}

async function generateSlidesWithAI(topic: string): Promise<Slide[]> {
  // In production, this would call an LLM API
  // For now, generate structured slides based on topic analysis
  const keywords = extractKeywords(topic);
  const structure = determineStructure(topic);
  
  return structure.map((section, i) => ({
    title: `${i + 1}. ${section.title.replace("{topic}", topic).replace("{keywords}", keywords.join(", "))}`,
    content: section.content.replace("{topic}", topic),
    bullets: section.bullets.map(b => b.replace("{topic}", topic).replace("{keywords}", keywords.join(", "))),
  }));
}

function extractKeywords(topic: string): string[] {
  // Simple keyword extraction
  const stopWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "about", "make", "create", "build", "generate", "presentation", "slides", "ppt", "deck"];
  return topic
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w))
    .slice(0, 5);
}

function determineStructure(topic: string): Array<{title: string, content: string, bullets: string[]}> {
  const lower = topic.toLowerCase();
  
  if (lower.includes("technical") || lower.includes("architecture") || lower.includes("system") || lower.includes("api")) {
    return [
      { title: "Introduction to {topic}", content: "Technical overview and system context for {topic}.", bullets: ["System boundaries and scope", "Key stakeholders and users", "Technical requirements summary"] },
      { title: "Architecture & Design", content: "High-level architecture and design decisions for {topic}.", bullets: ["Component diagram overview", "Data flow patterns", "Technology stack rationale", "Scalability considerations"] },
      { title: "Implementation Details", content: "Core implementation strategies for {topic}.", bullets: ["Critical algorithms and logic", "API contracts and interfaces", "Error handling patterns", "Performance optimizations"] },
      { title: "Deployment & Operations", content: "Operational considerations for {topic}.", bullets: ["Infrastructure requirements", "Monitoring and observability", "Rollout strategy", "Disaster recovery"] },
      { title: "Summary & Next Steps", content: "Key takeaways and action items for {topic}.", bullets: ["Priority implementation tasks", "Technical debt considerations", "Future enhancement opportunities", "Team ownership assignments"] },
    ];
  }
  
  if (lower.includes("business") || lower.includes("strategy") || lower.includes("market") || lower.includes("product")) {
    return [
      { title: "Executive Summary: {topic}", content: "Business context and strategic rationale for {topic}.", bullets: ["Market opportunity size", "Competitive landscape", "Value proposition", "Success metrics"] },
      { title: "Market Analysis", content: "Detailed market research supporting {topic}.", bullets: ["Target customer segments", "Market trends and drivers", "Competitive differentiation", "Barriers to entry"] },
      { title: "Solution Overview", content: "Product/solution details for {topic}.", bullets: ["Core features and benefits", "User journey highlights", "Pricing and packaging", "Go-to-market approach"] },
      { title: "Financial Projections", content: "Financial model and projections for {topic}.", bullets: ["Revenue model assumptions", "Cost structure breakdown", "Unit economics", "Break-even timeline"] },
      { title: "Roadmap & Milestones", content: "Execution roadmap for {topic}.", bullets: ["Phase 1: MVP delivery", "Phase 2: Feature expansion", "Phase 3: Scale & optimize", "Key dependencies and risks"] },
    ];
  }
  
  // Default general structure
  return [
    { title: "Introduction to {topic}", content: "Comprehensive overview of {topic} and its significance.", bullets: ["Background and context", "Key objectives", "Scope and boundaries", "Intended audience"] },
    { title: "Core Concepts & Principles", content: "Fundamental concepts underlying {topic}.", bullets: ["Primary principles", "Theoretical framework", "Key terminology", "Foundational models"] },
    { title: "Detailed Analysis", content: "In-depth examination of {topic} components.", bullets: ["Component 1: {keywords}", "Component 2: {keywords}", "Component 3: {keywords}", "Interdependencies and relationships"] },
    { title: "Applications & Use Cases", content: "Practical applications of {topic} in real-world scenarios.", bullets: ["Use case 1: {keywords}", "Use case 2: {keywords}", "Use case 3: {keywords}", "Success criteria and metrics"] },
    { title: "Conclusion & Recommendations", content: "Summary of findings and recommended next steps for {topic}.", bullets: ["Key takeaways", "Immediate actions", "Long-term strategy", "Further research needed"] },
  ];
}

function generatePresentationHTML(topic: string, slides: Slide[]): string {
  const cleanTitle = topic.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const slidesHtml = slides.map((s, idx) => `
    <div class="slide ${idx === 0 ? "active" : ""}" id="slide-${idx}">
      <div class="slide-header">
        <span class="badge">NEXUS PRESENTATION</span>
        <span class="slide-num">Slide ${idx + 1} of ${slides.length}</span>
      </div>
      <h2>${escapeHtml(s.title)}</h2>
      <p class="description">${escapeHtml(s.content)}</p>
      <ul class="bullets">
        ${s.bullets.map(b => `<li><span class="dot"></span>${escapeHtml(b)}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(topic)} - Presentation Deck</title>
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
      <span class="title">⚡ ${escapeHtml(topic)}</span>
      <span style="font-size:12px; color:#64748b;">Interactive HTML5 Presentation</span>
    </div>
    <div class="slide-area">
      ${slidesHtml}
    </div>
    <div class="footer-bar">
      <button class="btn" id="prevBtn" onclick="prevSlide()" disabled>← Previous</button>
      <span id="counter" style="font-size:13px; color:#94a3b8; font-family:monospace;">Slide 1 / ${slides.length}</span>
      <button class="btn" id="nextBtn" onclick="nextSlide()">Next →</button>
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
  return URL.createObjectURL(blob);
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function downloadPresentation(htmlUrl: string, topic: string): void {
  const a = document.createElement("a");
  a.href = htmlUrl;
  a.download = `${topic.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-presentation.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}