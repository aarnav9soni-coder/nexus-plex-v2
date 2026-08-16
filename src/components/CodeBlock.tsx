import React, { useState } from "react";
import { Check, Copy, Download, Terminal, FileCode } from "lucide-react";
import { downloadFile } from "@/utils/fileAnalyzer";

interface CodeBlockProps {
  language?: string;
  code: string;
}

const EXTENSION_MAP: Record<string, string> = {
  javascript: "js",
  js: "js",
  typescript: "ts",
  ts: "ts",
  tsx: "tsx",
  jsx: "jsx",
  python: "py",
  py: "py",
  json: "json",
  html: "html",
  css: "css",
  scss: "scss",
  sql: "sql",
  bash: "sh",
  sh: "sh",
  rust: "rs",
  go: "go",
  java: "java",
  cpp: "cpp",
  c: "c",
  yaml: "yaml",
  yml: "yml",
  markdown: "md",
  md: "md",
  text: "txt",
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = "javascript", code }) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanLang = language.replace(/^language-/, "").toLowerCase() || "text";
  const ext = EXTENSION_MAP[cleanLang] || "txt";
  const isLargeOrRefactored = code.length > 80 || code.includes("\n");

  const handleDownload = () => {
    const filename = `nexus_refactored_${Date.now().toString().slice(-4)}.${ext}`;
    downloadFile(code, filename, "text/plain");
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="my-4 rounded-2xl border border-[#1E2638] bg-[#0A0D14] overflow-hidden shadow-xl font-mono text-sm group">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#111622] border-b border-[#1E2638]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#06B6D4]" />
          <span className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-wider">{cleanLang}</span>
          {isLargeOrRefactored && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/20 hidden sm:inline-block">
              Refactor Preview
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#06B6D4] hover:text-white bg-[#06B6D4]/10 hover:bg-[#06B6D4]/25 border border-[#06B6D4]/30 rounded-lg transition-colors shadow-sm"
            title="Download refactored code file"
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#E2E8F0] hover:text-white bg-[#1A2234] hover:bg-[#253046] border border-[#1E2638] rounded-lg transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto text-[#E2E8F0] bg-[#080B11]/90 leading-relaxed font-mono text-xs sm:text-sm">
        <pre className="m-0">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

