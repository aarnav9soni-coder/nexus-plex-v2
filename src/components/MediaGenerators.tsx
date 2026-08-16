import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Video,
  Music,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  Disc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { MediaCard } from "./MediaCard";

/* -------------------------------------------------------------------------- */
/*                                VIDEO PLAYER CARD                            */
/* -------------------------------------------------------------------------- */

export interface VideoMediaProps {
  prompt: string;
  videoUrl?: string;
  url?: string;
  animatedUrl?: string;
  seed?: number;
  aspectRatio?: string;
  durationSeconds?: number;
  motion?: string;
  fps?: number;
  model?: string;
  status?: "completed" | "processing" | "failed";
  progress?: number;
  stage?: string;
}

export const VideoPlayerCard: React.FC<VideoMediaProps> = (props) => {
  return (
    <MediaCard
      prompt={props.prompt}
      videoUrl={props.videoUrl || props.url}
      animatedUrl={props.animatedUrl}
      seed={props.seed}
      aspectRatio={props.aspectRatio || "16:9"}
      durationSeconds={props.durationSeconds || 15}
      motion={props.motion || "high"}
      fps={props.fps || 60}
      model={props.model || "Nexus Sora 2.0 / Kling HD Motion Engine"}
      status={props.status || "completed"}
      progress={props.progress || 100}
      stage={props.stage}
    />
  );
};

export const DeprecatedVideoPlayerCard: React.FC<VideoMediaProps> = (props) => {
  return <VideoPlayerCard {...props} />;
};

/* -------------------------------------------------------------------------- */
/*                                AUDIO PLAYER CARD                            */
/* -------------------------------------------------------------------------- */

export interface AudioMediaProps {
  prompt: string;
  audioUrl?: string;
  genre?: string;
  bpm?: number;
}

export const AudioPlayerCard: React.FC<AudioMediaProps> = ({
  prompt,
  audioUrl = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=synthwave-80s-110045.mp3",
  genre = "Synthwave / Cyberpunk",
  bpm = 124,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Simple Web Audio API Synthesizer fallback
  const toggleSynthMusic = () => {
    if (isSynthPlaying) {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      setIsSynthPlaying(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime); // A3 note

        // Arpeggiator effect
        const notes = [220, 277.18, 329.63, 440, 329.63, 277.18];
        let noteIdx = 0;
        const interval = setInterval(() => {
          if (osc && ctx) {
            osc.frequency.setValueAtTime(notes[noteIdx % notes.length], ctx.currentTime);
            noteIdx++;
          } else {
            clearInterval(interval);
          }
        }, 150);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscillatorRef.current = osc;
        setIsSynthPlaying(true);
      } catch (err) {
        console.error("Web Audio error:", err);
      }
    }
  };

  // Canvas Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const bars = 32;
      const barWidth = width / bars - 2;

      for (let i = 0; i < bars; i++) {
        const h = isSynthPlaying || isPlaying
          ? Math.sin(step * 0.1 + i * 0.3) * (height / 2 - 4) + height / 2
          : 8 + Math.sin(i * 0.5) * 4;

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#06B6D4");
        gradient.addColorStop(1, "#8B5CF6");

        ctx.fillStyle = gradient;
        ctx.fillRect(i * (barWidth + 2), height - h, barWidth, h);
      }

      step += 1;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isSynthPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="my-4 rounded-2xl bg-[#111622] border border-[#1E2638] overflow-hidden shadow-2xl p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#06B6D4] to-[#8B5CF6] flex items-center justify-center shadow-md">
            <Music className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-white">AI Music & Soundscape Player</h4>
            <span className="text-[10px] text-[#06B6D4] font-medium">
              {genre} • {bpm} BPM
            </span>
          </div>
        </div>

        <Disc className={`w-5 h-5 text-[#8B5CF6] ${isSynthPlaying || isPlaying ? "animate-spin" : ""}`} />
      </div>

      {/* Waveform Visualizer Canvas */}
      <div className="p-3 bg-[#080B11] rounded-xl border border-[#1E2638] flex items-center justify-center">
        <canvas ref={canvasRef} width={300} height={48} className="w-full h-12" />
      </div>

      {/* HTML5 Audio Player */}
      <div className="bg-[#080B11] p-2 rounded-xl border border-[#1E2638]">
        <audio
          ref={audioRef}
          controls
          autoPlay
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-10 rounded-lg filter invert"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          onClick={toggleSynthMusic}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
            isSynthPlaying
              ? "bg-rose-500 hover:bg-rose-600 text-white"
              : "bg-[#06B6D4] hover:bg-[#0891B2] text-slate-950 shadow-md shadow-[#06B6D4]/20"
          }`}
        >
          {isSynthPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 mr-1.5" /> Stop WebSynth
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 mr-1.5" /> WebSynth Mode
            </>
          )}
        </Button>

        <span className="text-xs text-[#E2E8F0]/70 italic truncate max-w-[200px]">
          "{prompt}"
        </span>
      </div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                IMAGE ART CARD                               */
/* -------------------------------------------------------------------------- */

import { ImageGeneratorCard } from "@/components/ImageGeneratorCard";

export { ImageGeneratorCard };

export interface ImageMediaProps {
  prompt: string;
  imageUrl: string;
  model?: string;
  userEmail?: string;
}

export const ImageArtCard: React.FC<ImageMediaProps> = (props) => {
  return <ImageGeneratorCard {...props} />;
};
