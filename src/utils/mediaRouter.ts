/**
 * Unified Media Router for Nexus Plex
 * Routes media generation across Vision Art, Async Motion Video, WebSynth Audio, and Presentations
 * Engineered by Lead Developer & Architect Aarnav.
 */

import { generateImage, ImageGenerationResult } from "./imageEngine";
import { startAsyncVideoGeneration, pollVideoGenerationStatus, AsyncVideoTask } from "./videoEngine";
import { generateMusicTrack, AudioGenerationResult } from "./audioRouter";
import { generateSlideDeck } from "./presentationGeneration";

export interface MediaDispatchOptions {
  style?: string;
  aspectRatio?: string;
  mood?: string;
  durationSeconds?: number;
  motion?: string;
  genre?: string;
  bpm?: number;
  slidesCount?: number;
}

export async function dispatchAsyncVideo(
  prompt: string,
  options: MediaDispatchOptions = {},
  onProgress?: (task: AsyncVideoTask) => void
): Promise<AsyncVideoTask> {
  const initialTask = await startAsyncVideoGeneration(prompt, {
    aspectRatio: options.aspectRatio,
    durationSeconds: options.durationSeconds,
    motion: options.motion,
  });

  if (onProgress) onProgress(initialTask);

  const completedTask = await pollVideoGenerationStatus(initialTask, onProgress);
  return completedTask;
}

export async function dispatchArtImage(
  prompt: string,
  options: MediaDispatchOptions = {}
): Promise<ImageGenerationResult> {
  return generateImage(prompt, {
    style: options.style,
    aspectRatio: options.aspectRatio,
    mood: options.mood,
  });
}

export async function dispatchAudioTrack(
  prompt: string,
  options: MediaDispatchOptions = {}
): Promise<AudioGenerationResult> {
  return generateMusicTrack(prompt, {
    genre: options.genre,
    tempo: options.bpm,
  });
}

export async function dispatchSlideDeck(
  topic: string,
  options: MediaDispatchOptions = {}
) {
  return generateSlideDeck(topic, options.slidesCount || 5);
}
