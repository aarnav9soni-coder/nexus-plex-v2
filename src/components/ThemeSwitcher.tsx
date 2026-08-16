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

interface ThemeSwitcherProps {
  className?: string;
  align?: "left" | "right";
  showLabel?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = "",
  align = "right",
  showLabel = true,
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
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

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold group shadow-sm cursor-pointer hover:bg-slate-800/40"
        style={{
          backgroundColor: "var(--app-bg)",
          borderColor: "var(--app-border)",
          color: "var(--app-text)",
        }}
        title="Switch Workspace Visual Theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-black/20 dark:border-white/20 transition-transform group-hover:scale-110"
          style={{ backgroundColor: activeOption.preview.accent }}
        />
        {getThemeIcon(activeOption.iconName, activeOption.preview.accent)}
        {showLabel && (
          <span className="hidden sm:inline font-medium text-xs" style={{ color: "var(--app-text)" }}>
            {activeOption.name}
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform opacity-60 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--app-text)" }}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} mt-2 w-72 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-1 border`}
          style={{
            backgroundColor: "var(--app-panel)",
            borderColor: "var(--app-border)",
            color: "var(--app-text)",
          }}
        >
          <div
            className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border-b mb-1"
            style={{
              borderColor: "var(--app-border)",
              color: "var(--app-text-muted)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Color Themes</span>
            </div>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-mono border"
              style={{
                color: "var(--app-accent)",
                backgroundColor: "var(--app-accent-bg)",
                borderColor: "var(--app-accent-border)",
              }}
            >
              6 Options
            </span>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin pr-0.5">
            {THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-xs text-left border cursor-pointer ${
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
                      className="w-4 h-4 rounded-full shrink-0 border border-black/20 dark:border-white/20 shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: theme.preview.accent }}
                    >
                      {getThemeIcon(theme.iconName, "#FFFFFF")}
                    </div>
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
                        title="Background"
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
        </div>
      )}
    </div>
  );
};

export const ThemeSelector = ThemeSwitcher;
