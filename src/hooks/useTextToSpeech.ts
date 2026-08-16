import { useState, useEffect, useCallback, useRef } from "react";
import { sanitizeResponseText } from "@/utils/textSanitizer";

export type VoicePersona =
  | "Natural Female"
  | "Natural Male"
  | "Deep Studio Male"
  | "Crisp Executive";

export interface VoicePersonaConfig {
  id: VoicePersona;
  label: string;
  description: string;
  pitch: number;
  rate: number;
  voiceGenderPreference: "female" | "male" | "any";
  keywords: string[];
}

export const VOICE_PERSONAS: Record<VoicePersona, VoicePersonaConfig> = {
  "Natural Female": {
    id: "Natural Female",
    label: "Natural Female",
    description: "High clarity, polished female tone",
    pitch: 1.1,
    rate: 1.0,
    voiceGenderPreference: "female",
    keywords: ["google us english", "samantha", "victoria", "zira", "karen", "moira", "fiona", "female", "natural"],
  },
  "Natural Male": {
    id: "Natural Male",
    label: "Natural Male",
    description: "Warm, articulate male tone",
    pitch: 1.0,
    rate: 1.0,
    voiceGenderPreference: "male",
    keywords: ["google uk english male", "alex", "daniel", "david", "george", "guy", "male", "rishi", "oliver"],
  },
  "Deep Studio Male": {
    id: "Deep Studio Male",
    label: "Deep Studio Male",
    description: "Rich broadcast & podcast male tone",
    pitch: 0.85,
    rate: 0.95,
    voiceGenderPreference: "male",
    keywords: ["google uk english male", "alex", "daniel", "david", "richard", "male", "guy"],
  },
  "Crisp Executive": {
    id: "Crisp Executive",
    label: "Crisp Executive",
    description: "Clear, direct, authoritative tone",
    pitch: 1.05,
    rate: 1.05,
    voiceGenderPreference: "any",
    keywords: ["google us english", "samantha", "alex", "victoria", "karen", "daniel"],
  },
};

export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>("Natural Female");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Initialize and load system voices asynchronously with onvoiceschanged event listener
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const updateVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      if (avail && avail.length > 0) {
        setVoices(avail);
        voicesRef.current = avail;
      }
    };

    updateVoices();

    if (typeof window.speechSynthesis.addEventListener === "function") {
      window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    }
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (typeof window.speechSynthesis.removeEventListener === "function") {
        window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      }
    };
  }, []);

  // Match the best SpeechSynthesisVoice for a given persona
  const findBestVoice = useCallback(
    (persona: VoicePersona, overrideVoices?: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
      let pool = overrideVoices && overrideVoices.length > 0 ? overrideVoices : (voices.length > 0 ? voices : voicesRef.current);
      if ((!pool || pool.length === 0) && typeof window !== "undefined" && "speechSynthesis" in window) {
        pool = window.speechSynthesis.getVoices();
      }
      if (!pool || pool.length === 0) return null;

      const config = VOICE_PERSONAS[persona] || VOICE_PERSONAS["Natural Female"];
      const englishVoices = pool.filter(
        (v) => v.lang.startsWith("en") || v.lang.startsWith("EN")
      );
      const searchPool = englishVoices.length > 0 ? englishVoices : pool;

      const isFemalePreference =
        config.voiceGenderPreference === "female" ||
        persona === "Natural Female";

      const isMalePreference =
        config.voiceGenderPreference === "male" ||
        persona === "Natural Male" ||
        persona === "Deep Studio Male";

      const maleRegex = /\b(male|david|mark|george|daniel|alex|richard|guy|rishi|oliver|fred|stephen|steffan)\b/i;
      const femaleRegex = /\b(female|samantha|zira|victoria|karen|moira|fiona|veena|eva|ava|allison|susan|serena)\b/i;

      // Filter searchPool to prevent falling back to opposite gender default voices
      let preferredPool = searchPool;
      if (isFemalePreference) {
        const nonMale = searchPool.filter((v) => !maleRegex.test(v.name) && !maleRegex.test(v.voiceURI));
        if (nonMale.length > 0) {
          preferredPool = nonMale;
        }
      } else if (isMalePreference) {
        const maleOnly = searchPool.filter(
          (v) => maleRegex.test(v.name) || maleRegex.test(v.voiceURI) || !femaleRegex.test(v.name)
        );
        if (maleOnly.length > 0) {
          preferredPool = maleOnly;
        }
      }

      // 1. Keyword matching on preferred pool
      for (const kw of config.keywords) {
        const match = preferredPool.find(
          (v) => v.name.toLowerCase().includes(kw) || v.voiceURI.toLowerCase().includes(kw)
        );
        if (match) return match;
      }

      // 2. Keyword matching on broader search pool
      for (const kw of config.keywords) {
        const match = searchPool.find(
          (v) => v.name.toLowerCase().includes(kw) || v.voiceURI.toLowerCase().includes(kw)
        );
        if (match) return match;
      }

      // 3. Fallback to preferred or default voice
      const defaultVoice = preferredPool.find((v) => v.default) || preferredPool[0] || searchPool[0];
      return defaultVoice || null;
    },
    [voices]
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  const changePersona = useCallback((newPersona: VoicePersona) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
    setIsSpeaking(false);
    setSelectedPersona(newPersona);
  }, []);

  const speak = useCallback(
    (
      text: string,
      options?: {
        persona?: VoicePersona;
        onStart?: () => void;
        onEnd?: () => void;
        onError?: (err: unknown) => void;
      }
    ) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        options?.onEnd?.();
        return;
      }

      // Cancel any active speech synthesis audio stream immediately
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
      setIsSpeaking(false);

      if (!text || typeof text !== "string" || !text.trim()) {
        options?.onEnd?.();
        return;
      }

      const cleanedText = sanitizeResponseText(text)
        .replace(/[*#_`~[\]()]/g, "")
        .replace(/\bhttps?:\/\/\S+/gi, "link")
        .trim();

      if (!cleanedText) {
        options?.onEnd?.();
        return;
      }

      const activePersona = options?.persona || selectedPersona;
      const personaConfig = VOICE_PERSONAS[activePersona] || VOICE_PERSONAS["Natural Female"];
      const matchedVoice = findBestVoice(activePersona);

      const utterance = new SpeechSynthesisUtterance(cleanedText);

      // Pitch and Rate synthesis overrides for custom persona audio dynamics
      // Strictly enforce pitch <= 1.3 (pitch > 1.4 is forbidden)
      utterance.pitch = Math.min(Math.max(personaConfig.pitch, 0.5), 1.3);
      utterance.rate = Math.min(Math.max(personaConfig.rate, 0.5), 1.5);
      utterance.volume = 1.0;

      utterance.lang = matchedVoice ? matchedVoice.lang : "en-US";

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        options?.onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
        options?.onEnd?.();
      };

      utterance.onerror = (evt) => {
        console.warn("TTS Utterance Error:", evt);
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
        options?.onError?.(evt);
        options?.onEnd?.();
      };

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [selectedPersona, findBestVoice]
  );

  return {
    voices,
    selectedPersona,
    setSelectedPersona,
    changePersona,
    isSpeaking,
    isSupported,
    speak,
    stop,
    findBestVoice,
  };
}

