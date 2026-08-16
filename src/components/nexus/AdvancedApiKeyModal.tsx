import React, { useState } from "react";
import { Key, ShieldCheck, Info, Check, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess } from "@/utils/toast";

interface AdvancedApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  customApiKey: string;
  onSaveKey: (key: string) => void;
}

export function AdvancedApiKeyModal({
  isOpen,
  onClose,
  customApiKey,
  onSaveKey,
}: AdvancedApiKeyModalProps) {
  const [inputKey, setInputKey] = useState(customApiKey);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(inputKey.trim());
    showSuccess(inputKey.trim() ? "Custom API key saved!" : "Reset to default keyless gateway!");
    onClose();
  };

  const envKeyPresent = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100 p-6 rounded-3xl shadow-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Key className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-extrabold">Advanced API Settings</h2>
            <p className="text-[11px] text-slate-400">Optional configuration for power users</p>
          </div>
        </div>

        <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-3 text-xs text-indigo-200 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-indigo-300">
            <Info className="w-4 h-4 shrink-0" />
            <span>Default Zero-Setup Mode Active</span>
          </div>
          <p className="text-[11px] text-indigo-200/80 leading-relaxed">
            {envKeyPresent
              ? "System environment API key (VITE_GEMINI_API_KEY) is configured. You do not need to enter a key."
              : "Nexus Plex automatically routes prompts through our high-speed keyless cloud gateway. Entering a custom key below is strictly optional."}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">Custom Gemini / Pollinations Key (Optional):</label>
            <Input
              type="password"
              placeholder="Paste custom AI API key (AIzaSy...)"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="bg-slate-900 border-slate-800 text-xs rounded-xl h-10"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {customApiKey ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setInputKey("");
                  onSaveKey("");
                  showSuccess("Cleared custom key");
                }}
                className="text-xs text-rose-400 hover:text-rose-300 h-8 px-2"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear Custom Key
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="text-xs text-slate-400 h-9">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl h-9 px-4">
                Save Preference
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}