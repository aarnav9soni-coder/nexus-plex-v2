"use client";

import React from "react";
import { VideoPlayer } from "@/components/VideoPlayer";

interface VideoCardProps {
  prompt: string;
  videoUrl?: string;
  seed?: number;
}

export function VideoCard({ prompt, videoUrl, seed }: VideoCardProps) {
  return (
    <VideoPlayer
      prompt={prompt}
      videoUrl={videoUrl}
      seed={seed}
      fps={60}
      model="Nexus Sora 2.0 / Kling HD Motion Engine"
    />
  );
}

export default VideoCard;
