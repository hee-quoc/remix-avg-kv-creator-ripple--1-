import { WaveConfig } from '../types';

export interface WaveResult {
  // Wave scalar intensity in range [0, 1]
  value: number;
  // Displacement vector (dx, dy) in pixels
  displacementX: number;
  displacementY: number;
}

export interface AudioSignal {
  rmsVolume: number;
  bass: number;
  mid: number;
  treble: number;
  isActive: boolean;
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
  waveThicknessAnimEnabled: boolean;
  waveThicknessMin: number;
  waveThicknessMax: number;
  thicknessFreqEffective: number;
  waveThicknessVariation: number;
  waveThicknessAnimSpeed: number;
  waveThicknessRandomness: number;
  waveMotionAmplitude: number;
  waveMotionSpeed: number;
  motionFreqEffective: number;
  waveMotionPhaseOffset: number;
  waveMotionVariation: number;
}

export function createWaveFrameContext(
  canvasWidth: number,
  canvasHeight: number,
  time: number,
  config: WaveConfig,
  audioSignal?: AudioSignal
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
    waveThicknessAnimEnabled = false,
    waveThicknessMin = 0.5,
    waveThicknessMax = 1.5,
    waveThicknessFrequency = 1.0,
    waveThicknessVariation = 0.0,
    waveThicknessAnimSpeed = 1.0,
    waveThicknessRandomness = 0.0,
    waveMotionFrequency = 1.0,
    waveMotionSpeed = 1.0,
    waveMotionAmplitude = 0.0,
    waveMotionPhaseOffset = 0.0,
    waveMotionVariation = 0.0
  } = config;

  let audioFactor = 0;
  if (soundReactivity > 0) {
    if (audioSignal && audioSignal.isActive) {
      let bandVal = audioSignal.rmsVolume;
      if (soundReactionBand === 'bass') bandVal = audioSignal.bass;
      else if (soundReactionBand === 'mid') bandVal = audioSignal.mid;
      else if (soundReactionBand === 'treble') bandVal = audioSignal.treble;
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

  const thicknessFreqEffective =
    frequencyMapping === 'thickness_only' || frequencyMapping === 'combined'
      ? waveThicknessFrequency * (1.0 + waveFrequency * freqThicknessInfluence)
      : waveThicknessFrequency;

  const motionFreqEffective =
    frequencyMapping === 'motion_only' || frequencyMapping === 'combined'
      ? waveMotionFrequency * (1.0 + waveFrequency * freqMotionInfluence)
      : waveMotionFrequency;

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
    effectiveSpeed: (waveSpeed * 4.0) * (1.0 + audioFactor * 0.8),
    baseFreq: (effectiveWaveFrequency * 0.05) * (1.0 + audioFactor * 0.4),
    baseAmp: waveAmplitude * (1.0 + audioFactor * 1.5),
    cosLinear: Math.cos(rad),
    sinLinear: Math.sin(rad),
    frequencyThickness,
    radialThickness,
    waveSoftness,
    vectorDistortion,
    frequencyVariation,
    amplitudeVariation,
    sizeRandomness,
    intervalVariation,
    randomSeed,
    time,
    waveThicknessAnimEnabled,
    waveThicknessMin,
    waveThicknessMax,
    thicknessFreqEffective,
    waveThicknessVariation,
    waveThicknessAnimSpeed,
    waveThicknessRandomness,
    waveMotionAmplitude,
    waveMotionSpeed,
    motionFreqEffective,
    waveMotionPhaseOffset,
    waveMotionVariation
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
  out?: WaveResult
): WaveResult {
  const ctx = frameCtx || createWaveFrameContext(canvasWidth, canvasHeight, time, config, audioSignal);
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
    waveThicknessAnimEnabled,
    waveThicknessMin,
    waveThicknessMax,
    thicknessFreqEffective,
    waveThicknessVariation,
    waveThicknessAnimSpeed,
    waveThicknessRandomness,
    waveMotionAmplitude,
    waveMotionSpeed,
    motionFreqEffective,
    waveMotionPhaseOffset,
    waveMotionVariation
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
  let intervalPhaseOffset = 0.0;
  if (intervalVariation > 0) {
    const basePhase = rDist * baseFreq - time * effectiveSpeed;
    const ringIndex = Math.round(basePhase / (2 * Math.PI));
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

  // Thickness Frequency (Advanced Frequency Control, item 1B) — additive-only, disabled by default
  // for every existing preset (waveThicknessAnimEnabled defaults false), so localThickness's original
  // formula below is unchanged unless a user explicitly enables it. Smooth continuous sinusoidal
  // modulation (not per-frame flicker), matching the reference: map(sin(t*speed*freq), -1,1, min,max).
  let advThicknessFactor = 1.0;
  if (waveThicknessAnimEnabled) {
    const perPointPhase =
      waveThicknessVariation > 0
        ? pseudoHash(randomSeed + 911, Math.floor(x / 50), Math.floor(y / 50)) * waveThicknessVariation * Math.PI * 2
        : 0;
    const randOffset =
      waveThicknessRandomness > 0
        ? (pseudoHash(randomSeed + 913, Math.floor(x / 70), Math.floor(y / 70)) - 0.5) * waveThicknessRandomness * Math.PI
        : 0;
    const sinVal = Math.sin(time * waveThicknessAnimSpeed * thicknessFreqEffective + perPointPhase + randOffset);
    advThicknessFactor = waveThicknessMin + (waveThicknessMax - waveThicknessMin) * (0.5 + 0.5 * sinVal);
  }

  const localThickness = Math.max(
    0.05,
    Math.min(6.0, frequencyThickness * radialFactor * sizeJitter * advThicknessFactor)
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
    const phase = r * effectiveFreq - time * effectiveSpeed + intervalPhaseOffset;

    waveVal = evaluateShape(phase, effectiveSoftness) * localThickness;

    const dirX = rx / r;
    const dirY = ry / r;
    const dispMag = (waveVal - 0.5) * vectorDistortion * effectiveAmp * 20.0 * localThickness;
    dx = dirX * dispMag;
    dy = dirY * dispMag;

  } else if (pattern === 'linear') {
    const distAlongAngle = x * cosLinear + y * sinLinear;
    const phase = distAlongAngle * effectiveFreq - time * effectiveSpeed + intervalPhaseOffset;

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

    const phase = (r * effectiveFreq + angle * 2.5) - time * effectiveSpeed + intervalPhaseOffset;
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
    const phase1 = r1 * effectiveFreq - time * effectiveSpeed + intervalPhaseOffset;
    const val1 = evaluateShape(phase1, effectiveSoftness);

    const rx2 = x - ox2;
    const ry2 = y - oy2;
    const r2 = Math.sqrt(rx2 * rx2 + ry2 * ry2) + 0.001;
    const phase2 = r2 * effectiveFreq - time * effectiveSpeed * 0.9 + intervalPhaseOffset;
    const val2 = evaluateShape(phase2, effectiveSoftness);

    waveVal = val1 * val2 * 1.2 * localThickness;
    waveVal = Math.min(1.5, Math.max(0, waveVal));

    const dispMag1 = (val1 - 0.5) * vectorDistortion * effectiveAmp * 12.0 * localThickness;
    const dispMag2 = (val2 - 0.5) * vectorDistortion * effectiveAmp * 12.0 * localThickness;

    dx = (rx1 / r1) * dispMag1 + (rx2 / r2) * dispMag2;
    dy = (ry1 / r1) * dispMag1 + (ry2 / r2) * dispMag2;
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
