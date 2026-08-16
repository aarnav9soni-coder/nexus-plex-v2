/**
 * AI Router & Semantic Routing Engine - Nexus Plex
 * Engineered by Lead AI Systems Architect Aarnav.
 *
 * Implements deep semantic parsing and zero-shot intent routing:
 * - Automatically resolves typos and elongations ("musicccc" -> GENERATE_MUSIC)
 * - Automatically extracts implicit parameters (e.g. style, genre, fps, motion)
 * - Directs execution flow to the appropriate generator engine or LLM
 */

import {
  classifyUserIntent,
  evaluateFastSemanticIntent,
  SemanticIntentResult,
  IntentAction,
} from "./intentDetection";
import {
  processPrompt,
  getStandardApiHeaders,
  resolveOpenSourceModelSlug,
  resolveModelEndpoint,
  getEffectiveGeminiKey,
  getEffectiveOpenRouterKey,
} from "./apiRouter";
import { isIdentityQuestion, getIdentityResponse } from "./systemPrompt";

export interface SemanticRouteOptions {
  selectedModel?: string;
  systemPrompt?: string;
  userEmail?: string;
  apiKey?: string;
  signal?: AbortSignal;
}

export interface SemanticRouteExecution {
  action: IntentAction;
  extractedPrompt: string;
  originalPrompt: string;
  parameters: Record<string, any>;
  confidence: number;
  rationale?: string;
  isMediaAction: boolean;
}

/**
 * Evaluates the user input through the zero-shot semantic intent system,
 * resolving typos ("musicccc", "a dog", "clip of space") and pulling implicit parameters.
 */
export async function routeUserPrompt(
  prompt: string,
  options: SemanticRouteOptions = {}
): Promise<SemanticRouteExecution> {
  const raw = prompt.trim();

  // Special case: identity question
  if (isIdentityQuestion(raw)) {
    return {
      action: "TEXT_CHAT",
      extractedPrompt: raw,
      originalPrompt: raw,
      parameters: {},
      confidence: 1.0,
      rationale: "Nexus Plex identity prompt",
      isMediaAction: false,
    };
  }

  // Zero-Shot LLM Intent Classification
  const classification = await classifyUserIntent(raw, {
    apiKey: options.apiKey,
    userEmail: options.userEmail,
  });

  const isMediaAction =
    classification.action === "GENERATE_IMAGE" ||
    classification.action === "GENERATE_VIDEO" ||
    classification.action === "GENERATE_MUSIC";

  return {
    action: classification.action,
    extractedPrompt: classification.extractedPrompt || raw,
    originalPrompt: classification.originalPrompt || raw,
    parameters: classification.parameters || {},
    confidence: classification.confidence,
    rationale: classification.rationale,
    isMediaAction,
  };
}

export const aiRouter = {
  routeUserPrompt,
  classifyUserIntent,
  evaluateFastSemanticIntent,
  processPrompt,
  getStandardApiHeaders,
  resolveOpenSourceModelSlug,
  resolveModelEndpoint,
  getEffectiveGeminiKey,
  getEffectiveOpenRouterKey,
};

export default aiRouter;
