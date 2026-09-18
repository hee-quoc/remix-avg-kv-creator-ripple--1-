import { SDFData, sampleSDF } from './sdf';
import { calculateWave, createWaveFrameContext, WaveFrameContext, WaveResult, AudioSignal } from './wave';
import { GridConfig, WaveConfig, FontConfig, StyleConfig, CustomSvgLayer, CustomSvgDistribution, CompositionMode, Radial3DConfig, ModularStripConfig } from '../types';

export const DESIGN_WIDTH = 1920;
export const DESIGN_HEIGHT = 1080;

export interface Particle {
  x: number;
  y: number;
  radius: number; // Canonical particle radius used consistently by Canvas and SVG renderers
  fillColor: string;
  opacity: number;
  shape: string;
  strokeWidth?: number;
  angleDeg?: number;
  width?: number;
  height?: number;
  customSvgXml?: string;
  parsedCustomSvgDoc?: Document | null;
  customLayers?: CustomSvgLayer[];
  assignedLayerIndices?: number[];
  char?: string;
  fontSize?: number;
  extrusionDepth?: number;
  extrusionAngle?: number;
  label?: string;
  stitchLength?: number;
  stitchThickness?: number;
  stitchSoftness?: number;
}

/**
 * Creates a shallow snapshot copy of current particle state without mutating original references.
 */
export function snapshotParticles(particles: Particle[]): Particle[] {
  return particles.map((p) => ({
    ...p,
    customLayers: p.customLayers ? p.customLayers.map((l) => ({ ...l })) : undefined,
    assignedLayerIndices: p.assignedLayerIndices ? [...p.assignedLayerIndices] : undefined
  }));
}

export interface CachedGridPoint {
  x0: number;
  y0: number;
  rowIdx: number;
  colIdx: number;
}

let cachedGridKey = '';
let cachedGridPoints: CachedGridPoint[] = [];

/**
 * Caches grid base coordinates so we avoid re-allocating 25k-35k points every animation frame.
 */
export function getCachedGridPoints(
  gridType: string,
  density: number,
  width: number,
  height: number,
  originX: number,
  originY: number
): CachedGridPoint[] {
  const isRadial = gridType === 'radial';
  const isHex = gridType === 'hexagonal';
  const key = `${gridType}_${density}_${width}_${height}_${isRadial ? `${originX.toFixed(3)}_${originY.toFixed(3)}` : ''}`;

  if (key === cachedGridKey && cachedGridPoints.length > 0) {
    return cachedGridPoints;
  }

  cachedGridKey = key;
  const points: CachedGridPoint[] = [];

  if (isRadial) {
    const cx = originX * width;
    const cy = originY * height;
    const maxR = Math.sqrt(width * width + height * height);
    const ringSpacing = Math.max(3, density);
    const numRings = Math.ceil(maxR / ringSpacing);

    for (let r = 1; r <= numRings; r++) {
      const radius = r * ringSpacing;
      const circumference = 2 * Math.PI * radius;
      const numDots = Math.max(6, Math.floor(circumference / ringSpacing));
      const angleStep = (2 * Math.PI) / numDots;

      for (let i = 0; i < numDots; i++) {
        const a = i * angleStep;
        points.push({
          x0: cx + Math.cos(a) * radius,
          y0: cy + Math.sin(a) * radius,
          rowIdx: r,
          colIdx: i
        });
      }
    }
  } else {
    const effDensity = Math.max(4, density);
    const rowHeight = isHex ? effDensity * (Math.sqrt(3) / 2) : effDensity;
    const cols = Math.ceil(width / effDensity) + 2;
    const rows = Math.ceil(height / rowHeight) + 2;

    for (let r = 0; r < rows; r++) {
      const y0 = r * rowHeight;
      const rowOffset = isHex && r % 2 === 1 ? effDensity / 2 : 0;
      for (let c = 0; c < cols; c++) {
        points.push({
          x0: c * effDensity + rowOffset,
          y0,
          rowIdx: r,
          colIdx: c
        });
      }
    }
  }

  cachedGridPoints = points;
  return points;
}

// 256-step Color Gradient Lookup Table to eliminate thousands of string parsing calls per frame
let cachedLutKey = '';
let cachedGradientLUT: string[] = [];

export function getGradientLUT(c1: string, c2: string): string[] {
  const key = `${c1}_${c2}`;
  if (key === cachedLutKey && cachedGradientLUT.length === 256) {
    return cachedGradientLUT;
  }
  cachedLutKey = key;
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const lut = new Array<string>(256);
  for (let i = 0; i < 256; i++) {
    const w = i / 255;
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * w);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * w);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * w);
    lut[i] = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  cachedGradientLUT = lut;
  return lut;
}

// ASCII Charset Cache
let cachedCharsetRaw = '';
let cachedCharsetArray: string[] = [];

function getCachedCharset(raw: string): string[] {
  if (raw === cachedCharsetRaw && cachedCharsetArray.length > 0) {
    return cachedCharsetArray;
  }
  cachedCharsetRaw = raw;
  const parsed = raw.split(/\s+/).filter(Boolean);
  cachedCharsetArray = parsed.length > 0 ? parsed : ['0', '1', '+', '-'];
  return cachedCharsetArray;
}

const sharedWaveRes: WaveResult = { value: 0, displacementX: 0, displacementY: 0 };

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Deterministic pseudo-random float [0, 1)
 */
function prng(seed: number, i: number): number {
  const n = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Built-in default SVG layers for instant multi-layer custom dot shapes
 */
export const DEFAULT_CUSTOM_SVG_LAYERS: CustomSvgLayer[] = [
  {
    id: 'layer_star',
    name: '4-Point Star',
    svgXml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"/></svg>`,
    recolorMode: 'theme',
    scale: 1.0,
    rotationOffset: 0,
    opacity: 1.0,
    enabled: true
  },
  {
    id: 'layer_cross',
    name: 'Crosshair Plus',
    svgXml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 0h2v9h9v2h-9v9h-2v-9H2v-2h9V0z"/></svg>`,
    recolorMode: 'custom',
    customColor: '#00F0FF',
    scale: 0.8,
    rotationOffset: 45,
    opacity: 0.85,
    enabled: true
  },
  {
    id: 'layer_diamond',
    name: 'Diamond Sparkle',
    svgXml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L22 12L12 22L2 12Z"/></svg>`,
    recolorMode: 'theme',
    scale: 1.1,
    rotationOffset: 0,
    opacity: 0.9,
    enabled: false
  }
];

/**
 * Helper to recolor raw SVG XML string
 */
export function recolorSvgXml(
  rawXml: string,
  targetColor: string | null,
  recolorMode: 'original' | 'theme' | 'custom'
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawXml, 'image/svg+xml');
    if (doc.getElementsByTagName('parsererror').length > 0) return rawXml;

    const svgEl = doc.querySelector('svg');
    if (!svgEl) return rawXml;

    // Ensure explicit width, height and viewBox so browser Image() loaders don't default to 300x150
    const viewBox = svgEl.getAttribute('viewBox');
    let w = parseFloat(svgEl.getAttribute('width') || '');
    let h = parseFloat(svgEl.getAttribute('height') || '');

    if (viewBox) {
      const parts = viewBox.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        if (isNaN(w) || w <= 0) {
          w = parts[2];
          svgEl.setAttribute('width', w.toString());
        }
        if (isNaN(h) || h <= 0) {
          h = parts[3];
          svgEl.setAttribute('height', h.toString());
        }
      }
    } else if (w > 0 && h > 0) {
      svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }

    if (recolorMode !== 'original' && targetColor) {
      const elements = doc.querySelectorAll('path, rect, circle, ellipse, polygon, polyline, line, shape, g, use');
      if (elements.length === 0) {
        svgEl.setAttribute('fill', targetColor);
      } else {
        elements.forEach((el) => {
          const fillAttr = el.getAttribute('fill');
          const strokeAttr = el.getAttribute('stroke');

          if (fillAttr !== 'none' && fillAttr !== 'transparent') {
            el.setAttribute('fill', targetColor);
          }
          if (strokeAttr && strokeAttr !== 'none' && strokeAttr !== 'transparent') {
            el.setAttribute('stroke', targetColor);
          }
        });
        if (!svgEl.getAttribute('fill') || svgEl.getAttribute('fill') === 'currentColor') {
          svgEl.setAttribute('fill', targetColor);
        }
      }
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(doc);
  } catch (e) {
    return rawXml;
  }
}

// In-memory HTML5 Image cache for blazingly fast 60 FPS Canvas rendering of SVG layers
const svgImageCache = new Map<string, HTMLImageElement>();

