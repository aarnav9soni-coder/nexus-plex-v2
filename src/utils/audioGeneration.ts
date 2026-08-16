export interface AudioGenerationResult {
  url: string;
  prompt: string;
  model: string;
  bpm: number;
  mood: string;
}

export function hashPrompt(prompt: string): number {
  let hash = 5381;
  const str = prompt.toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

// Scale interval frequencies in Hz (across 2 octaves)
export const SCALE_FREQUENCIES: Record<string, number[]> = {
  synthwave: [110.00, 130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00], // A Minor / Synthwave
  lofi: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66], // C Major 7th / Lofi
  cyberpunk: [98.00, 103.83, 116.54, 130.81, 146.83, 155.56, 174.61, 196.00], // Dark Phrygian
  ambient: [130.81, 164.81, 196.00, 246.94, 261.63, 329.63, 392.00], // Ambient Pentatonic
  upbeat: [146.83, 164.81, 185.00, 196.00, 220.00, 246.94, 293.66], // D Major / Upbeat
};

export interface AudioSynthParams {
  seed: number;
  bpm: number;
  mood: string;
  notes: number[];
  chords: number[][];
}

export interface AudioOptions {
  seed?: number;
  genre?: string;
  tempo?: number;
}

export function deriveSynthParamsFromPrompt(prompt: string, options?: AudioOptions): AudioSynthParams {
  const dynamicSeed = options?.seed || (hashPrompt(prompt) + Date.now()) % 1000000;
  const lower = prompt.toLowerCase();

  // Extract or derive BPM
  let bpm = options?.tempo || 120;
  if (!options?.tempo) {
    const matchBpm = lower.match(/(\d+)\s*bpm/);
    if (matchBpm) {
      bpm = parseInt(matchBpm[1]);
    } else {
      bpm = 85 + (dynamicSeed % 60); // 85 to 145 BPM
    }
  }

  // Determine mood / scale
  let mood = options?.genre ? options.genre.toLowerCase() : "synthwave";
  if (!options?.genre) {
    if (lower.includes("lofi") || lower.includes("chill") || lower.includes("relax")) mood = "lofi";
    else if (lower.includes("cyber") || lower.includes("dark") || lower.includes("industrial")) mood = "cyberpunk";
    else if (lower.includes("ambient") || lower.includes("space") || lower.includes("meditation")) mood = "ambient";
    else if (lower.includes("upbeat") || lower.includes("pop") || lower.includes("dance") || lower.includes("energetic")) mood = "upbeat";
    else {
      const moods = ["synthwave", "lofi", "cyberpunk", "ambient", "upbeat"];
      mood = moods[dynamicSeed % moods.length];
    }
  }

  const scale = SCALE_FREQUENCIES[mood] || SCALE_FREQUENCIES.synthwave;

  // LCG PRNG seeded by prompt hash + dynamic seed
  let rngState = dynamicSeed;
  const nextRng = () => {
    rngState = (rngState * 1664525 + 1013904223) % 4294967296;
    return rngState / 4294967296;
  };

  const notes: number[] = [];
  for (let i = 0; i < 16; i++) {
    const idx = Math.floor(nextRng() * scale.length);
    notes.push(scale[idx]);
  }

  const chords: number[][] = [];
  for (let c = 0; c < 4; c++) {
    const rootIdx = Math.floor(nextRng() * Math.max(1, scale.length - 4));
    const root = scale[rootIdx] || 220;
    const third = scale[rootIdx + 2] || root * 1.25;
    const fifth = scale[rootIdx + 4] || root * 1.5;
    chords.push([root, third, fifth]);
  }

  return { seed: dynamicSeed, bpm, mood, notes, chords };
}

export async function generateAudio(prompt: string, options?: AudioOptions): Promise<AudioGenerationResult> {
  const dynamicSeed = options?.seed || Math.floor(Math.random() * 1000000) + Date.now();
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioCtx();
  
  const params = deriveSynthParamsFromPrompt(prompt, { ...options, seed: dynamicSeed });
  const duration = 12; // seconds
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    generatePromptAudio(data, sampleRate, params, channel);
  }
  
  const wavBlob = bufferToWav(buffer);
  const rawUrl = URL.createObjectURL(wavBlob);
  const url = `${rawUrl}?t=${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  return {
    url,
    prompt,
    model: `WebSynth Suno Engine (${params.mood.toUpperCase()} • ${params.bpm} BPM)`,
    bpm: params.bpm,
    mood: params.mood,
  };
}

function generatePromptAudio(data: Float32Array, sampleRate: number, params: AudioSynthParams, channel: number) {
  const beatInterval = (60 / params.bpm) * sampleRate;
  const noteDurationSeconds = 60 / (params.bpm * 2); // 8th note duration
  
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const beatPhase = (i % beatInterval) / beatInterval;
    
    // Determine active note from prompt-derived sequence
    const step = Math.floor(t / noteDurationSeconds) % params.notes.length;
    const freq = params.notes[step];
    
    // Determine active chord from prompt-derived progression
    const chordIdx = Math.floor(t / 2) % params.chords.length;
    const chord = params.chords[chordIdx];
    
    let sample = 0;
    
    // Main Lead Oscillator derived from prompt note
    const notePhase = (t % noteDurationSeconds) / noteDurationSeconds;
    const noteEnv = Math.exp(-notePhase * 4); // Fast decay
    sample += Math.sin(2 * Math.PI * freq * t) * 0.25 * noteEnv;
    sample += Math.sin(2 * Math.PI * (freq * 1.005) * t) * 0.15 * noteEnv; // Detune chorus
    
    // Sub-Bass Pad
    const bassFreq = chord[0] / 2;
    sample += Math.sin(2 * Math.PI * bassFreq * t) * 0.2;
    
    // Chord Pad Swell
    const chordPad = (Math.sin(2 * Math.PI * chord[0] * t) + Math.sin(2 * Math.PI * chord[1] * t) + Math.sin(2 * Math.PI * chord[2] * t)) / 3;
    const padEnv = Math.sin(2 * Math.PI * 0.25 * t) * 0.3 + 0.5;
    sample += chordPad * 0.15 * padEnv;
    
    // Beat pulse / Kick drum simulation
    if (beatPhase < 0.02) {
      const kickEnv = 1 - beatPhase / 0.02;
      sample += Math.sin(2 * Math.PI * 55 * t) * 0.4 * kickEnv;
    }
    
    // Stereo Pan
    if (channel === 1) {
      sample *= 0.85 + Math.sin(t * 2) * 0.15;
    } else {
      sample *= 0.85 - Math.sin(t * 2) * 0.15;
    }
    
    // Fade in / out envelopes
    const attack = sampleRate * 0.1;
    const release = sampleRate * 1.5;
    if (i < attack) sample *= i / attack;
    else if (i > data.length - release) sample *= (data.length - i) / release;
    
    data[i] = Math.max(-1, Math.min(1, sample));
  }
}

function bufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  
  writeString(view, 0, "RIFF");
  view.setUint32(4, length - 8, true);
  writeString(view, 8, "WAVE");
  
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  
  writeString(view, 36, "data");
  view.setUint32(40, length - 44, true);
  
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}