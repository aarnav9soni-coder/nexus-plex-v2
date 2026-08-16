import React, { useState, useEffect, useRef } from "react";
import {
  Palette,
  Moon,
  Sun,
  Sparkles,
  Flame,
  Terminal,
  Compass,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  THEMES,
  ThemeId,
  getStoredTheme,
  setStoredTheme,
  applyTheme,
} from "@/utils/theme";

interface ThemeSelectorProps {
  className?: string;
  variant?: "header" | "full";
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  className = "",
  variant = "header",
}) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>("dark");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialTheme = getStoredTheme();
    setCurrentTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    setStoredTheme(themeId);
    setIsOpen(false);
  };

  const getThemeIcon = (iconName: string, activeColor: string) => {
    const props = { className: "w-4 h-4 shrink-0", style: { color: activeColor } };
    switch (iconName) {
      case "Sun":
        return <Sun {...props} />;
      case "Moon":
        return <Moon {...props} />;
      case "Sparkles":
        return <Sparkles {...props} />;
      case "Flame":
        return <Flame {...props} />;
      case "Terminal":
        return <Terminal {...props} />;
      case "Compass":
        return <Compass {...props} />;
      default:
        return <Palette {...props} />;
    }
  };

  const activeOption = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  if (variant === "full") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
        {THEMES.map((theme) => {
          const isSelected = theme.id === currentTheme;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelect(theme.id)}
              className="flex flex-col text-left p-3 rounded-xl border transition-all relative overflow-hidden shadow-sm hover:scale-[1.01]"
              style={{
                backgroundColor: isSelected ? "var(--app-accent-bg)" : "var(--app-panel)",
                borderColor: isSelected ? "var(--app-accent)" : "var(--app-border)",
                color: "var(--app-text)",
              }}
            >
              <div className="flex items-center justify-between mb-2 w-full">
                <div className="flex items-center gap-2">
                  {getThemeIcon(theme.iconName, theme.preview.accent)}
                  <span className="font-bold text-xs" style={{ color: "var(--app-text)" }}>
                    {theme.name}
                  </span>
                </div>
                {isSelected && (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--app-accent)" }}
                  >
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                )}
              </div>

              <p className="text-[11px] mb-3 leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
                {theme.description}
              </p>

              {/* Color swatch previews */}
              <div
                className="flex items-center gap-1.5 mt-auto pt-2 border-t w-full"
                style={{ borderColor: "var(--app-border)" }}
              >
                <div
                  className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shadow-sm"
                  style={{ backgroundColor: theme.preview.bg }}
                  title="Canvas Background"
                />
                <div
                  className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shadow-sm"
                  style={{ backgroundColor: theme.preview.panel }}
                  title="Panel Background"
                />
                <div
                  className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shadow-sm"
                  style={{ backgroundColor: theme.preview.accent }}
                  title="Accent Color"
                />
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold group shadow-sm"
        style={{
          backgroundColor: "var(--app-bg)",
          borderColor: "var(--app-border)",
          color: "var(--app-text)",
        }}
        title="Switch Workspace Visual Theme"
      >
        <Palette className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" style={{ color: "var(--app-accent)" }} />
        <span className="hidden md:inline font-medium" style={{ color: "var(--app-text)" }}>
          {activeOption.name}
        </span>
        <ChevronDown className="w-3 h-3 transition-colors opacity-60" style={{ color: "var(--app-text)" }} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-1 border"
          style={{
            backgroundColor: "var(--app-panel)",
            borderColor: "var(--app-border)",
            color: "var(--app-text)",
          }}
        >
          <div
            className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border-b mb-1"
            style={{
              borderColor: "var(--app-border)",
              color: "var(--app-text-muted)",
            }}
          >
            <span>Visual Workspace Theme</span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-mono border"
              style={{
                color: "var(--app-accent)",
                backgroundColor: "var(--app-accent-bg)",
                borderColor: "var(--app-accent-border)",
              }}
            >
              6 Modes
            </span>
          </div>

          {THEMES.map((theme) => {
            const isSelected = theme.id === currentTheme;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-xs text-left border ${
                  isSelected ? "font-semibold shadow-sm" : "hover:opacity-90"
                }`}
                style={{
                  backgroundColor: isSelected ? "var(--app-accent-bg)" : "transparent",
                  borderColor: isSelected ? "var(--app-accent)" : "transparent",
                  color: "var(--app-text)",
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full shrink-0 border border-black/20 dark:border-white/20 shadow-sm"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                  <div className="truncate">
                    <div className="font-bold text-xs leading-none mb-1" style={{ color: "var(--app-text)" }}>
                      {theme.name}
                    </div>
                    <div className="text-[10px] truncate" style={{ color: "var(--app-text-muted)" }}>
                      {theme.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: theme.preview.bg }}
                      title="Canvas"
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/10"
                      style={{ backgroundColor: theme.preview.panel }}
                      title="Panel"
                    />
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 shrink-0" style={{ color: "var(--app-accent)" }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ThemeSwitcher = ThemeSelector;