export function getOrCacheSvgImage(
  layer: CustomSvgLayer,
  color: string
): HTMLImageElement | null {
  const targetColor =
    layer.recolorMode === 'custom'
      ? layer.customColor || '#00F0FF'
      : layer.recolorMode === 'theme'
      ? color
      : null;

  const cacheKey = `${layer.id}_${layer.recolorMode}_${targetColor || 'orig'}`;

  let img = svgImageCache.get(cacheKey);
  if (!img) {
    img = new Image();
    const processedXml = recolorSvgXml(layer.svgXml, targetColor, layer.recolorMode);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(processedXml);
    svgImageCache.set(cacheKey, img);
  }

  return img.complete && img.naturalWidth > 0 ? img : null;
}

// ============================================================================
// 3D RADIAL WAVE MODE
// A dedicated point-generation path (concentric rings projected through a lightweight 3D rotation)
// that feeds the SAME Particle[] pipeline and material shape renderers used everywhere else in the
// app — no parallel rendering engine. Selected via wave.pattern === 'radial_3d'.
// ============================================================================

export const DEFAULT_RADIAL3D_CONFIG: Radial3DConfig = {
  ringCount: 20,
  baseRadius: 40,
  ringSpacing: 17,
  angularResolutionDeg: 10,
  depthDisplacement: 50,
  thicknessAnimEnabled: true,
  minThickness: 0.5,
  maxThickness: 5,
  thicknessFrequency: 1.5,
  thicknessPhaseOffset: 0,
  thicknessSpeed: 1.0,
  thicknessRandomness: 0,
  zMotionFrequency: 1.2,
  zMotionSpeed: 1.0,
  zPhaseDifference: 0,
  zMotionDirection: 1,
  rotationX: 66,
  rotationY: 0,
  rotationZ: 0,
  perspective: 900,
  material: 'line',
  lineThickness: 2,
  dotSize: 3,
  asciiCharset: '0 1 + - * / . :',
  asciiSizeVariation: 0.3,
  stitchLength: 14,
  stitchAngleFollowsRing: true
};

interface CachedRadialAnglePoint {
  ringIdx: number;
  angle: number;
}

let cachedRadial3DKey = '';
let cachedRadial3DAngles: CachedRadialAnglePoint[] = [];

/** Caches static ring/angle geometry so only animated properties (thickness, Z, rotation) are recomputed each frame. */
function getCachedRadial3DPoints(ringCount: number, angularResolutionDeg: number): CachedRadialAnglePoint[] {
  const key = `${ringCount}_${angularResolutionDeg}`;
  if (key === cachedRadial3DKey && cachedRadial3DAngles.length > 0) {
    return cachedRadial3DAngles;
  }
  cachedRadial3DKey = key;
  const points: CachedRadialAnglePoint[] = [];
  const stepDeg = Math.max(1, angularResolutionDeg);
  const numAngles = Math.max(4, Math.round(360 / stepDeg));
  const angleStep = (Math.PI * 2) / numAngles;
  for (let ring = 0; ring < Math.max(1, ringCount); ring++) {
    for (let a = 0; a < numAngles; a++) {
      points.push({ ringIdx: ring, angle: a * angleStep });
    }
  }
  cachedRadial3DAngles = points;
  return points;
}

/**
 * Rotates a 3D point around X, then Y, then Z axes (degrees). Deliberately a lightweight Euler
 * rotation + perspective divide rather than a full 3D framework, per the performance requirement.
 */
function rotatePoint3D(x: number, y: number, z: number, rxDeg: number, ryDeg: number, rzDeg: number) {
  const rx = (rxDeg * Math.PI) / 180;
  const ry = (ryDeg * Math.PI) / 180;
  const rz = (rzDeg * Math.PI) / 180;

  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  const x1 = x;

  const x2 = x1 * Math.cos(ry) + z1 * Math.sin(ry);
  const z2 = -x1 * Math.sin(ry) + z1 * Math.cos(ry);
  const y2 = y1;

  const x3 = x2 * Math.cos(rz) - y2 * Math.sin(rz);
  const y3 = x2 * Math.sin(rz) + y2 * Math.cos(rz);
  const z3 = z2;

  return { x: x3, y: y3, z: z3 };
}

const RADIAL3D_DIAMOND_LAYER: CustomSvgLayer = {
  id: 'radial3d_diamond',
  name: 'Diamond',
  svgXml: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L22 12L12 22L2 12Z"/></svg>`,
  recolorMode: 'theme',
  scale: 1.0,
  rotationOffset: 0,
  opacity: 1.0,
  enabled: true
};

/**
 * Computes particles for the 3D Radial Wave mode. Time-based (not frame-based) animation so speed
 * stays consistent across frame rates. Material switching only changes which `particle.shape` /
 * fields get populated below — geometry, thickness, motion and rotation stay identical.
 */
export function computeRadial3DParticles(
  wave: WaveConfig,
  style: StyleConfig,
  width: number,
  height: number,
  time: number
): Particle[] {
  const cfg: Radial3DConfig = { ...DEFAULT_RADIAL3D_CONFIG, ...(wave.radial3D || {}) };
  const particles: Particle[] = [];
  const seed = wave.randomSeed || 42;

  const cx = wave.originX * width;
  const cy = wave.originY * height;
  const dotColor = style.dotColor;
  const gradientColor = style.enableColorGradient ? style.gradientColor : dotColor;
  const gradientLUT =
    style.enableColorGradient && !style.uniformColorBrightness ? getGradientLUT(dotColor, gradientColor) : null;

  const ringPoints = getCachedRadial3DPoints(cfg.ringCount, cfg.angularResolutionDeg);
  const numAnglesPerRing = Math.max(4, Math.round(360 / Math.max(1, cfg.angularResolutionDeg)));

  const effectiveCharset = cfg.material === 'ascii' ? getCachedCharset(cfg.asciiCharset || '0 1 + - * / . :') : null;

  let materialLayers: CustomSvgLayer[] | undefined;
  if (cfg.material === 'diamond') {
    materialLayers = [RADIAL3D_DIAMOND_LAYER];
  } else if (cfg.material === 'custom_svg') {
    const uploaded = (cfg.customSvgLayers || []).filter((l) => l.enabled !== false && l.svgXml);
    materialLayers = uploaded.length > 0 ? uploaded : [RADIAL3D_DIAMOND_LAYER];
  }

  const perspBase = cfg.perspective;

  for (let i = 0; i < ringPoints.length; i++) {
    const { ringIdx, angle } = ringPoints[i];
    const radius = cfg.baseRadius + ringIdx * cfg.ringSpacing;

    // Dynamic thickness animation — smooth continuous sinusoidal modulation (time-based), matching
    // the reference's map(sin(t*speed + i*freq), -1,1, min,max) spirit. Disabling it yields a fixed
    // mid-value thickness.
    let thickness: number;
    if (cfg.thicknessAnimEnabled) {
      const randJitter =
        cfg.thicknessRandomness > 0 ? (prng(seed + 301, ringIdx) - 0.5) * cfg.thicknessRandomness * Math.PI : 0;
      const thicknessPhase =
        time * cfg.thicknessSpeed + ringIdx * cfg.thicknessFrequency * 1.5 + cfg.thicknessPhaseOffset + randJitter;
      const sinVal = Math.sin(thicknessPhase);
      thickness = cfg.minThickness + (cfg.maxThickness - cfg.minThickness) * (0.5 + 0.5 * sinVal);
    } else {
      thickness = (cfg.minThickness + cfg.maxThickness) / 2;
    }

    // Z-axis depth displacement — own phase per ring so motion feels organic, not synchronized.
    const zPhase = time * cfg.zMotionSpeed + ringIdx * cfg.zMotionFrequency * 1.2 + cfg.zPhaseDifference * ringIdx;
    const z = Math.sin(zPhase) * cfg.depthDisplacement * cfg.zMotionDirection;

    const x3 = Math.cos(angle) * radius;
    const y3 = Math.sin(angle) * radius;
    const rotated = rotatePoint3D(x3, y3, z, cfg.rotationX, cfg.rotationY, cfg.rotationZ);

    const persp = perspBase / Math.max(50, perspBase + rotated.z);
    const screenX = cx + rotated.x * persp;
    const screenY = cy + rotated.y * persp;

    // Tangent direction in screen space (for line/stitch materials), via a nearby rotated sample.
    const tanAngle = angle + 0.02;
    const tanX3 = Math.cos(tanAngle) * radius;
    const tanY3 = Math.sin(tanAngle) * radius;
    const rotatedTan = rotatePoint3D(tanX3, tanY3, z, cfg.rotationX, cfg.rotationY, cfg.rotationZ);
    const perspTan = perspBase / Math.max(50, perspBase + rotatedTan.z);
    const tanScreenX = cx + rotatedTan.x * perspTan;
    const tanScreenY = cy + rotatedTan.y * perspTan;
    const angleDeg = (Math.atan2(tanScreenY - screenY, tanScreenX - screenX) * 180) / Math.PI;

    // Depth-based scale/opacity cue — points further back appear smaller/dimmer (cheap pseudo-3D).
    const depthScale = Math.max(0.4, Math.min(1.6, persp));
    const opacity = style.uniformColorBrightness
      ? 1.0
      : Math.max(0.25, Math.min(1.0, 0.55 + (depthScale - 1.0) * 0.6));

    let fillColor = dotColor;
    if (style.enableMultiColor && style.multiColorPalette && style.multiColorPalette.length > 0) {
      const pal = style.multiColorPalette;
      const dist = style.multiColorDistribution || 'palette_list';
      if (dist === 'random') {
        fillColor = pal[Math.abs((i * 2654435761 + seed) | 0) % pal.length];
      } else if (dist === 'gradient_based') {
        const t = Math.max(0, Math.min(0.999, (thickness - cfg.minThickness) / Math.max(0.001, cfg.maxThickness - cfg.minThickness)));
        fillColor = pal[Math.floor(t * pal.length)];
      } else {
        // 'grouped' and default 'palette_list': color follows the ring index
        fillColor = pal[ringIdx % pal.length];
      }
    } else if (gradientLUT) {
      const t = Math.max(0, Math.min(1, ringIdx / Math.max(1, cfg.ringCount - 1)));
      fillColor = gradientLUT[Math.floor(t * 255)];
    }

    const particle: Particle = {
      x: screenX,
      y: screenY,
      radius: Math.max(0.4, thickness * (cfg.dotSize / 2)),
      fillColor,
      opacity,
      shape: 'circle'
    };

    if (cfg.material === 'line') {
      particle.shape = 'concentric_arc';
      particle.angleDeg = angleDeg;
      const arcLen = Math.max(2, radius * ((Math.PI * 2) / numAnglesPerRing) * depthScale * 1.15);
      particle.width = arcLen;
      particle.height = Math.max(0.6, thickness * (cfg.lineThickness / 2));
    } else if (cfg.material === 'dot_matrix') {
      particle.shape = 'circle';
      particle.radius = Math.max(0.5, thickness * 0.5 * (cfg.dotSize / 2) * depthScale);
    } else if (cfg.material === 'ascii' && effectiveCharset) {
      particle.shape = 'ascii';
      particle.char = effectiveCharset[Math.abs((ringIdx * 7 + i) | 0) % effectiveCharset.length];
      particle.fontSize = Math.max(6, (8 + thickness * 3) * (1 + (cfg.asciiSizeVariation || 0) * (depthScale - 1)));
    } else if ((cfg.material === 'diamond' || cfg.material === 'custom_svg') && materialLayers) {
      particle.shape = 'custom_svg';
      particle.customLayers = materialLayers;
      particle.assignedLayerIndices = [i % materialLayers.length];
      particle.radius = Math.max(1, thickness * 1.6 * depthScale);
    } else if (cfg.material === 'stitch') {
      particle.shape = 'stitch';
      particle.angleDeg = cfg.stitchAngleFollowsRing ? angleDeg : (ringIdx % 2 === 0 ? 30 : -30);
      particle.width = Math.max(3, (cfg.stitchLength || 14) * depthScale);
      particle.height = Math.max(1, thickness * 0.8);
      particle.stitchLength = cfg.stitchLength;
      particle.stitchThickness = thickness * 0.8;
      particle.stitchSoftness = 0.2;
    }

    particles.push(particle);
  }

  return particles;
}

