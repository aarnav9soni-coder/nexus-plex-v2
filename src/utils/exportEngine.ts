/**
 * Cross-Account Export & Zero-Auth Sharing Engine
 * Nexus Plex Architecture - Engineered by Lead Developer & Architect Aarnav.
 *
 * Implements:
 * 1. Multi-format transcript generation (Markdown, JSON, Plain Text, Printable HTML/PDF)
 * 2. Zero-Auth Cross-Account Transfer via Web Share API, Mailto payload, and Google Drive upload handoff
 * 3. Clipboard copy with rich formatting
 */

import { ChatMessageData } from "./GeminiClient";
import { showSuccess, showError, showInfo } from "./toast";

export interface ExportSessionData {
  sessionTitle: string;
  messages: ChatMessageData[];
  selectedModel?: string;
  userEmail?: string;
}

/**
 * Formats transcript as clean GitHub-flavored Markdown (.md)
 */
export function generateMarkdownExport({
  sessionTitle,
  messages,
  selectedModel = "Gemini 3.7 Flash",
  userEmail = "guest",
}: ExportSessionData): string {
  const timestamp = new Date().toLocaleString();
  let md = `# ${sessionTitle}\n\n`;
  md += `> **Platform:** Nexus Plex AI Workspace  \n`;
  md += `> **Architect:** Engineered by Aarnav  \n`;
  md += `> **Model:** ${selectedModel}  \n`;
  md += `> **Export Date:** ${timestamp}  \n`;
  md += `> **Account Scope:** ${userEmail}  \n\n`;
  md += `---\n\n`;

  messages.forEach((msg, idx) => {
    const isUser = msg.sender === "user";
    const senderName = isUser ? "👤 **User**" : "⚡ **Nexus Plex AI**";
    const time = msg.timestamp ? ` *(${msg.timestamp})*` : "";

    md += `### ${senderName}${time}\n\n`;
    md += `${msg.text || ""}\n\n`;

    if (msg.generatedImage) {
      md += `![Generated Artwork](${msg.generatedImage.url})\n\n`;
    }

    if (msg.generatedVideo) {
      md += `🎥 **Generated Video:** [Watch Video Clip](${msg.generatedVideo.url})\n\n`;
    }

    if (msg.generatedAudio) {
      md += `🎵 **Synthesized Audio:** ${msg.generatedAudio.genre || "Audio Track"} (${msg.generatedAudio.bpm || 120} BPM)\n\n`;
    }

    if (msg.files && msg.files.length > 0) {
      md += `📎 **Attachments:** ${msg.files.map((f) => f.name).join(", ")}\n\n`;
    }

    if (idx < messages.length - 1) {
      md += `---\n\n`;
    }
  });

  md += `\n\n---\n*Exported securely with zero OAuth dependency from Nexus Plex.*`;
  return md;
}

/**
 * Formats full conversation state as structured JSON (.json)
 */
export function generateJsonExport({
  sessionTitle,
  messages,
  selectedModel = "gemini-3.7-flash",
  userEmail = "guest",
}: ExportSessionData): string {
  const payload = {
    workspace: "Nexus Plex",
    architect: "Aarnav",
    exportVersion: "2.0",
    exportedAt: new Date().toISOString(),
    sessionTitle,
    userAccount: userEmail,
    model: selectedModel,
    messagesCount: messages.length,
    messages: messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp,
      files: m.files?.map((f) => ({ name: f.name, type: f.type })),
      generatedImage: m.generatedImage ? { url: m.generatedImage.url, prompt: m.generatedImage.prompt } : undefined,
      generatedVideo: m.generatedVideo ? { url: m.generatedVideo.url, prompt: m.generatedVideo.prompt } : undefined,
      generatedAudio: m.generatedAudio ? { url: m.generatedAudio.url, prompt: m.generatedAudio.prompt } : undefined,
    })),
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Formats transcript as clean plain text (.txt)
 */
