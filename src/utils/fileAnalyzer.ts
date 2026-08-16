/**
 * Universal Multi-Format File & Media Analysis Engine
 * Nexus Plex Architecture - Engineered by Lead Developer & Architect Aarnav.
 */

export interface AnalyzedFile {
  name: string;
  type: "document" | "code" | "image" | "video" | "audio" | "binary";
  mimeType: string;
  size: number;
  formattedSize: string;
  extension: string;
  textContent?: string;
  dataUrl?: string;
  language?: string;
  isRefactorable: boolean;
}

const CODE_EXTENSIONS = new Set([
  "js", "jsx", "ts", "tsx", "py", "json", "html", "css", "scss",
  "c", "cpp", "h", "hpp", "java", "go", "rs", "rb", "php", "swift",
  "kt", "dart", "sql", "sh", "bash", "yaml", "yml", "xml", "toml",
  "lua", "r", "scala", "clj", "hs", "dockerfile", "env", "gitignore"
]);

const DOC_EXTENSIONS = new Set([
  "txt", "md", "markdown", "csv", "rtf", "log", "pdf", "docx", "doc", "odt"
]);

const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "ico", "avif"
]);

const VIDEO_EXTENSIONS = new Set([
  "mp4", "webm", "mov", "avi", "mkv", "m4v"
]);

const AUDIO_EXTENSIONS = new Set([
  "mp3", "wav", "ogg", "m4a", "aac", "flac"
]);

const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  json: "json",
  html: "html",
  css: "css",
  scss: "scss",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  java: "java",
  go: "go",
  rs: "rust",
  rb: "ruby",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  dart: "dart",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  toml: "toml",
  md: "markdown",
  txt: "text",
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Universal file processor supporting Code, Docs, Video, Audio, and Vision Images
 */
export async function analyzeUploadedFile(file: File): Promise<AnalyzedFile> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isCode = CODE_EXTENSIONS.has(ext);
  const isDoc = DOC_EXTENSIONS.has(ext);
  const isImg = IMAGE_EXTENSIONS.has(ext) || file.type.startsWith("image/");
  const isVid = VIDEO_EXTENSIONS.has(ext) || file.type.startsWith("video/");
  const isAud = AUDIO_EXTENSIONS.has(ext) || file.type.startsWith("audio/");

  let category: AnalyzedFile["type"] = "binary";
  if (isCode) category = "code";
  else if (isDoc) category = "document";
  else if (isImg) category = "image";
  else if (isVid) category = "video";
  else if (isAud) category = "audio";

  const language = LANGUAGE_MAP[ext] || (isCode ? ext : undefined);
  const isRefactorable = isCode || (isDoc && (ext === "txt" || ext === "md" || ext === "csv" || ext === "json"));

  return new Promise((resolve) => {
    // 1. Text & Code extraction
    if (isCode || (isDoc && !["pdf", "docx", "doc"].includes(ext)) || file.type.startsWith("text/")) {
      const textReader = new FileReader();
      textReader.onload = (e) => {
        const text = (e.target?.result as string) || "";
        resolve({
          name: file.name,
          type: category,
          mimeType: file.type || `text/${ext}`,
          size: file.size,
          formattedSize: formatFileSize(file.size),
          extension: ext,
          textContent: text.slice(0, 100000), // Up to 100k chars
          language,
          isRefactorable: true,
        });
      };
      textReader.onerror = () => {
        resolve(fallbackBinaryResult(file, category, ext, language, isRefactorable));
      };
      textReader.readAsText(file);
      return;
    }

    // 2. Multimodal media (Images, Audio, Video, PDF Data URL)
    const mediaReader = new FileReader();
    mediaReader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || "";
      resolve({
        name: file.name,
        type: category,
        mimeType: file.type || `application/${ext}`,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        extension: ext,
        dataUrl,
        language,
        isRefactorable: false,
      });
    };
    mediaReader.onerror = () => {
      resolve(fallbackBinaryResult(file, category, ext, language, isRefactorable));
    };
    mediaReader.readAsDataURL(file);
  });
}

function fallbackBinaryResult(
  file: File,
  category: AnalyzedFile["type"],
  ext: string,
  language?: string,
  isRefactorable: boolean = false
): AnalyzedFile {
  return {
    name: file.name,
    type: category,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    formattedSize: formatFileSize(file.size),
    extension: ext,
    language,
    isRefactorable,
  };
}

/**
 * Checks if user prompt expresses an intent to fix, debug, convert, or refactor code/files
 */
export function detectRefactorIntent(prompt: string): boolean {
  if (!prompt) return false;
  const p = prompt.toLowerCase();
  return (
    p.includes("fix this") ||
    p.includes("fix the") ||
    p.includes("fix bugs") ||
    p.includes("refactor") ||
    p.includes("optimize") ||
    p.includes("convert this") ||
    p.includes("clean up") ||
    p.includes("improve performance") ||
    p.includes("rewrite this") ||
    p.includes("debug this") ||
    p.includes("find errors") ||
    p.includes("make it work")
  );
}

/**
 * Formats analyzed file for injection into LLM context window
 */
export function formatFileForPromptContext(file: AnalyzedFile): string {
  if (file.textContent) {
    const lang = file.language || file.extension || "text";
    return `
[Attached File: ${file.name} (${file.formattedSize}, ${file.type})]
\`\`\`${lang}
${file.textContent}
\`\`\`
`.trim();
  }

  if (file.type === "image") {
    return `[Attached Vision Image: ${file.name} (${file.formattedSize}, ${file.mimeType}) - Loaded for multimodal vision inspection]`;
  }

  if (file.type === "video") {
    return `[Attached Video Asset: ${file.name} (${file.formattedSize}, ${file.mimeType}) - Multimodal video stream]`;
  }

  if (file.type === "audio") {
    return `[Attached Audio Track: ${file.name} (${file.formattedSize}, ${file.mimeType}) - Multimodal audio stream]`;
  }

  return `[Attached Binary File: ${file.name} (${file.formattedSize}, ${file.mimeType})]`;
}

/**
 * Triggers a browser download for refactored/fixed files
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/plain") {
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("[Nexus Download] Failed to download file:", err);
  }
}

export const analyzeFile = analyzeUploadedFile;