// ============================================================================
// MODULAR SIGNAL FIELD (Breaking Signal redesign)
// A field of staggered vertical color-block strips layered over crisp typography — fragmented
// transmission / scanning motion rather than the letterform-masked dot particle system. Reuses the
// same Particle[] pipeline; only compositionMode === 'modular_signal_field' opts into this path, so
// every other preset (which never sets that mode) is completely unaffected.
// ============================================================================

export const DEFAULT_MODULAR_STRIP_CONFIG: ModularStripConfig = {
  barWidth: 26,
  heightMin: 40,
  heightMax: 220,
  density: 10,
  spacing: 6,
  columnCount: 26,
  verticalOffsetAmount: 30,
  staggerAmount: 0.7,
  clusterSize: 3,
  overlapIntensity: 0.95,
  animSpeed: 1.0,
  offsetTiming: 0.6,
  movementAmplitude: 60,
  verticalMotionAmount: 1.0,
  horizontalDriftAmount: 4,
  loopSpeed: 1.0,
  randomnessAmount: 0.3,
  syncVsStagger: 0.85
};

/**
 * Computes particles for the Modular Signal Field mode. Time-based (not frame-based) so speed stays
 * consistent across frame rates. Deliberately bypasses the text-masked grid entirely — the "text" in
 * this mode comes from the independent Original Text / KV Layout layer (drawn separately, underneath
 * these strips), not from particles, per the "masking/interruption, not letterform particles" brief.
 */
export function computeModularStripParticles(
  grid: GridConfig,
  wave: WaveConfig,
  style: StyleConfig,
  width: number,
  height: number,
  time: number
): Particle[] {
  const cfg: ModularStripConfig = { ...DEFAULT_MODULAR_STRIP_CONFIG, ...(grid.modularStrip || {}) };
  const particles: Particle[] = [];
  const seed = wave.randomSeed || 42;

  const dotColor = style.dotColor;
  const gradientColor = style.enableColorGradient ? style.gradientColor : dotColor;
  const gradientLUT =
    style.enableColorGradient && !style.uniformColorBrightness ? getGradientLUT(dotColor, gradientColor) : null;

  const columnCount = Math.max(1, Math.round(cfg.columnCount));
  const density = Math.max(1, Math.round(cfg.density));
  const clusterSize = Math.max(1, Math.round(cfg.clusterSize));
  const cellW = width / columnCount;
  const cellH = height / density;
  const drawWidth = Math.max(1, Math.min(cfg.barWidth, cellW - cfg.spacing));

  let particleIndex = 0;

  for (let col = 0; col < columnCount; col++) {
    const clusterIdx = Math.floor(col / clusterSize);
    const colCenterX = (col + 0.5) * cellW;

    for (let seg = 0; seg < density; seg++) {
      const cellCenterY = (seg + 0.5) * cellH;

      // Phase blends fully synchronized motion (syncVsStagger=0) with fully staggered, per-cluster/
      // per-segment offset motion (syncVsStagger=1) — "staggered, modular, rhythmically offset."
      const staggerPhase = clusterIdx * cfg.staggerAmount * 2.4 + seg * 0.35 + cfg.offsetTiming * clusterIdx;
      const phase = time * cfg.animSpeed * cfg.loopSpeed + staggerPhase * cfg.syncVsStagger;

      const randVal = prng(seed + 777, col * 1000 + seg);
      const randJitter = (randVal - 0.5) * cfg.randomnessAmount;

      const vertOffset =
        Math.sin(phase + randJitter * Math.PI) * cfg.movementAmplitude * cfg.verticalMotionAmount +
        (randVal - 0.5) * cfg.verticalOffsetAmount;
      const horizDrift = Math.cos(phase * 0.6 + col) * cfg.horizontalDriftAmount;

      const segH = cfg.heightMin + (cfg.heightMax - cfg.heightMin) * prng(seed + 881, col * 57 + seg);

      const x = colCenterX + horizDrift;
      const y = cellCenterY + vertOffset;

      let fillColor = dotColor;
      if (style.enableMultiColor && style.multiColorPalette && style.multiColorPalette.length > 0) {
        const pal = style.multiColorPalette;
        const dist = style.multiColorDistribution || 'palette_list';
        if (dist === 'random') {
          fillColor = pal[Math.abs((particleIndex * 2654435761 + seed) | 0) % pal.length];
        } else if (dist === 'grouped') {
          fillColor = pal[col % pal.length];
        } else if (dist === 'gradient_based') {
          const t = Math.max(0, Math.min(0.999, seg / Math.max(1, density - 1)));
          fillColor = pal[Math.floor(t * pal.length)];
        } else {
          // 'palette_list': rhythmic sequential assignment across columns & segments
          fillColor = pal[(col + seg) % pal.length];
        }
      } else if (gradientLUT) {
        const t = Math.max(0, Math.min(1, col / Math.max(1, columnCount - 1)));
        fillColor = gradientLUT[Math.floor(t * 255)];
      }

      particles.push({
        x,
        y,
        radius: drawWidth / 2,
        fillColor,
        opacity: Math.max(0.05, Math.min(1, cfg.overlapIntensity)),
        shape: 'modular_strip',
        width: drawWidth,
        height: Math.max(3, segH)
      });
      particleIndex++;
    }
  }

  return particles;
}

/**
 * Computes all particles for the halftone kinetic grid based on current parameters.
 * Canonical source of particle positions, sizes (particle.radius), colors, and geometry.
 * Operates in logical design coordinate space (1920x1080).
 */