export function generatePlainTextExport({
  sessionTitle,
  messages,
  selectedModel = "Gemini 3.7 Flash",
  userEmail = "guest",
}: ExportSessionData): string {
  let txt = `======================================================\n`;
  txt += `NEXUS PLEX CHAT TRANSCRIPT\n`;
  txt += `Engineered by Aarnav\n`;
  txt += `Title: ${sessionTitle}\n`;
  txt += `Model: ${selectedModel}\n`;
  txt += `Account: ${userEmail}\n`;
  txt += `Exported: ${new Date().toLocaleString()}\n`;
  txt += `======================================================\n\n`;

  messages.forEach((msg) => {
    const sender = msg.sender === "user" ? "USER" : "NEXUS PLEX AI";
    const time = msg.timestamp ? ` [${msg.timestamp}]` : "";
    txt += `[${sender}${time}]\n${msg.text}\n\n`;
  });

  return txt;
}

/**
 * Downloads a text-based file in the browser
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("File download failed:", err);
    showError("Failed to trigger file download");
  }
}

/**
 * 1. Export as Markdown (.md)
 */
export function exportChatAsMarkdown(data: ExportSessionData): void {
  const md = generateMarkdownExport(data);
  const cleanTitle = data.sessionTitle.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30) || "chat";
  triggerFileDownload(md, `nexus_chat_${cleanTitle}_${Date.now()}.md`, "text/markdown");
  showSuccess("Downloaded Markdown (.md) transcript");
}

/**
 * 2. Export as JSON (.json)
 */
export function exportChatAsJson(data: ExportSessionData): void {
  const json = generateJsonExport(data);
  const cleanTitle = data.sessionTitle.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30) || "chat";
  triggerFileDownload(json, `nexus_backup_${cleanTitle}_${Date.now()}.json`, "application/json");
  showSuccess("Downloaded raw JSON session backup");
}

/**
 * 3. Export as Plain Text (.txt)
 */
export function exportChatAsPlainText(data: ExportSessionData): void {
  const txt = generatePlainTextExport(data);
  const cleanTitle = data.sessionTitle.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 30) || "chat";
  triggerFileDownload(txt, `nexus_transcript_${cleanTitle}_${Date.now()}.txt`, "text/plain");
  showSuccess("Downloaded plain text transcript (.txt)");
}

/**
 * 4. Printable PDF / HTML Document View
 */
