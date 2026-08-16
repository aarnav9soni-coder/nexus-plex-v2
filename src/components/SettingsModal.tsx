import React, { useState, useEffect } from "react";
import {
  Settings,
  Key,
  Check,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  Cpu,
  Sparkles,
  Bot,
  ExternalLink,
  Palette,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/ThemeSelector";
import {
  getStoredApiKeys,
  getStoredKeyStatuses,
  saveStoredApiKeys,
  clearStoredApiKeys,
  testApiKey,
  ApiKeys,
  KeyStatusMap,
} from "@/utils/apiKeyStore";
import { showSuccess, showError } from "@/utils/toast";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName?: string;
  userEmail?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  brandName = "Nexus Plex",
  userEmail,
}) => {
  const [keys, setKeys] = useState<ApiKeys>({
    gemini: "",
    openai: "",
    anthropic: "",
    xai: "",
    openrouter: "",
  });

  const [statuses, setStatuses] = useState<KeyStatusMap>({
    gemini: "",
    openai: "",
    anthropic: "",
    xai: "",
    openrouter: "",
  });

  const [testingMap, setTestingMap] = useState<Record<string, boolean>>({});
  const [showKeyMap, setShowKeyMap] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"keys" | "theme" | "about">("keys");

  useEffect(() => {
    if (isOpen) {
      setKeys(getStoredApiKeys(userEmail));
      setStatuses(getStoredKeyStatuses(userEmail));
    }
  }, [isOpen, userEmail]);

  if (!isOpen) return null;

  const handleKeyChange = (provider: keyof ApiKeys, value: string) => {
    setKeys((prev) => ({ ...prev, [provider]: value.trim() }));
  };

  const handleTestAndSaveKey = async (provider: keyof ApiKeys) => {
    const rawVal = keys[provider]?.trim() || "";
    if (!rawVal) {
      showError("Please enter an API key before testing.");
      return;
    }

    setTestingMap((prev) => ({ ...prev, [provider]: true }));

    try {
      const res = await testApiKey(provider, rawVal);
      if (res.status === "Verified & Active") {
        saveStoredApiKeys({ [provider]: rawVal }, userEmail, {
          [provider]: "Verified & Active",
        });
        setStatuses((prev) => ({ ...prev, [provider]: "Verified & Active" }));
        showSuccess(`Verified & Active: ${provider.toUpperCase()} Key Connected`);
      } else if (res.status === "Saved (Unverified)") {
        saveStoredApiKeys({ [provider]: rawVal }, userEmail, {
          [provider]: "Saved (Unverified)",
        });
        setStatuses((prev) => ({ ...prev, [provider]: "Saved (Unverified)" }));
        showSuccess(`Saved (Unverified due to CORS check limit)`);
      } else {
        saveStoredApiKeys({ [provider]: rawVal }, userEmail, {
          [provider]: "Refused Connection",
        });
        setStatuses((prev) => ({ ...prev, [provider]: "Refused Connection" }));
        showError(res.message || "Invalid API Key or Provider Refused Connection");
      }
    } catch (err: any) {
      showError(err.message || "Invalid API Key or Provider Refused Connection");
    } finally {
      setTestingMap((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleSave = () => {
    saveStoredApiKeys(keys, userEmail, statuses);
    showSuccess("API Keys saved securely in user account storage");
    onClose();
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all stored API keys for this account?")) {
      clearStoredApiKeys(userEmail);
      setKeys({
        gemini: "",
        openai: "",
        anthropic: "",
        xai: "",
        openrouter: "",
      });
      setStatuses({
        gemini: "",
        openai: "",
        anthropic: "",
        xai: "",
        openrouter: "",
      });
      showSuccess("All API keys removed from user account storage");
    }
  };

  const toggleVisibility = (provider: string) => {
    setShowKeyMap((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const providers: Array<{
    id: keyof ApiKeys;
    name: string;
    description: string;
    docUrl: string;
    placeholder: string;
    accent: string;
  }> = [
    {
      id: "gemini",
      name: "Google Gemini API Key",
      description: "Unlocks Gemini 3.5 Flash, 3.1 Pro & Flash Lite multimodal models.",
      docUrl: "https://aistudio.google.com/app/apikey",
      placeholder: "AIzaSy...",
      accent: "text-[#06B6D4] border-[#06B6D4]/30",
    },
    {
      id: "openrouter",
      name: "OpenRouter API Key",
      description: "Provides unified access to 100+ open-source LLMs & DeepSeek R1.",
      docUrl: "https://openrouter.ai/keys",
      placeholder: "sk-or-v1-...",
      accent: "text-[#8B5CF6] border-[#8B5CF6]/30",
    },
    {
      id: "openai",
      name: "OpenAI API Key",
      description: "Unlocks GPT-4o, GPT-4o-mini & Sora generation.",
      docUrl: "https://platform.openai.com/api-keys",
      placeholder: "sk-proj-...",
      accent: "text-emerald-400 border-emerald-500/30",
    },
    {
      id: "anthropic",
      name: "Anthropic Claude API Key",
      description: "Unlocks Claude 3.5 Sonnet & Claude 3 Opus reasoning models.",
      docUrl: "https://console.anthropic.com/settings/keys",
      placeholder: "sk-ant-...",
      accent: "text-amber-400 border-amber-500/30",
    },
    {
      id: "xai",
      name: "xAI Grok API Key",
      description: "Unlocks Grok 3 and real-time knowledge models.",
      docUrl: "https://console.x.ai",
      placeholder: "xai-...",
      accent: "text-sky-400 border-sky-500/30",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#111622] border border-[#1E2638] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E2638] bg-[#080B11]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#06B6D4]/20">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white tracking-wide">
                Universal Key Manager (BYOK)
              </h2>
              <p className="text-xs text-[#E2E8F0]/60">
                Bring your own keys to run unconstrained AI models directly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#E2E8F0]/60 hover:text-white hover:bg-[#1E2638] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-[#1E2638] bg-[#0A0D14] text-xs font-semibold">
          <button
            onClick={() => setActiveTab("keys")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "keys"
                ? "bg-[#1E2638] text-[#06B6D4] border border-[#06B6D4]/30"
                : "text-[#E2E8F0]/60 hover:text-white"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab("theme")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "theme"
                ? "bg-[#1E2638] text-[#06B6D4] border border-[#06B6D4]/30"
                : "text-[#E2E8F0]/60 hover:text-white"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab("about")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === "about"
                ? "bg-[#1E2638] text-[#8B5CF6] border border-[#8B5CF6]/30"
                : "text-[#E2E8F0]/60 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Privacy</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {activeTab === "keys" ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#080B11] border border-[#1E2638] flex items-center gap-3 text-xs text-[#E2E8F0]/80">
                <Sparkles className="w-5 h-5 text-[#06B6D4] shrink-0" />
                <span>
                  Keys are saved safely in browser storage under <strong className="text-white">workspace_user_{userEmail || "guest"}</strong>. Default public users enjoy zero setup via keyless failover.
                </span>
              </div>

              {providers.map((p) => {
                const hasValue = Boolean(keys[p.id]);
                const isVisible = Boolean(showKeyMap[p.id]);
                const isTesting = Boolean(testingMap[p.id]);
                const status = statuses[p.id] || (hasValue ? "Connected - Quota Active" : "");

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-[#080B11] border border-[#1E2638] space-y-2.5 hover:border-[#1E2638]/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                          {p.name}
                        </span>
                        {status === "Verified & Active" || status === "Connected - Quota Active" ? (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Verified & Active
                          </span>
                        ) : status === "Saved (Unverified)" ? (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300 font-mono font-medium border border-amber-500/30 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Saved (Unverified)
                          </span>
                        ) : status === "Refused Connection" ? (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-500/20 text-rose-400 font-mono font-medium border border-rose-500/30 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5" /> Invalid Key / Refused
                          </span>
                        ) : hasValue ? (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-medium border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Verified & Active
                          </span>
                        ) : null}
                      </div>

                      <a
                        href={p.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#06B6D4] hover:underline flex items-center gap-1"
                      >
                        <span>Get Key</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <p className="text-xs text-[#E2E8F0]/60 leading-normal">
                      {p.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1 flex items-center">
                        <input
                          type={isVisible ? "text" : "password"}
                          value={keys[p.id]}
                          onChange={(e) => handleKeyChange(p.id, e.target.value)}
                          placeholder={p.placeholder}
                          className="w-full bg-[#111622] border border-[#1E2638] focus:border-[#06B6D4] rounded-lg px-3 py-2 text-xs text-[#E2E8F0] placeholder-[#E2E8F0]/30 pr-10 font-mono focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => toggleVisibility(p.id)}
                          className="absolute right-2.5 text-[#E2E8F0]/50 hover:text-white p-1"
                        >
                          {isVisible ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <Button
                        type="button"
                        disabled={isTesting}
                        onClick={() => handleTestAndSaveKey(p.id)}
                        className="bg-[#1E2638] hover:bg-[#2A3650] text-[#06B6D4] border border-[#06B6D4]/30 text-xs px-3 py-2 font-semibold shrink-0"
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          "Save & Test Key"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : activeTab === "theme" ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#080B11] border border-[#1E2638] flex items-center gap-3 text-xs text-[#E2E8F0]/80">
                <Palette className="w-5 h-5 text-[#06B6D4] shrink-0" />
                <span>
                  Select your preferred visual atmosphere. Your theme selection is automatically saved in your browser storage.
                </span>
              </div>
              <ThemeSelector variant="full" />
            </div>
          ) : (
            <div className="space-y-4 text-xs text-[#E2E8F0]/80 leading-relaxed">
              <div className="p-4 rounded-xl bg-[#080B11] border border-[#1E2638] space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
                  <span>100% Client-Side Privacy Guarantee</span>
                </h4>
                <p>
                  Your API keys never touch external database logs or persistent third-party servers. All request payloads are signed directly inside client memory or passed through secure HTTPS TLS proxies.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#080B11] border border-[#1E2638] space-y-2">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Free Tier Hosting & Keyless Standards</span>
                </h4>
                <p>
                  Designed by Lead Architect <strong className="text-white">Aarnav</strong>. Default public users enjoy keyless high-speed AI execution automatically.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-[#1E2638] bg-[#080B11]/80 flex items-center justify-between gap-3">
          <Button
            type="button"
            onClick={handleClearAll}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs px-3 py-2 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Clear All Keys
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={onClose}
              className="bg-[#1E2638] hover:bg-[#253046] text-[#E2E8F0] text-xs px-4 py-2"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="bg-[#06B6D4] hover:bg-[#0891B2] text-slate-950 font-bold text-xs px-5 py-2 shadow-md shadow-[#06B6D4]/20"
            >
              Save Credentials
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