export function computeParticles(
  sdf: SDFData,
  grid: GridConfig,
  wave: WaveConfig,
  font: FontConfig,
  style: StyleConfig,
  width: number = DESIGN_WIDTH,
  height: number = DESIGN_HEIGHT,
  time: number = 0,
  parsedCustomSvgDoc?: Document | null,
  compositionMode: CompositionMode = 'full_molecule',
  audioSignal?: AudioSignal
): Particle[] {
  // Modular Signal Field (Breaking Signal redesign) uses its own dedicated point-generation path —
  // staggered vertical strips, not the text-masked grid below. Gated on compositionMode so no other
  // preset (which never sets it) is affected.
  if (compositionMode === 'modular_signal_field') {
    return computeModularStripParticles(grid, wave, style, width, height, time);
  }

  // 3D Radial Wave mode uses its own dedicated point-generation path (concentric rings projected
  // through a lightweight 3D rotation) rather than the text-masked grid below — see
  // computeRadial3DParticles. It still returns the same Particle[] shape consumed by every renderer.
  if (wave.pattern === 'radial_3d') {
    return computeRadial3DParticles(wave, style, width, height, time);
  }

  const particles: Particle[] = [];

  const isHex = grid.gridType === 'hexagonal';
  const isRadial = grid.gridType === 'radial';
  const dotColor = style.dotColor;
  const gradientColor = style.enableColorGradient ? style.gradientColor : dotColor;
  const isWaveOnly = compositionMode === 'molecule_wave_only';

  // Extract active Custom SVG Layers
  let activeCustomLayers: CustomSvgLayer[] = (grid.customSvgLayers || []).filter(
    (l) => l.enabled !== false && l.svgXml
  );

  if (activeCustomLayers.length === 0 && grid.customSvgXml) {
    activeCustomLayers = [
      {
        id: 'legacy_custom_layer',
        name: grid.customSvgName || 'Custom SVG',
        svgXml: grid.customSvgXml,
        dataUrl: grid.customSvgDataUrl,
        recolorMode: 'theme',
        scale: 1.0,
        rotationOffset: 0,
        opacity: 1.0,
        enabled: true
      }
    ];
  }

  const distributionMode: CustomSvgDistribution = grid.customSvgDistribution || 'cycle';

  // Prepare cached ASCII character set
  const rawCharset = grid.asciiCharset || '0 1 + - * / . :';
  const effectiveCharset = getCachedCharset(rawCharset);

  // Use cached grid points (avoids creating 25,000+ point objects per frame)
  const points = getCachedGridPoints(grid.gridType, grid.density, width, height, wave.originX, wave.originY);

  const threshold = grid.sdfThreshold * 20.0;
  const softness = grid.sdfSoftness * 15.0 + 1.0;
  const seed = wave.randomSeed || 42;

  // Pre-calculate frame-wide wave constants
  const waveFrameCtx = createWaveFrameContext(width, height, time, wave, audioSignal);

  // Pre-calculate color gradient LUT if gradient is enabled
  const gradientLUT = style.enableColorGradient && !style.uniformColorBrightness ? getGradientLUT(dotColor, gradientColor) : null;

  let particleIndex = 0;

  for (let pi = 0; pi < points.length; pi++) {
    const { x0, y0, rowIdx, colIdx } = points[pi];
    calculateWave(x0, y0, width, height, time, wave, audioSignal, waveFrameCtx, sharedWaveRes);

    let x = x0;
    let y = y0;

    if (wave.mode === 'flow') {
      const blend = 1.0 - wave.blendBack;
      x += sharedWaveRes.displacementX * blend;
      y += sharedWaveRes.displacementY * blend;
    }

    // Determine normalized distance / particle presence
    let normalizedDist = 0;

    if (isWaveOnly) {
      // Feature A: Molecule Wave Only Mode
      const waveIntensity = Math.min(1.0, Math.max(0.0, sharedWaveRes.value));
      normalizedDist = 0.2 + waveIntensity * 0.8;
      if (grid.hideBackgroundDots && waveIntensity < 0.15) {
        continue;
      }
    } else {
      // Standard Typography Masked Mode
      const sampleX = wave.mode === 'flow' ? x0 + (x - x0) * wave.blendBack : x0;
      const sampleY = wave.mode === 'flow' ? y0 + (y - y0) * wave.blendBack : y0;

      const sdfDist = sampleSDF(sdf, sampleX, sampleY, width, height);
      const distVal = font.invertText ? -sdfDist : sdfDist;

      normalizedDist = (distVal + threshold) / softness;
      normalizedDist = Math.max(0, Math.min(1, normalizedDist));

      if (grid.hideBackgroundDots && normalizedDist <= 0.01) {
        continue;
      }
    }

    const effectiveMinRadius = grid.hideBackgroundDots ? 0 : grid.minRadius;
    const baseRadius = effectiveMinRadius + (grid.maxRadius - effectiveMinRadius) * normalizedDist;

    if (baseRadius <= 0.01 && normalizedDist <= 0.01) {
      continue;
    }

    const waveBoost = wave.waveAmplitude * sharedWaveRes.value * 0.85;
    const finalRadius = Math.max(0.0, baseRadius * (1.0 + waveBoost));

    if (finalRadius < 0.2) {
      continue;
    }

    const opacity = style.uniformColorBrightness ? 1.0 : Math.min(1.0, Math.max(0.05, 0.35 + sharedWaveRes.value * 0.65));

    let fillColor = dotColor;
    if (style.enableMultiColor && style.multiColorPalette && style.multiColorPalette.length > 0) {
      const pal = style.multiColorPalette;
      const dist = style.multiColorDistribution || 'palette_list';
      if (dist === 'random') {
        const h = Math.abs((particleIndex * 2654435761 + seed) | 0);
        fillColor = pal[h % pal.length];
      } else if (dist === 'grouped') {
        const groupIdx = Math.floor((x0 / width) * pal.length);
        fillColor = pal[Math.max(0, Math.min(pal.length - 1, groupIdx))];
      } else if (dist === 'gradient_based') {
        const valNorm = Math.max(0, Math.min(0.999, sharedWaveRes.value));
        fillColor = pal[Math.floor(valNorm * pal.length)];
      } else {
        // 'palette_list' (sequential by column + row)
        fillColor = pal[(colIdx + rowIdx) % pal.length];
      }
    } else if (gradientLUT) {
      const lutIdx = (sharedWaveRes.value * 255) | 0;
      fillColor = gradientLUT[lutIdx < 0 ? 0 : lutIdx > 255 ? 255 : lutIdx];
    }

    // Determine Custom SVG layer assignment
    let assignedLayerIndices: number[] | undefined;
    if (grid.dotShape === 'custom_svg' && activeCustomLayers.length > 0) {
      if (distributionMode === 'stacked') {
        assignedLayerIndices = activeCustomLayers.map((_, idx) => idx);
      } else if (distributionMode === 'random') {
        const hash = Math.abs((particleIndex * 2654435761) | 0);
        assignedLayerIndices = [hash % activeCustomLayers.length];
      } else if (distributionMode === 'size_tier') {
        const tier = Math.min(
          activeCustomLayers.length - 1,
          Math.floor(normalizedDist * activeCustomLayers.length)
        );
        assignedLayerIndices = [tier];
      } else {
        // 'cycle'
        assignedLayerIndices = [particleIndex % activeCustomLayers.length];
      }
    }

    // Feature C: ASCII character selection
    let charVal: string | undefined;
    let asciiSize: number | undefined;

    if (grid.dotShape === 'ascii' || style.visualStyle === 'ascii_flow' || style.visualStyle === 'binary_typography') {
      const distType = grid.asciiDistribution || 'grid';
      let charIdx = 0;
      if (distType === 'random') {
        charIdx = Math.floor(prng(seed, particleIndex) * effectiveCharset.length);
      } else if (distType === 'flow') {
        const flowHash = Math.floor((sharedWaveRes.value * 8.0 + (x0 + y0) / 100)) % effectiveCharset.length;
        charIdx = (flowHash + effectiveCharset.length) % effectiveCharset.length;
      } else if (distType === 'radial') {
        charIdx = (rowIdx + colIdx) % effectiveCharset.length;
      } else {
        charIdx = (colIdx + rowIdx * 3) % effectiveCharset.length;
      }
      charVal = effectiveCharset[charIdx];
      const baseFontSize = grid.asciiFontSize || 14;
      asciiSize = grid.asciiVariableSize ? Math.max(8, baseFontSize * (0.6 + sharedWaveRes.value * 0.8)) : baseFontSize;
    }

    // Data Constellation telemetry label for prominent nodes
    let labelVal: string | undefined;
    if (style.visualStyle === 'data_constellation' && style.constellationShowLabels) {
      if (particleIndex % 28 === 0 && sharedWaveRes.value > 0.45) {
        const labelPool = ['NODE_01', 'NODE_02', 'PULSE_7', 'FREQ_A', 'FREQ_B', '88.4%', 'GRID_X', 'RADAR', '720HZ', 'TX_9'];
        labelVal = labelPool[(particleIndex / 28) % labelPool.length];
      }
    }

    const particle: Particle = {
      x,
      y,
      radius: finalRadius,
      fillColor,
      opacity,
      shape: grid.dotShape,
      customSvgXml: grid.customSvgXml,
      parsedCustomSvgDoc,
      customLayers: activeCustomLayers.length > 0 ? activeCustomLayers : undefined,
      assignedLayerIndices,
      char: charVal,
      fontSize: asciiSize,
      extrusionDepth: style.extrusionDepth,
      extrusionAngle: style.extrusionAngle,
      label: labelVal
    };

    if (grid.dotShape === 'ring') {
      particle.strokeWidth = Math.max(1, finalRadius * 0.35);
    } else if (grid.dotShape === 'concentric_arc' || grid.dotShape === 'wave_ripple') {
      const ox = wave.originX * width;
      const oy = wave.originY * height;
      const dx = x - ox;
      const dy = y - oy;
      particle.angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      particle.width = Math.max(1.5, finalRadius * 2.5 * (wave.wavefrontArcLength ?? 1.0));
      particle.height = Math.max(1, finalRadius * 0.8 * (wave.wavefrontCurveWidth ?? 1.2));
    } else if (grid.dotShape === 'tangent_line') {
      const ox = wave.originX * width;
      const oy = wave.originY * height;
      const dx = x - ox;
      const dy = y - oy;
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (grid.lineDirection === 'radial') {
        angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      } else if (grid.lineDirection === 'linear') {
        angle = grid.lineAngle ?? wave.linearAngle ?? 45;
      }
      particle.angleDeg = angle;
      const lengthMult = grid.lineLength ?? 3.5;
      const thickVal = grid.lineThickness ?? Math.max(1, finalRadius * 0.5);
      particle.width = Math.max(2.0, finalRadius * lengthMult * (wave.wavefrontArcLength ?? 1.0));
      particle.height = Math.max(0.8, thickVal * (wave.wavefrontCurveWidth ?? 1.0));
    } else if (grid.dotShape === 'stitch' || style.visualStyle === 'stitch_craft') {
      const baseLen = (grid.stitchLength ?? 16) * (finalRadius / Math.max(1, grid.maxRadius * 0.7));
      const baseThick = grid.stitchThickness ?? Math.max(1.5, finalRadius * 0.35);

      // Angle calculation based on stitchAngleMode
      const mode = grid.stitchAngleMode || 'diagonal_sashiko';
      let angle = 35;
      if (mode === 'diagonal_sashiko') {
        angle = (rowIdx % 2 === 0 ? 1 : -1) * (grid.stitchAngle ?? 32);
      } else if (mode === 'cross_stitch') {
        angle = ((colIdx + rowIdx) % 2 === 0 ? 45 : -45) + (grid.stitchAngle ?? 0);
      } else if (mode === 'contour_flow') {
        const ox = wave.originX * width;
        const oy = wave.originY * height;
        angle = (Math.atan2(y - oy, x - ox) * 180) / Math.PI + (grid.stitchAngle ?? 0);
      } else if (mode === 'alternating_weave') {
        angle = ((rowIdx + colIdx) % 2 === 0 ? 0 : 90) + (grid.stitchAngle ?? 0);
      }

      // Dynamic thread tension animation inspired by reference logic
      let mult = 1.0;
      if (grid.stitchTensionAnim !== false) {
        const waveNorm = Math.min(1.0, Math.max(0.0, sharedWaveRes.value));
        mult = 1.0 + 1.6 * Math.sin(waveNorm * Math.PI);
      }

      particle.shape = 'stitch';
      particle.width = Math.max(3.0, baseLen * mult);
      particle.height = Math.max(1.0, baseThick);
      particle.angleDeg = angle;
      particle.stitchLength = baseLen;
      particle.stitchThickness = baseThick;
      particle.stitchSoftness = grid.stitchSoftness ?? 0.2;
    } else if (grid.dotShape === 'woven') {
      const isWarp = rowIdx % 2 === 0;
      const weaveLen = (grid.stitchLength ?? 14) * 1.4;
      const weaveThick = grid.stitchThickness ?? Math.max(2.0, finalRadius * 0.45);
      particle.shape = 'woven';
      particle.width = Math.max(4.0, weaveLen);
      particle.height = weaveThick;
      particle.angleDeg = isWarp ? 0 : 90;
    } else if (grid.dotShape === 'tile' || style.visualStyle === 'kinetic_vortex') {
      const ox = wave.originX * width;
      const oy = wave.originY * height;
      const dx = x - ox;
      const dy = y - oy;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const twist = (style.vortexTwist ?? 1.2) * (sharedWaveRes.value * 45);
      particle.angleDeg = angle + twist;
      particle.width = Math.max(2, finalRadius * 3.2);
      particle.height = Math.max(1.5, finalRadius * 1.4);
    }

    particles.push(particle);
    particleIndex++;
  }

  return particles;
}

