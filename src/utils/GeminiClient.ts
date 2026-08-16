import { getStoredApiKeys } from "./apiKeyStore";
import { SlideDeckProps } from "@/components/SlideDeckViewer";
import { streamGeminiChat } from "./geminiService";

export interface ChatMessageData {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  files?: Array<{ name: string; type: string; dataUrl: string; textContent?: string }>;
  generatedImage?: { url: string; prompt: string; model: string };
  generatedVideo?: {
    videoUrl?: string;
    url?: string;
    animatedUrl?: string;
    prompt: string;
    seed?: number;
    aspectRatio?: string;
    durationSeconds?: number;
    motion?: string;
    fps?: number;
    model?: string;
    status?: "completed" | "processing" | "failed";
    progress?: number;
    stage?: string;
  };
  generatedAudio?: { prompt: string; genre?: string; bpm?: number };
  generatedSlideDeck?: SlideDeckProps;
  isStreaming?: boolean;
  isError?: boolean;
  modelUsed?: string;
  commandType?: "image" | "vision" | "audio" | "video" | "presentation" | "reasoning" | "code" | "general" | string;
}

export interface StreamChatOptions {
  messages: ChatMessageData[];
  model?: string;
  systemInstruction?: string;
  userEmail?: string;
  onChunk: (chunkText: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

/**
 * Client wrapper to communicate with server-side AI streaming endpoint, attaching BYOK keys if present.
 */
export async function streamChatResponse(options: StreamChatOptions): Promise<void> {
  return streamGeminiChat(options);
}

/**
 * Image generation API helper
 */
export async function generateImageClient(prompt: string): Promise<{ url: string; prompt: string; model: string }> {
  const res = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate image");
  }

  return await res.json();
}

/**
 * Video generation API helper - Nexus Plex Dynamic AI Video Pipeline
 */
export async function generateVideoClient(
  prompt: string,
  options: { aspectRatio?: string; durationSeconds?: number; fps?: number; seed?: number } = {}
): Promise<{ videoUrl: string; prompt: string; aspectRatio: string; durationSeconds: number; seed: number; model: string; fps: number }> {
  const dynamicSeed = options.seed ?? Math.floor(Math.random() * 1000000) + 1;
  const res = await fetch("/api/generate-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      seed: dynamicSeed,
      aspectRatio: options.aspectRatio || "16:9",
      durationSeconds: options.durationSeconds || 15,
      fps: options.fps || 60,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate dynamic AI video");
  }

  return await res.json();
}

/**
 * Slide Deck Presentation generation API helper
 */
export async function generatePptClient(prompt: string): Promise<SlideDeckProps> {
  const res = await fetch("/api/generate-ppt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate presentation");
  }

  return await res.json();
}
