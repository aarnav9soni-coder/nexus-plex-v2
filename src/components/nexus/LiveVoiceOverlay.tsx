"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LiveVoiceOverlay({ isActive, onStop }: { isActive: boolean; onStop: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const ctx2 = canvas.getContext("2d");
      if (!ctx2) return;
      const width = canvas.width;
      const height = canvas.height;

      // Background gradient
      const grad = ctx2.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#1e1b4b");
      ctx2.fillStyle = grad;
      ctx2.fillRect(0, 0, width, height);

      // Pulse effect
      const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
      ctx2.fillStyle = `rgba(102, 58, 179, ${pulse * 0.3})`;
      ctx2.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        className="rounded-full shadow-2xl"
      />
      <div className="text-center space-y-3">
        <span className="text-[12px] text-slate-400">Listening...</span>
        <Button
          onClick={onStop}
          className="bg-slate-800 text-slate-300 rounded-xl px-4 py-2 text-xs"
        >
          Stop Listening
        </Button>
      </div>
    </div>
  );
}