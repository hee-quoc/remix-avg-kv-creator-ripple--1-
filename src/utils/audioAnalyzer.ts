/**
 * Shared Audio Reactivity engine for AVG KV Creator — Ripple.
 *
 * Ported from AVG SoundText Ripple's `utils/audioAnalyzer.ts` and adapted to this app's
 * Canvas2D wave/particle architecture. One shared AudioContext + one analyser feed a single
 * `update()` call per animation frame (called from the existing KineticCanvas render loop via
 * refs, never via per-frame React state) — see docs in AUDIO_CORE_FOR_CLAUDE.md item 11.
 *
 * Supports:
 * 1. Audio file upload with full transport (play/pause/stop/restart/seek/loop/volume).
 * 2. Live microphone input.
 * 3. Built-in procedural beat synthesizer (electro / lofi / techno).
 * 4. Beat detection with adaptive threshold + ripple sequence spawning.
 * 5. A continuously rolling 256-sample volume-history buffer for the travelling Music Ripple.
 * 6. A Second Wave phase accumulator that only advances while audio is actually active.
 */
import { AudioConfig, AudioAnalysisData, BeatRippleWave, SynthStyle } from '../types';

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  enabled: false,
  sensitivity: 1.0,
  smoothing: 0.8,
  beatDetectionEnabled: true,
  beatSensitivity: 1.2,
  beatThreshold: 0.4,
  minBeatInterval: 180,
  beatBoost: 0.8,
  beatDecay: 0.92,
  bassSensitivity: 1.2,
  midSensitivity: 1.0,
  highSensitivity: 1.0,
  beatRippleEnabled: true,
  beatRippleStrength: 1.2,
  beatRippleSpeed: 6.0,
  beatRippleWidth: 40.0,
  beatRippleDecay: 0.94,
  beatRippleSize: 1.2,
  beatRippleSequenceMode: 'cascade',
  cascadeCount: 3,
  cascadeDelayMs: 60,
  audioMusicRippleEnabled: true,
  audioRippleSpeed: 5.0,
  audioRippleStrength: 1.5,
  audioRippleWavelength: 600,
  audioRippleHarmonics: 1,
  audioRippleBand: 'overall',
  secondWaveSpeed: 1.0,
  secondWaveFrequency: 1.0,
  secondWaveBaseThickness: 1.0,
  secondWaveThicknessInfluence: 0.7,
  secondWaveMovementStrength: 0.7,
  secondWaveBeatSensitivity: 1.0,
  audioColorShift: false,
  audioColorShiftMode: 'accent_glow',
  audioBeatGlow: true,
  loopAudio: true,
  synthStyle: 'electro',
  synthBpm: 120,
  mappings: [
    { source: 'bass', target: 'waveThickness', amount: 0.6 },
    { source: 'beatPulse', target: 'waveAmplitude', amount: 0.4 }
  ],
  vocalReactivity: {
    mode: 'off',
    sensitivity: 1.3,
    freqLow: 150,
    freqHigh: 4000,
    attack: 0.65,
    release: 0.25,
    influence: 0.6,
    adaptiveNormalization: true,
    confidenceThresholdOn: 0.5,
    confidenceThresholdOff: 0.32,
    minVocalDuration: 0.12,
    detectionSmoothing: 0.35
  }
};

const EMPTY_UINT8 = new Uint8Array(0);

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Harmonicity / periodicity "clarity" via a short-lag normalized autocorrelation over the vocal
 * fundamental range (~150-800Hz). This is a classic pitch-detection building block (same family as
 * YIN's periodicity measure), used here only as one of three supporting features — NOT as a vocal
 * identifier on its own, since clean synth/guitar/piano tones are often MORE periodic than a voice.
 * It only gates out non-tonal noise/silence (see tonalGate in updateInternal). Lag/inner loops are
 * strided by 2 to keep this cheap enough to run once per animation frame alongside 2D dot rendering.
 */
function computeHarmonicity(timeData: Uint8Array, sampleRate: number): number {
  const n = timeData.length;
  const minLag = Math.max(2, Math.floor(sampleRate / 800));
  const maxLag = Math.min(n - 2, Math.floor(sampleRate / 150));
  if (maxLag <= minLag) return 0;

  const sig = new Float32Array(n);
  let energy0 = 0;
  for (let i = 0; i < n; i++) {
    const v = (timeData[i] - 128) / 128;
    sig[i] = v;
    energy0 += v * v;
  }
  if (energy0 < 1e-4) return 0;

  let bestCorr = 0;
  for (let lag = minLag; lag <= maxLag; lag += 2) {
    let corr = 0;
    const limit = n - lag;
    for (let i = 0; i < limit; i += 2) corr += sig[i] * sig[i + lag];
    const norm = corr / energy0;
    if (norm > bestCorr) bestCorr = norm;
  }
  return Math.max(0, Math.min(1, bestCorr));
}

/**
 * Syllabic-rate amplitude-modulation strength (~2-6Hz), a well-established DSP heuristic from
 * pre-deep-learning singing-voice-detection literature: sung/spoken phrases pulse at the syllable
 * rate, while sustained instrumental tones (pads, held guitar/piano notes/chords) don't. Scored
 * against a target of ~4Hz with a tolerance window, gated by modulation depth so a flat/silent
 * signal never scores highly just from noise.
 */
function computeSyllabicModulation(samples: { t: number; v: number }[]): number {
  if (samples.length < 8) return 0;
  let sum = 0;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const s of samples) {
    sum += s.v;
    if (s.v < minV) minV = s.v;
    if (s.v > maxV) maxV = s.v;
  }
  const mean = sum / samples.length;
  const amp = maxV - minV;
  if (amp < 0.03) return 0;

  let crossings = 0;
  let prevAbove = samples[0].v - mean >= 0;
  for (let i = 1; i < samples.length; i++) {
    const above = samples[i].v - mean >= 0;
    if (above !== prevAbove) {
      crossings++;
      prevAbove = above;
    }
  }
  const durationSec = (samples[samples.length - 1].t - samples[0].t) / 1000;
  if (durationSec <= 0) return 0;

  const rateHz = crossings / 2 / durationSec;
  const target = 4.0;
  const width = 3.0;
  const rateScore = Math.exp(-Math.pow((rateHz - target) / width, 2));
  const ampScore = Math.min(1, amp / 0.35);
  return Math.max(0, Math.min(1, rateScore * ampScore));
}

