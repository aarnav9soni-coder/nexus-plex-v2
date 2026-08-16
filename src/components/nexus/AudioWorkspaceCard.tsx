import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Pause, Play, Download } from "lucide-react";

interface AudioWorkspaceCardProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  duration: number;
  onDownload: () => void;
}

export function AudioWorkspaceCard({
  isPlaying,
  onPlayPause,
  bpm,
  onBpmChange,
  duration,
  onDownload,
}: AudioWorkspaceCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Initialize audio context on first play
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const startSynth = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = bpm / 5; // simple mapping: frequency = BPM / 5
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    oscillatorRef.current = osc;
    gainNodeRef.current = gain;
  };

  const stopSynth = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
      gainNodeRef.current = null;
    }
  };

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#6366f1";
    ctx.fillRect(0, height - 5, width, 5); // baseline

    const sliceWidth = (width * 1) / dataArrayRef.current.length;
    let x = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const v = dataArrayRef.current[i] / 128;
      const y = v * height / 2;
      ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.stroke();
  };

  useEffect(() => {
    if (isPlaying && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      // Connect oscillator to analyser for visualization
      if (oscillatorRef.current) {
        oscillatorRef.current.connect(analyser);
        analyser.connect(ctx.destination);
        const animationId = requestAnimationFrame(() => {
          drawVisualizer();
          if (isPlaying) {
            requestAnimationFrame(() => drawVisualizer());
          }
        });
        return () => cancelAnimationFrame(animationId);
      }
    }
  }, [isPlaying]);

  return (
    <Card className="rounded-2xl border-slate-800 bg-slate-900/60 p-4 shadow-xl">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Audio Workspace</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onPlayPause}
            className="flex items-center gap-1"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="text-[10px] text-slate-400">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="text-[10px] text-slate-400">Play</span>
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">BPM:</span>
          <Input
            type="range"
            min="80"
            max="140"
            step="1"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value, 10))}
            className="w-20 h-6 rounded-lg bg-slate-800 border border-slate-800 text-slate-300"
          />
          <span className="text-[10px] text-slate-400">{bpm}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">Duration:</span>
          <span className="text-[10px] text-slate-300">{duration}s</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDownload}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] text-slate-400">Download WAV</span>
          </Button>
        </div>

        <div className="relative h-48 bg-slate-950 rounded-xl overflow-hidden">
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="w-full h-full"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
              <span className="text-[10px] text-cyan-400">Visualizing audio...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}