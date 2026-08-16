"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, Volume2, VolumeX, Waves, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";

interface GeneratedAudioProps {
  url: string;
  prompt: string;
  model: string;
  messageId: string;
}

export function GeneratedAudio({ url, prompt, model, messageId }: GeneratedAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    audioRef.current = new Audio(url);
    audioRef.current.volume = volume;
    
    audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    audioRef.current.addEventListener("error", () => showSuccess("Audio playback error"));
    
    // Setup visualizer
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audioRef.current);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyserRef.current = analyser;
    
    return () => {
      audioRef.current?.pause();
      cancelAnimationFrame(animFrameRef.current);
      audioContext.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const drawVisualizer = () => {
    if (!isPlaying || !analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, width, height);
    
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    
    // Waveform bars
    const barCount = dataArray.length;
    const barWidth = width / barCount;
    let x = 0;
    
    for (let i = 0; i < barCount; i++) {
      const v = dataArray[i] / 128.0;
      const barHeight = v * height * 0.8;
      const hue = (i / barCount) * 270 + 200;
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }
    
    animFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      drawVisualizer();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `nexusflow-generated-audio-${messageId}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      setDownloadSuccess(true);
      showSuccess("Audio downloaded!");
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (error) {
      window.open(url, "_blank");
      showSuccess("Opened in new tab");
    }
  };

  const handleRegenerate = () => {
    window.dispatchEvent(new CustomEvent("nexus-regenerate-audio", { 
      detail: { prompt, messageId } 
    }));
  };

  return (
    <div className="relative group rounded-2xl border border-slate-700/50 overflow-hidden bg-slate-950/50 shadow-xl">
      {/* Waveform Visualizer */}
      <div className="relative h-40 bg-slate-900/50">
        <canvas
          ref={canvasRef}
          width={640}
          height={160}
          className="w-full h-full"
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
            <Button
              size="icon"
              variant="default"
              className="h-12 w-12 rounded-full bg-indigo-600/80 hover:bg-indigo-500/90 text-white shadow-xl"
              onClick={togglePlay}
            >
              <Waves className="w-5 h-5" />
            </Button>
          </div>
        )}
        
        {/* Overlay Controls */}
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl bg-black/60 backdrop-blur-sm text-white hover:bg-black/80"
            onClick={handleDownload}
            disabled={downloadSuccess}
            title="Download Audio"
          >
            {downloadSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl bg-black/60 backdrop-blur-sm text-white hover:bg-black/80"
            onClick={handleRegenerate}
            title="Regenerate Variation"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Controls Bar */}
      <div className="p-3 border-t border-slate-800/50 bg-slate-900/50 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-300 font-mono truncate max-w-[200px]">{prompt}</p>
          <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-800 font-mono">{model}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Waves className="w-4 h-4" />}
          </Button>
          
          <button
            onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}