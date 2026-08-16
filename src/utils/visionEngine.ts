/**
 * Vision Engine Utility
 * Detects image payloads, validates formats, and dynamically selects optimal vision models.
 * Engineered for Nexus Plex by Lead AI Systems Architect Aarnav.
 */

import { ProcessedFile } from "./fileHandler";

export interface VisionModelChoice {
  isVisionRequired: boolean;
  recommendedModel: string;
  reason?: string;
}

const VISION_CAPABLE_MODELS = new Set([
  "gemini-3.7-flash",
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gpt-4o",
  "gpt-4o-mini",
  "claude-3-5-sonnet",
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-sonnet",
]);

/**
 * Checks whether any file in the attachments list is a visual image
 */
export function hasImageAttachments(files?: ProcessedFile[]): boolean {
  if (!files || !Array.isArray(files) || files.length === 0) return false;

  return files.some((file) => {
    const mime = (file.mimeType || file.type || "").toLowerCase();
    const name = (file.name || "").toLowerCase();
    const isImageMime = mime.startsWith("image/");
    const isImageExt = /\.(png|jpe?g|webp|gif|bmp|tiff|svg)$/i.test(name);
    const isBase64Image = typeof file.content === "string" && file.content.startsWith("data:image/");
    return isImageMime || isImageExt || isBase64Image;
  });
}

/**
 * Evaluates current model choice and automatically overrides to a vision-capable model if images are present
 */
export function resolveVisionModel(selectedModel: string, files?: ProcessedFile[]): VisionModelChoice {
  const hasImages = hasImageAttachments(files);

  if (!hasImages) {
    return {
      isVisionRequired: false,
      recommendedModel: selectedModel,
    };
  }

  const modelLower = (selectedModel || "").toLowerCase().trim();

  // If already a vision-capable model, keep it
  for (const vm of VISION_CAPABLE_MODELS) {
    if (modelLower === vm || modelLower.includes(vm)) {
      return {
        isVisionRequired: true,
        recommendedModel: selectedModel,
        reason: "User model supports native multimodal vision.",
      };
    }
  }

  // Otherwise, automatically route to Gemini 3.7 Flash (or user-chosen vision model)
  console.log(`[Nexus Router] Image attachment detected. Routing to vision-capable model: gemini-3.7-flash (overriding ${selectedModel})`);

  return {
    isVisionRequired: true,
    recommendedModel: "gemini-3.7-flash",
    reason: `Image attached. Auto-routed from text model (${selectedModel}) to multimodal vision engine (gemini-3.7-flash).`,
  };
}
