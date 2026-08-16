import { showError } from "@/utils/toast";

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export class VoiceRecognition {
  private recognition: any = null;
  private activeStream: MediaStream | null = null;
  private onResult: ((result: VoiceRecognitionResult) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onEnd: (() => void) | null = null;
  private isListening = false;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";
        
        this.recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";
          let maxConfidence = 0;
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            const confidence = result[0].confidence || 0;
            maxConfidence = Math.max(maxConfidence, confidence);
            
            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (this.onResult) {
            this.onResult({
              transcript: finalTranscript || interimTranscript,
              confidence: maxConfidence,
              isFinal: !!finalTranscript,
            });
          }
        };
        
        this.recognition.onerror = (event: any) => {
          if (this.onError) {
            this.onError(event.error);
          }
        };
        
        this.recognition.onend = () => {
          this.stopAudioTracks();
          this.isListening = false;
          if (this.onEnd) {
            this.onEnd();
          }
        };
      }
    }
  }

  private stopAudioTracks() {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      this.activeStream = null;
    }
  }

  async start(): Promise<void> {
    if (!this.recognition) {
      const msg = "Speech Recognition not supported in this browser";
      showError(msg);
      throw new Error(msg);
    }
    
    if (this.isListening) {
      return;
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        this.activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : String(err);
      let userFriendlyErr = "Microphone access denied or unavailable.";

      if (errorStr.includes("NotAllowedError") || errorStr.includes("Permission denied")) {
        userFriendlyErr = "Microphone permission denied. Please allow microphone access in browser settings.";
      } else if (errorStr.includes("NotFoundError") || errorStr.includes("DevicesNotFoundError")) {
        userFriendlyErr = "No microphone device found on your system.";
      }

      showError(userFriendlyErr);
      throw new Error(userFriendlyErr);
    }

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      this.stopAudioTracks();
      throw error;
    }
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch {}
      this.isListening = false;
    }
    this.stopAudioTracks();
  }

  setOnResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.onResult = callback;
  }

  setOnError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  setOnEnd(callback: () => void): void {
    this.onEnd = callback;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }
}
