import { WaveConfig, AudioConfig, DynamicThicknessConfig } from '../types';

/**
 * Dynamic Visual Thickness (2D) defaults — disabled, so every existing preset/config that never sets
 * `wave.dynamicThickness` renders byte-for-byte identically to before this feature existed.
 */
export const DEFAULT_DYNAMIC_THICKNESS_CONFIG: DynamicThicknessConfig = {
  enabled: false,
  mode: 'animated',
  baseThickness: 1.0,
  minThickness: 0.4,
  maxThickness: 1.8,
  thicknessFrequency: 1.0,
  animSpeed: 1.0,
  phaseOffset: 0.6,
  randomness: 0.0,
  audioThicknessInfluence: 0.0
};

export interface WaveResult {
  // Wave scalar intensity in range [0, 1]
  value: number;
  // Displacement vector (dx, dy) in pixels
  displacementX: number;
  displacementY: number;
}

/**
 * Lightweight per-frame audio snapshot consumed by the wave engine. Ported/adapted from AVG
 * SoundText Ripple's AudioAnalysisData — see AUDIO_CORE_FOR_CLAUDE.md item 3/4/5.
 */
export interface AudioSignal {
  rmsVolume: number; // overall energy
  bass: number;
  mid: number;
  high: number;
  isActive: boolean;
  beatPulse?: number;
  smoothedBeatIntensity?: number;
  secondWavePhase?: number;
  volumeHistory?: Float32Array; // 256-sample rolling history for the Continuous Music Ripple
}

/**
 * Deterministic pseudo-random float [0, 1) based on integer seed and coordinates
 */
function pseudoHash(seed: number, x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 137.5) * 43758.5453;
  return n - Math.floor(n);
}

export interface WaveFrameContext {
  pattern: string;
  waveType: string;
  ox1: number;
  oy1: number;
  ox2: number;
  oy2: number;
  cx: number;
  cy: number;
  maxDim: number;
  effectiveSpeed: number;
  baseFreq: number;
  baseAmp: number;
  cosLinear: number;
  sinLinear: number;
  frequencyThickness: number;
  radialThickness: number;
  waveSoftness: number;
  vectorDistortion: number;
  frequencyVariation: number;
  amplitudeVariation: number;
  sizeRandomness: number;
  intervalVariation: number;
  randomSeed: number;
  time: number;
  // Advanced Frequency Control (generic, additive-only)
  waveMotionAmplitude: number;
  waveMotionSpeed: number;
  motionFreqEffective: number;
  waveMotionPhaseOffset: number;
  waveMotionVariation: number;
  // Audio Reactivity — Second Wave & Continuous Music Ripple (additive-only; inert unless
  // audioConfig.enabled is explicitly turned on by the user)
  secondWaveActive: boolean;
  secondWavePhase: number;
  secondWaveSpeedScale: number;
  secondWaveFrequency: number;
  secondWaveThicknessInfluence: number;
  secondWaveMovementStrength: number;
  smoothedBeatIntensity: number;
  musicRippleActive: boolean;
  audioRippleStrength: number;
  audioRippleWavelength: number;
  audioRippleHarmonics: number;
  // Dynamic Visual Thickness (2D, ported from 3D Radial Wave's per-ring thickness system)
  dynamicThicknessEnabled: boolean;
  dynamicThicknessMode: DynamicThicknessConfig['mode'];
  dynamicThicknessBase: number;
  dynamicThicknessMin: number;
  dynamicThicknessMax: number;
  dynamicThicknessFrequency: number;
  dynamicThicknessAnimSpeed: number;
  dynamicThicknessPhaseOffset: number;
  dynamicThicknessRandomness: number;
  dynamicThicknessAudioInfluence: number;
}