/** Fraction of total spectral energy concentrated in the core vocal-formant range (~300-3400Hz). */
function computeFormantRatio(freqData: Uint8Array, binHz: number): number {
  const lowBin = Math.max(0, Math.round(300 / binHz));
  const highBin = Math.min(freqData.length - 1, Math.round(3400 / binHz));
  let bandSum = 0;
  let total = 0;
  for (let i = 0; i < freqData.length; i++) {
    total += freqData[i];
    if (i >= lowBin && i <= highBin) bandSum += freqData[i];
  }
  if (total <= 0) return 0;
  return Math.min(1, bandSum / total);
}

class AudioAnalyzerEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private exportDestination: MediaStreamAudioDestinationNode | null = null;

  private audioElem: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private objectUrl: string | null = null;

  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;

  private freqData: Uint8Array = EMPTY_UINT8;
  private timeData: Uint8Array = EMPTY_UINT8;

  private fileName: string | null = null;
  private isLoaded: boolean = false;
  private isLooping: boolean = true;

  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedHigh = 0;
  private smoothedOverall = 0;
  private smoothedBeatIntensity = 0;

  // Vocal Reactivity — independent envelope + adaptive floor/peak tracking, isolated from beat
  // detection so singing never spawns rings (see spawnRippleSequence, which vocal never calls into).
  private smoothedVocal = 0;
  private vocalNoiseFloor = 0;
  private vocalPeak = 0.15;

  // Vocal DETECTION (separate from the energy tracking above — see VocalReactivityConfig doc
  // comment in types.ts for why energy alone is not proof of vocal presence).
  private vocalEnvSamples: { t: number; v: number }[] = []; // downsampled ring buffer for syllabic-rate modulation analysis
  private smoothedVocalConfidence = 0;
  private vocalDetected = false;
  private vocalAboveOnSince = 0; // performance.now() timestamp confidence first crossed the ON threshold, 0 = not currently above
  private smoothedVocalGate = 0; // eases 0..1 toward vocalDetected?1:0 so ripple modulation settles smoothly rather than cutting abruptly

  // 256-sample rolling volume history: index 0 = newest (center), higher index = older (outward)
  private volumeHistory: Float32Array = new Float32Array(256);

  private synthBeatTimer: number | null = null;
  private synthBeatStep = 0;
  private currentSynthStyle: SynthStyle = 'electro';
  private currentSynthBpm = 120;

  private playPromise: Promise<void> | null = null;
  private currentSource: 'file' | 'synth' | 'mic' | null = null;
  private listeners: Set<() => void> = new Set();

  private energyHistory: number[] = [];
  private historySize = 35;
  private lastBeatTime = 0;
  private beatPulse = 0;
  private nextRippleId = 1;
  private activeRipples: BeatRippleWave[] = [];

  private sequenceStep = 0;
  private secondWavePhase = 0;
  private rippleShiftAccumulator = 0;

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore listener errors
      }
    });
  }

  private initAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);

      this.audioElem = new Audio();
      this.audioElem.crossOrigin = 'anonymous';
      this.audioElem.loop = this.isLooping;

      this.audioElem.addEventListener('play', () => this.notifyListeners());
      this.audioElem.addEventListener('pause', () => this.notifyListeners());
      this.audioElem.addEventListener('ended', () => this.notifyListeners());
      this.audioElem.addEventListener('timeupdate', () => this.notifyListeners());
      this.audioElem.addEventListener('loadedmetadata', () => this.notifyListeners());

      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElem);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // ---- Microphone ----

  public async startMicrophone(): Promise<boolean> {
    this.stop();
    this.initAudioContext();
    if (!this.audioCtx || !this.analyser) return false;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micSourceNode = this.audioCtx.createMediaStreamSource(this.micStream);
      // Mic connects only to the analyser — never to masterGain/destination — to avoid feedback echo.
      this.micSourceNode.connect(this.analyser);
      this.fileName = 'Live Microphone Input';
      this.isLoaded = true;
      this.currentSource = 'mic';
      this.resetHistory();
      this.notifyListeners();
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable:', err);
      this.stopMicrophone();
      return false;
    }
  }

  public stopMicrophone() {
    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch {}
      this.micSourceNode = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.fileName === 'Live Microphone Input') {
      this.fileName = null;
      this.isLoaded = false;
      if (this.currentSource === 'mic') this.currentSource = null;
    }
    this.notifyListeners();
  }

  public isMicrophoneActive(): boolean {
    return this.micStream !== null;
  }

  // ---- File playback ----

  public async loadAudioFile(file: File): Promise<void> {
    this.stopMicrophone();
    this.stopProceduralBeat();
    this.initAudioContext();
    if (!this.audioElem) return;

    if (this.playPromise) {
      try {
        await this.playPromise;
      } catch {
        // previous play was aborted or failed
      }
    }
    this.audioElem.pause();

    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }

    const url = URL.createObjectURL(file);
    this.objectUrl = url;
    this.audioElem.src = url;
    this.audioElem.loop = this.isLooping;
    this.fileName = file.name;
    this.isLoaded = true;
    this.currentSource = 'file';

    // Fresh song → reset history so old audio data never bleeds into the new file (item 12).
    this.resetHistory();
    this.notifyListeners();

    try {
      this.playPromise = this.audioElem.play();
      this.notifyListeners();
      await this.playPromise;
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.warn('Autoplay prevented or waiting for interaction:', err);
    } finally {
      this.playPromise = null;
      this.notifyListeners();
    }
  }

  public setLoop(loop: boolean) {
    this.isLooping = loop;
    if (this.audioElem) this.audioElem.loop = loop;
  }

  public getIsLooping(): boolean {
    return this.isLooping;
  }

  public getVolumeHistory(): Float32Array {
    return this.volumeHistory;
  }

  public resetHistory() {
    this.volumeHistory.fill(0);
    this.energyHistory = [];
    this.activeRipples = [];
    this.secondWavePhase = 0;
    this.smoothedBeatIntensity = 0;
    this.beatPulse = 0;
    this.rippleShiftAccumulator = 0;
    this.smoothedVocal = 0;
    this.vocalNoiseFloor = 0;
    this.vocalPeak = 0.15;
    this.vocalEnvSamples = [];
    this.smoothedVocalConfidence = 0;
    this.vocalDetected = false;
    this.vocalAboveOnSince = 0;
    this.smoothedVocalGate = 0;
  }

  /**
   * Built-in multi-style procedural beat synthesizer (electro / lofi / techno) — lets users
   * preview audio reactivity without uploading a file.
   */
  public startProceduralBeat(style: SynthStyle = 'electro', bpm: number = 120) {
    this.stopMicrophone();
    this.stopAudioElem();
    this.initAudioContext();
    if (!this.audioCtx || !this.analyser) return;

    this.stopProceduralBeat();
    this.currentSynthStyle = style;
    this.currentSynthBpm = bpm;
    this.currentSource = 'synth';

    const styleNames: Record<SynthStyle, string> = {
      electro: `${bpm} BPM Cyber Electro`,
      lofi: `${bpm} BPM Lo-Fi Chill`,
      techno: `${bpm} BPM Industrial Techno`
    };
    this.fileName = styleNames[style] || `${bpm} BPM Synth Beat`;
    this.isLoaded = true;
    this.synthBeatStep = 0;
    this.resetHistory();
    this.notifyListeners();

    const sixteenthInterval = 60000 / bpm / 4;

    this.synthBeatTimer = window.setInterval(() => {
      if (!this.audioCtx || !this.analyser) return;
      const ctx = this.audioCtx;
      const t = ctx.currentTime;
      const step = this.synthBeatStep % 16;
      this.synthBeatStep++;

      const connectTarget = this.analyser;

      if (style === 'lofi') {
        if (step === 0 || step === 7 || step === 10) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(connectTarget);
          osc.frequency.setValueAtTime(110, t);
          osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
          gain.gain.setValueAtTime(0.75, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          osc.start(t);
          osc.stop(t + 0.3);
        }
        if (step === 4 || step === 12) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, t);
          osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
          gain.gain.setValueAtTime(0.45, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
          osc.connect(gain);
          gain.connect(connectTarget);
          osc.start(t);
          osc.stop(t + 0.06);
        }
        if (step === 0 || step === 8) {
          [220, 261.63, 329.63].forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            osc.connect(gain);
            gain.connect(connectTarget);
            osc.start(t);
            osc.stop(t + 0.5);
          });
        }
      } else if (style === 'techno') {
        if (step % 4 === 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(connectTarget);
          osc.frequency.setValueAtTime(200, t);
          osc.frequency.exponentialRampToValueAtTime(36, t + 0.1);
          gain.gain.setValueAtTime(0.95, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc.start(t);
          osc.stop(t + 0.22);
        }
        if (step % 4 === 2) {
          const bufferSize = ctx.sampleRate * 0.08;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const hat = ctx.createBufferSource();
          hat.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(7000, t);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.005, t + 0.08);
          hat.connect(filter);
          filter.connect(gain);
          gain.connect(connectTarget);
          hat.start(t);
          hat.stop(t + 0.08);
        }
        if (step % 4 === 3) {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(146.83, t);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2400, t);
          filter.frequency.exponentialRampToValueAtTime(280, t + 0.15);
          filter.Q.setValueAtTime(6.0, t);
          gain.gain.setValueAtTime(0.35, t);
          gain.gain.exponentialRampToValueAtTime(0.005, t + 0.15);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(connectTarget);
          osc.start(t);
          osc.stop(t + 0.15);
        }
      } else {
        // ELECTRO (default)
        if (step === 0 || step === 4 || step === 8 || step === 12 || step === 10) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(connectTarget);
          osc.frequency.setValueAtTime(160, t);
          osc.frequency.exponentialRampToValueAtTime(32, t + 0.12);
          gain.gain.setValueAtTime(0.85, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.start(t);
          osc.stop(t + 0.25);
        }
        if (step === 4 || step === 12) {
          const bufferSize = ctx.sampleRate * 0.15;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(1000, t);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.65, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(connectTarget);
          noise.start(t);
          noise.stop(t + 0.15);

          const osc = ctx.createOscillator();
          const toneGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(180, t);
          osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
          toneGain.gain.setValueAtTime(0.4, t);
          toneGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
          osc.connect(toneGain);
          toneGain.connect(connectTarget);
          osc.start(t);
          osc.stop(t + 0.08);
        }
        if (step % 2 === 0) {
          const bufferSize = ctx.sampleRate * 0.04;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const hat = ctx.createBufferSource();
          hat.buffer = buffer;
          const filter = ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(6500, t);
          const gain = ctx.createGain();
          const hatVol = step % 4 === 2 ? 0.35 : 0.18;
          gain.gain.setValueAtTime(hatVol, t);
          gain.gain.exponentialRampToValueAtTime(0.005, t + 0.04);
          hat.connect(filter);
          filter.connect(gain);
          gain.connect(connectTarget);
          hat.start(t);
          hat.stop(t + 0.04);
        }
        const bassNotes = [45, 45, 55, 45, 40, 40, 50, 40];
        const noteFreq = bassNotes[Math.floor(step / 2) % bassNotes.length];
        if (step % 4 === 0) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(noteFreq * 1.5, t);
          const bassFilter = ctx.createBiquadFilter();
          bassFilter.type = 'lowpass';
          bassFilter.frequency.setValueAtTime(300, t);
          bassGain.gain.setValueAtTime(0.4, t);
          bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
          bassOsc.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(connectTarget);
          bassOsc.start(t);
          bassOsc.stop(t + 0.22);
        }
      }
    }, sixteenthInterval);
  }

  public stopProceduralBeat() {
    if (this.synthBeatTimer !== null) {
      clearInterval(this.synthBeatTimer);
      this.synthBeatTimer = null;
    }
    this.notifyListeners();
  }

  private stopAudioElem() {
    if (this.audioElem) {
      if (this.playPromise) {
        this.playPromise
          .then(() => {
            if (this.audioElem) {
              this.audioElem.pause();
              this.audioElem.currentTime = 0;
              this.notifyListeners();
            }
          })
          .catch(() => {});
      } else {
        this.audioElem.pause();
        this.audioElem.currentTime = 0;
        this.notifyListeners();
      }
    }
  }

  public isProceduralActive(): boolean {
    return this.synthBeatTimer !== null;
  }

  public getProceduralStyle(): SynthStyle {
    return this.currentSynthStyle;
  }

  public getProceduralBpm(): number {
    return this.currentSynthBpm;
  }

  // ---- Transport ----

  public async play(): Promise<void> {
    this.initAudioContext();
    if (this.currentSource === 'synth') {
      this.startProceduralBeat(this.currentSynthStyle, this.currentSynthBpm);
    } else if (this.currentSource === 'mic') {
      await this.startMicrophone();
    } else if (this.audioElem && this.isLoaded && !this.isProceduralActive() && !this.isMicrophoneActive()) {
      this.currentSource = 'file';
      if (this.playPromise) return;
      try {
        this.playPromise = this.audioElem.play();
        this.notifyListeners();
        await this.playPromise;
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.name === 'NotAllowedError') return;
        console.warn('Audio play error:', err);
      } finally {
        this.playPromise = null;
        this.notifyListeners();
      }
    }
  }

  public pause() {
    if (this.synthBeatTimer !== null) {
      this.stopProceduralBeat();
    }
    if (this.audioElem) {
      if (this.playPromise) {
        this.playPromise
          .then(() => {
            if (this.audioElem) {
              this.audioElem.pause();
              this.notifyListeners();
            }
          })
          .catch(() => {});
      } else {
        this.audioElem.pause();
        this.notifyListeners();
      }
    }
    this.notifyListeners();
  }

  public stop() {
    this.stopProceduralBeat();
    this.stopMicrophone();
    this.stopAudioElem();
    this.smoothedBeatIntensity = 0;
    this.notifyListeners();
  }

  public restart() {
    if (this.synthBeatTimer !== null) {
      this.startProceduralBeat(this.currentSynthStyle, this.currentSynthBpm);
    } else if (this.audioElem && this.isLoaded) {
      const doRestart = () => {
        if (this.audioElem) {
          this.audioElem.currentTime = 0;
          this.play();
        }
      };
      if (this.playPromise) {
        this.playPromise.then(doRestart).catch(doRestart);
      } else {
        doRestart();
      }
    }
  }

  public seek(seconds: number) {
    if (this.audioElem) {
      this.audioElem.currentTime = Math.max(0, Math.min(seconds, this.audioElem.duration || 0));
    }
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    if (this.audioElem) this.audioElem.volume = clamped;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(clamped, this.audioCtx.currentTime);
    }
  }

  public getVolume(): number {
    return this.audioElem ? this.audioElem.volume : 1;
  }

  public getCurrentTime(): number {
    return this.audioElem ? this.audioElem.currentTime : 0;
  }

  public getDuration(): number {
    return this.audioElem && !isNaN(this.audioElem.duration) ? this.audioElem.duration : 0;
  }

  public isPlaying(): boolean {
    return !!(
      (this.audioElem && !this.audioElem.paused && !this.audioElem.ended) ||
      this.synthBeatTimer !== null ||
      this.micStream !== null
    );
  }

  public hasAudio(): boolean {
    return this.isLoaded;
  }

  public getFileName(): string | null {
    return this.fileName;
  }

  public getCurrentSource(): 'file' | 'synth' | 'mic' | null {
    return this.currentSource;
  }

  /**
   * Returns a live MediaStreamTrack carrying the current audio graph output, for muxing into
   * video export. Returns null when no audio source is active (video export then falls back to
   * a video-only recording and reports the limitation rather than producing a silent file
   * mislabeled as having audio — see utils/exportVideo.ts).
   */
  public getExportAudioTrack(): MediaStreamTrack | null {
    if (!this.audioCtx || !this.masterGain || !this.hasAudio()) return null;
    if (!this.exportDestination) {
      this.exportDestination = this.audioCtx.createMediaStreamDestination();
      this.masterGain.connect(this.exportDestination);
    }
    const track = this.exportDestination.stream.getAudioTracks()[0];
    return track || null;
  }

  // ---- Beat ripple sequencing ----

  public triggerManualBeat(config: AudioConfig) {
    if (config.beatRippleEnabled) {
      this.spawnRippleSequence(1.0, config, 0.8, 0.5, 0.3);
    }
    this.beatPulse = 1.0;
  }

  private spawnRippleSequence(
    beatStrength: number,
    config: AudioConfig,
    rawBass: number,
    rawMid: number,
    rawHigh: number
  ) {
    this.sequenceStep = (this.sequenceStep + 1) % 12;
    const baseStrength = beatStrength * config.beatRippleStrength * Math.max(0.6, config.beatRippleSize);
    const mode = config.beatRippleSequenceMode || 'cascade';

    if (mode === 'single') {
      const w = config.beatRippleWidth * (0.8 + config.beatRippleSize * 0.2);
      this.activeRipples.push({
        id: this.nextRippleId++,
        radius: 0,
        strength: baseStrength,
        speed: config.beatRippleSpeed,
        width: w,
        baseWidth: w,
        decay: config.beatRippleDecay,
        age: 0,
        originX: 0.5,
        originY: 0.5
      });
    } else if (mode === 'cascade') {
      const count = Math.min(4, Math.max(1, config.cascadeCount || 3));
      const delayMs = config.cascadeDelayMs || 60;
      const frameDelay = delayMs / 16.6;
      for (let c = 0; c < count; c++) {
        const offsetRadius = -c * frameDelay * config.beatRippleSpeed;
        const ringScale = Math.pow(0.85, c);
        const w = config.beatRippleWidth * (1.0 - c * 0.12);
        this.activeRipples.push({
          id: this.nextRippleId++,
          radius: offsetRadius,
          strength: baseStrength * ringScale,
          speed: config.beatRippleSpeed,
          width: w,
          baseWidth: w,
          decay: config.beatRippleDecay,
          age: 0,
          originX: 0.5,
          originY: 0.5
        });
      }
    } else if (mode === 'alternate') {
      const origins = [
        { x: 0.5, y: 0.5 },
        { x: 0.3, y: 0.3 },
        { x: 0.7, y: 0.7 },
        { x: 0.3, y: 0.7 },
        { x: 0.7, y: 0.3 }
      ];
      const curOrigin = origins[this.sequenceStep % origins.length];
      const w = config.beatRippleWidth;
      this.activeRipples.push({
        id: this.nextRippleId++,
        radius: 0,
        strength: baseStrength,
        speed: config.beatRippleSpeed * 1.1,
        width: w,
        baseWidth: w,
        decay: config.beatRippleDecay,
        age: 0,
        originX: curOrigin.x,
        originY: curOrigin.y
      });
    } else if (mode === 'freq_bands') {
      if (rawBass >= rawMid && rawBass >= rawHigh) {
        const w = config.beatRippleWidth * 1.8;
        this.activeRipples.push({
          id: this.nextRippleId++,
          radius: 0,
          strength: baseStrength * 1.3,
          speed: config.beatRippleSpeed * 0.8,
          width: w,
          baseWidth: w,
          decay: config.beatRippleDecay,
          age: 0,
          originX: 0.5,
          originY: 0.5
        });
      } else if (rawMid >= rawHigh) {
        const w1 = config.beatRippleWidth * 1.0;
        const w2 = config.beatRippleWidth * 0.8;
        this.activeRipples.push({
          id: this.nextRippleId++,
          radius: 0,
          strength: baseStrength,
          speed: config.beatRippleSpeed * 1.2,
          width: w1,
          baseWidth: w1,
          decay: config.beatRippleDecay,
          age: 0,
          originX: 0.5,
          originY: 0.5
        });
        this.activeRipples.push({
          id: this.nextRippleId++,
          radius: -config.beatRippleSpeed * 4,
          strength: baseStrength * 0.75,
          speed: config.beatRippleSpeed * 1.2,
          width: w2,
          baseWidth: w2,
          decay: config.beatRippleDecay,
          age: 0,
          originX: 0.5,
          originY: 0.5
        });
      } else {
        const w = config.beatRippleWidth * 0.5;
        this.activeRipples.push({
          id: this.nextRippleId++,
          radius: 0,
          strength: baseStrength * 0.8,
          speed: config.beatRippleSpeed * 1.8,
          width: w,
          baseWidth: w,
          decay: config.beatRippleDecay * 0.95,
          age: 0,
          originX: 0.5,
          originY: 0.5
        });
      }
    } else if (mode === 'second_wave') {
      // Second Wave never spawns rings — it modulates the existing ones (see wave.ts). Only boost
      // beat intensity here for a fast attack on the thickness/movement modulation.
      this.smoothedBeatIntensity = Math.min(1.0, this.smoothedBeatIntensity + Math.max(0.55, beatStrength * 0.95));
    }
  }

  private updateRipples() {
    for (let i = 0; i < this.activeRipples.length; i++) {
      const r = this.activeRipples[i];
      r.radius += r.speed;
      if (r.radius >= 0) r.strength *= r.decay;
      r.age++;
    }
    this.activeRipples = this.activeRipples.filter((r) => r.strength >= 0.008 && r.radius <= 2500);
    if (this.activeRipples.length > 12) {
      this.activeRipples = this.activeRipples.slice(-12);
    }
  }

  // ---- Main per-frame analysis ----

  private lastAnalysis: AudioAnalysisData | null = null;

  /**
   * Returns the most recent `update()` snapshot without performing any analysis work — the UI
   * (meters, HUD) polls this at a throttled rate instead of calling `update()` itself, so analysis
   * (FFT read, beat detection, history shift) happens exactly once per frame from the single render
   * loop that drives the visuals (item 11: avoid duplicate analysis loops).
   */
  public getLastAnalysis(): AudioAnalysisData | null {
    return this.lastAnalysis;
  }

  public update(config: AudioConfig): AudioAnalysisData {
    const result = this.updateInternal(config);
    this.lastAnalysis = result;
    return result;
  }

  private updateInternal(config: AudioConfig): AudioAnalysisData {
    const isPlaying = this.isPlaying();
    const currentTime = this.getCurrentTime();
    const duration = this.getDuration();
    const sourceType: AudioAnalysisData['sourceType'] = this.currentSource ?? 'none';

    if (!isPlaying || !this.analyser) {
      this.beatPulse *= config.beatDecay;
      if (this.beatPulse < 0.005) this.beatPulse = 0;
      this.smoothedBeatIntensity *= 0.82;
      if (this.smoothedBeatIntensity < 0.005) this.smoothedBeatIntensity = 0;

      // Vocal envelope settles on the release curve too (never freezes) so movement relaxes smoothly
      // when the singer stops, rather than holding the last value or snapping instantly to 0.
      const releaseRate = 0.03 + Math.min(0.95, Math.max(0.05, config.vocalReactivity?.release ?? 0.25)) * 0.2;
      this.smoothedVocal += (0 - this.smoothedVocal) * releaseRate;
      if (this.smoothedVocal < 0.004) this.smoothedVocal = 0;

      // Detection settles too: confidence decays, detection drops once below OFF threshold, and the
      // gate eases toward 0 on the same smooth release curve as the ripple-facing energy above.
      this.smoothedVocalConfidence *= 0.9;
      if (this.smoothedVocalConfidence < 0.01) this.smoothedVocalConfidence = 0;
      const pausedDetOff = Math.min(
        (config.vocalReactivity?.confidenceThresholdOn ?? 0.5) - 0.02,
        Math.max(0.02, config.vocalReactivity?.confidenceThresholdOff ?? 0.32)
      );
      if (this.smoothedVocalConfidence < pausedDetOff) {
        this.vocalDetected = false;
        this.vocalAboveOnSince = 0;
      }
      this.smoothedVocalGate += (0 - this.smoothedVocalGate) * 0.08;
      if (this.smoothedVocalGate < 0.004) this.smoothedVocalGate = 0;

      // Stopped/paused: decay history in place (no advance) so ripples settle rather than freeze.
      for (let i = 0; i < this.volumeHistory.length; i++) {
        this.volumeHistory[i] *= 0.85;
        if (this.volumeHistory[i] < 0.001) this.volumeHistory[i] = 0;
      }
      this.updateRipples();

      return {
        isPlaying: false,
        isLooping: this.isLooping,
        currentTime,
        duration,
        fileName: this.fileName,
        sourceType,
        overallEnergy: this.smoothedOverall * 0.9,
        bass: this.smoothedBass * 0.9,
        mid: this.smoothedMid * 0.9,
        high: this.smoothedHigh * 0.9,
        vocal: this.smoothedVocal,
        vocalRaw: 0,
        fullMix: this.smoothedOverall * 0.9,
        vocalConfidence: this.smoothedVocalConfidence,
        vocalDetected: this.vocalDetected,
        vocalDetectionMethod: 'heuristic',
        vocalStemStatus: 'unavailable',
        vocalRippleInfluence: 0,
        beatDetected: false,
        beatStrength: 0,
        beatPulse: this.beatPulse,
        smoothedBeatIntensity: this.smoothedBeatIntensity,
        secondWavePhase: this.secondWavePhase,
        spectrum: this.freqData,
        waveform: this.timeData,
        activeRipples: [...this.activeRipples],
        volumeHistory: this.volumeHistory
      };
    }

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    let sumSquares = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const normalizedSample = (this.timeData[i] - 128) / 128;
      sumSquares += normalizedSample * normalizedSample;
    }
    const rmsLevel = Math.sqrt(sumSquares / this.timeData.length);

    const NOISE_GATE = 0.022;
    const effectiveRms = rmsLevel > NOISE_GATE ? (rmsLevel - NOISE_GATE) / (1.0 - NOISE_GATE) : 0;

    let sumBass = 0,
      countBass = 0;
    for (let i = 0; i <= 5; i++) {
      sumBass += this.freqData[i];
      countBass++;
    }
    const rawBass = (sumBass / (countBass * 255)) * config.bassSensitivity;

    let sumMid = 0,
      countMid = 0;
    for (let i = 6; i <= 35; i++) {
      sumMid += this.freqData[i];
      countMid++;
    }
    const rawMid = (sumMid / (countMid * 255)) * config.midSensitivity;

    let sumHigh = 0,
      countHigh = 0;
    for (let i = 36; i <= 120; i++) {
      sumHigh += this.freqData[i];
      countHigh++;
    }
    const rawHigh = (sumHigh / (countHigh * 255)) * config.highSensitivity;

    // Vocal Reactivity — reads the SAME freqData buffer already sampled above (no extra FFT/analyser
    // work), just a differently-bounded band sum. Root cause of "ripple barely reacts to singing":
    // the pre-existing Mid band (bins 6-35, ~500Hz-3kHz here) undershoots the configurable vocal
    // range (default 150-4000Hz) AND, more importantly, nothing in the default parameter mappings or
    // beat-detection path ever routed Mid/vocal energy to a visible target — only Bass and beatPulse
    // did, and beat detection is a bass-onset (kick drum) detector that rarely fires on sustained
    // singing with no drums. This band is intentionally independent from `mid`/beat detection so a
    // user's existing Bass/Beat-driven presets are completely unaffected.
    const vc = config.vocalReactivity;
    const vocalFreqLow = vc?.freqLow ?? 150;
    const vocalFreqHigh = vc?.freqHigh ?? 4000;
    const vocalSensitivity = vc?.sensitivity ?? 1.3;
    const nyquist = (this.audioCtx?.sampleRate ?? 44100) / 2;
    const binHz = nyquist / this.freqData.length;
    const vocalLowBin = Math.max(0, Math.min(this.freqData.length - 1, Math.round(vocalFreqLow / binHz)));
    const vocalHighBin = Math.max(vocalLowBin, Math.min(this.freqData.length - 1, Math.round(vocalFreqHigh / binHz)));
    let sumVocal = 0;
    for (let i = vocalLowBin; i <= vocalHighBin; i++) sumVocal += this.freqData[i];
    const vocalBinCount = vocalHighBin - vocalLowBin + 1;
    const rawVocal = (sumVocal / (vocalBinCount * 255)) * vocalSensitivity;

    let sumOverall = 0;
    for (let i = 0; i < this.freqData.length; i++) sumOverall += this.freqData[i];
    const rawOverall = (sumOverall / (this.freqData.length * 255)) * config.sensitivity;
    const effectiveOverall = rawOverall > 0.04 ? (rawOverall - 0.04) / 0.96 : 0;

    const smoothingBase = 1.0 - Math.min(0.95, Math.max(0.1, config.smoothing));
    this.smoothedBass += (rawBass - this.smoothedBass) * smoothingBase;
    this.smoothedMid += (rawMid - this.smoothedMid) * smoothingBase;
    this.smoothedHigh += (rawHigh - this.smoothedHigh) * smoothingBase;
    this.smoothedOverall += (rawOverall - this.smoothedOverall) * smoothingBase;

    // Vocal Reactivity — adaptive normalization + independent attack/release envelope. A raw FFT
    // band reading is a weak/noisy signal on its own (a quiet a-cappella verse and a loud chorus
    // read completely differently); adaptive normalization tracks a slow-moving noise floor (so
    // room hiss / silence never gets amplified into false movement — a low floor is not amplified,
    // it is the subtraction baseline) and a slow-decaying peak (so the song's own loudness range
    // becomes the 0..1 scale), which is what lets a soft, isolated vocal register as strongly as a
    // loud one relative to itself — without ever multiplying by one large constant as a shortcut.
    const vocalNoiseGate = 0.01; // rejects near-silence only — deliberately below the RMS gate above
    // so quieter singing is never suppressed (task requirement: "avoid thresholds that suppress
    // quieter vocals").
    const vocalAboveGate = rawVocal > vocalNoiseGate ? rawVocal : 0;

    // Floor tracks slowly upward, faster downward, so it settles just under the quietest recent
    // vocal-band content (room tone / instrument bleed) rather than the loudest.
    const floorRate = vocalAboveGate < this.vocalNoiseFloor ? 0.08 : 0.004;
    this.vocalNoiseFloor += (vocalAboveGate - this.vocalNoiseFloor) * floorRate;
    this.vocalNoiseFloor = Math.max(0, this.vocalNoiseFloor);

    // Peak rises fast on new loud content, decays slowly so it represents "how loud this song's
    // vocal range gets", not just the last instant.
    if (vocalAboveGate > this.vocalPeak) {
      this.vocalPeak += (vocalAboveGate - this.vocalPeak) * 0.35;
    } else {
      this.vocalPeak += (vocalAboveGate - this.vocalPeak) * 0.002;
    }
    this.vocalPeak = Math.max(0.06, this.vocalPeak);

    const adaptiveOn = vc?.adaptiveNormalization ?? true;
    const vocalRange = Math.max(0.02, this.vocalPeak - this.vocalNoiseFloor);
    const normalizedVocal = adaptiveOn
      ? Math.min(1.0, Math.max(0, (vocalAboveGate - this.vocalNoiseFloor) / vocalRange))
      : Math.min(1.0, vocalAboveGate);

    // Attack/release envelope, independently configurable from the global Smoothing knob so vocal
    // dynamics (phrase starts, sustained notes, silence between lines) aren't washed out by whatever
    // smoothing the Bass/Beat analysis is using.
    const vocalAttackRate = 0.12 + Math.min(1, Math.max(0, vc?.attack ?? 0.65)) * 0.75;
    const vocalReleaseRate = 0.02 + Math.min(1, Math.max(0, vc?.release ?? 0.25)) * 0.22;
    if (normalizedVocal > this.smoothedVocal) {
      this.smoothedVocal += (normalizedVocal - this.smoothedVocal) * vocalAttackRate;
    } else {
      this.smoothedVocal += (normalizedVocal - this.smoothedVocal) * vocalReleaseRate;
    }
    this.smoothedVocal = Math.min(1.0, Math.max(0, this.smoothedVocal));
    if (this.smoothedVocal < 0.004) this.smoothedVocal = 0;

    // ---- Vocal DETECTION (separate from the ENERGY tracked above) ----
    // Energy alone is not proof of vocal presence — a synth pad, guitar or piano can sit at the
    // exact same band energy as a voice. Detection combines three independent DSP cues into a
    // confidence score: (1) harmonicity — is there ANY tonal/periodic content at all (rules out
    // pure noise/silence, but does NOT by itself indicate voice vs instrument); (2) syllabic-rate
    // modulation — does the vocal-band envelope pulse at the ~2-6Hz rate singing/speech naturally
    // produces, which a sustained pad/held note/drone does not; (3) formant-band concentration — a
    // minor supporting weight. This is a heuristic, not a trained classifier — see the doc comment
    // on VocalReactivityConfig in types.ts for why, and its documented limitations.
    const nowMs = performance.now();
    if (!this.vocalEnvSamples.length || nowMs - this.vocalEnvSamples[this.vocalEnvSamples.length - 1].t > 30) {
      this.vocalEnvSamples.push({ t: nowMs, v: normalizedVocal });
      const cutoff = nowMs - 2000;
      while (this.vocalEnvSamples.length && this.vocalEnvSamples[0].t < cutoff) this.vocalEnvSamples.shift();
    }

    const harmonicity = computeHarmonicity(this.timeData, this.audioCtx?.sampleRate ?? 44100);
    const syllabicModulation = computeSyllabicModulation(this.vocalEnvSamples);
    const formantRatio = computeFormantRatio(this.freqData, binHz);
    // Harmonicity only GATES (rules out noise/silence) — it does not scale confidence upward, since
    // very high periodicity is just as (if not more) consistent with a clean instrument tone.
    const tonalGate = smoothstep(0.1, 0.32, harmonicity);
    const formantWeight = 0.5 + 0.5 * formantRatio;
    const rawConfidence = Math.max(0, Math.min(1, tonalGate * syllabicModulation * formantWeight));

    const detSmoothing = Math.min(0.95, Math.max(0.05, vc?.detectionSmoothing ?? 0.35));
    const confRate = 1.0 - detSmoothing;
    this.smoothedVocalConfidence += (rawConfidence - this.smoothedVocalConfidence) * confRate;
    this.smoothedVocalConfidence = Math.max(0, Math.min(1, this.smoothedVocalConfidence));

    // Hysteresis with separate ON/OFF thresholds + a minimum-duration debounce on the ON transition
    // only, so a single loud instrumental transient can't flip Vocal Mode on, while release stays
    // fast (task: "avoid excessive smoothing that causes significant detection delay").
    const detOn = Math.max(0.05, Math.min(0.95, vc?.confidenceThresholdOn ?? 0.5));
    const detOff = Math.min(detOn - 0.02, Math.max(0.02, vc?.confidenceThresholdOff ?? 0.32));
    const minDurMs = Math.max(0, vc?.minVocalDuration ?? 0.12) * 1000;

    if (!this.vocalDetected) {
      if (this.smoothedVocalConfidence >= detOn) {
        if (this.vocalAboveOnSince === 0) this.vocalAboveOnSince = nowMs;
        if (nowMs - this.vocalAboveOnSince >= minDurMs) this.vocalDetected = true;
      } else {
        this.vocalAboveOnSince = 0;
      }
    } else if (this.smoothedVocalConfidence < detOff) {
      this.vocalDetected = false;
      this.vocalAboveOnSince = 0;
    }

    const gateTarget = this.vocalDetected ? 1 : 0;
    const gateRate = gateTarget > this.smoothedVocalGate ? 0.3 : 0.08;
    this.smoothedVocalGate += (gateTarget - this.smoothedVocalGate) * gateRate;
    this.smoothedVocalGate = Math.max(0, Math.min(1, this.smoothedVocalGate));

    // Final influence actually applied by the AUTOMATIC Vocal Reactivity system (wave.ts) — the raw
    // `smoothedVocal` energy remains available separately as a manual 'vocal' Parameter Mapping
    // source (task: "other enabled mappings must continue working normally"), unaffected by mode.
    const vocalMode = vc?.mode ?? 'off';
    let vocalRippleInfluence = 0;
    if (vocalMode === 'auto_detect') {
      vocalRippleInfluence = this.smoothedVocal * this.smoothedVocalGate;
    }
    // 'isolated' intentionally stays 0 — no source-separation engine is bundled in this build (see
    // vocalStemStatus: 'unavailable'), and silently substituting full-mix band energy while labeling
    // it "isolated" would misrepresent an unreliable signal as an accurate one.

    // Full Mix — combines frequency-band energy and RMS WITHOUT requiring a bass beat to trigger a
    // response (task item 4), so quiet/instrument-light vocal passages still move something even
    // with every other source (Bass/Beat) near zero.
    const rawFullMix = Math.min(
      1.0,
      effectiveRms * 0.4 + rawBass * 0.15 + rawMid * 0.15 + this.smoothedVocal * 0.2 + rawHigh * 0.1
    );

    let beatDetected = false;
    let beatStrength = 0;

    if (config.beatDetectionEnabled) {
      this.energyHistory.push(rawBass);
      if (this.energyHistory.length > this.historySize) this.energyHistory.shift();

      const historyAvg = this.energyHistory.reduce((a, b) => a + b, 0) / (this.energyHistory.length || 1);
      const variance =
        this.energyHistory.reduce((a, b) => a + Math.pow(b - historyAvg, 2), 0) / (this.energyHistory.length || 1);
      const stdDev = Math.sqrt(variance);

      const thresholdFactor = 1.0 + (1.1 - config.beatThreshold) * 0.8;
      const adaptiveThreshold = historyAvg * thresholdFactor + stdDev * 0.5;

      const now = performance.now();
      if (rawBass > adaptiveThreshold && now - this.lastBeatTime > config.minBeatInterval && rawBass > 0.08) {
        this.lastBeatTime = now;
        beatDetected = true;
        beatStrength = Math.min(1.0, ((rawBass - historyAvg) / Math.max(0.05, historyAvg)) * config.beatSensitivity);
        this.beatPulse = Math.max(this.beatPulse, beatStrength);
        if (config.beatRippleEnabled) {
          this.spawnRippleSequence(beatStrength, config, rawBass, rawMid, rawHigh);
        }
      }
    }

    this.beatPulse *= config.beatDecay;
    if (this.beatPulse < 0.005) this.beatPulse = 0;

    const instantBeat = Math.max(
      this.beatPulse * 1.25,
      beatDetected ? beatStrength * 1.35 : 0,
      rawBass * 1.2,
      effectiveRms * 1.4
    );
    const clampedBeat = Math.min(1.0, Math.max(0.0, instantBeat));

    const attackRate = 0.75;
    const releaseRate = 0.055;
    if (clampedBeat > this.smoothedBeatIntensity) {
      this.smoothedBeatIntensity += (clampedBeat - this.smoothedBeatIntensity) * attackRate;
    } else {
      this.smoothedBeatIntensity += (clampedBeat - this.smoothedBeatIntensity) * releaseRate;
    }
    if (this.smoothedBeatIntensity < 0.005) this.smoothedBeatIntensity = 0;

    // Second Wave phase only advances while audio is genuinely active — silence lets it settle.
    // Vocal energy now also counts as activity (previously only bass/RMS/beat did), so Second Wave
    // keeps animating through a vocal-only passage instead of nearly flatlining between kick hits.
    const audioActivity = Math.max(
      effectiveRms * 1.6,
      rawBass * 1.3,
      this.smoothedBeatIntensity * 0.85,
      this.smoothedVocal * 1.2
    );
    if (audioActivity > 0.015) {
      const baseSpeed = 0.022 * config.secondWaveSpeed;
      const beatBoost = 0.058 * config.secondWaveSpeed * this.smoothedBeatIntensity;
      const audioDrivenSpeed = (baseSpeed + beatBoost) * Math.min(1.8, audioActivity * 1.8);
      this.secondWavePhase += audioDrivenSpeed;
      if (this.secondWavePhase > 6283.1853) this.secondWavePhase -= 6283.1853;
    }

    // Continuous rolling volume history (drives the travelling Music Ripple)
    let currentVol = 0;
    if (config.audioRippleBand === 'bass') {
      currentVol = rawBass * 1.8;
    } else if (config.audioRippleBand === 'mid') {
      currentVol = rawMid * 1.6;
    } else if (config.audioRippleBand === 'beatPulse') {
      currentVol = Math.max(this.beatPulse * 1.3, rawBass * 0.9);
    } else if (config.audioRippleBand === 'vocal') {
      currentVol = this.smoothedVocal * 1.7;
    } else if (config.audioRippleBand === 'fullMix') {
      currentVol = rawFullMix * 1.6;
    } else {
      currentVol = effectiveRms * 2.6 * config.sensitivity + rawBass * 0.35 + effectiveOverall * 0.25;
    }
    if (beatDetected) currentVol = Math.max(currentVol, beatStrength * 1.25);
    if (currentVol < 0.012) currentVol = 0;
    currentVol = Math.max(0.0, Math.min(1.0, currentVol));

    // Ripple Speed controls how fast new samples push outward through the history buffer
    // (5.0 = 1 slot/update, matching the source app's default cadence).
    this.rippleShiftAccumulator += Math.max(0.1, config.audioRippleSpeed || 5.0) / 5.0;
    const shiftSteps = Math.min(20, Math.max(1, Math.floor(this.rippleShiftAccumulator)));
    this.rippleShiftAccumulator -= shiftSteps;

    for (let s = 0; s < shiftSteps; s++) {
      this.volumeHistory.copyWithin(1, 0, 255);
      this.volumeHistory[0] = currentVol;
    }

    const decayMultiplier = currentVol === 0 ? 0.93 : 0.993;
    for (let i = 1; i < this.volumeHistory.length; i++) {
      this.volumeHistory[i] *= decayMultiplier;
      if (this.volumeHistory[i] < 0.001) this.volumeHistory[i] = 0;
    }

    this.updateRipples();

    return {
      isPlaying: true,
      isLooping: this.isLooping,
      currentTime,
      duration,
      fileName: this.fileName,
      sourceType,
      overallEnergy: Math.min(1.0, this.smoothedOverall),
      bass: Math.min(1.0, this.smoothedBass),
      mid: Math.min(1.0, this.smoothedMid),
      high: Math.min(1.0, this.smoothedHigh),
      vocal: this.smoothedVocal,
      vocalRaw: Math.min(1.0, rawVocal),
      fullMix: rawFullMix,
      vocalConfidence: this.smoothedVocalConfidence,
      vocalDetected: this.vocalDetected,
      vocalDetectionMethod: 'heuristic',
      vocalStemStatus: 'unavailable',
      vocalRippleInfluence,
      beatDetected,
      beatStrength,
      beatPulse: Math.min(1.0, this.beatPulse),
      smoothedBeatIntensity: Math.min(1.0, this.smoothedBeatIntensity),
      secondWavePhase: this.secondWavePhase,
      spectrum: this.freqData,
      waveform: this.timeData,
      activeRipples: [...this.activeRipples],
      volumeHistory: this.volumeHistory
    };
  }
}

export const audioAnalyzer = new AudioAnalyzerEngine();
export const audioAnalyzerInstance = audioAnalyzer;
