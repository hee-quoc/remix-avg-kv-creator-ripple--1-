/**
 * Real Web Audio API analyzer for Sound Reactivity in AVG KV Creator - Ripple.
 * Provides real-time FFT frequency and RMS volume analysis.
 * Supports:
 * 1. Live Microphone Input (via getUserMedia)
 * 2. Real Web Audio Synthesizer Beat Generator (built-in 120BPM electronic kick & bass pulse)
 * 3. User Audio File Upload (mp3, wav, etc.)
 */

export interface AudioAnalysisResult {
  rmsVolume: number; // 0.0 to 1.0
  bass: number; // 0.0 to 1.0 (low frequencies ~20-250Hz)
  mid: number; // 0.0 to 1.0 (mid frequencies ~250-2000Hz)
  treble: number; // 0.0 to 1.0 (high frequencies ~2000-16000Hz)
  peak: number; // 0.0 to 1.0
  isActive: boolean;
  sourceType: 'none' | 'mic' | 'synth' | 'file';
}

class AudioAnalyzerManager {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private fileAudio: HTMLAudioElement | null = null;
  private fileSource: MediaElementAudioSourceNode | null = null;
  private synthInterval: number | null = null;
  private synthGain: GainNode | null = null;
  private dataArray: Uint8Array | null = null;
  private currentSource: 'none' | 'mic' | 'synth' | 'file' = 'none';
  private cachedResult: AudioAnalysisResult = {
    rmsVolume: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    peak: 0,
    isActive: false,
    sourceType: 'none'
  };

  private initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public async startMicrophone(): Promise<boolean> {
    try {
      this.stop();
      const ctx = this.initContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      this.micSource = ctx.createMediaStreamSource(stream);
      if (this.analyser) {
        this.micSource.connect(this.analyser);
      }
      this.currentSource = 'mic';
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      return false;
    }
  }

  /**
   * Generates a real 120 BPM rhythmic electronic pulse through Web Audio API oscillator nodes
   */
  public startSyntheticBeat(bpm: number = 124): boolean {
    try {
      this.stop();
      const ctx = this.initContext();
      if (!this.analyser) return false;

      this.synthGain = ctx.createGain();
      this.synthGain.gain.setValueAtTime(0.3, ctx.currentTime);
      // Connect to analyser (and muted to destination so it doesn't blast ears, or gentle sound)
      this.synthGain.connect(this.analyser);
      // We can also route low-volume audio to speakers so user hears the rhythm
      const speakerGain = ctx.createGain();
      speakerGain.gain.setValueAtTime(0.08, ctx.currentTime);
      this.synthGain.connect(speakerGain);
      speakerGain.connect(ctx.destination);

      let step = 0;
      const intervalMs = (60 / bpm) * 1000 / 2; // 8th notes

      this.synthInterval = window.setInterval(() => {
        if (!this.audioCtx || this.currentSource !== 'synth') return;
        const now = this.audioCtx.currentTime;

        // Kick drum on beats 0, 4 (quarter notes)
        if (step % 4 === 0) {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

          gain.gain.setValueAtTime(1.0, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

          osc.connect(gain);
          if (this.synthGain) gain.connect(this.synthGain);

          osc.start(now);
          osc.stop(now + 0.23);
        }

        // Bass synths on odd 8th notes
        if (step % 2 === 1) {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          const notes = [65.41, 73.42, 82.41, 98.0]; // C2, D2, E2, G2
          const freq = notes[(Math.floor(step / 2)) % notes.length];
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.45, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

          osc.connect(gain);
          if (this.synthGain) gain.connect(this.synthGain);

          osc.start(now);
          osc.stop(now + 0.2);
        }

        // Hi-hat tick every 8th note
        const noiseOsc = this.audioCtx.createOscillator();
        const noiseGain = this.audioCtx.createGain();
        noiseOsc.type = 'triangle';
        noiseOsc.frequency.setValueAtTime(step % 4 === 2 ? 6000 : 9000, now);
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noiseOsc.connect(noiseGain);
        if (this.synthGain) noiseGain.connect(this.synthGain);

        noiseOsc.start(now);
        noiseOsc.stop(now + 0.06);

        step = (step + 1) % 16;
      }, intervalMs);

      this.currentSource = 'synth';
      return true;
    } catch (err) {
      console.warn('Failed to start synth beat:', err);
      return false;
    }
  }

  public startAudioFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.stop();
        const ctx = this.initContext();
        if (!this.analyser) return resolve(false);

        const url = URL.createObjectURL(file);
        const audio = new Audio(url);
        audio.loop = true;
        audio.crossOrigin = 'anonymous';

        this.fileAudio = audio;
        this.fileSource = ctx.createMediaElementSource(audio);
        this.fileSource.connect(this.analyser);
        this.fileSource.connect(ctx.destination);

        audio.play().then(() => {
          this.currentSource = 'file';
          resolve(true);
        }).catch((err) => {
          console.warn('Audio playback error:', err);
          resolve(false);
        });
      } catch (err) {
        console.warn('Audio file error:', err);
        resolve(false);
      }
    });
  }

  public stop() {
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {}
      this.micSource = null;
    }
    if (this.fileAudio) {
      this.fileAudio.pause();
      this.fileAudio.src = '';
      this.fileAudio = null;
    }
    if (this.fileSource) {
      try {
        this.fileSource.disconnect();
      } catch {}
      this.fileSource = null;
    }
    this.currentSource = 'none';
  }

  public analyze(): AudioAnalysisResult {
    if (!this.analyser || !this.dataArray || this.currentSource === 'none') {
      this.cachedResult.rmsVolume = 0;
      this.cachedResult.bass = 0;
      this.cachedResult.mid = 0;
      this.cachedResult.treble = 0;
      this.cachedResult.peak = 0;
      this.cachedResult.isActive = false;
      this.cachedResult.sourceType = 'none';
      return this.cachedResult;
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    const binCount = this.dataArray.length;

    let sum = 0;
    let peak = 0;
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;

    const bassEnd = Math.floor(binCount * 0.15);
    const midEnd = Math.floor(binCount * 0.55);

    for (let i = 0; i < binCount; i++) {
      const val = this.dataArray[i] / 255;
      sum += val * val;
      if (val > peak) peak = val;

      if (i <= bassEnd) {
        bassSum += val;
      } else if (i <= midEnd) {
        midSum += val;
      } else {
        trebleSum += val;
      }
    }

    const rms = Math.sqrt(sum / binCount);
    const bass = bassSum / Math.max(1, bassEnd + 1);
    const mid = midSum / Math.max(1, midEnd - bassEnd);
    const treble = trebleSum / Math.max(1, binCount - midEnd);

    this.cachedResult.rmsVolume = Math.min(1, rms * 1.5);
    this.cachedResult.bass = Math.min(1, bass * 1.8);
    this.cachedResult.mid = Math.min(1, mid * 1.6);
    this.cachedResult.treble = Math.min(1, treble * 2.0);
    this.cachedResult.peak = Math.min(1, peak);
    this.cachedResult.isActive = true;
    this.cachedResult.sourceType = this.currentSource;

    return this.cachedResult;
  }

  public getAnalysis(): AudioAnalysisResult {
    return this.analyze();
  }

  public startTestOscillator(bpm?: number): boolean {
    return this.startSyntheticBeat(bpm);
  }

  public getSource(): 'none' | 'mic' | 'synth' | 'file' {
    return this.currentSource;
  }
}

export const audioAnalyzer = new AudioAnalyzerManager();
export const audioAnalyzerInstance = audioAnalyzer;