/**
 * Renders Data Constellation connecting lines between nearby particles
 */
export function renderConstellationLinesToCanvas(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  maxDist: number = 55,
  lineColor: string = '#00f0ff'
): void {
  if (particles.length === 0 || maxDist <= 0) return;
  ctx.save();
  const maxD2 = maxDist * maxDist;

  // Render sparse connections (sample subset for 60fps performance)
  const step = particles.length > 2500 ? 3 : particles.length > 1200 ? 2 : 1;

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  let lineCount = 0;

  for (let i = 0; i < particles.length; i += step) {
    const p1 = particles[i];
    if (p1.opacity < 0.15) continue;

    // Check next neighbors
    for (let j = i + 1; j < Math.min(particles.length, i + 40); j++) {
      const p2 = particles[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < maxD2 && d2 > 16) {
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        lineCount++;
      }
    }
  }

  if (lineCount > 0) {
    ctx.globalAlpha = 0.22;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders Data Constellation connecting lines to an SVG Group
 */
export function renderConstellationLinesToSVG(
  svgGroup: SVGGElement,
  particles: Particle[],
  maxDist: number = 55,
  lineColor: string = '#00f0ff',
  svgDoc: Document
): void {
  if (particles.length === 0 || maxDist <= 0) return;
  const maxD2 = maxDist * maxDist;
  const step = particles.length > 2000 ? 4 : particles.length > 1000 ? 2 : 1;

  for (let i = 0; i < particles.length; i += step) {
    const p1 = particles[i];
    if (p1.opacity < 0.15) continue;

    for (let j = i + 1; j < Math.min(particles.length, i + 35); j++) {
      const p2 = particles[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const d2 = dx * dx + dy * dy;

      if (d2 < maxD2 && d2 > 16) {
        const dist = Math.sqrt(d2);
        const alpha = (1 - dist / maxDist) * 0.25 * Math.min(p1.opacity, p2.opacity);
        const line = svgDoc.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', p1.x.toFixed(2));
        line.setAttribute('y1', p1.y.toFixed(2));
        line.setAttribute('x2', p2.x.toFixed(2));
        line.setAttribute('y2', p2.y.toFixed(2));
        line.setAttribute('stroke', lineColor);
        line.setAttribute('stroke-width', '1');
        line.setAttribute('opacity', alpha.toFixed(3));
        svgGroup.appendChild(line);
      }
    }
  }
}

/**
 * Renders original typography layer for Molecule Wave Only / Editorial Collage modes on HTML5 Canvas
 */
export function renderOriginalTypographyToCanvas(
  ctx: CanvasRenderingContext2D,
  font: FontConfig,
  style: StyleConfig,
  canvasWidth: number,
  canvasHeight: number
): void {
  const text = font.text.trim();
  if (!text) return;

  ctx.save();

  const scale = style.editorialHeadlineScale ?? 1.0;
  const offsetX = style.editorialHeadlineOffsetX ?? 0;
  const offsetY = style.editorialHeadlineOffsetY ?? 0;
  const color = style.editorialHeadlineColor || '#ffffff';
  const opacity = style.editorialHeadlineOpacity ?? 1.0;

  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  const lines = text.split('\n');
  const baseFontSize = (font.fontSize || 120) * scale;
  const lineHeight = baseFontSize * (font.lineHeight || 0.95);
  const totalHeight = lines.length * lineHeight;

  const cx = canvasWidth * 0.5 + offsetX;
  const startY = canvasHeight * 0.5 - totalHeight * 0.5 + lineHeight * 0.8 + offsetY;

  ctx.font = `${font.fontWeight || 700} ${baseFontSize}px "${font.fontFamily}", sans-serif`;
  ctx.textAlign = font.textAlign || 'center';
  ctx.textBaseline = 'alphabetic';

  lines.forEach((line, index) => {
    const yPos = startY + index * lineHeight;
    ctx.fillText(line, cx, yPos);
  });

  ctx.restore();
}

/**
 * Renders original typography layer to SVG for Molecule Wave Only / Editorial Collage modes
 */
export function renderOriginalTypographyToSVG(
  svgGroup: SVGGElement,
  font: FontConfig,
  style: StyleConfig,
  canvasWidth: number,
  canvasHeight: number,
  svgDoc: Document
): void {
  const text = font.text.trim();
  if (!text) return;

  const scale = style.editorialHeadlineScale ?? 1.0;
  const offsetX = style.editorialHeadlineOffsetX ?? 0;
  const offsetY = style.editorialHeadlineOffsetY ?? 0;
  const color = style.editorialHeadlineColor || '#ffffff';
  const opacity = style.editorialHeadlineOpacity ?? 1.0;

  const lines = text.split('\n');
  const baseFontSize = (font.fontSize || 120) * scale;
  const lineHeight = baseFontSize * (font.lineHeight || 0.95);
  const totalHeight = lines.length * lineHeight;

  const cx = canvasWidth * 0.5 + offsetX;
  const startY = canvasHeight * 0.5 - totalHeight * 0.5 + lineHeight * 0.8 + offsetY;

  const textGroup = svgDoc.createElementNS(SVG_NS, 'g');
  textGroup.setAttribute('opacity', opacity.toFixed(2));

  lines.forEach((line, index) => {
    const yPos = startY + index * lineHeight;
    const textEl = svgDoc.createElementNS(SVG_NS, 'text');
    textEl.setAttribute('x', cx.toFixed(2));
    textEl.setAttribute('y', yPos.toFixed(2));
    textEl.setAttribute('font-family', font.fontFamily || 'sans-serif');
    textEl.setAttribute('font-size', baseFontSize.toFixed(1));
    textEl.setAttribute('font-weight', (font.fontWeight || 700).toString());
    textEl.setAttribute('fill', color);
    textEl.setAttribute('text-anchor', font.textAlign === 'left' ? 'start' : font.textAlign === 'right' ? 'end' : 'middle');
    textEl.textContent = line;
    textGroup.appendChild(textEl);
  });

  svgGroup.appendChild(textGroup);
}

/**
 * Renders all particles to a 2D Canvas context with high-performance batching,
 * avoiding thousands of redundant context save/restore and text layout calls per frame.
 */
export function renderParticlesToCanvas(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  if (particles.length === 0) return;

  const firstParticle = particles[0];
  const shape = firstParticle.shape;

  // Optimized fast-path for standard circles (eliminates 30,000 save/restore context pushes)
  if (shape === 'circle') {
    let lastColor = '';
    let lastAlpha = -1;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity !== lastAlpha) {
        ctx.globalAlpha = p.opacity;
        lastAlpha = p.opacity;
      }
      if (p.fillColor !== lastColor) {
        ctx.fillStyle = p.fillColor;
        lastColor = p.fillColor;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  // Optimized fast-path for squares
  if (shape === 'square') {
    let lastColor = '';
    let lastAlpha = -1;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity !== lastAlpha) {
        ctx.globalAlpha = p.opacity;
        lastAlpha = p.opacity;
      }
      if (p.fillColor !== lastColor) {
        ctx.fillStyle = p.fillColor;
        lastColor = p.fillColor;
      }
      const size = p.radius * 2;
      ctx.beginPath();
      ctx.rect(p.x - p.radius, p.y - p.radius, size, size);
      ctx.fill();
    }
    return;
  }

  // Optimized fast-path for rings
  if (shape === 'ring') {
    let lastColor = '';
    let lastAlpha = -1;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity !== lastAlpha) {
        ctx.globalAlpha = p.opacity;
        lastAlpha = p.opacity;
      }
      if (p.fillColor !== lastColor) {
        ctx.strokeStyle = p.fillColor;
        lastColor = p.fillColor;
      }
      ctx.lineWidth = p.strokeWidth ?? Math.max(1, p.radius * 0.35);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    return;
  }

  // Optimized fast-path for ASCII characters (set textAlign & baseline once, cache fonts)
  if (shape === 'ascii') {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let currentFont = '';
    let lastColor = '';
    let lastAlpha = -1;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!p.char) continue;

      const fSize = (p.fontSize || Math.max(10, p.radius * 2.2)) | 0;
      const fontStr = `bold ${fSize}px "JetBrains Mono", monospace`;
      if (fontStr !== currentFont) {
        ctx.font = fontStr;
        currentFont = fontStr;
      }
      if (p.opacity !== lastAlpha) {
        ctx.globalAlpha = p.opacity;
        lastAlpha = p.opacity;
      }
      if (p.fillColor !== lastColor) {
        ctx.fillStyle = p.fillColor;
        lastColor = p.fillColor;
      }
      ctx.fillText(p.char, p.x, p.y);
    }
    return;
  }

  // Optimized fast-path for Extruded 2.5D Blocks (calculate ex, ey once per frame)
  if (shape === 'extruded_block') {
    const depth = firstParticle.extrusionDepth ?? 16;
    const angleRad = ((firstParticle.extrusionAngle ?? 125) * Math.PI) / 180;
    const ex = Math.cos(angleRad) * depth;
    const ey = Math.sin(angleRad) * depth;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const { x, y, radius, fillColor, opacity } = p;
      ctx.globalAlpha = opacity;

      // Side face / shadow
      const shadowColor = mixHexColors(fillColor, '#000000', 0.5);
      ctx.fillStyle = shadowColor;
      ctx.beginPath();
      ctx.moveTo(x - radius, y - radius);
      ctx.lineTo(x - radius + ex, y - radius + ey);
      ctx.lineTo(x + radius + ex, y + radius + ey);
      ctx.lineTo(x + radius, y + radius);
      ctx.closePath();
      ctx.fill();

      // Top face
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(x + ex, y + ey, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  // General path for other transformed particle types (tiles, concentric arcs, custom svg)
  for (let i = 0; i < particles.length; i++) {
    renderParticleToCanvas(ctx, particles[i]);
  }
}

/**
 * Renders a single particle to a 2D HTML5 Canvas context.
 * Uses particle.radius consistently.
 */
export function renderParticleToCanvas(ctx: CanvasRenderingContext2D, particle: Particle): void {
  ctx.save();
  ctx.globalAlpha = particle.opacity;

  const { x, y, radius, fillColor, shape } = particle;

  if (shape === 'ascii' && particle.char) {
    // Feature C: ASCII Molecule rendering
    const fSize = particle.fontSize || Math.max(10, radius * 2.2);
    ctx.font = `bold ${fSize}px "JetBrains Mono", "Courier New", monospace`;
    ctx.fillStyle = fillColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(particle.char, x, y);

  } else if (shape === 'extruded_block') {
    // Style 07: Extruded 2.5D Particles
    const depth = particle.extrusionDepth ?? 16;
    const angleRad = ((particle.extrusionAngle ?? 125) * Math.PI) / 180;
    const ex = Math.cos(angleRad) * depth;
    const ey = Math.sin(angleRad) * depth;

    // Side face / shadow
    const shadowColor = mixHexColors(fillColor, '#000000', 0.5);
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.moveTo(x - radius, y - radius);
    ctx.lineTo(x - radius + ex, y - radius + ey);
    ctx.lineTo(x + radius + ex, y + radius + ey);
    ctx.lineTo(x + radius, y + radius);
    ctx.closePath();
    ctx.fill();

    // Top face
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x + ex, y + ey, radius, 0, Math.PI * 2);
    ctx.fill();

  } else if (shape === 'tile') {
    // Style 09: Kinetic Tile Vortex
    const w = particle.width ?? radius * 3.2;
    const h = particle.height ?? radius * 1.4;
    const angleRad = ((particle.angleDeg ?? 0) * Math.PI) / 180;

    ctx.translate(x, y);
    ctx.rotate(angleRad);
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.rect(-w / 2, -h / 2, w, h);
    ctx.fill();

  } else if (shape === 'square') {
    const size = radius * 2;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    const rx = 1;
    const px = x - radius;
    const py = y - radius;
    if ('roundRect' in ctx && typeof ctx.roundRect === 'function') {
      ctx.roundRect(px, py, size, size, rx);
    } else {
      ctx.rect(px, py, size, size);
    }
    ctx.fill();
  } else if (shape === 'ring') {
    const strokeW = particle.strokeWidth ?? Math.max(1, radius * 0.35);
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = strokeW;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape === 'soft_circle') {
    const rOuter = radius * 1.5;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, rOuter);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, rOuter, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === 'concentric_arc' || shape === 'wave_ripple' || shape === 'tangent_line') {
    const w = particle.width ?? radius * 2;
    const h = particle.height ?? radius * 2;
    const angleRad = ((particle.angleDeg ?? 0) * Math.PI) / 180;
    const rx = h / 2;

    ctx.translate(x, y);
    ctx.rotate(angleRad);
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    if ('roundRect' in ctx && typeof ctx.roundRect === 'function') {
      ctx.roundRect(-w / 2, -h / 2, w, h, rx);
    } else {
      ctx.rect(-w / 2, -h / 2, w, h);
    }
    ctx.fill();
  } else if (shape === 'stitch') {
    const len = particle.width ?? radius * 3.5;
    const thick = particle.height ?? Math.max(1.2, radius * 0.4);
    const angleRad = ((particle.angleDeg ?? 0) * Math.PI) / 180;

    ctx.translate(x, y);
    ctx.rotate(angleRad);

    // Stitched thread mark with subtle needle entry/exit pinch and fiber highlight
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    if ('roundRect' in ctx && typeof ctx.roundRect === 'function') {
      ctx.roundRect(-len / 2, -thick / 2, len, thick, thick / 2);
    } else {
      ctx.ellipse(0, 0, len / 2, thick / 2, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    // Subtle center thread twist highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = Math.max(0.5, thick * 0.25);
    ctx.beginPath();
    ctx.moveTo(-len * 0.35, 0);
    ctx.lineTo(len * 0.35, 0);
    ctx.stroke();
  } else if (shape === 'woven') {
    const len = particle.width ?? radius * 3.0;
    const thick = particle.height ?? Math.max(1.5, radius * 0.5);
    const angleRad = ((particle.angleDeg ?? 0) * Math.PI) / 180;

    ctx.translate(x, y);
    ctx.rotate(angleRad);
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    if ('roundRect' in ctx && typeof ctx.roundRect === 'function') {
      ctx.roundRect(-len / 2, -thick / 2, len, thick, 1);
    } else {
      ctx.rect(-len / 2, -thick / 2, len, thick);
    }
    ctx.fill();
  } else if (shape === 'modular_strip') {
    // Flat, hard-edged vertical color block — no rotation, no soft gradient, per the
    // "flat editorial color blocks" form language of the Modular Signal Field mode.
    const w = particle.width ?? radius * 2;
    const h = particle.height ?? radius * 4;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fill();
  } else if (shape === 'custom_svg' && particle.customLayers && particle.assignedLayerIndices) {
    for (const idx of particle.assignedLayerIndices) {
      const layer = particle.customLayers[idx];
      if (!layer || layer.enabled === false) continue;

      const scaleX = layer.scaleX ?? layer.scale ?? 1.0;
      const scaleY = layer.scaleY ?? layer.scale ?? 1.0;
      const sizeX = radius * 2 * scaleX;
      const sizeY = radius * 2 * scaleY;
      const layerOpacity = particle.opacity * (layer.opacity ?? 1.0);

      const layerColor =
        layer.recolorMode === 'custom'
          ? layer.customColor || '#00F0FF'
          : layer.recolorMode === 'theme'
          ? fillColor
          : fillColor;

      const img = getOrCacheSvgImage(layer, layerColor);

      ctx.save();
      ctx.globalAlpha = layerOpacity;
      ctx.translate(x, y);
      if (layer.rotationOffset) {
        ctx.rotate((layer.rotationOffset * Math.PI) / 180);
      }

      if (img) {
        let drawW = sizeX;
        let drawH = sizeY;
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const aspect = img.naturalWidth / img.naturalHeight;
          if (aspect > 1) {
            drawW = sizeX;
            drawH = sizeY / aspect;
          } else if (aspect < 1) {
            drawW = sizeX * aspect;
            drawH = sizeY;
          }
        }
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        ctx.fillStyle = layerColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * scaleX, radius * scaleY, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  } else {
    // Default circle
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Optional Data Constellation label
  if (particle.label) {
    ctx.font = '10px "Space Grotesk", sans-serif';
    ctx.fillStyle = fillColor;
    ctx.globalAlpha = 0.8;
    ctx.fillText(particle.label, x + radius + 4, y - 4);
  }

  ctx.restore();
}

/**
 * Renders a single particle to an SVG Group element.
 */
export function renderParticleToSVG(
  svgGroup: SVGGElement,
  particle: Particle,
  defs: SVGDefsElement,
  svgDoc: Document
): void {
  const { x, y, radius, fillColor, opacity, shape } = particle;

  if (shape === 'ascii' && particle.char) {
    // Feature C: Vector SVG ASCII Text
    const fSize = particle.fontSize || Math.max(10, radius * 2.2);
    const textEl = svgDoc.createElementNS(SVG_NS, 'text');
    textEl.setAttribute('x', x.toFixed(2));
    textEl.setAttribute('y', y.toFixed(2));
    textEl.setAttribute('font-family', 'JetBrains Mono, Courier New, monospace');
    textEl.setAttribute('font-size', fSize.toFixed(1));
    textEl.setAttribute('font-weight', 'bold');
    textEl.setAttribute('fill', fillColor);
    textEl.setAttribute('opacity', opacity.toFixed(2));
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('dominant-baseline', 'central');
    textEl.textContent = particle.char;
    svgGroup.appendChild(textEl);

  } else if (shape === 'extruded_block') {
    // Style 07: Vector SVG 2.5D Extruded Particle
    const depth = particle.extrusionDepth ?? 16;
    const angleRad = ((particle.extrusionAngle ?? 125) * Math.PI) / 180;
    const ex = Math.cos(angleRad) * depth;
    const ey = Math.sin(angleRad) * depth;
    const shadowColor = mixHexColors(fillColor, '#000000', 0.5);

    const poly = svgDoc.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute(
      'points',
      `${(x - radius).toFixed(2)},${(y - radius).toFixed(2)} ${(x - radius + ex).toFixed(2)},${(y - radius + ey).toFixed(2)} ${(x + radius + ex).toFixed(2)},${(y + radius + ey).toFixed(2)} ${(x + radius).toFixed(2)},${(y + radius).toFixed(2)}`
    );
    poly.setAttribute('fill', shadowColor);
    poly.setAttribute('opacity', opacity.toFixed(2));
    svgGroup.appendChild(poly);

    const circle = svgDoc.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', (x + ex).toFixed(2));
    circle.setAttribute('cy', (y + ey).toFixed(2));
    circle.setAttribute('r', radius.toFixed(2));
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('opacity', opacity.toFixed(2));
    svgGroup.appendChild(circle);

  } else if (shape === 'tile') {
    // Style 09: Vector SVG Kinetic Tile
    const w = particle.width ?? radius * 3.2;
    const h = particle.height ?? radius * 1.4;
    const angleDeg = particle.angleDeg ?? 0;
    const rect = svgDoc.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', (x - w / 2).toFixed(2));
    rect.setAttribute('y', (y - h / 2).toFixed(2));
    rect.setAttribute('width', w.toFixed(2));
    rect.setAttribute('height', h.toFixed(2));
    rect.setAttribute('fill', fillColor);
    rect.setAttribute('opacity', opacity.toFixed(2));
    rect.setAttribute('transform', `rotate(${angleDeg.toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})`);
    svgGroup.appendChild(rect);

  } else if (shape === 'square') {
    const size = radius * 2;
    const rect = svgDoc.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', (x - radius).toFixed(2));
    rect.setAttribute('y', (y - radius).toFixed(2));
    rect.setAttribute('width', size.toFixed(2));
    rect.setAttribute('height', size.toFixed(2));
    rect.setAttribute('rx', '1');
    rect.setAttribute('fill', fillColor);
    rect.setAttribute('opacity', opacity.toFixed(2));
    svgGroup.appendChild(rect);
  } else if (shape === 'ring') {
    const strokeW = particle.strokeWidth ?? Math.max(1, radius * 0.35);
    const circle = svgDoc.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', x.toFixed(2));
    circle.setAttribute('cy', y.toFixed(2));
    circle.setAttribute('r', radius.toFixed(2));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', fillColor);
    circle.setAttribute('stroke-width', strokeW.toFixed(2));
    circle.setAttribute('opacity', opacity.toFixed(2));
    svgGroup.appendChild(circle);
  } else if (shape === 'soft_circle') {
    const rOuter = radius * 1.5;
    const gradId = `soft-grad-${Math.random().toString(36).substring(2, 8)}`;
    const grad = svgDoc.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', gradId);
    grad.setAttribute('cx', '50%');
    grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');

    const stop1 = svgDoc.createElementNS(SVG_NS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', fillColor);
    stop1.setAttribute('stop-opacity', '1');

    const stop2 = svgDoc.createElementNS(SVG_NS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', fillColor);
    stop2.setAttribute('stop-opacity', '0');

    grad.appendChild(stop1);
    grad.appendChild(stop2);
    defs.appendChild(grad);

    const circle = svgDoc.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', x.toFixed(2));
    circle.setAttribute('cy', y.toFixed(2));
    circle.setAttribute('r', rOuter.toFixed(2));
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('opacity', opacity.toFixed(2));
    svgGroup.appendChild(circle);
  } else if (shape === 'concentric_arc' || shape === 'wave_ripple' || shape === 'tangent_line') {
    const w = particle.width ?? radius * 2;
    const h = particle.height ?? radius * 2;
    const angleDeg = particle.angleDeg ?? 0;
    const rect = svgDoc.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', (x - w / 2).toFixed(2));
    rect.setAttribute('y', (y - h / 2).toFixed(2));
    rect.setAttribute('width', w.toFixed(2));
    rect.setAttribute('height', h.toFixed(2));
    rect.setAttribute('rx', (h / 2).toFixed(2));
    rect.setAttribute('fill', fillColor);
    rect.setAttribute('opacity', opacity.toFixed(2));
    rect.setAttribute('transform', `rotate(${angleDeg.toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})`);
    svgGroup.appendChild(rect);
  } else if (shape === 'stitch') {
    const len = particle.width ?? radius * 3.5;
    const thick = particle.height ?? Math.max(1.2, radius * 0.4);
    const angleDeg = particle.angleDeg ?? 0;
    const rect = svgDoc.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', (-len / 2).toFixed(2));
    rect.setAttribute('y', (-thick / 2).toFixed(2));
    rect.setAttribute('width', len.toFixed(2));
    rect.setAttribute('height', thick.toFixed(2));
    rect.setAttribute('rx', (thick / 2).toFixed(2));
    rect.setAttribute('fill', fillColor);
    rect.setAttribute('opacity', opacity.toFixed(2));
    rect.setAttribute('transform', `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${angleDeg.toFixed(1)})`);
    svgGroup.appendChild(rect);
  } else if (shape === 'woven') {
    const len = particle.width ?? radius * 3.0;
    const thick = particle.height ?? Math.max(1.5, radius * 0.5);
    const angleDeg = particle.angleDeg ?? 0;
    const rect = svgDoc.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', (-len / 2).toFixed(2));
    rect.setAttribute('y', (-thick / 2).toFixed(2));
    rect.setAttribute('width', len.toFixed(2));
    rect.setAttribute('height', thick.toFixed(2));
    rect.setAttribute('rx', '1');
    rect.setAttribute('fill', fillColor);
    rect.setAttribute('opacity', opacity.toFixed(2));
    rect.setAttribute('transform', `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${angleDeg.toFixed(1)})`);
    svgGroup.appendChild(rect);
  } else if (shape === 'modular_strip') {
    const w = particle.width ?? radius * 2;
    const h = particle.height ?? radius * 4;
    const rect = svgDoc.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', (x - w / 2).toFixed(2));
    rect.setAttribute('y', (y - h / 2).toFixed(2));
    rect.setAttribute('width', w.toFixed(2));
    rect.setAttribute('height', h.toFixed(2));
    rect.setAttribute('fill', fillColor);
    rect.setAttribute('opacity', opacity.toFixed(2));
    svgGroup.appendChild(rect);
  } else if (shape === 'custom_svg' && particle.customLayers && particle.assignedLayerIndices) {
    for (const idx of particle.assignedLayerIndices) {
      const layer = particle.customLayers[idx];
      if (!layer || layer.enabled === false) continue;

      const layerColor =
        layer.recolorMode === 'custom'
          ? layer.customColor || '#00F0FF'
          : layer.recolorMode === 'theme'
          ? fillColor
          : fillColor;

      const targetColor = layer.recolorMode === 'original' ? null : layerColor;
      const processedXml = recolorSvgXml(layer.svgXml, targetColor, layer.recolorMode);

      const scaleX = layer.scaleX ?? layer.scale ?? 1.0;
      const scaleY = layer.scaleY ?? layer.scale ?? 1.0;
      const sizeX = radius * 2 * scaleX;
      const sizeY = radius * 2 * scaleY;
      const layerOpacity = opacity * (layer.opacity ?? 1.0);
      const rot = layer.rotationOffset ?? 0;

      const layerG = svgDoc.createElementNS(SVG_NS, 'g');
      layerG.setAttribute('opacity', layerOpacity.toFixed(2));

      try {
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(processedXml, 'image/svg+xml');
        const svgEl = parsedDoc.querySelector('svg');
        if (svgEl) {
          const viewBox = svgEl.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.split(/[\s,]+/).map(Number);
            if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
              const maxDim = Math.max(parts[2], parts[3]);
              const scaleFactorX = sizeX / maxDim;
              const scaleFactorY = sizeY / maxDim;
              layerG.setAttribute(
                'transform',
                `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${rot.toFixed(1)}) scale(${scaleFactorX.toFixed(4)}, ${scaleFactorY.toFixed(4)}) translate(${(-parts[0] - parts[2] / 2).toFixed(2)}, ${(-parts[1] - parts[3] / 2).toFixed(2)})`
              );
            } else {
              layerG.setAttribute(
                'transform',
                `translate(${(x - sizeX / 2).toFixed(2)}, ${(y - sizeY / 2).toFixed(2)}) rotate(${rot.toFixed(1)} ${(sizeX / 2).toFixed(2)} ${(sizeY / 2).toFixed(2)}) scale(${(sizeX / 100).toFixed(4)}, ${(sizeY / 100).toFixed(4)})`
              );
            }
          } else {
            layerG.setAttribute(
              'transform',
              `translate(${(x - sizeX / 2).toFixed(2)}, ${(y - sizeY / 2).toFixed(2)}) rotate(${rot.toFixed(1)} ${(sizeX / 2).toFixed(2)} ${(sizeY / 2).toFixed(2)}) scale(${(sizeX / 100).toFixed(4)}, ${(sizeY / 100).toFixed(4)})`
            );
          }

          for (const child of Array.from(svgEl.childNodes)) {
            if (child.nodeType === Node.ELEMENT_NODE) {
              layerG.appendChild(svgDoc.importNode(child, true));
            }
          }
        }
      } catch (e) {
        console.warn('SVG parse error for export:', e);
      }

      svgGroup.appendChild(layerG);
    }
  } else if (shape === 'custom_svg' && particle.parsedCustomSvgDoc) {
    const size = radius * 2;
    const customG = svgDoc.createElementNS(SVG_NS, 'g');
    customG.setAttribute(
      'transform',
      `translate(${(x - radius).toFixed(2)}, ${(y - radius).toFixed(2)}) scale(${(size / 100).toFixed(4)})`
    );
    customG.setAttribute('fill', fillColor);
    customG.setAttribute('opacity', opacity.toFixed(2));

    const rootElem = particle.parsedCustomSvgDoc.documentElement;
    const sourceNodes =
      rootElem.nodeName.toLowerCase() === 'svg'
        ? Array.from(rootElem.childNodes)
        : Array.from(particle.parsedCustomSvgDoc.childNodes);

    for (const child of sourceNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const elem = child as Element;
        const tag = elem.tagName.toLowerCase();
        if (tag === 'defs') {
          for (const defChild of Array.from(elem.childNodes)) {
            if (defChild.nodeType === Node.ELEMENT_NODE) {
              defs.appendChild(svgDoc.importNode(defChild, true));
            }
          }
        } else if (tag === 'svg') {
          for (const svgChild of Array.from(elem.childNodes)) {
            if (svgChild.nodeType === Node.ELEMENT_NODE) {
              customG.appendChild(svgDoc.importNode(svgChild, true));
            }
          }
        } else {
          customG.appendChild(svgDoc.importNode(elem, true));
        }
      }
    }
    svgGroup.appendChild(customG);
  } else {
    // Default circle
    const circle = svgDoc.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', x.toFixed(2));
    circle.setAttribute('cy', y.toFixed(2));
    circle.setAttribute('r', radius.toFixed(2));
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('opacity', opacity.toFixed(2));
    svgGroup.appendChild(circle);
  }

  if (particle.label) {
    const labelEl = svgDoc.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', (x + radius + 4).toFixed(2));
    labelEl.setAttribute('y', (y - 4).toFixed(2));
    labelEl.setAttribute('font-family', 'Space Grotesk, sans-serif');
    labelEl.setAttribute('font-size', '10');
    labelEl.setAttribute('fill', fillColor);
    labelEl.setAttribute('opacity', '0.8');
    labelEl.textContent = particle.label;
    svgGroup.appendChild(labelEl);
  }
}

function mixHexColors(color1: string, color2: string, weight: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const w = Math.max(0, Math.min(1, weight));

  const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * w);
  const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * w);
  const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * w);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const hexRgbCache = new Map<string, { r: number; g: number; b: number }>();

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cached = hexRgbCache.get(hex);
  if (cached) return cached;

  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16) || 0;
  cached = {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
  hexRgbCache.set(hex, cached);
  return cached;
}


