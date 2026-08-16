/**
 * Prompt Enhancer (Deprecated / Pass-through Mode)
 * Nexus Plex Architecture
 *
 * User prompts now pass directly to AI models raw and unmodified.
 * All functions in this file operate in direct pass-through mode.
 */

export type DetectedStyle =
  | "photography"
  | "anime"
  | "digital_art"
  | "vector"
  | "pixel_art"
  | "ui_product"
  | "3d_render"
  | "cyberpunk"
  | "dark_fantasy"
  | "oil_painting"
  | "architecture"
  | "general";

export interface EnhancedImagePromptResult {
  originalPrompt: string;
  enhancedPrompt: string;
  negativePrompt: string;
  detectedStyle: DetectedStyle;
  styleModifiersApplied: string[];
}

export interface EnhancedVideoPromptResult {
  originalPrompt: string;
  enhancedPrompt: string;
  motionDirective: string;
  aspectRatio: string;
  negativePrompt: string;
}

/**
 * Check if the Magic Enhancer is active (always false / disabled)
 */
export function isMagicEnhancerActive(): boolean {
  return false;
}

/**
 * Deprecated setter - does not alter prompt behavior
 */
export function setMagicEnhancerActive(_enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("nexus_magic_enhancer_enabled", "false");
    window.dispatchEvent(
      new CustomEvent("nexus-magic-enhancer-toggle", { detail: { enabled: false } })
    );
  }
}

/**
 * Detect style helper (returns general by default)
 */
export function detectPromptStyle(_prompt: string): DetectedStyle {
  return "general";
}

/**
 * Direct pass-through prompt enhancer: returns the raw user prompt untouched
 */
export async function enhancePrompt(
  prompt: string,
  _mode: "image" | "video" | "audio" | "chat" = "chat"
): Promise<string> {
  return prompt || "";
}

/**
 * Preview enhanced prompt (returns original prompt)
 */
export function previewEnhancedPrompt(
  prompt: string,
  _targetMode: "image" | "video" | "chat" = "image"
): string {
  return prompt || "";
}

/**
 * Build image prompt (passes raw prompt with standard clean negative parameters)
 */
export function buildEnhancedImagePrompt(
  prompt: string,
  options: {
    style?: string;
    aspectRatio?: string;
    mood?: string;
    negativePrompt?: string;
    forceEnhance?: boolean;
  } = {}
): EnhancedImagePromptResult {
  const cleanPrompt = (prompt || "").trim();
  const negativePrompt =
    options.negativePrompt ||
    "blurry, low quality, distorted, watermark, signature, artifacts, low resolution, bad anatomy, out of focus";

  return {
    originalPrompt: cleanPrompt,
    enhancedPrompt: cleanPrompt,
    negativePrompt,
    detectedStyle: "general",
    styleModifiersApplied: [],
  };
}

/**
 * Build video prompt (passes raw prompt)
 */
export function buildEnhancedVideoPrompt(
  prompt: string,
  options: {
    motion?: string;
    aspectRatio?: string;
    negativePrompt?: string;
    forceEnhance?: boolean;
  } = {}
): EnhancedVideoPromptResult {
  const cleanPrompt = (prompt || "").trim();
  return {
    originalPrompt: cleanPrompt,
    enhancedPrompt: cleanPrompt,
    motionDirective: options.motion || "high",
    aspectRatio: options.aspectRatio || "16:9",
    negativePrompt:
      options.negativePrompt ||
      "blurry, low-res, static, distorted, artifacts, low frame rate",
  };
}

export default {
  isMagicEnhancerActive,
  setMagicEnhancerActive,
  detectPromptStyle,
  enhancePrompt,
  previewEnhancedPrompt,
  buildEnhancedImagePrompt,
  buildEnhancedVideoPrompt,
};