export function createWaveFrameContext(
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  config: WaveConfig,
  audioSignal?: AudioSignal,
  audioConfig?: AudioConfig
): WaveFrameContext {
  const {
    pattern,
    waveType,
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    waveSoftness,
    frequencyThickness = 1.0,
    radialThickness = 0.0,
    originX,
    originY,
    secondaryOriginX,
    secondaryOriginY,
    linearAngle,
    vectorDistortion,
    frequencyVariation = 0.0,
    amplitudeVariation = 0.0,
    sizeRandomness = 0.0,
    intervalVariation = 0.0,
    randomSeed = 42,
    soundReactivity = 0.0,
    soundSensitivity = 1.2,
    soundReactionBand = 'all',
    frequencyMapping = 'spatial_only',
    freqThicknessInfluence = 0.0,
    freqMotionInfluence = 0.0,
    waveMotionFrequency = 1.0,
    waveMotionSpeed = 1.0,
    waveMotionAmplitude = 0.0,
    waveMotionPhaseOffset = 0.0,
    waveMotionVariation = 0.0,
    dynamicThickness
  } = config;

  const dtEnabled = dynamicThickness?.enabled ?? false;
  const dtMode = dynamicThickness?.mode ?? 'animated';
  const dtBase = dynamicThickness?.baseThickness ?? 1.0;
  const dtMin = dynamicThickness?.minThickness ?? 0.4;
  const dtMax = dynamicThickness?.maxThickness ?? 1.8;
  const dtFrequencyBase = dynamicThickness?.thicknessFrequency ?? 1.0;
  const dtAnimSpeed = dynamicThickness?.animSpeed ?? 1.0;
  const dtPhaseOffset = dynamicThickness?.phaseOffset ?? 0.6;
  const dtRandomness = dynamicThickness?.randomness ?? 0.0;
  const dtAudioInfluence = dynamicThickness?.audioThicknessInfluence ?? 0.0;

  let audioFactor = 0;
  if (soundReactivity > 0) {
    if (audioSignal && audioSignal.isActive) {
      let bandVal = audioSignal.rmsVolume;
      if (soundReactionBand === 'bass') bandVal = audioSignal.bass;
      else if (soundReactionBand === 'mid') bandVal = audioSignal.mid;
      else if (soundReactionBand === 'treble') bandVal = audioSignal.high;
      audioFactor = bandVal * soundSensitivity * soundReactivity;
    } else {
      const pulseCycle = (time * 2.0) % 1.0;
      audioFactor = Math.pow(Math.max(0, 1.0 - pulseCycle), 3.0) * 0.45 * soundReactivity;
    }
  }

  const rad = (linearAngle * Math.PI) / 180;

  // Advanced Frequency Control — Frequency Mapping (item 1). Default 'spatial_only' reproduces the
  // exact original baseFreq formula below, so every existing preset (which never sets this field)
  // is byte-for-byte unaffected. 'thickness_only'/'motion_only' decouple spatial frequency from the
  // master Frequency slider (freezing it at a neutral baseline) so that slider can be dedicated
  // entirely to driving Thickness/Motion instead; 'combined' keeps spatial active AND feeds both.
  const spatialDrivesFreq = frequencyMapping === 'spatial_only' || frequencyMapping === 'combined';
  const effectiveWaveFrequency = spatialDrivesFreq ? waveFrequency : 1.0;

  // Frequency Mapping's Thickness target now feeds the ring-based Dynamic Visual Thickness system
  // (dynamicThickness.thicknessFrequency) rather than a separate per-point system — see the
  // consolidation note on WaveConfig.freqThicknessInfluence in types.ts.
  const dtFrequency =
    frequencyMapping === 'thickness_only' || frequencyMapping === 'combined'
      ? dtFrequencyBase * (1.0 + waveFrequency * freqThicknessInfluence)
      : dtFrequencyBase;

  const motionFreqEffective =
    frequencyMapping === 'motion_only' || frequencyMapping === 'combined'
      ? waveMotionFrequency * (1.0 + waveFrequency * freqMotionInfluence)
      : waveMotionFrequency;

  // ---- Audio Reactivity: Parameter Mapping Matrix (item 7) ----
  // Additive-only: zero effect unless audioConfig.enabled is explicitly turned on. Applies BEFORE
  // effectiveSpeed/baseFreq/baseAmp/frequencyThickness are finalized below, so the target rendering
  // engine receives the final effective parameters — the user's manual base values are never
  // permanently overwritten, only modulated for this frame (item 3).
  let mappedSpeedDelta = 0;
  let mappedFreqDelta = 0;
  let mappedAmpDelta = 0;
  let mappedThicknessDelta = 0;
  const audioActiveForMapping = !!(audioConfig?.enabled && audioSignal?.isActive);
  if (audioActiveForMapping && audioConfig?.mappings) {
    for (const m of audioConfig.mappings) {
      let sourceVal = 0;
      switch (m.source) {
        case 'bass':
          sourceVal = audioSignal!.bass;
          break;
        case 'mid':
          sourceVal = audioSignal!.mid;
          break;
        case 'high':
          sourceVal = audioSignal!.high;
          break;
        case 'overallEnergy':
          sourceVal = audioSignal!.rmsVolume;
          break;
        case 'beatPulse':
          sourceVal = audioSignal!.beatPulse ?? 0;
          break;
      }
      const delta = sourceVal * m.amount;
      switch (m.target) {
        case 'waveAmplitude':
          mappedAmpDelta += delta * 1.5;
          break;
        case 'waveSpeed':
          mappedSpeedDelta += delta * 2.0;
          break;
        case 'waveFrequency':
          mappedFreqDelta += delta * 1.5;
          break;
        case 'waveThickness':
          mappedThicknessDelta += delta * 1.4;
          break;
        // radialDisplacement / particleSize / particleOpacity / wavefrontScale / wavefrontThreshold
        // are applied downstream (particleRenderer.ts) where per-particle geometry is available.
      }
    }
  }

  const secondWaveActive = !!(
    audioConfig?.enabled &&
    audioConfig?.beatRippleSequenceMode === 'second_wave' &&
    audioSignal?.isActive
  );
  const musicRippleActive = !!(
    audioConfig?.enabled &&
    audioConfig?.audioMusicRippleEnabled !== false &&
    audioSignal?.isActive &&
    audioSignal?.volumeHistory
  );

  return {
    pattern,
    waveType,
    ox1: originX * canvasWidth,
    oy1: originY * canvasHeight,
    ox2: secondaryOriginX * canvasWidth,
    oy2: secondaryOriginY * canvasHeight,
    cx: canvasWidth * 0.5,
    cy: canvasHeight * 0.5,
    maxDim: Math.max(canvasWidth, canvasHeight) * 0.5,
    effectiveSpeed: ((waveSpeed + mappedSpeedDelta) * 4.0) * (1.0 + audioFactor * 0.8),
    baseFreq: ((effectiveWaveFrequency + mappedFreqDelta) * 0.05) * (1.0 + audioFactor * 0.4),
    baseAmp: (waveAmplitude + mappedAmpDelta) * (1.0 + audioFactor * 1.5),
    cosLinear: Math.cos(rad),
    sinLinear: Math.sin(rad),
    frequencyThickness: frequencyThickness + mappedThicknessDelta,
    radialThickness,
    waveSoftness,
    vectorDistortion,
    frequencyVariation,
    amplitudeVariation,
    sizeRandomness,
    intervalVariation,
    randomSeed,
    time,
    waveMotionAmplitude,
    waveMotionSpeed,
    motionFreqEffective,
    waveMotionPhaseOffset,
    waveMotionVariation,
    secondWaveActive,
    secondWavePhase: audioSignal?.secondWavePhase ?? 0,
    secondWaveSpeedScale: audioConfig?.secondWaveSpeed ?? 1.0,
    secondWaveFrequency: audioConfig?.secondWaveFrequency ?? 1.0,
    secondWaveThicknessInfluence: audioConfig?.secondWaveThicknessInfluence ?? 0.7,
    secondWaveMovementStrength: audioConfig?.secondWaveMovementStrength ?? 0.7,
    smoothedBeatIntensity: audioSignal?.smoothedBeatIntensity ?? 0,
    musicRippleActive,
    audioRippleStrength: audioConfig?.audioRippleStrength ?? 1.5,
    audioRippleWavelength: audioConfig?.audioRippleWavelength ?? 600,
    audioRippleHarmonics: audioConfig?.audioRippleHarmonics ?? 1,
    dynamicThicknessEnabled: dtEnabled,
    dynamicThicknessMode: dtMode,
    dynamicThicknessBase: dtBase,
    dynamicThicknessMin: dtMin,
    dynamicThicknessMax: dtMax,
    dynamicThicknessFrequency: dtFrequency,
    dynamicThicknessAnimSpeed: dtAnimSpeed,
    dynamicThicknessPhaseOffset: dtPhaseOffset,
    dynamicThicknessRandomness: dtRandomness,
    dynamicThicknessAudioInfluence: dtAudioInfluence
  };
}

