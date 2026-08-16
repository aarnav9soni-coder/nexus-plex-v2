import React from "react";
import { Sparkles, Cpu, Zap, Layers, Bot, Globe, Brain } from "lucide-react";

export interface ModelOption {
  id: string;
  name: string;
  provider: "google" | "openai" | "anthropic" | "xai" | "openrouter" | "pollinations";
  badge: string;
  description: string;
  speed: "Ultra Fast" | "Fast" | "Deep Reasoner";
  apiModelId: string;
  openRouterSlug?: string;
  pollinationsModel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const SUPPORTED_MODELS: ModelOption[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    provider: "google",
    badge: "Default Gateway",
    description: "Ultra-fast high-performance multimodal LLM with instant streaming.",
    speed: "Ultra Fast",
    apiModelId: "gemini-3.7-flash",
    icon: Zap,
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "google",
    badge: "Reasoning",
    description: "Advanced analytical reasoning & complex code synthesis.",
    speed: "Deep Reasoner",
    apiModelId: "gemini-3.1-pro-preview",
    icon: Sparkles,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "google",
    badge: "Lite Speed",
    description: "Extremely fast lightweight multimodal model.",
    speed: "Ultra Fast",
    apiModelId: "gemini-3.1-flash-lite",
    icon: Zap,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    badge: "Free / Tier Standard",
    description: "Fast, efficient OpenAI model for general tasks.",
    speed: "Ultra Fast",
    apiModelId: "openai/gpt-4o-mini",
    openRouterSlug: "openai/gpt-4o-mini",
    icon: Bot,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    badge: "OpenAI Flagship",
    description: "Omni model for vision, code, and structured outputs.",
    speed: "Fast",
    apiModelId: "openai/gpt-4o",
    openRouterSlug: "openai/gpt-4o",
    icon: Bot,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    badge: "Anthropic Flagship",
    description: "Superior coding, creative writing, and natural language.",
    speed: "Fast",
    apiModelId: "anthropic/claude-3.5-sonnet",
    openRouterSlug: "anthropic/claude-3.5-sonnet",
    icon: Cpu,
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "anthropic",
    badge: "Anthropic Fast",
    description: "Lightweight and instant response speed.",
    speed: "Ultra Fast",
    apiModelId: "anthropic/claude-3-haiku",
    openRouterSlug: "anthropic/claude-3-haiku",
    icon: Cpu,
  },
  {
    id: "deepseek-r1-free",
    name: "DeepSeek-R1",
    provider: "openrouter",
    badge: "Free Open Source",
    description: "Deep reasoning open weights model with zero key requirement.",
    speed: "Deep Reasoner",
    apiModelId: "deepseek/deepseek-r1:free",
    openRouterSlug: "deepseek/deepseek-r1:free",
    pollinationsModel: "deepseek",
    icon: Brain,
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "openrouter",
    badge: "DeepSeek Active",
    description: "High-capability reasoning and general conversation model.",
    speed: "Fast",
    apiModelId: "deepseek/deepseek-chat",
    openRouterSlug: "deepseek/deepseek-chat",
    pollinationsModel: "deepseek",
    icon: Brain,
  },
  {
    id: "llama-3.3-free",
    name: "Llama 3.3 70B",
    provider: "openrouter",
    badge: "Free Open Source",
    description: "Zero-key unconstrained open-source intelligence.",
    speed: "Ultra Fast",
    apiModelId: "meta-llama/llama-3.3-70b-instruct:free",
    openRouterSlug: "meta-llama/llama-3.3-70b-instruct:free",
    pollinationsModel: "llama",
    icon: Globe,
  },
  {
    id: "grok-2",
    name: "xAI Grok 2",
    provider: "xai",
    badge: "xAI Flagship",
    description: "Real-time knowledge and unconstrained intelligence.",
    speed: "Fast",
    apiModelId: "x-ai/grok-2-1212",
    openRouterSlug: "x-ai/grok-2-1212",
    icon: Layers,
  },
  {
    id: "grok-beta",
    name: "xAI Grok Beta",
    provider: "xai",
    badge: "xAI Beta Tier",
    description: "Fast reasoning and conversational model from xAI.",
    speed: "Fast",
    apiModelId: "x-ai/grok-beta",
    openRouterSlug: "x-ai/grok-beta",
    icon: Layers,
  },
];

/**
 * Maps any input model identifier or UI model option to its corresponding, active official API model identifier
 */
export function getApiModelId(modelId: string = "gemini-3.7-flash"): string {
  if (!modelId) return "gemini-3.7-flash";
  const found = SUPPORTED_MODELS.find((m) => m.id === modelId || m.apiModelId === modelId);
  if (found) return found.apiModelId;

  const trimmed = modelId.trim();
  if (trimmed.includes("/")) return trimmed;

  const lower = trimmed.toLowerCase();
  if (lower.includes("gpt-4o-mini") || lower.includes("4o-mini")) return "openai/gpt-4o-mini";
  if (lower.includes("gpt-4o") || lower.includes("gpt-4") || lower.includes("openai")) return "openai/gpt-4o";
  if (lower.includes("claude-3-haiku") || lower.includes("haiku")) return "anthropic/claude-3-haiku";
  if (lower.includes("claude") || lower.includes("sonnet") || lower.includes("anthropic")) return "anthropic/claude-3.5-sonnet";
  if (lower.includes("deepseek-chat") || lower.includes("deepseek-v3") || lower.includes("v3")) return "deepseek/deepseek-chat";
  if (lower.includes("deepseek") || lower.includes("r1")) return "deepseek/deepseek-r1:free";
  if (lower.includes("llama") || lower.includes("qwen")) return "meta-llama/llama-3.3-70b-instruct:free";
  if (lower.includes("grok-beta")) return "x-ai/grok-beta";
  if (lower.includes("grok") || lower.includes("xai")) return "x-ai/grok-2-1212";
  if (lower.includes("3.1-pro") || lower.includes("pro-preview")) return "gemini-3.1-pro-preview";
  if (lower.includes("3.1-flash-lite") || lower.includes("flash-lite") || lower.includes("lite")) return "gemini-3.1-flash-lite";
  if (lower.includes("gemini") || lower.includes("flash") || lower.includes("3.7")) return "gemini-3.7-flash";

  return trimmed;
}

/**
 * Gets full model option details by ID
 */
export function getModelConfig(modelId: string = "gemini-3.7-flash"): ModelOption {
  return (
    SUPPORTED_MODELS.find((m) => m.id === modelId || m.apiModelId === modelId) ||
    SUPPORTED_MODELS[0]
  );
}
