/**
 * Universal Web Scraper & URL Inspector Engine
 * Nexus Plex Architecture - Engineered by Lead Developer & Architect Aarnav.
 */

export interface ScrapedPageData {
  url: string;
  title: string;
  description?: string;
  headings: string[];
  content: string;
  linksCount: number;
  wordCount: number;
  status: "success" | "error" | "partial";
  error?: string;
}

/**
 * Extracts all valid HTTP/HTTPS URLs from a given prompt string
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches));
}

/**
 * Scrapes and extracts DOM text / Markdown from a target URL
 * Routes through the server scraping proxy with client-side fallback
 */
export async function scrapeWebUrl(url: string): Promise<ScrapedPageData> {
  const cleanUrl = url.trim();

  // Try server proxy scraping endpoint first
  try {
    const response = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: cleanUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.content) {
        return {
          url: cleanUrl,
          title: data.title || "Webpage Analysis",
          description: data.description,
          headings: data.headings || [],
          content: data.content,
          linksCount: data.linksCount || 0,
          wordCount: data.wordCount || data.content.split(/\s+/).length,
          status: "success",
        };
      }
    }
  } catch (err) {
    console.warn("[Nexus URL Scraper] Server proxy fetch error, attempting direct/fallback scrape:", err);
  }

  // Fallback: CORS proxy or client fetch
  try {
    const corsProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`;
    const res = await fetch(corsProxyUrl);
    if (res.ok) {
      const json = await res.json();
      const rawHtml = json.contents || "";
      const parsed = parseRawHtml(rawHtml, cleanUrl);
      return parsed;
    }
  } catch (e) {
    console.warn("[Nexus URL Scraper] Fallback CORS proxy failed:", e);
  }

  // Final graceful fallback
  return {
    url: cleanUrl,
    title: `URL Target: ${new URL(cleanUrl).hostname}`,
    headings: [],
    content: `Web resource reference: ${cleanUrl}\nNote: Live network scrape was restricted by remote host CORS policies. Analyzing URL parameters and domain context.`,
    linksCount: 0,
    wordCount: 20,
    status: "partial",
  };
}

/**
 * Parses raw HTML string into clean text, title, and headings
 */
function parseRawHtml(html: string, url: string): ScrapedPageData {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Remove scripts, styles, noscript, svg, and iframes
    const scripts = doc.querySelectorAll("script, style, noscript, svg, iframe, nav, footer");
    scripts.forEach((s) => s.remove());

    const title = doc.querySelector("title")?.textContent?.trim() || doc.querySelector("h1")?.textContent?.trim() || new URL(url).hostname;
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || undefined;

    const headings: string[] = [];
    doc.querySelectorAll("h1, h2, h3").forEach((h) => {
      const text = h.textContent?.trim();
      if (text && text.length > 2 && text.length < 120) {
        headings.push(text);
      }
    });

    const bodyText = doc.body?.textContent || "";
    const cleanText = bodyText
      .replace(/\s+/g, " ")
      .replace(/(\n\s*){3,}/g, "\n\n")
      .trim()
      .slice(0, 15000);

    const linksCount = doc.querySelectorAll("a[href]").length;

    return {
      url,
      title,
      description: metaDesc,
      headings: headings.slice(0, 8),
      content: cleanText || `Scraped content from ${url}`,
      linksCount,
      wordCount: cleanText.split(/\s+/).length,
      status: "success",
    };
  } catch (err) {
    return {
      url,
      title: url,
      headings: [],
      content: html.slice(0, 5000),
      linksCount: 0,
      wordCount: 100,
      status: "partial",
    };
  }
}

/**
 * Formats scraped webpage data into structured context for the LLM
 */
export function formatScrapedContext(data: ScrapedPageData): string {
  const headingsList = data.headings.length > 0 ? `\nKey Headings: ${data.headings.join(" | ")}` : "";
  const desc = data.description ? `\nSummary: ${data.description}` : "";

  return `
[🌐 Web Page Inspector Context]
- URL: ${data.url}
- Title: ${data.title}${desc}${headingsList}
- Word Count: ~${data.wordCount} words

--- Webpage Content ---
${data.content}
--- End Webpage Content ---
`.trim();
}
