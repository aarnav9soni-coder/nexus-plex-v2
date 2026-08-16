/**
 * Image Generation Engine - Nexus Plex
 * Pure prompt-driven high-fidelity image generator.
 * Directly translates user natural language into visual outputs.
 */

export interface ImageOptions {
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | string;
  seed?: number;
}

export interface ImageGenerationResult {
  url: string;
  prompt: string;
  enhancedPrompt: string;
  model: string;
  aspectRatio?: string;
}

/**
 * Generates an image directly from the user's prompt
 */
export async function generateImage(
  userPrompt: string,
  options: ImageOptions = {}
): Promise<ImageGenerationResult> {
  const rawPrompt = (userPrompt || "").trim();
  const ratio = options.aspectRatio || "1:1";

  // Map aspect ratio to standard HD resolution
  let width = 1024;
  let height = 1024;

  if (ratio === "16:9") {
    width = 1344;
    height = 768;
  } else if (ratio === "9:16") {
    width = 768;
    height = 1344;
  } else if (ratio === "4:3") {
    width = 1152;
    height = 864;
  } else if (ratio === "3:4") {
    width = 864;
    height = 1152;
  }

  // 1. Primary Engine: Backend API route with Google Imagen 3 / Gemini
  try {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: rawPrompt,
        aspectRatio: ratio,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return {
          url: data.url,
          prompt: rawPrompt,
          enhancedPrompt: data.enhancedPrompt || rawPrompt,
          model: data.model || "Google Imagen 3",
          aspectRatio: ratio,
        };
      }
    }
  } catch (err) {
    console.warn("[ImageEngine] Backend route fallback:", err);
  }

  // 2. High-Definition Flux Diffusion with dynamic seed
  const seed = options.seed ?? Math.floor(Math.random() * 10000000);
  const encodedPrompt = encodeURIComponent(rawPrompt);
  const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;

  return {
    url: fluxUrl,
    prompt: rawPrompt,
    enhancedPrompt: rawPrompt,
    model: "Flux HD Diffusion",
    aspectRatio: ratio,
  };
}

/**
 * Downloads full resolution image file
 */
export async function downloadImage(url: string, filename?: string): Promise<void> {
  const targetFilename = filename || `nexus_image_${Date.now()}.png`;
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = targetFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  } catch {
    const a = document.createElement("a");
    a.href = url;
    a.download = targetFilename;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export default {
  generateImage,
  downloadImage,
};
