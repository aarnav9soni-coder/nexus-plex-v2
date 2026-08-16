/**
 * Audio Router for Nexus Plex
 * Routes audio requests to the music engine with dynamic seeds and parameters.
 */
import { generateMusicTrack, MusicEngineParams } from "./musicEngine";
import { generateAudio, AudioOptions, AudioGenerationResult } from "./audioGeneration";

export async function processAudioRequest(
  prompt: string,
  options?: MusicEngineParams & AudioOptions
): Promise<AudioGenerationResult> {
  const dynamicSeed = Math.floor(Math.random() * 1000000) + Date.now();

  return generateMusicTrack(prompt, {
    seed: dynamicSeed,
    genre: options?.genre || "Synth-Pop",
    tempo: options?.tempo || 120,
    vocalStyle: options?.vocalStyle || "Instrumental",
    ...options,
  });
}

export const audioRouter = {
  processAudioRequest,
  generateMusicTrack,
  generateAudio,
};
