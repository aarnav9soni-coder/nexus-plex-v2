import React, { useRef, useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, X, AlertCircle, SwitchCamera } from "lucide-react";
import { requestCameraAccess, stopMediaStream } from "@/utils/permissionsManager";
import { ProcessedFile } from "@/utils/fileHandler";
import { showError, showSuccess } from "@/utils/toast";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: ProcessedFile) => void;
}

export function CameraCaptureModal({ isOpen, onClose, onPhotoCaptured }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (facing: "user" | "environment") => {
    setIsInitializing(true);
    setErrorMsg(null);
    try {
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
        streamRef.current = null;
        setStream(null);
      }
      const newStream = await requestCameraAccess(facing);
      streamRef.current = newStream;
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error("Camera capture error:", err);
      setErrorMsg(err.message || "Could not access device camera");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      startCamera(facingMode);
    } else {
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
        streamRef.current = null;
        setStream(null);
      }
    }
    return () => {
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode, startCamera]);

  const handleToggleCamera = () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror image if front camera
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);
  };

  const handleConfirmPhoto = () => {
    if (!capturedDataUrl) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const photoFile: ProcessedFile = {
      name: `camera-capture-${timestamp}.jpg`,
      type: "image/jpeg",
      size: Math.round((capturedDataUrl.length * 3) / 4),
      content: capturedDataUrl,
      mimeType: "image/jpeg",
    };

    onPhotoCaptured(photoFile);
    showSuccess("Photo captured and attached to prompt");
    onClose();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    if (videoRef.current && stream) {
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-slate-950 border-slate-800 text-slate-100 rounded-2xl p-5 shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-indigo-300">
            <Camera className="w-5 h-5 text-indigo-400" />
            Camera Snapshot
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Capture a photo to analyze with Nexus Plex AI Vision.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-3 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center">
          {errorMsg ? (
            <div className="p-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="text-xs text-rose-200 font-medium">{errorMsg}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => startCamera(facingMode)}
                className="mt-2 border-slate-700 hover:bg-slate-800 text-xs text-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Camera
              </Button>
            </div>
          ) : capturedDataUrl ? (
            <img src={capturedDataUrl} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
            />
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Flip camera toggle button */}
          {!capturedDataUrl && !errorMsg && (
            <button
              type="button"
              onClick={handleToggleCamera}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-md transition-all"
              title="Switch Camera (Front/Rear)"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-2 border-t border-slate-800/80">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </Button>

          {capturedDataUrl ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retake
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPhoto}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Attach Photo
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              disabled={!!errorMsg || isInitializing}
              onClick={handleTakeSnapshot}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Photo</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
