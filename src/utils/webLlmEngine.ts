export const DEFAULT_WEBGPU_MODEL = "Llama-3.2-1B-Instruct-q4f16_1-MLC";

export const WEBGPU_MODELS = [
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", name: "Llama 3.2 1B (Ultra Fast, High Quality)" },
  { id: "SmolLM2-360M-Instruct-q4f16_1-MLC", name: "SmolLM2 360M (Lightweight / Low VRAM)" },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC", name: "Phi-3.5 Mini (Advanced Reasoning)" },
];

export function checkWebGpuSupport(): boolean {
  if (typeof navigator === "undefined") return false;
  return "gpu" in navigator;
}

export async function checkWebLlmAvailable(): Promise<boolean> {
  return true;
}

export async function generateWebLlmChat(
  messages: any[],
  modelId: string = DEFAULT_WEBGPU_MODEL,
  onProgress?: (report: any) => void,
  onStreamChunk?: (chunkText: string) => void
): Promise<string> {
  await new Promise(r => setTimeout(r, 500));
  return "WebGPU LLM engine is not available in this environment.";
}