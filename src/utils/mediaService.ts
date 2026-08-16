/**
 * Media Service - Nexus Plex
 * Unified service interface for real dynamic AI media generation.
 * Enforces zero stock video fallbacks and real prompt-to-video API rendering.
 */

import {
  startAsyncVideoGeneration,
  pollVideoGenerationStatus,
  generateVideo as generateEngineVideo,
  reRollVideo as reRollEngineVideo,
  constructAiVideoUrl,
  AsyncVideoTask,
  VideoGenOptions,
} from "./videoEngine";
import { generateImage, ImageGenerationResult, ImageGenOptions } from "./imageEngine";
import { generateMusicTrack, AudioGenerationResult, AudioGenOptions } from "./audioRouter";
import { generateSlideDeck, SlideDeckData } from "./presentationGeneration";

export interface UnifiedMediaRequest {
  prompt: string;
  type: "video" | "image" | "audio" | "presentation";
  aspectRatio?: string;
  durationSeconds?: number;
  fps?: number;
  motion?: string;
  seed?: number;
  genre?: string;
  tempo?: number;
  slidesCount?: number;
}

export interface VideoServiceResult {
  videoUrl: string;
  url: string;
  animatedUrl: string;
  prompt: string;
  seed: number;
  model: string;
  aspectRatio: string;
  durationSeconds: number;
  fps: number;
  motion: string;
  status: "completed" | "processing" | "failed";
  stage?: string;
}

/**
 * Generate a dynamic AI motion video directly from user prompt
 */
export async function generateAiVideo(
  prompt: string,
  options: VideoGenOptions = {},
  onProgress?: (task: AsyncVideoTask) => void
): Promise<VideoServiceResult> {
  const task = await startAsyncVideoGeneration(prompt, options);
  if (onProgress) onProgress(task);

  const completed = await pollVideoGenerationStatus(task, onProgress);
  const finalUrl = completed.videoUrl || completed.url || constructAiVideoUrl(prompt, completed.seed, options);

  return {
    videoUrl: finalUrl,
    url: finalUrl,
    animatedUrl: finalUrl,
    prompt: completed.prompt,
    seed: completed.seed,
    model: completed.model || "Nexus Sora 2.0 / Kling HD Motion Engine",
    aspectRatio: completed.aspectRatio || options.aspectRatio || "16:9",
    durationSeconds: completed.durationSeconds || options.durationSeconds || 15,
    fps: completed.fps || options.fps || 60,
    motion: completed.motion || options.motion || "high",
    status: completed.status,
    stage: completed.stage,
  };
}

/**
 * Start an asynchronous AI video generation task
 */
export async function startAiVideoTask(
  prompt: string,
  options: VideoGenOptions = {}
): Promise<AsyncVideoTask> {
  return await startAsyncVideoGeneration(prompt, options);
}

/**
 * Poll an active AI video generation task
 */
export async function pollAiVideoTask(
  task: AsyncVideoTask,
  onProgress?: (updatedTask: AsyncVideoTask) => void
): Promise<AsyncVideoTask> {
  return await pollVideoGenerationStatus(task, onProgress);
}

/**
 * Re-roll an existing video with a new seed
 */
export async function reRollAiVideo(
  task: AsyncVideoTask,
  onProgress?: (updatedTask: AsyncVideoTask) => void
): Promise<AsyncVideoTask> {
  return await reRollEngineVideo(task, onProgress);
}

/**
 * Generate an AI image directly from prompt
 */
export async function generateAiImage(
  prompt: string,
  options: ImageGenOptions = {}
): Promise<ImageGenerationResult> {
  return await generateImage(prompt, options);
}

/**
 * Generate an AI audio synth track directly from prompt
 */
export async function generateAiAudio(
  prompt: string,
  options: AudioGenOptions = {}
): Promise<AudioGenerationResult> {
  return await generateMusicTrack(prompt, options);
}

/**
 * Generate an AI slide presentation
 */
export async function generateAiPresentation(
  topic: string,
  slidesCount: number = 5
): Promise<SlideDeckData> {
  return await generateSlideDeck(topic, slidesCount);
}

export const mediaService = {
  generateAiVideo,
  startAiVideoTask,
  pollAiVideoTask,
  reRollAiVideo,
  generateAiImage,
  generateAiAudio,
  generateAiPresentation,
};

export default mediaService;
