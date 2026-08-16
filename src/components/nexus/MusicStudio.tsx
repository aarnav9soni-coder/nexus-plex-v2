"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Download, RefreshCw, Volume2, VolumeX, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MusicStudioProps {
  prompt: string;
}

export function MusicStudio({ prompt }: MusicStudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [volume, setVolume] = useState(0.7);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animFrameRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  const initAudio = () => {
    if (isInitializedRef.current) return;
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 220 + (tempo / 140) * 220;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    osc.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    osc.start();
    oscillatorRef.current = osc;
    gainNodeRef.current = gain;
    analyserRef.current = analyser;
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    isInitializedRef.current = true;
  };

  const startVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const draw = () => {
      if (!isPlaying) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx2 = canvas.getContext("2d");
      if (!ctx2) return;

      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!);
      const width = canvas.width;
      const height = canvas.height;

      ctx2.clearRect(0, 0, width, height);

      const bgGrad = ctx2.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(1, "#1e1b4b");
      ctx2.fillStyle = bgGrad;
      ctx2.fillRect(0, 0, width, height);

      const barCount = dataArrayRef.current!.length;
      const barWidth = width / barCount;
      let x = 0;
      for (let i = 0; i < barCount; i++) {
        const v = dataArrayRef.current![i] / 128.0;
        const barHeight = v * height * 0.8;
        const hue = (i / barCount) * 270 + 200;
        ctx2.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
        ctx2.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const stopVisualizer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      initAudio();
      startVisualizer();
    } else {
      stopVisualizer();
    }
    return () => {
      stopVisualizer();
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch (e) {}
        oscillatorRef.current = null;
      }
      isInitializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.frequency.value = 220 + (tempo / 140) * 220;
    }
  }, [tempo]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300">Audio Studio</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 text-slate-400" onClick={() => setTempo(Math.max(60, tempo - 10))}>
            −
          </Button>
          <span className="text-[10px] text-slate-400 font-mono w-8 text-center">{tempo} BPM</span>
          <Button size="sm" variant="ghost" className="h-7 text-slate-400" onClick={() => setTempo(Math.min(180, tempo + 10))}>
            +
          </Button>
        </div>
      </div>

      {/* Prompt Tag */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800">
        <span className="text-[10px] text-slate-500 font-mono">Prompt:</span>
        <span className="text-xs text-slate-300 ml-2">&quot;{prompt}&quot;</span>
      </div>

      {/* Waveform Visualizer */}
      <div className="relative h-32 bg-slate-950 overflow-hidden">
        <canvas ref={canvasRef} width={640} height={128} className="w-full h-full" />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
            <span className="text-[10px] text-slate-500">Press play to visualize audio</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-9 w-9 p-0 rounded-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-slate-400" onClick={() => { setIsPlaying(false); }}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setVolume(volume === 0 ? 0.7 : 0)} className="text-slate-400 hover:text-white">
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <Button size="sm" variant="ghost" className="h-7 text-slate-400" onClick={() => {}}>
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}