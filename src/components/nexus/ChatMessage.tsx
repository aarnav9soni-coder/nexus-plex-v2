"use client";

import React, { useState } from "react";
import { Copy, Check, Volume2, VolumeX, Sparkles, Code, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showSuccess } from "@/utils/toast";
import { GeneratedImage } from "./GeneratedImage";
import { GeneratedVideo } from "./GeneratedVideo";
import { GeneratedAudio } from "./GeneratedAudio";
import { GeneratedPresentation } from "./GeneratedPresentation";
import { GenerationIndicatorBadge, GenerationSkeletonCard } from "@/components/ChatArea";
import { MessageItem } from "@/pages/Index";
import { sanitizeResponseText } from "@/utils/textSanitizer";

interface ChatMessageProps {
  message: MessageItem;
  isStreaming?: boolean;
  onCopy: (id: string) => void;
  onSpeak: (id: string, text: string) => void;
  speakingId: string | null;
  copiedId: string | null;
}

export function ChatMessage({ message, isStreaming, onCopy, onSpeak, speakingId, copiedId }: ChatMessageProps) {
  const [showRaw, setShowRaw] = useState(false);
  const isCurrentlyGenerating = message.sender === "ai" && (isStreaming || message.isStreaming);
  const hasNoContentYet = !message.text?.trim() && !message.generatedImage && !message.generatedVideo && !message.generatedAudio && !message.generatedPresentation;

  const renderContent = () => {
    // Render generated media components
    if (message.commandType === "image" && message.generatedImage) {
      return <GeneratedImage {...message.generatedImage} messageId={message.id} />;
    }
    if (message.commandType === "video" && message.generatedVideo) {
      return <GeneratedVideo {...message.generatedVideo} messageId={message.id} />;
    }
    if (message.commandType === "audio" && message.generatedAudio) {
      return <GeneratedAudio {...message.generatedAudio} messageId={message.id} />;
    }
    if (message.commandType === "presentation" && message.generatedPresentation) {
      return <GeneratedPresentation {...message.generatedPresentation} messageId={message.id} />;
    }

    // Render text content with markdown
    return <MarkdownRenderer text={message.text} isStreaming={isStreaming} />;
  };

  return (
    <div className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
      {message.sender === "ai" && (
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
      )}
      <div className={`max-w-[88%] sm:max-w-[80%] p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed ${
        message.sender === "user"
          ? "bg-indigo-600/90 text-white font-medium rounded-tr-sm shadow-lg shadow-indigo-600/20 border border-indigo-500/30"
          : "bg-neutral-900/70 backdrop-blur-2xl border border-neutral-800/80 text-neutral-200 rounded-tl-sm shadow-2xl"
      } ${isCurrentlyGenerating ? "border-indigo-500/50 shadow-indigo-500/10 shadow-2xl" : ""}`}>
        {isCurrentlyGenerating && (
          <GenerationIndicatorBadge commandType={message.commandType} text={message.text} />
        )}

        {isCurrentlyGenerating && hasNoContentYet ? (
          <GenerationSkeletonCard commandType={message.commandType} />
        ) : (
          renderContent()
        )}
        
        <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-400 pt-2 border-t border-neutral-800/50">
          <span>{message.timestamp}</span>
          <div className="flex items-center gap-2">
            {message.commandType && (
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono">
                {message.commandType}
              </Badge>
            )}
            <button
              onClick={() => onSpeak(message.id, message.text)}
              className="hover:text-white transition-colors flex items-center gap-1 p-1 rounded-lg hover:bg-neutral-800"
              title="Read aloud"
            >
              {speakingId === message.id ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.text);
                onCopy(message.id);
                showSuccess("Copied to clipboard!");
              }}
              className="hover:text-white transition-colors flex items-center gap-1 p-1 rounded-lg hover:bg-neutral-800"
              title="Copy text"
            >
              {copiedId === message.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkdownRenderer({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  const cleanText = sanitizeResponseText(text);
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: Array<{ type: "text"; value: string } | { type: "code"; lang: string; value: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: cleanText.substring(lastIndex, match.index) });
    }
    parts.push({ type: "code", lang: match[1] || "code", value: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleanText.length) {
    parts.push({ type: "text", value: cleanText.substring(lastIndex) });
  }

  if (parts.length === 0) {
    return <div className="whitespace-pre-wrap font-sans">{cleanText}</div>;
  }

  return (
    <div className="space-y-3 font-sans">
      {parts.map((p, idx) => {
        if (p.type === "text") {
          return <div key={idx}>{renderMarkdownText(p.value)}</div>;
        }
        return (
          <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs my-2">
            <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <Code className="w-3.5 h-3.5" /> {p.lang}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(p.value);
                  showSuccess("Code copied!");
                }}
                className="hover:text-white flex items-center gap-1 text-[10px]"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <pre className="p-3 text-slate-200 overflow-x-auto leading-relaxed">{p.value}</pre>
          </div>
        );
      })}
    </div>
  );
}

function renderMarkdownText(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={key} className="list-disc list-inside space-y-1.5 my-2 pl-1 text-slate-300">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList(`flush-${idx}`);
      elements.push(
        <h3 key={idx} className="text-base font-bold text-indigo-300 mt-3 mb-1">
          {renderInlineFormatting(trimmed.replace(/^###\s+/, ""))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList(`flush-${idx}`);
      elements.push(
        <h2 key={idx} className="text-lg font-extrabold text-indigo-400 mt-4 mb-2">
          {renderInlineFormatting(trimmed.replace(/^##\s+/, ""))}
        </h2>
      );
      return;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      inList = true;
      const content = trimmed.replace(/^[-*•]\s+/, "");
      listItems.push(<li key={`li-${idx}`}>{renderInlineFormatting(content)}</li>);
      return;
    } else {
      flushList(`flush-${idx}`);
    }

    if (!trimmed) {
      elements.push(<div key={idx} className="h-2" />);
      return;
    }

    if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
      const mathStr = trimmed.slice(2, -2).trim();
      elements.push(
        <div key={idx} className="my-3 p-3 bg-slate-950 border border-indigo-500/40 rounded-xl text-center font-mono text-sm text-cyan-300 shadow-inner overflow-x-auto">
          {mathStr}
        </div>
      );
      return;
    }

    elements.push(
      <p key={idx} className="leading-relaxed">
        {renderInlineFormatting(line)}
      </p>
    );
  });

  flushList("flush-final");
  return <div className="space-y-1">{elements}</div>;
}

function renderInlineFormatting(text: string): React.ReactNode {
  const tokenRegex = /(\*\*.*?\*\*|`.*?`|\$.*?\$)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={i} className="font-bold text-slate-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={i} className="bg-slate-900 border border-slate-700/80 px-1.5 py-0.5 rounded font-mono text-[11px] text-cyan-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("$") && part.endsWith("$") && part.length >= 2) {
      return (
        <span key={i} className="font-mono text-cyan-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-800/40">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}