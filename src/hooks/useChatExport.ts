import { useCallback } from "react";
import { ChatMessageData } from "@/utils/GeminiClient";
import { showSuccess } from "@/utils/toast";

export function useChatExport(
  messages: ChatMessageData[],
  sessionTitle: string = "Agent Chat",
  userEmail?: string,
  selectedModel?: string
) {
  const getIsolatedUserScope = useCallback(() => {
    if (!userEmail || !userEmail.trim()) return "workspace_user_guest";
    const sanitized = userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    return `workspace_user_${sanitized}`;
  }, [userEmail]);

  // 1. Export as Markdown (.md)
  const exportAsMarkdown = useCallback(() => {
    if (!messages || messages.length === 0) return;

    const userScope = getIsolatedUserScope();
    const timestampStr = new Date().toISOString();

    let mdContent = `# ${sessionTitle}\n`;
    mdContent += `> Exported from Nexus Plex (${userScope})\n`;
    mdContent += `> Model: ${selectedModel || "Gemini 3.5 Flash"} | Date: ${new Date().toLocaleString()}\n\n`;
    mdContent += `---\n\n`;

    messages.forEach((msg, idx) => {
      const roleName = msg.sender === "user" ? "👤 User" : "🤖 AI Assistant";
      const timeLabel = msg.timestamp ? ` (${msg.timestamp})` : "";
      mdContent += `### ${roleName}${timeLabel}\n\n`;
      mdContent += `${msg.text || ""}\n\n`;

      if (msg.generatedImage) {
        mdContent += `![Generated Image](${msg.generatedImage.url})\n\n`;
      }
      if (msg.files && msg.files.length > 0) {
        mdContent += `*Attached Files:* ${msg.files.map((f) => f.name).join(", ")}\n\n`;
      }

      if (idx < messages.length - 1) {
        mdContent += `---\n\n`;
      }
    });

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${sessionTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Exported chat as Markdown (.md)");
  }, [messages, sessionTitle, selectedModel, getIsolatedUserScope]);

  // 2. Export as JSON (.json)
  const exportAsJson = useCallback(() => {
    if (!messages || messages.length === 0) return;

    const userScope = getIsolatedUserScope();
    const payload = {
      workspaceUserScope: userScope,
      userEmail: userEmail || "guest",
      sessionTitle,
      model: selectedModel || "gemini-3.7-flash",
      exportedAt: new Date().toISOString(),
      messagesCount: messages.length,
      messages,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${sessionTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Exported raw session JSON (.json)");
  }, [messages, sessionTitle, selectedModel, userEmail, getIsolatedUserScope]);

  // 3. Export as Plain Text (.txt)
  const exportAsPlainText = useCallback(() => {
    if (!messages || messages.length === 0) return;

    const userScope = getIsolatedUserScope();
    let txtContent = `AI WORKSPACE CHAT TRANSCRIPT\n`;
    txtContent += `Title: ${sessionTitle}\n`;
    txtContent += `Scope: ${userScope}\n`;
    txtContent += `Date: ${new Date().toLocaleString()}\n`;
    txtContent += `==================================================\n\n`;

    messages.forEach((msg) => {
      const sender = msg.sender === "user" ? "USER" : "AI ASSISTANT";
      const time = msg.timestamp ? ` [${msg.timestamp}]` : "";
      txtContent += `[${sender}${time}]\n${msg.text}\n\n`;
    });

    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${sessionTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Exported chat transcript (.txt)");
  }, [messages, sessionTitle, getIsolatedUserScope]);

  // 4. Export as Printable Document / HTML
  const exportAsPrintableDocument = useCallback(() => {
    if (!messages || messages.length === 0) return;

    const userScope = getIsolatedUserScope();
    const htmlWindow = window.open("", "_blank");
    if (!htmlWindow) {
      showSuccess("Pop-up blocked. Downloading document directly.");
      return;
    }

    const messagesHtml = messages
      .map((msg) => {
        const isUser = msg.sender === "user";
        return `
        <div style="margin-bottom: 24px; padding: 16px; border-radius: 12px; background: ${
          isUser ? "#f1f5f9" : "#f8fafc"
        }; border: 1px solid #e2e8f0;">
          <div style="font-weight: bold; font-size: 13px; color: ${
            isUser ? "#2563eb" : "#7c3aed"
          }; margin-bottom: 8px;">
            ${isUser ? "👤 User" : "🤖 AI Assistant"} <span style="font-size: 11px; color: #64748b; font-weight: normal;">${msg.timestamp || ""}</span>
          </div>
          <div style="font-size: 14px; line-height: 1.6; color: #0f172a; white-space: pre-wrap;">${
            msg.text || ""
          }</div>
        </div>
      `;
      })
      .join("");

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${sessionTitle} - Nexus Plex Export</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-w: 800px; margin: 40px auto; padding: 0 20px; color: #0f172a; }
            h1 { font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 8px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 24px; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${sessionTitle}</h1>
          <div class="meta">Exported from Nexus Plex (${userScope}) • ${new Date().toLocaleString()}</div>
          <div>${messagesHtml}</div>
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `;

    htmlWindow.document.write(fullHtml);
    htmlWindow.document.close();
    showSuccess("Opened printable document export");
  }, [messages, sessionTitle, getIsolatedUserScope]);

  return {
    exportAsMarkdown,
    exportAsJson,
    exportAsPlainText,
    exportAsPrintableDocument,
  };
}
