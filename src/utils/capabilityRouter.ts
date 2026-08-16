/**
 * Capability Query Router & Dynamic Assistant Engine for Nexus Plex
 * Accurately analyzes whether user is asking what Nexus Plex can/cannot do,
 * providing crystal-clear confirmation, feature matrices, and 1-click execution prompts.
 * Engineered by Lead Architect Aarnav.
 */

export interface CapabilityMatch {
  isCapabilityQuery: boolean;
  category?: "general" | "image" | "video" | "audio" | "presentation" | "code" | "web" | "voice";
  responseMarkdown: string;
}

const CAPABILITY_QUESTIONS_PATTERNS = [
  // General capability questions
  /\b(what\s+can\s+you\s+(do|make|generate|create|build|render))\b/i,
  /\b(what\s+are\s+your\s+(capabilities|features|functions|skills|powers))\b/i,
  /\b(what\s+do\s+you\s+(support|offer))\b/i,
  /\b(list\s+(your\s+)?(features|capabilities|abilities))\b/i,
  /\b(how\s+can\s+you\s+help(\s+me)?)\b/i,

  // Image capability questions
  /\b(can\s+you\s+(make|generate|create|draw|render|produce)\s+(an?\s+)?(image|images|picture|pictures|photo|photos|artwork|graphics|art))\b/i,
  /\b(can\s+you\s+not\s+(make|generate|create|draw|render)\s+(an?\s+)?(image|images|pictures?|photos?))\b/i,
  /\b(do\s+you\s+(make|support|generate|create)\s+(images?|pictures?|art|photos?))\b/i,
  /\b(are\s+you\s+able\s+to\s+(draw|paint|generate|make)\s+(images?|pictures?))\b/i,

  // Video capability questions
  /\b(can\s+you\s+(make|generate|create|produce|animate)\s+(a\s+)?(video|videos|clips?|animations?|movies?))\b/i,
  /\b(can\s+you\s+not\s+(make|generate|create|produce)\s+(a\s+)?(video|videos))\b/i,
  /\b(do\s+you\s+(support|generate|create)\s+(video|videos|animation))\b/i,

  // Music & Audio capability questions
  /\b(can\s+you\s+(make|generate|create|compose|produce)\s+(a\s+)?(song|songs|music|audio|tracks?|beats?))\b/i,
  /\b(can\s+you\s+not\s+(make|generate|create|compose)\s+(music|songs?|audio))\b/i,
  /\b(do\s+you\s+(make|support|generate|create)\s+(music|audio|songs?))\b/i,

  // Presentation & Slides capability questions
  /\b(can\s+you\s+(make|generate|create|build|design)\s+(a\s+)?(presentation|presentations|slides|slide\s*decks?|ppt|powerpoints?|pitch\s*decks?))\b/i,
  /\b(can\s+you\s+not\s+(make|create|generate)\s+(slides?|presentations?|ppt))\b/i,
  /\b(do\s+you\s+(make|support|generate|create)\s+(slides?|presentations?|decks?))\b/i,

  // Code capability questions
  /\b(can\s+you\s+(write|generate|build|code|debug|fix|create)\s+(code|apps?|programs?|scripts?|software|websites?|components?))\b/i,
  /\b(do\s+you\s+(support|write|know)\s+(programming|coding|python|javascript|typescript|react|html))\b/i,

  // URL & Web capability questions
  /\b(can\s+you\s+(browse|scrape|read|analyze|open|check|visit)\s+(urls?|links?|websites?|web\s*pages?))\b/i,

  // Voice capability questions
  /\b(can\s+you\s+(speak|talk|listen|hear|use\s+voice))\b/i,
  /\b(do\s+you\s+have\s+(voice|speech|audio\s+mode))\b/i,
];

/**
 * Checks if prompt is an inquiry regarding capabilities rather than an explicit command to generate.
 */
