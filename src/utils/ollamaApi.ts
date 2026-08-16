export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaRequestOptions {
  model: string;
  messages: OllamaChatMessage[];
  baseUrl?: string;
}

export const DEFAULT_OLLAMA_URL = "http://localhost:11434";

/**
 * Checks if local Ollama service is reachable and fetches installed models
 */
export async function checkOllamaHealth(baseUrl = DEFAULT_OLLAMA_URL): Promise<{ online: boolean; models: string[] }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) return { online: false, models: [] };

    const data = await response.json();
    const modelNames = data?.models ? data.models.map((m: any) => m.name) : [];
    return { online: true, models: modelNames };
  } catch (err) {
    return { online: false, models: [] };
  }
}

/**
 * Sends a chat completion request to local Ollama server
 */
export async function fetchOllamaChat(options: OllamaRequestOptions): Promise<string> {
  const baseUrl = options.baseUrl || DEFAULT_OLLAMA_URL;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: options.model || "llama3",
      messages: options.messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  return data?.message?.content || "No content returned from Ollama.";
}