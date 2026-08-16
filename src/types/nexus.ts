export type EngineMode = "cloud" | "ollama" | "webgpu";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  timestamp: string;
  latencyMs?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  model: string;
  ratio: string;
  seed: number;
  timestamp: string;
  loading?: boolean;
}

export interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  category: "chat" | "vision" | "studio";
  createdAt: string;
}

export interface WebGpuProgress {
  progress: number;
  text: string;
  isLoading: boolean;
}

export interface DiagnosticsState {
  activeRoute: string;
  isOllamaOnline: boolean;
  ollamaModels: string[];
  isWebGpuSupported: boolean;
  webGpuProgress: WebGpuProgress;
  lastLatencyMs: number | null;
  fallbackCount: number;
  engineMode: EngineMode;
}