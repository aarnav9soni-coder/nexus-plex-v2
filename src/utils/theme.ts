export type ThemeId = "dark" | "light" | "neon" | "sunset" | "emerald" | "ocean";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  iconName: string;
  preview: {
    bg: string;
    panel: string;
    accent: string;
    text: string;
  };
}

export const THEMES: ThemeOption[] = [
  {
    id: "dark",
    name: "Cyber Midnight",
    description: "Classic dark workspace with cyan accents",
    iconName: "Moon",
    preview: {
      bg: "#080B11",
      panel: "#111622",
      accent: "#06B6D4",
      text: "#E2E8F0",
    },
  },
  {
    id: "light",
    name: "Clean Studio",
    description: "Crisp, bright light mode with sky blue details",
    iconName: "Sun",
    preview: {
      bg: "#F8FAFC",
      panel: "#FFFFFF",
      accent: "#0284C7",
      text: "#0F172A",
    },
  },
  {
    id: "neon",
    name: "Neon Cyberpunk",
    description: "Vibrant synthwave violet with electric pink highlights",
    iconName: "Sparkles",
    preview: {
      bg: "#05050A",
      panel: "#0E091A",
      accent: "#EC4899",
      text: "#F8FAFC",
    },
  },
  {
    id: "sunset",
    name: "Sunset Amber",
    description: "Warm, rich espresso canvas with gold amber tones",
    iconName: "Flame",
    preview: {
      bg: "#0C0A09",
      panel: "#1C1917",
      accent: "#F59E0B",
      text: "#FAFAF9",
    },
  },
  {
    id: "emerald",
    name: "Matrix Emerald",
    description: "Deep forest matrix terminal with mint emerald highlights",
    iconName: "Terminal",
    preview: {
      bg: "#02120A",
      panel: "#062315",
      accent: "#10B981",
      text: "#ECFDF5",
    },
  },
  {
    id: "ocean",
    name: "Sapphire Ocean",
    description: "Deep abyss navy background with royal blue glow",
    iconName: "Compass",
    preview: {
      bg: "#030712",
      panel: "#0B1528",
      accent: "#3B82F6",
      text: "#F0F9FF",
    },
  },
];

const THEME_STORAGE_KEY = "ai_workspace_theme";

export function getStoredTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved as ThemeId;
    }
  } catch (e) {
    console.error("Error reading theme from storage:", e);
  }
  return "dark";
}

export function setStoredTheme(themeId: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
    applyTheme(themeId);
  } catch (e) {
    console.error("Error saving theme to storage:", e);
  }
}

export function applyTheme(themeId: ThemeId): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", themeId);

  // Toggle standard Tailwind dark class if not light
  if (themeId === "light") {
    root.classList.remove("dark");
  } else {
    root.classList.add("dark");
  }
}