/**
 * Calculates scalar wave field intensity and vector displacement at a given coordinate (x, y).
 */
export function calculateWave(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  config: WaveConfig,
  audioSignal?: AudioSignal,
  frameCtx?: WaveFrameContext,
  out?: WaveResult,
  audioConfig?: AudioConfig
): WaveResult {
  const ctx = frameCtx || createWaveFrameContext(canvasWidth, canvasHeight, time, config, audioSignal, audioConfig);
  const {
    pattern,
    waveType,
    ox1,
    oy1,
    ox2,
    oy2,
    cx,
    cy,
    maxDim,
    effectiveSpeed,
    baseFreq,
    baseAmp,
    cosLinear,
    sinLinear,
    frequencyThickness,
    radialThickness,
    waveSoftness,
    vectorDistortion,
    frequencyVariation,
    amplitudeVariation,
    sizeRandomness,
    intervalVariation,
    randomSeed,
    waveMotionAmplitude,
    waveMotionSpeed,
    motionFreqEffective,
    waveMotionPhaseOffset,
    waveMotionVariation,
    secondWaveActive,
    secondWavePhase,
    secondWaveSpeedScale,
    secondWaveFrequency,
    secondWaveThicknessInfluence,
    secondWaveMovementStrength,
    smoothedBeatIntensity,
    musicRippleActive,
    audioRippleStrength,
    audioRippleWavelength,
    audioRippleHarmonics,
    dynamicThicknessEnabled,
    dynamicThicknessMode,
    dynamicThicknessBase,
    dynamicThicknessMin,
    dynamicThicknessMax,
    dynamicThicknessFrequency,
    dynamicThicknessAnimSpeed,
    dynamicThicknessPhaseOffset,
    dynamicThicknessRandomness,
    dynamicThicknessAudioInfluence
  } = ctx;

  let rDist = 0;
  if (pattern === 'circular' || pattern === 'spiral') {
    const rx = x - ox1;
    const ry = y - oy1;
    rDist = Math.sqrt(rx * rx + ry * ry);
  } else if (pattern === 'linear' || pattern === 'market_chart') {
    rDist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
  } else if (pattern === 'interference') {
    const r1 = Math.sqrt((x - ox1) * (x - ox1) + (y - oy1) * (y - oy1));
    const r2 = Math.sqrt((x - ox2) * (x - ox2) + (y - oy2) * (y - oy2));
    rDist = Math.min(r1, r2);
  }

  // Audio Reactivity — Second Wave (item 5): when active, the travelling phase term is driven by
  // the analyzer's audio-gated secondWavePhase accumulator instead of raw elapsed time, so movement
  // freezes/settles during silence and surges on beats — WITHOUT spawning new rings, since it's the
  // same phase term every pattern already uses to animate its EXISTING wavefronts.
  const travelTimeTerm = secondWaveActive ? secondWavePhase * secondWaveSpeedScale : time * effectiveSpeed;

  // Fast jitter calculation (only compute pseudoHash when variation is enabled).
  // NOTE: kept byte-for-byte identical to the original spatial-bucket formulas so that presets
  // which already ship nonzero frequencyVariation/amplitudeVariation/sizeRandomness (Global Pulse,
  // Breaking Signal, etc.) keep rendering their existing default appearance unchanged.
  let freqJitter = 1.0;
  if (frequencyVariation > 0) {
    const coordHash = pseudoHash(randomSeed, Math.floor(x / 40), Math.floor(y / 40));
    freqJitter = 1.0 + (frequencyVariation * 0.8) * (coordHash - 0.5);
  }

  let ampJitter = 1.0;
  if (amplitudeVariation > 0) {
    ampJitter = 1.0 + (amplitudeVariation * 0.9) * (pseudoHash(randomSeed + 99, Math.floor(rDist / 80), 0) - 0.5);
  }

  let sizeJitter = 1.0;
  if (sizeRandomness > 0) {
    sizeJitter = 1.0 + (sizeRandomness * 0.6) * (pseudoHash(randomSeed + 137, Math.floor(rDist / 120), 1) - 0.5);
  }

  // Wave Interval Variation (new, additive-only param — defaults to 0 for every existing preset so
  // it has zero effect unless a user explicitly raises it): gives each consecutive wavefront its own
  // irregular timing/arrival offset, independent from Frequency (which controls spacing/repetition).
  // Bucketed by wavefront/ring index (derived from the un-jittered phase) so a given ring keeps a
  // STABLE offset as it travels outward, rather than the offset drifting as the ring propagates.
  // Stable per-ring index: derived from the un-jittered phase so a given wavefront/ring keeps the SAME
  // index as it travels outward (rather than the index drifting), matching the source app's per-ring
  // (not per-point) thickness addressing. Shared by Wave Interval Variation and Dynamic Thickness below.
  const basePhase = rDist * baseFreq - travelTimeTerm;
  const ringIndex = Math.round(basePhase / (2 * Math.PI));

  let intervalPhaseOffset = 0.0;
  if (intervalVariation > 0) {
    intervalPhaseOffset = (pseudoHash(randomSeed + 271, ringIndex, 44) - 0.5) * intervalVariation * Math.PI * 1.4;
  }

  // Motion Frequency (Advanced Frequency Control, item 1C) — additive-only, zero effect when
  // waveMotionAmplitude is 0 (the default for every existing preset). Gives each wave its own
  // organic per-point phase drift so consecutive waves don't move in lockstep.
  if (waveMotionAmplitude > 0) {
    const perPointPhase =
      waveMotionVariation > 0
        ? pseudoHash(randomSeed + 821, Math.floor(x / 45), Math.floor(y / 45)) * waveMotionVariation * Math.PI * 2
        : 0;
    intervalPhaseOffset +=
      Math.sin(time * waveMotionSpeed * motionFreqEffective + waveMotionPhaseOffset + perPointPhase) *
      waveMotionAmplitude *
      Math.PI;
  }

  let radialFactor = 1.0;
  if (radialThickness !== 0) {
    const dNorm = Math.min(1.0, rDist / Math.max(1, maxDim));
    radialFactor = 1.0 + radialThickness * (0.5 - dNorm) * 2.0;
  }

  // Audio Reactivity — Second Wave ring thickness (item 5/6): existing rings continuously alternate
  // thick/thin based on their ring index, scaled by smoothedBeatIntensity (strong beats = more
  // pronounced alternation, quiet passages = subtler, silence = settles toward 1.0/no modulation).
  let secondWaveThicknessScale = 1.0;
  if (secondWaveActive) {
    const ringIndex = (rDist * baseFreq) / (2 * Math.PI);
    const thicknessWave = Math.sin(ringIndex * secondWaveFrequency - secondWavePhase + Math.PI / 2);
    secondWaveThicknessScale = Math.min(
      2.5,
      Math.max(0.25, 1.0 + thicknessWave * secondWaveThicknessInfluence * smoothedBeatIntensity)
    );
  }

  // Dynamic Visual Thickness (2D) — ported from the 3D Radial Wave's per-ring formula:
  //   thickness = min + (max-min) * (0.5 + 0.5*sin(time*speed + ringIndex*phaseOffset))
  // Operates on the SAME stable ringIndex as Wave Interval Variation above, so each concentric
  // wavefront (ring) carries its own independently animated width — Wave 1 thick, Wave 2 thin, etc.
  // — rather than a single global thickness value. Additive-only: factor is 1.0 (no-op) whenever
  // dynamicThickness.enabled is false, which is the default for every existing preset.
  let dynamicThicknessFactor = 1.0;
  if (dynamicThicknessEnabled) {
    switch (dynamicThicknessMode) {
      case 'uniform':
        dynamicThicknessFactor = dynamicThicknessBase;
        break;
      case 'radial_gradient': {
        const dNorm = Math.min(1.0, rDist / Math.max(1, maxDim));
        dynamicThicknessFactor = dynamicThicknessMin + (dynamicThicknessMax - dynamicThicknessMin) * dNorm;
        break;
      }
      case 'random': {
        const rnd = pseudoHash(randomSeed + 601, ringIndex, 13);
        dynamicThicknessFactor = dynamicThicknessMin + (dynamicThicknessMax - dynamicThicknessMin) * rnd;
        break;
      }
      case 'animated':
      default: {
        // Combine Random + Animated: a per-ring jitter offset folded into the oscillation phase, so
        // rings share the same sine sweep but drift out of sync with each other when Randomness > 0.
        const randJitter =
          dynamicThicknessRandomness > 0
            ? (pseudoHash(randomSeed + 601, ringIndex, 13) - 0.5) * dynamicThicknessRandomness * Math.PI
            : 0;
        const sinVal = Math.sin(
          time * dynamicThicknessAnimSpeed +
            ringIndex * dynamicThicknessFrequency * 1.5 +
            dynamicThicknessPhaseOffset +
            randJitter
        );
        dynamicThicknessFactor =
          dynamicThicknessMin + (dynamicThicknessMax - dynamicThicknessMin) * (0.5 + 0.5 * sinVal);
        break;
      }
    }

    // Audio Reactivity — Audio Thickness Influence (item 4): smoothly boosts/reduces the thickness of
    // the EXISTING rings with bass level; silence relaxes back toward the base modulation above. Never
    // spawns new rings and never overwrites the user's own min/max/mode settings — purely multiplicative.
    if (dynamicThicknessAudioInfluence > 0 && audioConfig?.enabled && audioSignal?.isActive) {
      const bassLevel = audioSignal.bass ?? 0;
      dynamicThicknessFactor = Math.max(0.05, dynamicThicknessFactor * (1.0 + bassLevel * dynamicThicknessAudioInfluence));
    }
  }

  const localThickness = Math.max(
    0.05,
    Math.min(
      6.0,
      frequencyThickness * radialFactor * sizeJitter * secondWaveThicknessScale * dynamicThicknessFactor
    )
  );
  const effectiveSoftness = Math.min(1.0, Math.max(0.05, waveSoftness * localThickness));

  const effectiveFreq = baseFreq * freqJitter;
  const effectiveAmp = baseAmp * ampJitter;

  let waveVal = 0;
  let dx = 0;
  let dy = 0;

  function evaluateShape(phase: number, softness: number): number {
    const wrapped = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    switch (waveType) {
      case 'sine':
        return 0.5 + 0.5 * Math.sin(phase);
      case 'pulse': {
        const norm = (wrapped - Math.PI) / Math.PI;
        const width = (0.1 + softness * 0.4) * sizeJitter;
        return Math.exp(-(norm * norm) / (width * width));
      }
      case 'burst': {
        const norm = wrapped / (2 * Math.PI);
        const burstShape = Math.pow(Math.max(0, 1.0 - norm), 2.2);
        return burstShape * (1.0 + 0.25 * Math.sin(phase * 3.0));
      }
      case 'square':
        return Math.sin(phase) > 0 ? 1 : 0;
      case 'gaussian': {
        const sinVal = Math.sin(phase);
        return Math.pow(Math.max(0, sinVal), 1.0 + (1.0 - softness) * 8.0);
      }
      default:
        return 0.5 + 0.5 * Math.sin(phase);
    }
  }

  if (pattern === 'circular') {
    const rx = x - ox1;
    const ry = y - oy1;
    const r = Math.sqrt(rx * rx + ry * ry) + 0.001;
    const phase = r * effectiveFreq - travelTimeTerm + intervalPhaseOffset;

    waveVal = evaluateShape(phase, effectiveSoftness) * localThickness;

    const dirX = rx / r;
    const dirY = ry / r;
    const dispMag = (waveVal - 0.5) * vectorDistortion * effectiveAmp * 20.0 * localThickness;
    dx = dirX * dispMag;
    dy = dirY * dispMag;

  } else if (pattern === 'linear') {
    const distAlongAngle = x * cosLinear + y * sinLinear;
    const phase = distAlongAngle * effectiveFreq - travelTimeTerm + intervalPhaseOffset;

    waveVal = evaluateShape(phase, effectiveSoftness) * localThickness;

    const dispMag = (waveVal - 0.5) * vectorDistortion * effectiveAmp * 20.0 * localThickness;
    dx = cosLinear * dispMag;
    dy = sinLinear * dispMag;

  } else if (pattern === 'market_chart') {
    // Discrete column bins for financial chart bar / candlestick effect
    const colStep = 28.0;
    const colId = Math.floor(x / colStep);

    // Multi-frequency financial trend curves: macro trend + medium swings + high frequency market ticks
    const macroTrend = Math.sin(colId * 0.15 + time * effectiveSpeed * 0.35) * 0.42;
    const mediumSwing = Math.cos(colId * 0.52 - time * effectiveSpeed * 0.75) * 0.32;
    const microTick = Math.sin(colId * 1.65 + time * effectiveSpeed * 1.4) * 0.22;
    const volatility = macroTrend + mediumSwing + microTick;

    // Baseline chart line height in canvas that undulates up and down
    const baselineY = cy + volatility * canvasHeight * 0.32;
    const vertDist = y - baselineY;
    const chartBarPhase = Math.abs(vertDist) * effectiveFreq * 0.08 - time * effectiveSpeed + intervalPhaseOffset;

    const wrapped = ((chartBarPhase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const barProximity = Math.max(0, 1.0 - Math.abs(vertDist) / (canvasHeight * 0.3));

    // Wave intensity responds to proximity to fluctuating chart line & bar volume
    waveVal = (barProximity * 0.7 + (0.5 + 0.5 * Math.cos(wrapped)) * 0.3) * localThickness;

    // Strong vertical displacement: dots surge up and down like market price swings
    const dispY = (volatility * 50.0 + Math.sin(colId * 2.4 + time * effectiveSpeed * 1.8) * 16.0) * vectorDistortion * effectiveAmp * localThickness;
    const dispX = Math.cos(y * 0.02 + time * effectiveSpeed) * 3.0 * vectorDistortion;
    dx = dispX;
    dy = dispY;

  } else if (pattern === 'spiral') {
    const rx = x - ox1;
    const ry = y - oy1;
    const r = Math.sqrt(rx * rx + ry * ry) + 0.001;
    const angle = Math.atan2(ry, rx);

    const phase = (r * effectiveFreq + angle * 2.5) - travelTimeTerm + intervalPhaseOffset;
    waveVal = evaluateShape(phase, effectiveSoftness) * localThickness;

    const rotX = -ry / r;
    const rotY = rx / r;
    const dispMag = (waveVal - 0.5) * vectorDistortion * effectiveAmp * 20.0 * localThickness;
    dx = (rx / r + rotX * 0.5) * dispMag;
    dy = (ry / r + rotY * 0.5) * dispMag;

  } else if (pattern === 'interference') {
    const rx1 = x - ox1;
    const ry1 = y - oy1;
    const r1 = Math.sqrt(rx1 * rx1 + ry1 * ry1) + 0.001;
    const phase1 = r1 * effectiveFreq - travelTimeTerm + intervalPhaseOffset;
    const val1 = evaluateShape(phase1, effectiveSoftness);

    const rx2 = x - ox2;
    const ry2 = y - oy2;
    const r2 = Math.sqrt(rx2 * rx2 + ry2 * ry2) + 0.001;
    const phase2 = r2 * effectiveFreq - travelTimeTerm * 0.9 + intervalPhaseOffset;
    const val2 = evaluateShape(phase2, effectiveSoftness);

    waveVal = val1 * val2 * 1.2 * localThickness;
    waveVal = Math.min(1.5, Math.max(0, waveVal));

    const dispMag1 = (val1 - 0.5) * vectorDistortion * effectiveAmp * 12.0 * localThickness;
    const dispMag2 = (val2 - 0.5) * vectorDistortion * effectiveAmp * 12.0 * localThickness;

    dx = (rx1 / r1) * dispMag1 + (rx2 / r2) * dispMag2;
    dy = (ry1 / r1) * dispMag1 + (ry2 / r2) * dispMag2;
  }

  // Audio Reactivity — Second Wave radial movement (item 5): compresses/expands the EXISTING ring
  // positions outward from the primary origin. Purely additive on top of whatever pattern is active,
  // so it never spawns new rings — it just makes the ones already there breathe with the beat.
  if (secondWaveActive && (pattern === 'circular' || pattern === 'spiral')) {
    const rx = x - ox1;
    const ry = y - oy1;
    const r = Math.sqrt(rx * rx + ry * ry) + 0.001;
    const ringIndex = (rDist * baseFreq) / (2 * Math.PI);
    const movementAmount = 28.0 * secondWaveMovementStrength;
    const radialOffset =
      Math.sin(ringIndex * secondWaveFrequency - secondWavePhase) * movementAmount * smoothedBeatIntensity;
    dx += (rx / r) * radialOffset;
    dy += (ry / r) * radialOffset;
    waveVal += 0.5 * smoothedBeatIntensity * (0.5 + 0.5 * Math.sin(ringIndex * secondWaveFrequency - secondWavePhase));
  }

  // Audio Reactivity — Continuous Music Ripple (item 4): a travelling wavefront sampled from the
  // 256-sample rolling volume-history buffer, indexed by normalized distance from the primary
  // origin — new audio enters at the center (index 0) and propagates outward as history ages,
  // exactly like the source app's texture-sampled version, adapted to a plain array lookup here.
  if (musicRippleActive && audioSignal?.volumeHistory) {
    const hist = audioSignal.volumeHistory;
    const maxReach = Math.max(20, audioRippleWavelength);
    const normDist = rDist / maxReach;
    if (normDist >= 0 && normDist <= 1) {
      const idx = Math.min(255, Math.max(0, Math.floor(normDist * 255)));
      let v = hist[idx];
      if (audioRippleHarmonics > 1) {
        const idx2 = Math.floor((normDist * 2 * 255) % 256);
        v += hist[idx2] * 0.35;
      }
      if (audioRippleHarmonics > 2) {
        const idx3 = Math.floor((normDist * 3 * 255) % 256);
        v += hist[idx3] * 0.2;
      }
      const distFade = 1.0 - normDist * 0.3;
      const rippleVal = v * audioRippleStrength * distFade;

      waveVal += rippleVal;

      const rx = x - ox1;
      const ry = y - oy1;
      const r = Math.sqrt(rx * rx + ry * ry) + 0.001;
      dx += (rx / r) * (rippleVal * 25.0 * vectorDistortion);
      dy += (ry / r) * (rippleVal * 25.0 * vectorDistortion);
    }
  }

  if (out) {
    out.value = waveVal;
    out.displacementX = dx;
    out.displacementY = dy;
    return out;
  }

  return {
    value: waveVal,
    displacementX: dx,
    displacementY: dy
  };
}
