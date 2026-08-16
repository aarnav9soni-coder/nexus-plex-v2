import React from "react";
import { Sparkles, User, Volume2 } from "lucide-react";
import { VoicePersona, VOICE_PERSONAS } from "@/hooks/useTextToSpeech";

export interface VoiceSelectorProps {
  value: VoicePersona;
  onChange: (persona: VoicePersona) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="relative flex items-center">
      <div className="absolute left-2.5 pointer-events-none text-[#06B6D4]">
        <Volume2 className="w-3.5 h-3.5" />
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value as VoicePersona)}
        disabled={disabled}
        className="bg-[#111622] border border-[#1E2638] hover:border-[#06B6D4]/50 text-xs font-semibold text-slate-100 rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#06B6D4] cursor-pointer transition-colors appearance-none"
      >
        {(Object.keys(VOICE_PERSONAS) as VoicePersona[]).map((key) => {
          const config = VOICE_PERSONAS[key];
          return (
            <option key={key} value={key} className="bg-[#111622] text-slate-100 py-1">
              {config.label}
            </option>
          );
        })}
      </select>

      <div className="absolute right-2.5 pointer-events-none text-slate-400">
        <Sparkles className="w-3 h-3" />
      </div>
    </div>
  );
};
