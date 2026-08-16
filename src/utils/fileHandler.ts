export interface ProcessedFile {
  name: string;
  type: string;
  size: number;
  content: string;
  mimeType: string;
}

export function processFile(file: File): Promise<ProcessedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve({
        name: file.name,
        type: file.type || getFileType(file.name),
        size: file.size,
        content: content.slice(0, 50000), // Limit to 50k chars
        mimeType: file.type,
      });
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    
    if (file.type.startsWith("text/") || isTextFile(file.name)) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}

function isTextFile(filename: string): boolean {
  const textExtensions = [".txt", ".md", ".js", ".ts", ".tsx", ".jsx", ".py", ".json", ".csv", ".html", ".css", ".xml", ".yaml", ".yml", ".sh", ".sql", ".rs", ".go", ".java", ".cpp", ".c", ".h", ".php", ".rb", ".swift", ".kt", ".dart", ".lua", ".r", ".m", ".pl", ".scala", ".clj", ".hs", ".ml", ".fs", ".vb", ".pas", ".asm", ".s", ".tex", ".bib", ".rst", ".adoc", ".org", ".txt", ".log", ".ini", ".cfg", ".conf", ".config", ".toml", ".env", ".properties", ".gradle", ".maven", ".sbt", ".bazel", ".cmake", ".make", ".dockerfile", ".gitignore", ".gitattributes", ".editorconfig", ".eslintrc", ".prettierrc", ".babelrc", ".tsconfig", ".jsconfig"];
  return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

function getFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    js: "application/javascript",
    ts: "application/typescript",
    tsx: "application/typescript",
    jsx: "application/javascript",
    py: "text/x-python",
    json: "application/json",
    html: "text/html",
    css: "text/css",
    md: "text/markdown",
    txt: "text/plain",
    csv: "text/csv",
    xml: "application/xml",
    yaml: "application/yaml",
    yml: "application/yaml",
  };
  return types[ext || ""] || "application/octet-stream";
}

export function formatFileForContext(file: ProcessedFile): string {
  if (file.mimeType.startsWith("text/") || isTextFile(file.name)) {
    return `\n[File: ${file.name}]\n\`\`\`${getLanguageFromFilename(file.name)}\n${file.content}\n\`\`\`\n`;
  } else {
    return `\n[File: ${file.name} (${formatBytes(file.size)}, ${file.mimeType}) - Binary file attached]\n`;
  }
}

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const langs: Record<string, string> = {
    js: "javascript", ts: "typescript", tsx: "tsx", jsx: "jsx",
    py: "python", json: "json", html: "html", css: "css",
    md: "markdown", sh: "bash", sql: "sql", rs: "rust",
    go: "go", java: "java", cpp: "cpp", c: "c", h: "c",
    php: "php", rb: "ruby", swift: "swift", kt: "kotlin",
    dart: "dart", lua: "lua", r: "r", scala: "scala",
  };
  return langs[ext || ""] || "";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}