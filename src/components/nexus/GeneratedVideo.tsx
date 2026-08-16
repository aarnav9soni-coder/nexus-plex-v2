"use client";

import React from "react";
import { MediaCard } from "@/components/MediaCard";

interface GeneratedVideoProps {
  url?: string;
  videoUrl?: string;
  animatedUrl?: string;
  prompt: string;
  model?: string;
  seed?: number;
  messageId?: string;
  status?: "completed" | "processing" | "failed";
  aspectRatio?: string;
  durationSeconds?: number;
  motion?: string;
  fps?: number;
  progress?: number;
  stage?: string;
}

export function GeneratedVideo({
  url,
  videoUrl,
  animatedUrl,
  prompt,
  model,
  seed,
  aspectRatio = "16:9",
  durationSeconds = 15,
  motion = "high",
  fps = 30,
  status = "completed",
  progress = 100,
  stage,
}: GeneratedVideoProps) {
  return (
    <MediaCard
      prompt={prompt}
      videoUrl={videoUrl || url}
      animatedUrl={animatedUrl}
      seed={seed}
      aspectRatio={aspectRatio}
      durationSeconds={durationSeconds}
      motion={motion}
      fps={fps}
      model={model || "Nexus Motion Diffusion Engine (Async 4K)"}
      status={status}
      progress={progress}
      stage={stage}
    />
  );
}
