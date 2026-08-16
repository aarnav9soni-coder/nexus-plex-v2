import React, { useState } from "react";
import { Sparkles, Wand2, RefreshCw, Download, Loader2, SlidersHorizontal, Repeat, Maximize2, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { showSuccess, showError } from "@/utils/toast";
import { GeneratedImage } from "@/types/nexus";
import { ImageGeneratorCard } from "@/components/ImageGeneratorCard";

export function VisionTab() {
  const [imagePrompt, setImagePrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted, extra limbs, grain");
  const [imageModel, setImageModel] = useState("flux");
  const [imageRatio, setImageRatio] = useState("16:9");
  const [customSeed, setCustomSeed] = useState<number | "">("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedLightboxImg, setSelectedLightboxImg] = useState<GeneratedImage | null>(null);

  const handleGenerateImage = (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToUse = customPrompt || imagePrompt;

    if (!promptToUse.trim()) {
      showError("Please enter a prompt to generate an image");
      return;
    }

    setIsGeneratingImage(true);

    let width = 1280;
    let height = 720;
    if (imageRatio === "1:1") {
      width = 1024;
      height = 1024;
    } else if (imageRatio === "9:16") {
      width = 720;
      height = 1280;
    }

    const seed = typeof customSeed === "number" ? customSeed : Math.floor(Math.random() * 1000000);
    const fullPrompt = negativePrompt.trim()
      ? `${promptToUse.trim()} --no ${negativePrompt.trim()}`
      : promptToUse.trim();

    const encodedPrompt = encodeURIComponent(fullPrompt);
    const imageUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${imageModel}&nologo=true`;

    const newImg: GeneratedImage = {
      id: Date.now().toString(),
      prompt: promptToUse,
      url: imageUrl,
      model: imageModel,
      ratio: imageRatio,
      seed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      loading: true,
    };

    setGeneratedImages((prev) => [newImg, ...prev]);
    setIsGeneratingImage(false);
    showSuccess("Image synthesis started!");
  };

  const enhanceImagePrompt = () => {
    if (!imagePrompt.trim()) {
      setImagePrompt("A glowing neon cyberpunk city in rain, hyperrealistic, cinematic lighting, 8k resolution, octane render");
    } else {
      setImagePrompt(`${imagePrompt.trim()}, highly detailed, cinematic lighting, 8k resolution, photorealistic masterpiece`);
    }
    showSuccess("Prompt enhanced!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="rounded-3xl border-slate-800 bg-slate-900/60 p-6 shadow-xl space-y-4">
        <form onSubmit={(e) => handleGenerateImage(e)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Visual Prompt Description
              </label>
              <button
                type="button"
                onClick={enhanceImagePrompt}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" /> Magic Enhancer
              </button>
            </div>
            <Textarea
              placeholder="A futuristic cyberpunk neon city in rain, ultra-detailed 8k resolution..."
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="rounded-2xl border-slate-800 bg-slate-950 text-xs sm:text-sm h-20 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3 text-rose-400" /> Negative Prompt:
              </label>
              <Input
                placeholder="blurry, bad anatomy, lowres..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="rounded-xl border-slate-800 bg-slate-950 text-xs h-8 text-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Custom Seed (Optional):</label>
              <Input
                type="number"
                placeholder="Random seed..."
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value ? parseInt(e.target.value, 10) : "")}
                className="rounded-xl border-slate-800 bg-slate-950 text-xs h-8 text-slate-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[11px] text-slate-400 font-bold shrink-0">Preset Styles:</span>
            {["Cyberpunk", "Photorealistic", "Synthwave 80s", "3D Render", "Anime"].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setImagePrompt((prev) => `${prev} ${style} style, highly detailed`)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium shrink-0"
              >
                + {style}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Artistic Model</label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-950 text-xs px-3 text-slate-200"
              >
                <option value="flux">Flux Schnell (Fast)</option>
                <option value="flux-realism">Flux Realism (Photorealistic)</option>
                <option value="flux-anime">Flux Anime</option>
                <option value="flux-3d">Flux 3D Render</option>
                <option value="turbo">Turbo Speed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Aspect Ratio</label>
              <select
                value={imageRatio}
                onChange={(e) => setImageRatio(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-950 text-xs px-3 text-slate-200"
              >
                <option value="16:9">16:9 Widescreen</option>
                <option value="1:1">1:1 Square</option>
                <option value="9:16">9:16 Portrait</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="w-full h-10 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {isGeneratingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Synthesize Image
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Generated Gallery</h3>
        {generatedImages.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl text-slate-500 text-xs">
            No images generated yet. Type a prompt above to generate visuals!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedImages.map((img) => (
              <ImageGeneratorCard
                key={img.id}
                prompt={img.prompt}
                imageUrl={img.url}
                model={`${img.model} (${img.ratio})`}
                onRetry={() => handleGenerateImage(undefined, img.prompt)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedLightboxImg} onOpenChange={() => setSelectedLightboxImg(null)}>
        <DialogContent className="max-w-4xl w-[90vw] bg-slate-950 border-slate-800 p-0 overflow-hidden text-slate-100 rounded-3xl">
          {selectedLightboxImg && (
            <div className="flex flex-col">
              <div className="relative bg-black flex items-center justify-center max-h-[70vh] overflow-hidden">
                <img src={selectedLightboxImg.url} alt={selectedLightboxImg.prompt} className="max-h-[70vh] object-contain" />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedLightboxImg(null)}
                  className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/80 rounded-full h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">Prompt Detail</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLightboxImg.prompt);
                      showSuccess("Prompt copied!");
                    }}
                    className="h-7 text-xs text-slate-300"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" /> Copy Prompt
                  </Button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {selectedLightboxImg.prompt}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}