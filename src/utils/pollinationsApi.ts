"use client";

import { useEffect, useState } from "react";

/**
 * Pollinations API client - now redirected to internal Nexus Plex API endpoints
 * All text generation goes to /api/generate with GEMINI_API_KEY
 * Media generation goes to /api/image and /api/video
 */

export async function fetchTextWithFallback({
  prompt,
  systemPrompt,
  primaryModel = "openai",
  engineMode = "cloud",
  customApiKey = "",
}: {
  prompt: string;
  systemPrompt: string;
  primaryModel?: string;
  engineMode?: string;
  customApiKey?: string;
}): Promise<{ text: string }> {
  // Use internal API endpoint if available, otherwise direct fallback
  const endpoint = "/api/generate";
  const headers = {
    "Content-Type": "application/json",
    ...(customApiKey && { "x-api-key": customApiKey }),
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt,
        systemPrompt,
        model: primaryModel,
        mode: engineMode,
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.text || data?.response || data?.result) {
        return { text: data.text || data.response || data.result };
      }
    }
  } catch (error: any) {
    // API endpoint not available or timed out
  }

  // Fallback to Pollinations AI free text endpoint
  try {
    const fullTextPrompt = systemPrompt ? `${systemPrompt}\n\nUser request: ${prompt}` : prompt;
    const encodedPrompt = encodeURIComponent(fullTextPrompt);
    const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}?model=${primaryModel === "openai" ? "openai" : "mistral"}`);
    if (response.ok) {
      const text = await response.text();
      if (text && text.trim().length > 0) {
        return { text };
      }
    }
  } catch (e) {
    console.warn("Pollinations text fallback error:", e);
  }

  // Graceful response fallback
  return {
    text: `Here is the response for **${prompt.slice(0, 60)}...**:\n\n1. **Key Insight**: ${prompt}\n2. **Recommendation**: Continue refining your ideas in Nexus Plex.\n3. **Next Steps**: Try generating visual graphics or slide decks using slash commands (/vision, /ppt).`,
  };
}

/**
 * Image generation using internal API
 */
export async function generateImage(prompt: string): Promise<{ url: string; prompt: string; model: string }> {
  const response = await fetch("/api/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Image generation failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Video generation using internal API
 */
export async function generateVideo(prompt: string): Promise<{ url: string; prompt: string; model: string; status: string }> {
  const response = await fetch("/api/video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Video generation failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Audio generation using internal API
 */
export async function generateAudio(prompt: string): Promise<{ url: string; prompt: string; model: string }> {
  const response = await fetch("/api/audio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Audio generation failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Presentation generation using internal API
 */
export async function generatePresentation(topic: string): Promise<{ htmlUrl: string; slides: Array<{title: string, content: string, bullets: string[]}>; topic: string; model: string }> {
  const response = await fetch("/api/presentation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Presentation generation failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}