export function checkCapabilityQuery(prompt: string): CapabilityMatch {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  // If starts with direct slash commands, it is an execution request, NOT a question
  if (trimmed.startsWith("/") && !trimmed.startsWith("/help")) {
    return { isCapabilityQuery: false, responseMarkdown: "" };
  }

  // Check specific category inquiry
  if (
    /\b(can\s+you\s+(make|generate|create|draw|render|produce)\s+(an?\s+)?(image|images|picture|pictures|photo|photos|artwork|art))\b/i.test(lower) ||
    /\b(can\s+you\s+not\s+(make|generate|create|draw|render)\s+(an?\s+)?(image|images|pictures?))\b/i.test(lower) ||
    /\b(do\s+you\s+(make|support|generate|create)\s+(images?|pictures?|art|photos?))\b/i.test(lower) ||
    /\b(are\s+you\s+able\s+to\s+(draw|paint|generate|make)\s+(images?|pictures?))\b/i.test(lower)
  ) {
    return {
      isCapabilityQuery: true,
      category: "image",
      responseMarkdown: `### 🎨 Yes! Nexus Plex Generates Native HD Images

**Nexus Plex** features a built-in enterprise image generation engine powered by **Google Imagen 3 (HD Studio)** and **Flux 1.1 Pro**, producing crystal-clear, zero-watermark visuals in 4K resolution.

#### ✨ Capabilities:
- **Aspect Ratios:** Square (\`1:1\`), Cinematic Widescreen (\`16:9\`), Portrait/Mobile (\`9:16\`), Standard (\`4:3\`).
- **Aesthetic Styles:** Photorealistic, Cyberpunk, Cinematic Lighting, 3D Render, Anime, Oil Painting, and Minimalist Vector.
- **Controls:** Direct high-res download, 1-click prompt re-rolling, and full-screen lightbox preview.

---
💡 **Try any prompt right now:**
- \`"Generate a photorealistic 8K image of a neon-lit cyberpunk Tokyo street in rain ratio:16:9"\`
- \`"Create a futuristic concept art illustration of an AI glass skyscraper with floating gardens"\`
- \`"Draw a studio portrait of a cybernetic cat with luminous blue eyes style:Cinematic"\``,
    };
  }

  // Video inquiry
  if (
    /\b(can\s+you\s+(make|generate|create|produce|animate)\s+(a\s+)?(video|videos|clips?|animations?|movies?))\b/i.test(lower) ||
    /\b(can\s+you\s+not\s+(make|generate|create|produce)\s+(a\s+)?(video|videos))\b/i.test(lower) ||
    /\b(do\s+you\s+(support|generate|create)\s+(video|videos|animation))\b/i.test(lower)
  ) {
    return {
      isCapabilityQuery: true,
      category: "video",
      responseMarkdown: `### 🎥 Yes! Nexus Plex Generates AI Videos & Animations

**Nexus Plex** includes a dedicated motion video synthesis engine supporting dynamic camera motion, looping streams, and progressive HTML5 canvas animation.

#### 🎬 Capabilities:
- **Formats:** High-resolution MP4 video streaming loops and interactive canvas motion renderers.
- **Cinematic Controls:** Panning, zooming, orbiting, hyperlapse, and camera drone motion paths.
- **Duration & Ratios:** Configurable durations (5s to 30s) and widescreen (\`16:9\`) formats.

---
💡 **Try any video prompt right now:**
- \`"Generate a video of a hypercar driving down a neon highway at sunset motion:Orbit"\`
- \`"Create a smooth drone video flying over mountain peaks in winter ratio:16:9"\`
- \`"Animate cosmic nebulae swirling in deep space with particle physics"\``,
    };
  }

  // Music & Audio inquiry
  if (
    /\b(can\s+you\s+(make|generate|create|compose|produce)\s+(a\s+)?(song|songs|music|audio|tracks?|beats?))\b/i.test(lower) ||
    /\b(can\s+you\s+not\s+(make|generate|create|compose)\s+(music|songs?|audio))\b/i.test(lower) ||
    /\b(do\s+you\s+(make|support|generate|create)\s+(music|audio|songs?))\b/i.test(lower)
  ) {
    return {
      isCapabilityQuery: true,
      category: "audio",
      responseMarkdown: `### 🎵 Yes! Nexus Plex Generates Custom Music & Audio Tracks

**Nexus Plex** features a WebAudio multi-oscillator polyphonic synthesizer engine with real-time waveform visualizers, producing original soundscapes, electronic beats, and ambient soundtracks.

#### 🎹 Capabilities:
- **Genres:** Synth-Pop, Lo-Fi Chill, Cyberpunk Techno, Ambient Meditation, Cinematic Orchestral, EDM, and Retrowave.
- **Audio Synthesis:** Real-time frequency oscillators, tempo (BPM) modulation, customizable scales, and stereo reverb.
- **Interactive Player:** Live waveform equalizer, volume control, and direct audio export.

---
💡 **Try any audio prompt right now:**
- \`"Compose a chill Lo-Fi beat with rain sounds genre:Lo-Fi bpm:85"\`
- \`"Generate an energetic cyberpunk electronic track with heavy bass bpm:130"\`
- \`"Create an ambient cosmic soundscape for deep focus and meditation"\``,
    };
  }

  // Slides & Presentations inquiry
  if (
    /\b(can\s+you\s+(make|generate|create|build|design)\s+(a\s+)?(presentation|presentations|slides|slide\s*decks?|ppt|powerpoints?|pitch\s*decks?))\b/i.test(lower) ||
    /\b(can\s+you\s+not\s+(make|create|generate)\s+(slides?|presentations?|ppt))\b/i.test(lower) ||
    /\b(do\s+you\s+(make|support|generate|create)\s+(slides?|presentations?|decks?))\b/i.test(lower)
  ) {
    return {
      isCapabilityQuery: true,
      category: "presentation",
      responseMarkdown: `### 📊 Yes! Nexus Plex Generates Interactive Slide Decks

**Nexus Plex** creates complete, structured multi-slide presentations with key takeaways, visual bullet frameworks, speaker notes, and presentation mode controls.

#### 📑 Capabilities:
- **Slide Controls:** Full-screen presentation mode, slide carousel navigation, and keyboard controls.
- **Export Options:** Instant export to presentation format or printable document.
- **Customization:** Adjustable slide counts (\`slides:5\` to \`slides:15\`), themes, and corporate pitch templates.

---
💡 **Try any presentation prompt right now:**
- \`"Create a 6-slide investor pitch deck on renewable energy AI startups slides:6"\`
- \`"Generate a presentation explaining quantum computing fundamentals for executives"\`
- \`"Build a slide deck on full-stack web architecture best practices"\``,
    };
  }

  // Code & Apps inquiry
  if (
    /\b(can\s+you\s+(write|generate|build|code|debug|fix|create)\s+(code|apps?|programs?|scripts?|software|websites?|components?))\b/i.test(lower) ||
    /\b(do\s+you\s+(support|write|know)\s+(programming|coding|python|javascript|typescript|react|html))\b/i.test(lower)
  ) {
    return {
      isCapabilityQuery: true,
      category: "code",
      responseMarkdown: `### 💻 Yes! Nexus Plex Is an Advanced Code Execution & Development Suite

**Nexus Plex** is engineered by Lead Architect **Aarnav** to provide expert-grade code generation, debugging, refactoring, and single-click file exporting.

#### ⚡ Capabilities:
- **Languages & Frameworks:** TypeScript, JavaScript, Python, React, Next.js, Node.js, HTML/Tailwind CSS, SQL, Rust, Go, and C++.
- **Code Block Tools:** 1-click copy, download raw code files, syntax highlighting, and inline explanations.
- **Architecture & System Design:** Full backend APIs, database schemas, responsive UI components, and algorithmic solutions.

---
💡 **Try any coding prompt right now:**
- \`"Write a full React TypeScript custom hook for real-time WebSocket communication"\`
- \`"Generate an Express.js rate-limiting middleware with Redis caching"\`
- \`"Build a clean Tailwind CSS responsive pricing card component with dark mode"\``,
    };
  }

  // Web Scraping & URL Analysis inquiry
  if (/\b(can\s+you\s+(browse|scrape|read|analyze|open|check|visit)\s+(urls?|links?|websites?|web\s*pages?))\b/i.test(lower)) {
    return {
      isCapabilityQuery: true,
      category: "web",
      responseMarkdown: `### 🌐 Yes! Nexus Plex Analyzes Real-Time URLs & Web Pages

**Nexus Plex** includes a server-side URL scraper and document ingestion pipeline that extracts raw text, articles, and documentation from live web links.

#### 🔍 Capabilities:
- **Live URL Scraping:** Automatically extracts clean article content, metadata, and tables from any public HTTP/HTTPS URL.
- **Multi-File Attachment:** Attach PDFs, images, code files, CSVs, and documents for vision analysis.
- **Deep Synthesis:** Summarize long research papers, cross-reference technical documentation, and extract key metrics.

---
💡 **Try pasting any URL or asking:**
- \`"Analyze https://en.wikipedia.org/wiki/Artificial_intelligence and summarize its history"\`
- \`"Extract the key architecture points from https://react.dev"\``,
    };
  }

  // Voice inquiry
  if (
    /\b(can\s+you\s+(speak|talk|listen|hear|use\s+voice))\b/i.test(lower) ||
    /\b(do\s+you\s+have\s+(voice|speech|audio\s+mode))\b/i.test(lower)
  ) {
    return {
      isCapabilityQuery: true,
      category: "voice",
      responseMarkdown: `### 🎙️ Yes! Nexus Plex Features Live Voice & Speech Recognition

**Nexus Plex** provides bidirectional voice capabilities with high-accuracy speech-to-text and natural speech synthesis.

#### 🔊 Capabilities:
- **Nexus Live Voice Mode:** Real-time conversational voice interface with live audio waveform feedback.
- **Whisper Input:** Tap the microphone icon in the chat input to speak your prompt in any language.
- **Text-to-Speech (TTS):** 1-click audio playback on any AI response message with natural prosody.`,
    };
  }

  // General "What can you do / What can you generate" inquiry
  const isGeneralQuery = CAPABILITY_QUESTIONS_PATTERNS.some((p) => p.test(lower));
  if (isGeneralQuery) {
    return {
      isCapabilityQuery: true,
      category: "general",
      responseMarkdown: `### 🚀 Welcome to Nexus Plex — Unified AI Creation Platform
*Engineered by Lead Architect & Developer **Aarnav***

**Nexus Plex** is an all-in-one AI workspace combining multimodal generation, autonomous reasoning, and high-performance development tools into a single seamless interface.

---

### 🌟 Core Capabilities Overview:

| Modality | Features & Capabilities | Quick Command / Action |
| :--- | :--- | :--- |
| 🎨 **Image Generation** | Google Imagen 3 (HD Studio) & Flux 1.1 Pro (Zero-watermark 4K) | \`"Generate an image of..."\` |
| 🎥 **Video Generation** | Dynamic motion streams, camera pans, and HTML5 canvas animations | \`"Generate a video of..."\` |
| 🎵 **Music & Audio** | Polyphonic synthesizer, Lo-Fi, Cyberpunk, EDM & Ambient tracks | \`"Compose a song..."\` |
| 📊 **Presentations** | Multi-slide interactive slide decks with presentation mode & export | \`"Create a slide deck on..."\` |
| 💻 **Code & Development**| Full-stack code generation, refactoring, and 1-click file downloads | \`"Write code for..."\` |
| 🌐 **Live Web & Files** | Real-time URL scraping, PDF/image vision analysis, multi-file uploads | Paste URL or drag files |
| 🎙️ **Live Voice & Audio** | Bidirectional voice conversations, Whisper speech input, and audio TTS | Click 🎙️ Live Voice |
| 💾 **Zero-Auth Export** | 1-click Markdown, JSON, PDF printable, and email sharing | Click 📥 Export Chat |

---
💡 **What would you like to build or generate today? Just describe your idea or ask a question!**`,
    };
  }

  return { isCapabilityQuery: false, responseMarkdown: "" };
}
