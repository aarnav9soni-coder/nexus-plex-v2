"use client";

import React from "react";
import { ImageGeneratorCard } from "@/components/ImageGeneratorCard";

interface GeneratedImageProps {
  url: string;
  prompt: string;
  model: string;
  messageId: string;
}

export function GeneratedImage({ url, prompt, model, messageId }: GeneratedImageProps) {
  const handleRegenerate = () => {
    window.dispatchEvent(
      new CustomEvent("nexus-regenerate-image", {
        detail: { prompt, messageId },
      })
    );
  };

  return (
    <ImageGeneratorCard
      imageUrl={url}
      prompt={prompt}
      model={model}
      onRetry={handleRegenerate}
    />
  );
}
