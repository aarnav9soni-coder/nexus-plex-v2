"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Download,
  RefreshCw,
  Copy,
  Check,
  Film,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import {
  AsyncVideoTask,
  reRollVideo,
  constructAiVideoUrl,
  VideoGenOptions,
} from "@/utils/videoEngine";

export interface MediaCardProps {
  prompt: string;
  originalPrompt?: string;
  enhancedPrompt?: string;
  videoUrl?: string;
  url?: string;
  animatedUrl?: string;
  posterUrl?: string;
  seed?: number;
  aspectRatio?: string;
  durationSeconds?: number;
  motion?: string;
  fps?: number;
  model?: string;
  status?: "completed" | "processing" | "failed";
  progress?: number;
  stage?: string;
  messageId?: string;
  error?: string;
  onReRoll?: (newTask: AsyncVideoTask) => void;
  onRegenerateSora?: (newTask: AsyncVideoTask) => void;
  onDownload?: () => void;
}

export function MediaCard({
  prompt,
  originalPrompt,
  enhancedPrompt,
  videoUrl,
  url,
  animatedUrl,
  posterUrl,
  seed: initialSeed,
  aspectRatio = "16:9",
  durationSeconds = 15,
  motion = "high",
  fps = 60,
  model = "Nexus Sora 2.0 / Kling HD Motion Engine",
  status: initialStatus = "completed",
  progress: initialProgress = 100,
  stage: initialStage,
  error: initialError,
  onReRoll,
  onRegenerateSora,
  onDownload,
}: MediaCardProps) {
  const [currentSeed, setCurrentSeed] = useState<number>(
    initialSeed && initialSeed > 0 ? initialSeed : Math.floor(Math.random() * 1000000) + 1
  );

  const initialResolved =
    videoUrl ||
    url ||
    animatedUrl ||
    constructAiVideoUrl(prompt, currentSeed, { aspectRatio, fps, motion });

  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>(initialResolved);
  const [currentStatus, setCurrentStatus] = useState<"completed" | "processing" | "failed">(
    initialStatus
  );
  const [currentProgress, setCurrentProgress] = useState<number>(initialProgress);
  const [currentStage, setCurrentStage] = useState<string>(
    initialStage || (initialStatus === "processing" ? "Generating AI frames for your prompt..." : "AI Video ready")
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync if props change
  useEffect(() => {
    const nextUrl = videoUrl || url || animatedUrl;
    if (nextUrl) {
      setCurrentVideoUrl(nextUrl);
      setErrorMessage(null);
    }
  }, [videoUrl, url, animatedUrl]);

  useEffect(() => {
    if (initialStatus) setCurrentStatus(initialStatus);
    if (typeof initialProgress === "number") setCurrentProgress(initialProgress);
    if (initialStage) setCurrentStage(initialStage);
    if (initialError) setErrorMessage(initialError);
  }, [initialStatus, initialProgress, initialStage, initialError]);

  // Handle re-rolling with real dynamic AI video pipeline
  const handleRegenerate = async () => {
    if (currentStatus === "processing") return;
    setCurrentStatus("processing");
    setCurrentProgress(25);
    setCurrentStage("Generating AI frames for your prompt...");
    setErrorMessage(null);
    setVideoLoaded(false);

    try {
      const newSeed = Math.floor(Math.random() * 1000000) + 1;
      setCurrentSeed(newSeed);

      const taskToReRoll: AsyncVideoTask = {
        id: `vid_${Date.now()}_${newSeed}`,
        generationId: `vid_${Date.now()}_${newSeed}`,
        prompt: prompt,
        originalPrompt: originalPrompt || prompt,
        enhancedPrompt: enhancedPrompt || prompt,
        status: "processing",
        progress: 25,
        stage: "Generating AI frames for your prompt...",
        seed: newSeed,
        aspectRatio,
        durationSeconds,
        fps,
        motion,
        createdAt: Date.now(),
      };

      const completed = await reRollVideo(taskToReRoll, (prog) => {
        setCurrentProgress(prog.progress);
        if (prog.stage) setCurrentStage(prog.stage);
      });

      const nextVideo =
        completed.videoUrl ||
        completed.url ||
        constructAiVideoUrl(prompt, newSeed, { aspectRatio, fps, motion });

      setCurrentVideoUrl(nextVideo);
      setCurrentStatus("completed");
      setCurrentProgress(100);
      setCurrentStage("AI Video ready");
      showSuccess("Generated new dynamic AI video variation");

      const callback = onRegenerateSora || onReRoll;
      if (callback) {
        callback(completed);
      }
    } catch (err: any) {
      console.error("[MediaCard] Video generation error:", err);
      setCurrentStatus("failed");
      const errText = err?.message || "Failed to render dynamic AI video frames.";
      setErrorMessage(errText);
      showError(errText);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    showSuccess("Copied prompt to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    showSuccess("Downloading AI generated video...");
    const a = document.createElement("a");
    a.href = currentVideoUrl;
    a.download = `nexus_plex_ai_video_${currentSeed}.mp4`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const isProcessing = currentStatus === "processing";
  const isFailed = currentStatus === "failed" || errorMessage !== null;

  return (
    <div
      id={`media-card-${currentSeed}`}
      className="my-3 rounded-2xl bg-[#0F141C] border border-slate-800/80 overflow-hidden shadow-2xl p-3.5 sm:p-4 space-y-3 font-sans transition-all text-slate-200"
    >
      {/* Action Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Film className="w-3.5 h-3.5 text-[#06B6D4]" />
          </div>
          <span className="font-semibold text-xs text-slate-100 truncate">
            AI Prompt-to-Video
          </span>
          <span className="text-[10px] bg-[#172033] text-cyan-400 font-mono px-2 py-0.5 rounded-full border border-cyan-500/20 shrink-0">
            {aspectRatio} • {fps}FPS
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id={`copy-prompt-${currentSeed}`}
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
            id={`download-video-${currentSeed}`}
            onClick={handleDownload}
            disabled={isProcessing || isFailed}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors disabled:opacity-40"
            title="Download Video (MP4)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            id={`regenerate-video-${currentSeed}`}
            onClick={handleRegenerate}
            disabled={isProcessing}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-[#06B6D4] text-xs font-semibold border border-cyan-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Regenerate Video with New Seed"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`}
            />
            <span>{isProcessing ? "Rendering..." : "Re-roll"}</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative rounded-xl overflow-hidden bg-[#07090E] aspect-video border border-slate-800/70 flex items-center justify-center group">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3.5 w-full max-w-sm">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-[#06B6D4] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#06B6D4] animate-pulse" />
              </div>
            </div>

            <div className="space-y-1 w-full">
              <p className="text-xs text-slate-200 font-semibold">
                {currentStage}
              </p>
              <p className="text-[11px] text-slate-400">
                Nexus Plex Latent Motion Engine ({currentProgress}%)
              </p>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-[#06B6D4] to-[#8B5CF6] transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : isFailed ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 max-w-md">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-rose-300 font-semibold">
                Dynamic Video Generation Error
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {errorMessage || "The AI video rendering pipeline encountered an upstream timeout or connection error."}
              </p>
            </div>
            <button
              type="button"
              id={`retry-video-${currentSeed}`}
              onClick={handleRegenerate}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors border border-slate-700"
            >
              Retry Generation
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={currentVideoUrl}
              poster={posterUrl}
              controls={false}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="auto"
              onLoadedData={() => setVideoLoaded(true)}
              onError={(e) => {
                console.warn("[MediaCard] Video stream error for prompt-to-video URL:", currentVideoUrl, e);
                setErrorMessage("Failed to load generated AI video stream. Please click Retry.");
                setCurrentStatus("failed");
              }}
              className="w-full h-full object-cover cursor-pointer"
              onClick={togglePlay}
            />

            {/* Custom Overlay Controls on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between pointer-events-none">
              <div className="flex justify-between items-center pointer-events-auto">
                <span className="text-[10px] font-mono text-[#06B6D4] bg-black/60 px-2 py-0.5 rounded-md border border-[#06B6D4]/30 backdrop-blur-sm">
                  Seed: {currentSeed}
                </span>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm border border-slate-700/50"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex justify-between items-center pointer-events-auto">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2 rounded-full bg-[#06B6D4] text-slate-950 hover:bg-[#0891B2] transition-colors font-bold shadow-lg"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>

                <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded-md border border-slate-700/50">
                  {model}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Prompt Caption & Metadata Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-0.5 gap-2">
        <div className="truncate italic flex-1" title={prompt}>
          <span className="text-[#8B5CF6] font-medium not-italic">Prompt: </span>
          "{prompt}"
        </div>
        <div className="text-[10px] font-mono text-slate-500 shrink-0">
          Nexus Plex • {durationSeconds}s
        </div>
      </div>
    </div>
  );
}

export default MediaCard;
