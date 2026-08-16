"use client";

import React, { useState, useEffect } from "react";
import {
  ImageIcon,
  Download,
  Copy,
  Check,
  Maximize2,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { downloadImage } from "@/utils/imageEngine";

export interface ImageGeneratorCardProps {
  prompt: string;
  imageUrl: string;
  model?: string;
  onRetry?: () => void;
  userEmail?: string;
}

export const ImageGeneratorCard: React.FC<ImageGeneratorCardProps> = ({
  prompt,
  imageUrl: initialImageUrl,
  onRetry,
}) => {
  const [currentUrl, setCurrentUrl] = useState(initialImageUrl);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setCurrentUrl(initialImageUrl);
    setIsLoading(true);
    setHasError(false);
  }, [initialImageUrl]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    showSuccess("Copied prompt");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDownloading(true);
    try {
      await downloadImage(currentUrl, `nexus_image_${Date.now()}.png`);
      showSuccess("Image downloaded");
    } catch (err) {
      console.error("Download failed:", err);
      window.open(currentUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);

    if (onRetry) {
      onRetry();
    } else {
      const newSeed = Math.floor(Math.random() * 10000000);
      let updatedUrl = currentUrl;
      if (updatedUrl.includes("seed=")) {
        updatedUrl = updatedUrl.replace(/seed=\d+/, `seed=${newSeed}`);
      } else if (updatedUrl.includes("?")) {
        updatedUrl += `&seed=${newSeed}`;
      } else {
        updatedUrl += `?seed=${newSeed}`;
      }
      setCurrentUrl(updatedUrl);
    }
  };

  return (
    <div className="my-3 rounded-2xl bg-[#0F141C] border border-slate-800/80 overflow-hidden shadow-xl p-3 sm:p-4 space-y-3 font-sans transition-all text-slate-200">
      {/* Top Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <ImageIcon className="w-3.5 h-3.5 text-[#06B6D4]" />
          </div>
          <span className="font-semibold text-xs text-slate-200 truncate">
            Generated Image
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Copy Prompt"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || isLoading || hasError}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors disabled:opacity-40"
            title="Download Image"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleRetry}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[#06B6D4] text-xs font-semibold border border-cyan-500/30 transition-colors flex items-center gap-1.5"
            title="Re-roll Variation"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>{isLoading ? "Generating..." : "Regenerate"}</span>
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className={`relative min-h-[260px] sm:min-h-[320px] rounded-xl overflow-hidden bg-black/60 border border-slate-800/60 flex items-center justify-center ${
          !isLoading && !hasError ? "group cursor-pointer" : ""
        }`}
        onClick={() => {
          if (!isLoading && !hasError) setShowFull(true);
        }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-950/80">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-[#06B6D4] animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-medium">
              Generating image...
            </p>
          </div>
        )}

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-center space-y-3">
            <AlertCircle className="w-7 h-7 text-rose-400" />
            <p className="text-xs text-slate-300">Unable to load image</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Image Element */}
        <img
          src={currentUrl}
          alt={prompt}
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`w-full max-h-[480px] object-contain rounded-xl transition-all duration-300 ${
            isLoading || hasError
              ? "opacity-0 absolute inset-0 pointer-events-none"
              : "opacity-100"
          }`}
        />

        {/* Click to expand hover hint */}
        {!isLoading && !hasError && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-black/80 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium border border-white/20 shadow-lg backdrop-blur-md">
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" /> View Fullscreen
            </span>
          </div>
        )}
      </div>

      {/* Minimal Prompt Footer */}
      {prompt && (
        <div className="px-0.5 text-xs text-slate-400 italic line-clamp-2">
          "{prompt}"
        </div>
      )}

      {/* Lightbox Modal */}
      {showFull && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
          onClick={() => setShowFull(false)}
        >
          <div
            className="w-full max-w-5xl flex items-center justify-between z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-semibold text-slate-200">
              Generated Image
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isDownloading ? "Downloading..." : "Download"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFull(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="relative flex-1 flex items-center justify-center max-w-5xl w-full my-3 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentUrl}
              alt={prompt}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          {prompt && (
            <div
              className="w-full max-w-2xl px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-center z-10 backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs text-slate-300 italic line-clamp-2">
                "{prompt}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorCard;
