/**
 * Music Generation Engine - Nexus Plex
 * Pure prompt-driven audio synthesizer.
 * Automatically translates user prompt into procedural music tracks.
 */

import { AudioOptions, AudioGenerationResult, deriveSynthParamsFromPrompt } from "./audioGeneration";

export interface MusicEngineParams extends AudioOptions {
  seed?: number;
}

/**
 * Derives musical parameters directly from natural language prompt
 */
export function enrichMusicPrompt(prompt: string, seed?: number): {
  enrichedPrompt: string;
  dynamicSeed: number;
} {
  const dynamicSeed = seed || Math.floor(Math.random() * 1000000) + Date.now();
  const enrichedPrompt = (prompt || "Calm ambient soundscape").trim();
  return { enrichedPrompt, dynamicSeed };
}

/**
 * Synthesizes a unique audio track from prompt using WebAudio API + procedural WAV generation
 */
export async function generateMusicTrack(
  prompt: string,
  options?: MusicEngineParams
): Promise<AudioGenerationResult> {
  const { enrichedPrompt, dynamicSeed } = enrichMusicPrompt(prompt, options?.seed);

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioCtx();

  const synthParams = deriveSynthParamsFromPrompt(enrichedPrompt, {
    seed: dynamicSeed,
  });

  const duration = 12; // 12-second track
  const sampleRate = audioContext.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioContext.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    generateProceduralAudioData(data, sampleRate, synthParams, channel, dynamicSeed);
  }

  const wavBlob = bufferToWavBlob(buffer);
  const blobUrl = URL.createObjectURL(wavBlob);
  const cacheBustedUrl = `${blobUrl}?t=${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    url: cacheBustedUrl,
    prompt: enrichedPrompt,
    model: "Nexus Music Engine",
    bpm: synthParams.bpm,
    mood: synthParams.mood,
  };
}

function generateProceduralAudioData(
  data: Float32Array,
  sampleRate: number,
  params: any,
  channel: number,
  seed: number
) {
  const bpm = params.bpm || 110;
  const beatInterval = (60 / bpm) * sampleRate;
  const noteDurationSeconds = 60 / (bpm * 2);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const beatPhase = (i % beatInterval) / beatInterval;

    const step = Math.floor(t / noteDurationSeconds) % params.notes.length;
    const freq = params.notes[step];

    const chordIdx = Math.floor(t / 2) % params.chords.length;
    const chord = params.chords[chordIdx];

    let sample = 0;

    // Lead synth note with envelope
    const notePhase = (t % noteDurationSeconds) / noteDurationSeconds;
    const noteEnv = Math.exp(-notePhase * 4.0);
    const detuneShift = 1 + ((seed % 10) - 5) * 0.0005;

    sample += Math.sin(2 * Math.PI * freq * t) * 0.22 * noteEnv;
    sample += Math.sin(2 * Math.PI * (freq * detuneShift) * t) * 0.16 * noteEnv;

    // Sub-Bass
    const bassFreq = chord[0] / 2;
    sample += Math.sin(2 * Math.PI * bassFreq * t) * 0.2;

    // Harmonic Chord Pad
    const chordPad =
      (Math.sin(2 * Math.PI * chord[0] * t) +
        Math.sin(2 * Math.PI * chord[1] * t) +
        Math.sin(2 * Math.PI * chord[2] * t)) /
      3;
    const padEnv = Math.sin(2 * Math.PI * 0.25 * t) * 0.25 + 0.55;
    sample += chordPad * 0.12 * padEnv;

    // Kick / Pulse
    if (beatPhase < 0.025) {
      const kickEnv = 1 - beatPhase / 0.025;
      sample += Math.sin(2 * Math.PI * (55 - beatPhase * 900) * t) * 0.3 * kickEnv;
    }

    // Spatial panning
    if (channel === 1) {
      sample *= 0.85 + Math.sin(t * 2.0 + (seed % 10)) * 0.15;
    } else {
      sample *= 0.85 - Math.sin(t * 2.0 + (seed % 10)) * 0.15;
    }

    // Attack / Release bounds
    const attack = sampleRate * 0.05;
    const release = sampleRate * 1.2;
    if (i < attack) sample *= i / attack;
    else if (i > data.length - release) sample *= (data.length - i) / release;

    data[i] = Math.max(-1, Math.min(1, sample));
  }
}

function bufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);

  const writeString = (v: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      v.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(view, 0, "RIFF");
  view.setUint32(4, length - 8, true);
  writeString(view, 8, "WAVE");

  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
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
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

export default {
  generateMusicTrack,
  enrichMusicPrompt,
};
