"use client";

import React from "react";
import { X, FileText, FileCode, FileSpreadsheet, FileImage, FileAudio, FileVideo, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProcessedFile } from "@/utils/fileHandler";

interface AttachmentPreviewProps {
  files: ProcessedFile[];
  onRemove: (index: number) => void;
}

export function AttachmentPreview({ files, onRemove }: AttachmentPreviewProps) {
  const getFileIcon = (file: ProcessedFile) => {
    if (file.mimeType.startsWith("image/")) return <FileImage className="w-4 h-4 text-green-400" />;
    if (file.mimeType.startsWith("audio/")) return <FileAudio className="w-4 h-4 text-amber-400" />;
    if (file.mimeType.startsWith("video/")) return <FileVideo className="w-4 h-4 text-red-400" />;
    if (file.mimeType.includes("code") || file.name.match(/\.(js|ts|tsx|jsx|py|rs|go|java|cpp|c|h)$/)) return <FileCode className="w-4 h-4 text-blue-400" />;
    if (file.mimeType.includes("spreadsheet") || file.name.match(/\.(csv|xlsx|xls)$/)) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (file.mimeType.startsWith("text/")) return <FileText className="w-4 h-4 text-slate-400" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-slate-900/50 border border-slate-800/50 rounded-xl">
      {files.map((file, index) => (
        <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg">
          {getFileIcon(file)}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
            <p className="text-[10px] text-slate-500">{formatSize(file.size)} • {file.mimeType || "unknown"}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-slate-400 hover:text-rose-400"
            onClick={() => onRemove(index)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}