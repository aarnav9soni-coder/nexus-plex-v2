/**
 * Sanitizes AI response text to ensure casual conversational messages
 * render in clean, natural human text rather than forced raw JSON or code block templates.
 */
export function sanitizeResponseText(text: string, userPrompt: string = ""): string {
  if (!text) return "";

  const trimmed = text.trim();

  // If user explicitly requested JSON, code, or technical structure, retain verbatim
  const userWantsCodeOrJson =
    /\b(json|code|script|schema|function|api|object|type|interface|payload|format|yaml|sql|xml|html|css)\b/i.test(
      userPrompt
    ) || userPrompt.trim().startsWith("/");

  if (userWantsCodeOrJson) {
    return text;
  }

  // 1. Unwrap markdown code blocks wrapping a single JSON string or object
  // e.g., ```json\n{\n  "message": "Hello!"\n}\n```
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const contentToInspect = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed;

  // 2. Check if contentToInspect is a raw JSON object string
  if (
    (contentToInspect.startsWith("{") && contentToInspect.endsWith("}")) ||
    (contentToInspect.startsWith("[") && contentToInspect.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(contentToInspect);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        // Look for common text message keys
        const extractedText =
          parsed.message ||
          parsed.text ||
          parsed.response ||
          parsed.reply ||
          parsed.content ||
          parsed.answer ||
          parsed.output;

        if (typeof extractedText === "string" && extractedText.trim()) {
          return extractedText.trim();
        }
      }
    } catch {
      // Not valid JSON, proceed
    }
  }

  // 3. If the entire response was wrapped in a generic ``` code block for simple text, unwrap it
  if (codeBlockMatch) {
    const inner = codeBlockMatch[1].trim();
    // Only unwrap if inner content does not look like actual programming code
    const looksLikeCode = /^(import\s|export\s|function\s|const\s|let\s|var\s|class\s|def\s|public\s|<[a-z]+)/m.test(inner);
    if (!looksLikeCode) {
      return inner;
    }
  }

  return text;
}
