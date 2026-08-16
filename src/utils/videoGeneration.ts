import { generateVideo as generateEngineVideo, AsyncVideoTask, VideoGenOptions } from "./videoEngine";

export interface VideoGenerationResult {
  url: string;
  videoUrl?: string;
  animatedUrl?: string;
  prompt: string;
  model: string;
  seed: number;
  status: "completed" | "processing" | "failed";
}

export async function generateVideo(
  prompt: string,
  options: VideoGenOptions = {}
): Promise<VideoGenerationResult> {
  const task = await generateEngineVideo(prompt, {
    motion: "high",
    fps: 60,
    aspectRatio: "16:9",
    durationSeconds: 15,
    quality: "sora",
    ...options,
  });

  return {
    url: task.videoUrl || task.url || "",
    videoUrl: task.videoUrl || task.url || "",
    animatedUrl: task.animatedUrl || task.videoUrl || task.url || "",
    prompt: task.prompt,
    seed: task.seed,
    model: task.model || "Nexus Sora 2.0 / Kling HD Motion Engine",
    status: task.status,
  };
}