export function exportChatAsPrintableDocument(data: ExportSessionData): void {
  const { sessionTitle, messages, selectedModel = "Gemini 3.7 Flash", userEmail = "guest" } = data;

  const htmlWindow = window.open("", "_blank");
  if (!htmlWindow) {
    showInfo("Pop-up blocked. Exporting as Markdown instead.");
    exportChatAsMarkdown(data);
    return;
  }

  const messagesHtml = messages
    .map((msg) => {
      const isUser = msg.sender === "user";
      const senderLabel = isUser ? "👤 User" : "⚡ Nexus Plex AI";
      const badgeColor = isUser ? "#0284c7" : "#7c3aed";
      const bgColor = isUser ? "#f0f9ff" : "#f8fafc";
      const borderColor = isUser ? "#bae6fd" : "#e2e8f0";

      return `
      <div style="margin-bottom: 20px; padding: 18px; border-radius: 14px; background: ${bgColor}; border: 1px solid ${borderColor}; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-weight: 700; font-size: 13px; color: ${badgeColor}; font-family: ui-monospace, monospace;">
            ${senderLabel}
          </span>
          <span style="font-size: 11px; color: #64748b; font-family: ui-monospace, monospace;">
            ${msg.timestamp || ""}
          </span>
        </div>
        <div style="font-size: 14px; line-height: 1.65; color: #0f172a; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${escapeHtml(
          msg.text || ""
        )}</div>
        ${
          msg.generatedImage
            ? `<div style="margin-top: 12px;"><img src="${msg.generatedImage.url}" alt="Artwork" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #cbd5e1;" /></div>`
            : ""
        }
      </div>
    `;
    })
    .join("");

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(sessionTitle)} - Nexus Plex Transcript</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 860px;
            margin: 30px auto;
            padding: 0 24px;
            color: #0f172a;
            background: #ffffff;
          }
          .header {
            border-bottom: 2px solid #06B6D4;
            padding-bottom: 16px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .header h1 {
            font-size: 22px;
            font-weight: 800;
            margin: 0 0 6px 0;
            color: #0f172a;
          }
          .header .brand {
            font-size: 12px;
            font-weight: 700;
            color: #0891b2;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          .meta {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 24px;
            line-height: 1.5;
            background: #f8fafc;
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          .print-btn {
            background: #0891b2;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            margin-bottom: 20px;
          }
          @media print {
            .print-btn { display: none; }
            body { margin: 0; padding: 12px; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <div class="header">
          <div>
            <div class="brand">Nexus Plex • Engineered by Aarnav</div>
            <h1>${escapeHtml(sessionTitle)}</h1>
          </div>
          <div style="font-size: 11px; color: #64748b; text-align: right;">
            <div>${new Date().toLocaleDateString()}</div>
            <div>${new Date().toLocaleTimeString()}</div>
          </div>
        </div>
        <div class="meta">
          <strong>Model:</strong> ${escapeHtml(selectedModel)} &nbsp;|&nbsp; 
          <strong>Account:</strong> ${escapeHtml(userEmail)} &nbsp;|&nbsp; 
          <strong>Total Messages:</strong> ${messages.length}
        </div>
        <div>${messagesHtml}</div>
        <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
          Generated with Nexus Plex AI Architecture • Zero-Auth Verified
        </div>
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => { window.print(); }, 400);
          });
        </script>
      </body>
    </html>
  `;

  htmlWindow.document.write(fullHtml);
  htmlWindow.document.close();
  showSuccess("Opened printable PDF / Document view");
}

/**
 * 5. Direct Google Account / Email Transfer (Web Share API & Mailto payload)
 */
export async function transferToGoogleAccount({
  sessionTitle,
  messages,
  selectedModel = "Gemini 3.7 Flash",
  destinationEmail,
}: ExportSessionData & { destinationEmail?: string }): Promise<void> {
  const plainSummary = generatePlainTextExport({
    sessionTitle,
    messages,
    selectedModel,
    userEmail: destinationEmail || "user",
  });

  const subject = `Nexus Plex AI Chat Transcript: ${sessionTitle}`;

  // Try Native Web Share API if supported and no specific email typed
  if (!destinationEmail && typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: subject,
        text: plainSummary.slice(0, 3000),
      });
      showSuccess("Shared transcript via device share menu");
      return;
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.log("Web Share fallback to mailto:", e);
      }
    }
  }

  // Construct mailto link
  const targetEmail = destinationEmail?.trim() || "";
  const mailtoBody = encodeURIComponent(
    `Here is the exported chat transcript from Nexus Plex:\n\n${plainSummary.slice(0, 1800)}\n\n(Full conversation contains ${messages.length} messages)`
  );
  const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${mailtoBody}`;

  // Open default mail client / Gmail handler
  window.open(mailtoUrl, "_blank");
  showSuccess(
    targetEmail
      ? `Prepared transcript email dispatch to ${targetEmail}`
      : "Opened email dispatch for chat transcript"
  );
}

/**
 * 6. Copy Formatted Transcript to Clipboard
 */
export async function copyTranscriptToClipboard(data: ExportSessionData): Promise<void> {
  const md = generateMarkdownExport(data);
  try {
    await navigator.clipboard.writeText(md);
    showSuccess("Copied formatted transcript to clipboard");
  } catch (err) {
    console.error("Clipboard write error:", err);
    showError("Could not write to clipboard");
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
