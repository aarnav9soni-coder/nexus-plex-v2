import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Loader2, Radio, Globe, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { fetchTextWithFallback } from "@/utils/pollinationsApi";
import { EngineMode } from "@/types/nexus";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface TalkTabProps {
  engineMode: EngineMode;
  selectedOllamaModel: string;
  onUpdateDiagnostics: (route: string, latencyMs: number, wasFallback: boolean) => void;
}

export function TalkTab({
  engineMode,
  selectedOllamaModel,
  onUpdateDiagnostics,
}: TalkTabProps) {
  const [talkTranscript, setTalkTranscript] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [speechRate, setSpeechRate] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [autoRespondMode, setAutoRespondMode] = useState(true);

  const { isListening, startListening, stopListening } = useSpeechToText();

  useEffect(() => {
    return () => {
      stopListening();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopListening]);

  const handleSpeakText = (textToSpeak: string) => {
    if (!("speechSynthesis" in window)) {
      showError("Speech Synthesis not supported in this browser");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = textToSpeak.replace(/[*#_`]/g, "").trim() || "Nexus Plex voice engine online.";
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = selectedLang;
    utterance.rate = speechRate;

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (isListening) {
        stopListening();
      }
    };

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const processVoiceAiQuery = async (speechText: string) => {
    if (!speechText.trim()) return;
    setIsAiThinking(true);

    try {
      const result = await fetchTextWithFallback({
        prompt: speechText,
        primaryModel: "openai",
        engineMode,
        ollamaModel: selectedOllamaModel,
        systemPrompt: `You are Nexus Plex Voice AI, built by Lead Developer & Architect Aarnav. Respond concisely in language: ${selectedLang}. Keep answers under 2 short sentences in natural spoken text. Never claim to be Aarnav's assistant; credit Aarnav as the Lead Developer & Architect who created Nexus Plex.`,
      });

      onUpdateDiagnostics(result.modelUsed, result.latencyMs, result.wasFallback);

      setTalkTranscript(`User: ${speechText}\n\nNexus Plex: ${result.text}`);
      setIsAiThinking(false);

      if (autoRespondMode) {
        handleSpeakText(result.text);
      }
    } catch (err) {
      setIsAiThinking(false);
      showError("Voice AI response error.");
    }
  };

  const toggleSpeechRecognition = async () => {
    if (isListening) {
      stopListening();
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    const success = await startListening({
      continuous: false,
      interimResults: false,
      lang: selectedLang,
      onResult: (capturedText) => {
        if (capturedText) {
          setTalkTranscript(`User: ${capturedText}`);
          processVoiceAiQuery(capturedText);
        }
      },
    });

    if (success) {
      showSuccess("Listening to your voice...");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center py-6">
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-xs px-3 py-1 rounded-full">
            Realtime Voice AI Agent
          </Badge>
          <button
            onClick={() => setAutoRespondMode(!autoRespondMode)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${
              autoRespondMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <Radio className="w-3 h-3" /> Auto-Speak Response: {autoRespondMode ? "ON" : "OFF"}
          </button>
        </div>
        <h2 className="text-2xl font-black tracking-tight">Nexus Voice Agent</h2>
        <p className="text-xs sm:text-sm text-slate-400">Speak your question into the mic. AI will analyze and reply hands-free!</p>
      </div>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative">
          {(isListening || isSpeaking || isAiThinking) && (
            <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-50 blur-xl animate-pulse" />
          )}
          <button
            onClick={toggleSpeechRecognition}
            disabled={isAiThinking}
            className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
              isListening
                ? "bg-rose-600 shadow-rose-600/50 scale-110"
                : isAiThinking
                ? "bg-indigo-900 border-2 border-indigo-500"
                : "bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-600 shadow-indigo-600/40 hover:scale-105"
            }`}
          >
            {isAiThinking ? (
              <Loader2 className="w-12 h-12 text-indigo-300 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
            <span className="text-[10px] font-extrabold text-white mt-1 uppercase tracking-wider">
              {isAiThinking ? "Thinking" : isListening ? "Stop Mic" : "Start Mic"}
            </span>
          </button>
        </div>

        {(isListening || isSpeaking) && (
          <div className="flex items-center gap-1.5 mt-6 h-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
              <div
                key={bar}
                className="w-1 bg-indigo-400 rounded-full animate-bounce"
                style={{
                  height: `${Math.floor(Math.random() * 16) + 8}px`,
                  animationDelay: `${bar * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}

        <span className="text-xs font-bold mt-4 text-slate-300">
          {isAiThinking
            ? "Analyzing speech query with AI..."
            : isListening
            ? "Listening... Speak your prompt clearly!"
            : isSpeaking
            ? "Speaking audio response..."
            : "Click the central orb to talk hands-free"}
        </span>
      </div>

      <Card className="rounded-3xl border-slate-800 bg-slate-900/60 p-5 text-left space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Voice Conversation Log
          </label>
          {talkTranscript && (
            <button onClick={() => setTalkTranscript("")} className="text-xs text-rose-400 hover:underline">
              Clear Log
            </button>
          )}
        </div>
        <Textarea
          value={talkTranscript}
          onChange={(e) => setTalkTranscript(e.target.value)}
          placeholder="Speech transcript and AI spoken responses will appear here..."
          className="bg-slate-950 border-slate-800 text-xs sm:text-sm min-h-[100px] rounded-2xl"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-200 border-0 focus:ring-0"
            >
              <option value="en-US">English (US)</option>
              <option value="es-ES">Spanish (Español)</option>
              <option value="fr-FR">French (Français)</option>
              <option value="de-DE">German (Deutsch)</option>
              <option value="ja-JP">Japanese (日本語)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <FastForward className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] text-slate-400">Speed: {speechRate}x</span>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <Button
            onClick={() => handleSpeakText(talkTranscript)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-9 px-4 flex items-center justify-center gap-1.5"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isSpeaking ? "Stop Speech" : "Replay Speech"}
          </Button>
        </div>
      </Card>
    </div>
  );
}