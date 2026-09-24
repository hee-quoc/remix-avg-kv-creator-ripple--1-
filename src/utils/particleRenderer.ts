import { SDFData, sampleSDF } from './sdf';
import { calculateWave, createWaveFrameContext, WaveFrameContext, WaveResult, AudioSignal } from './wave';
import type { AudioConfig } from '../types';
import { GridConfig, WaveConfig, FontConfig, StyleConfig, CustomSvgLayer, CustomSvgDistribution, CompositionMode, Radial3DConfig, ModularStripConfig, TypographyRippleConfig, TypographyBoxConfig, MeshNetConfig, SpeedStripeConfig } from '../types';

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
  fontFamily?: string;
  glyphColor?: string;
  extrusionDepth?: number;
  extrusionAngle?: number;
  label?: string;
  stitchLength?: number;
  stitchThickness?: number;
  stitchSoftness?: number;
  stitchTapered?: boolean; // true for Diagonal Sashiko — pinches the stitch mark to a point at both ends
  // Typography Box Material (News)
  cornerRadius?: number;
  isFilled?: boolean;
  strokeColor?: string;
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

  // Key accounts for: SVG source content, material configuration (recolorMode), and the relevant
  // color setting (targetColor) — task requirement. Content is folded in via `svgXml.length` (an
  // O(1) string-length read, not a content scan/hash) rather than `layer.id` alone, so a layer whose
  // svgXml is ever replaced in place (same id, different markup — e.g. the legacy single-SVG upload
  // path, which rebuilds a plain object every frame) can't silently keep serving a stale rasterized
  // image. This must stay O(1): it runs once per particle per frame for custom_svg fields, so any
  // per-call scan over the (potentially large) SVG string would be a real perf regression.
  // Rendering-style-specific effects (rotation, extrusion, etc.) are intentionally NOT part of this
  // key: they're applied at draw time from particle transforms, never baked into the rasterized
  // bitmap, so varying visual style never needs a different cached image for the same SVG+color.
  const cacheKey = `${layer.id}_${layer.svgXml.length}_${layer.recolorMode}_${targetColor || 'orig'}`;

  let img = svgImageCache.get(cacheKey);
  if (!img) {
    img = new Image();
    const processedXml = recolorSvgXml(layer.svgXml, targetColor, layer.recolorMode);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(processedXml);
    svgImageCache.set(cacheKey, img);
  }

  return img.complete && img.naturalWidth > 0 ? img : null;
}

const editorialSvgImageCache = new Map<string, HTMLImageElement>();

/**
 * Same rasterize-and-cache pattern as getOrCacheSvgImage above, for the "crisp typography" overlay
 * used by Molecule Wave Only / Editorial Collage (renderOriginalTypographyToCanvas below) when Object
 * Mask is set to SVG LOGO — everywhere else in the app, an uploaded "mask" SVG is treated purely as a
 * silhouette (its own colors are never shown; the app's own style color fills it), so this recolors
 * the same way for consistency instead of rendering the logo's original artwork colors.
 */
function getOrCacheEditorialSvgImage(svgXml: string, color: string): HTMLImageElement | null {
  const cacheKey = `${svgXml.length}_${color}`;
  let img = editorialSvgImageCache.get(cacheKey);
  if (!img) {
    img = new Image();
    const processedXml = recolorSvgXml(svgXml, color, 'theme');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(processedXml);
    editorialSvgImageCache.set(cacheKey, img);
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

// ============================================================================
// CULTURE — ORIGINAL STITCH PATTERN
// A pixel-for-pixel port of the source p5.js sketch's 120x120 stitch grid, fed through the SAME
// wave/ripple engine used everywhere else (calculateWave) rather than a standalone renderer. Base
// positions/angles/geometry are cached and only ever recomputed when canvas dimensions change (task
// requirement: do not recreate 14,400 stitch objects every frame) — ripple only ever perturbs the
// per-frame render position, never the cached base geometry, so amplitude 0 reproduces the exact
// static source pattern.
// ============================================================================

const ORIGINAL_STITCH_ROWS = 120;
const ORIGINAL_STITCH_COLS = 120;

interface CachedOriginalStitchPoint {
  x0: number;
  y0: number;
  rowIdx: number;
  colIdx: number;
  angleDeg: number;
  ellipseW: number; // full width (diameter), matching p5's ellipse(x,y,w,h) convention
  ellipseH: number; // full height (diameter)
}

let cachedOriginalStitchKey = '';
let cachedOriginalStitchPoints: CachedOriginalStitchPoint[] = [];

/** p5.js `map()` — linear-maps v from [a,b] to [c,d]. */
function mapRange(v: number, a: number, b: number, c: number, d: number): number {
  return c + ((v - a) * (d - c)) / (b - a);
}

function getCachedOriginalStitchPoints(width: number, height: number): CachedOriginalStitchPoint[] {
  const key = `${width}_${height}`;
  if (key === cachedOriginalStitchKey && cachedOriginalStitchPoints.length > 0) {
    return cachedOriginalStitchPoints;
  }
  cachedOriginalStitchKey = key;

  // translate(width/2, height/2) in the source sketch — everything below is relative to that origin.
  const cx = width / 2;
  const cy = height / 2;

  // stitchLength = 1.66 * height / rows — constant across the whole grid in the source (computed
  // inside the loop there only because JS re-evaluates it harmlessly every iteration; hoisted here).
  const stitchLength = (1.66 * height) / ORIGINAL_STITCH_ROWS;
  const ellipseW = stitchLength / 2.5;
  const ellipseH = stitchLength;

  const points: CachedOriginalStitchPoint[] = [];
  for (let row = 0; row < ORIGINAL_STITCH_ROWS; row++) {
    const y = mapRange(row, 0, ORIGINAL_STITCH_ROWS - 1, -height / 2.05, height / 2.1);
    for (let col = 0; col < ORIGINAL_STITCH_COLS; col++) {
      const x = mapRange(col, 0, ORIGINAL_STITCH_COLS - 1, -height / 2.05, height / 2.05);
      // angle = -PI/8 + (col % 2) * PI/4 — alternating stitch orientation, exactly as authored.
      const angleRad = -Math.PI / 8 + (col % 2) * (Math.PI / 4);
      points.push({
        x0: cx + x,
        y0: cy + y,
        rowIdx: row,
        colIdx: col,
        angleDeg: (angleRad * 180) / Math.PI,
        ellipseW,
        ellipseH
      });
    }
  }

  cachedOriginalStitchPoints = points;
  return points;
}

/**
 * Feeds each of the 14,400 cached stitch base positions through the existing wave engine
 * (calculateWave/createWaveFrameContext — the same functions every other material uses), so Wave
 * Frequency/Amplitude/Speed/Thickness/Softness, Dynamic Thickness, and Audio Reactivity all apply
 * automatically without bespoke re-implementation. Only the stitch's RENDER POSITION is displaced;
 * its angle and ellipse geometry are read unmodified from the cache, so amplitude 0 (Ripple off)
 * reproduces the exact static pattern — fill color/alpha come from the app's normal color controls
 * (single dotColor, OR the existing Multi-Color Dot Controls palette/distribution system) rather than
 * being hardcoded, defaulted to the source sketch's rgba(80,120,255,200) single color / two-tone
 * checkerboard (palette_list distribution) variants for the Culture preset.
 *
 * SVG support: if the user has uploaded Custom SVG layers (the SAME grid.customSvgLayers/
 * customSvgDistribution used by the 'custom_svg' dotShape elsewhere), each stitch is assigned a layer
 * exactly like the main particle loop does (assignedLayerIndices via the same cycle/random/size_tier/
 * stacked distribution), and the renderer draws that SVG at the stitch's position — but still rotated
 * by ITS OWN alternating stitch angle (not the layer's static rotationOffset alone), so "alternating
 * stitch orientation must remain intact" keeps holding even when stitches are logo-shaped. With no
 * layers uploaded, stitches fall back to the exact plain ellipse — unchanged from before.
 *
 * Text / SVG-mask support: gated on the SAME `grid.hideBackgroundDots` toggle every other
 * shape/material already uses (header "HIDE BG DOTS" button, or the GRID tab) — OFF by default, which
 * is what keeps the shipped Culture preset's static (Ripple-off) output pixel-identical to the source
 * sketch, since the source has no text-masking concept at all. Turning it ON samples the SAME `sdf`
 * this frame's headline (or, when Object Mask is set to "SVG LOGO", the same uploaded SVG-as-mask) is
 * built from, via the exact `sampleSDF`/threshold/softness math the standard grid uses, and hides
 * stitches outside that silhouette — so both plain text AND an SVG-as-text-mask logo shape the stitch
 * field once explicitly opted into, without ever touching the fixed 120x120 base geometry.
 */
export function computeOriginalStitchParticles(
  wave: WaveConfig,
  style: StyleConfig,
  grid: GridConfig,
  font: FontConfig,
  sdf: SDFData,
  width: number,
  height: number,
  time: number,
  audioSignal?: AudioSignal,
  audioConfig?: AudioConfig
): Particle[] {
  const points = getCachedOriginalStitchPoints(width, height);
  const waveFrameCtx = createWaveFrameContext(width, height, time, wave, audioSignal, audioConfig);
  const dotColor = style.dotColor;
  const seed = wave.randomSeed || 42;
  const particles: Particle[] = [];

  const useTextMask = !!grid.hideBackgroundDots;
  const sdfThreshold = grid.sdfThreshold * 20.0;
  const sdfSoftness = grid.sdfSoftness * 15.0 + 1.0;

  // Multi-color support — reuses the SAME palette/distribution system every other shape in the app
  // uses (Multi-Color Dot Controls), so this material stays visually/behaviorally consistent with the
  // rest of the generative system rather than having its own bespoke coloring rule. With a 2-color
  // palette and the 'palette_list' distribution, `(colIdx + rowIdx) % pal.length` reproduces exactly
  // the checkerboard `(row + col) % 2` alternation from the reference two-tone sketch.
  const usePalette = !!(style.enableMultiColor && style.multiColorPalette && style.multiColorPalette.length > 0);
  const pal = style.multiColorPalette || [];
  const dist = style.multiColorDistribution || 'palette_list';

  // Uploaded Custom SVG layers — identical extraction logic to the standard particle loop below
  // (including the legacy single-svg fallback), so Original Stitch reuses the exact same asset the
  // rest of the app already has active rather than requiring a separate upload.
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

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    calculateWave(p.x0, p.y0, width, height, time, wave, audioSignal, waveFrameCtx, sharedWaveRes, audioConfig);

    let x = p.x0;
    let y = p.y0;
    if (wave.mode === 'flow') {
      const blend = 1.0 - wave.blendBack;
      x += sharedWaveRes.displacementX * blend;
      y += sharedWaveRes.displacementY * blend;
    }

    // Text / SVG-mask gate — see doc comment above. Sampled at the same base-vs-displaced blend the
    // standard "Typography Masked Mode" path uses, so the silhouette tracks the ripple consistently.
    let normalizedDist = 1.0;
    if (useTextMask) {
      const sampleX = wave.mode === 'flow' ? p.x0 + (x - p.x0) * wave.blendBack : p.x0;
      const sampleY = wave.mode === 'flow' ? p.y0 + (y - p.y0) * wave.blendBack : p.y0;
      const sdfDist = sampleSDF(sdf, sampleX, sampleY, width, height);
      const distVal = font.invertText ? -sdfDist : sdfDist;
      normalizedDist = Math.max(0, Math.min(1, (distVal + sdfThreshold) / sdfSoftness));
      if (normalizedDist <= 0.01) continue;
    }

    let fillColor = dotColor;
    if (usePalette) {
      if (dist === 'random') {
        const h = Math.abs((i * 2654435761 + seed) | 0);
        fillColor = pal[h % pal.length];
      } else if (dist === 'grouped') {
        const groupIdx = Math.floor((p.x0 / width) * pal.length);
        fillColor = pal[Math.max(0, Math.min(pal.length - 1, groupIdx))];
      } else if (dist === 'gradient_based') {
        const valNorm = Math.max(0, Math.min(0.999, sharedWaveRes.value));
        fillColor = pal[Math.floor(valNorm * pal.length)];
      } else {
        // 'palette_list' (default) — sequential alternation by (col + row), matching the reference's
        // (row + col) % 2 checkerboard exactly when given a 2-color palette.
        fillColor = pal[(p.colIdx + p.rowIdx) % pal.length];
      }
    }

    let assignedLayerIndices: number[] | undefined;
    if (activeCustomLayers.length > 0) {
      if (distributionMode === 'stacked') {
        assignedLayerIndices = activeCustomLayers.map((_, idx) => idx);
      } else if (distributionMode === 'random') {
        const hash = Math.abs((i * 2654435761) | 0);
        assignedLayerIndices = [hash % activeCustomLayers.length];
      } else if (distributionMode === 'size_tier') {
        // Uses the real text-mask distance when the mask is active (matching the standard grid's
        // size_tier behavior exactly); otherwise falls back to a checkerboard-consistent (col+row)
        // parity as the tiering key, since there's no distance signal without a mask.
        const tier = useTextMask
          ? Math.min(activeCustomLayers.length - 1, Math.floor(normalizedDist * activeCustomLayers.length))
          : (p.colIdx + p.rowIdx) % activeCustomLayers.length;
        assignedLayerIndices = [tier];
      } else {
        // 'cycle'
        assignedLayerIndices = [i % activeCustomLayers.length];
      }
    }

    // When an uploaded SVG logo is active on this stitch, fillColor doubles as the 'theme'/'original'
    // recolor target getOrCacheSvgImage() keys its cache on (see the matching fix/comment in
    // computeMeshNetParticles) — 'gradient_based' distribution ties fillColor to the continuously
    // animated wave value, which would thrash that cache every frame and starve the image decode.
    // Fall back to the stable checkerboard color specifically for logo-carrying stitches; the plain-
    // ellipse ones (no assignedLayerIndices) keep the animated gradient look unaffected.
    const svgSafeFillColor =
      assignedLayerIndices && usePalette && dist === 'gradient_based' ? pal[(p.colIdx + p.rowIdx) % pal.length] : fillColor;

    particles.push({
      x,
      y,
      radius: p.ellipseH / 2,
      fillColor: svgSafeFillColor,
      opacity: style.uniformColorBrightness ? 1.0 : 200 / 255,
      shape: 'original_stitch',
      angleDeg: p.angleDeg,
      width: p.ellipseW,
      height: p.ellipseH,
      customLayers: assignedLayerIndices ? activeCustomLayers : undefined,
      assignedLayerIndices
    });
  }

  return particles;
}

// ============================================================================
// NEWS — TYPOGRAPHY BOX MATERIAL
// A direct port of the user's existing p5.js material (rounded word-boxes packed into rows, random
// fill/outline, fixed palette) — geometry/text/colors are generated once and cached exactly like the
// source's setup() grid-packing loop. The ONLY thing replaced is the source's independent
// currentBox/progress/boxData.pop() sequential reveal animation: opacity now comes from sampling the
// SAME wave engine (calculateWave) every other material in this app already uses, at each box's
// center — so Wave Frequency/Speed/Amplitude/Thickness/Softness/Origin, Dynamic Thickness, and Audio
// Reactivity all drive it automatically, with zero bespoke animation code.
// ============================================================================

export const DEFAULT_TYPOGRAPHY_BOX_CONFIG: TypographyBoxConfig = {
  words: ['caffeine', 'Hola!', 'Hallo!', 'Bonjour!', 'caffeine', '你好', 'こんにちは', 'Привет'],
  colorPalette: ['#FFF533', '#F64FA7', '#73F849'],
  fontFamily: 'Arial',
  fontSize: 52,
  boxHeight: 75,
  horizontalPadding: 40,
  marginX: 20,
  marginY: 20,
  cornerRadius: 50,
  cornerRadiusMode: 'uniform',
  cornerRadiusMin: 0,
  cornerRadiusMax: 50,
  filledRatio: 0.5,
  strokeColor: '#000000',
  textColor: '#000000',
  strokeWidth: 3,
  baseOpacity: 0.12,
  minOpacity: 0.08,
  maxOpacity: 1.0,
  opacityInfluence: 0.9,
  opacitySoftness: 0.45,
  invertOpacity: false
};

interface TypoBoxItem {
  x: number;
  y: number;
  w: number;
  h: number;
  word: string;
  fillColor: string;
  isFilled: boolean;
  cornerRadius: number;
}

// A single reused offscreen canvas for text measurement — created once, never touches the DOM, so
// building/rebuilding the box grid never costs a real layout/paint (task: avoid unnecessary work).
let typoBoxMeasureCtx: CanvasRenderingContext2D | null = null;
function getTypoBoxMeasureCtx(): CanvasRenderingContext2D {
  if (!typoBoxMeasureCtx) {
    const canvas = document.createElement('canvas');
    typoBoxMeasureCtx = canvas.getContext('2d')!;
  }
  return typoBoxMeasureCtx;
}

let cachedTypoBoxKey = '';
let cachedTypoBoxItems: TypoBoxItem[] = [];

/**
 * Ports the source sketch's setup() grid-packing loop verbatim (same while/while structure, same
 * `x + wordWidth > width` row-break condition, same word/color/filled random draws) — the only
 * change is using the SAME deterministic prng() this codebase already uses elsewhere (seeded from
 * wave.randomSeed) instead of p5's unseeded random(), so the layout is cacheable/reproducible rather
 * than different on every reload (task: "use the existing deterministic random seed where possible").
 * Cached by every input that affects layout/text/color, exactly like buildTypographyCells above —
 * regenerated only when canvas size or one of the material's own settings actually changes, never by
 * ripple/time (task item 6).
 */
function buildTypographyBoxItems(
  cfg: TypographyBoxConfig,
  width: number,
  height: number,
  seed: number
): TypoBoxItem[] {
  const words = cfg.words.length > 0 ? cfg.words : DEFAULT_TYPOGRAPHY_BOX_CONFIG.words;
  const palette = cfg.colorPalette.length > 0 ? cfg.colorPalette : DEFAULT_TYPOGRAPHY_BOX_CONFIG.colorPalette;

  const key = `${words.join('')}|${palette.join(',')}|${cfg.fontFamily}|${cfg.fontSize}|${cfg.boxHeight}|${cfg.horizontalPadding}|${cfg.marginX}|${cfg.marginY}|${cfg.filledRatio}|${cfg.cornerRadius}|${cfg.cornerRadiusMode}|${cfg.cornerRadiusMin}|${cfg.cornerRadiusMax}|${width}|${height}|${seed}`;
  if (key === cachedTypoBoxKey && cachedTypoBoxItems.length > 0) {
    return cachedTypoBoxItems;
  }

  const ctx = getTypoBoxMeasureCtx();
  ctx.font = `bold ${cfg.fontSize}px "${cfg.fontFamily}", sans-serif`;

  let rngIdx = 0;
  const rand = () => prng(seed + 4271, rngIdx++);

  const radiusMin = Math.min(cfg.cornerRadiusMin, cfg.cornerRadiusMax);
  const radiusMax = Math.max(cfg.cornerRadiusMin, cfg.cornerRadiusMax);

  const items: TypoBoxItem[] = [];
  let y = 0;
  while (y + cfg.boxHeight < height) {
    let x = 0;
    while (x < width) {
      const word = words[Math.floor(rand() * words.length)] ?? words[0];
      const wordWidth = ctx.measureText(word.toUpperCase()).width + cfg.horizontalPadding;

      if (x + wordWidth > width) break;

      // Wrapping shape: either one uniform radius for every box (original behavior), or each box
      // gets its own radius drawn from [min, max] and cached (never re-rolled per frame) — a low min
      // (0 by default) means some boxes land as plain sharp rectangles right alongside rounded ones.
      const boxCornerRadius =
        cfg.cornerRadiusMode === 'random' ? radiusMin + rand() * (radiusMax - radiusMin) : cfg.cornerRadius;

      items.push({
        x,
        y,
        w: wordWidth,
        h: cfg.boxHeight,
        word,
        fillColor: palette[Math.floor(rand() * palette.length)] ?? palette[0],
        isFilled: rand() < cfg.filledRatio,
        cornerRadius: boxCornerRadius
      });

      x += wordWidth + cfg.marginX;
    }
    y += cfg.boxHeight + cfg.marginY;
  }

  cachedTypoBoxKey = key;
  cachedTypoBoxItems = items;
  return items;
}

/**
 * Computes particles for the Typography Box Material. Box geometry/word/color/filled-state come from
 * the cached grid above (untouched frame to frame); only opacity is recalculated every frame, sampled
 * from calculateWave() at each box's own center — this IS the "sampleExistingRipple" from the task's
 * conceptual pseudocode, using the real wave engine instead of a placeholder. Position is intentionally
 * NEVER displaced (unlike Flow-mode dots elsewhere): these boxes are tightly packed with zero gap
 * tolerance, so moving them would tear the grid apart — only opacity responds to the ripple, exactly
 * as the task specifies ("preserving their original shapes... grid arrangement").
 *
 * Clip Mask support: same toggle and math as Original Stitch Pattern / Sine Mesh Net / Speed Stripe
 * Field (HIDE BG DOTS, header bar or GRID tab) — when on, boxes whose center falls outside the current
 * text (or an uploaded SVG logo set as Object Mask) are simply omitted, clipping the word grid to that
 * silhouette instead of filling the whole canvas.
 */
export function computeTypographyBoxParticles(
  grid: GridConfig,
  wave: WaveConfig,
  style: StyleConfig,
  font: FontConfig,
  sdf: SDFData,
  width: number,
  height: number,
  time: number,
  audioSignal?: AudioSignal,
  audioConfig?: AudioConfig
): Particle[] {
  const cfg: TypographyBoxConfig = { ...DEFAULT_TYPOGRAPHY_BOX_CONFIG, ...(grid.typographyBox || {}) };
  const seed = wave.randomSeed || 42;
  const items = buildTypographyBoxItems(cfg, width, height, seed);
  const waveFrameCtx = createWaveFrameContext(width, height, time, wave, audioSignal, audioConfig);

  const useTextMask = !!grid.hideBackgroundDots;
  const sdfThreshold = grid.sdfThreshold * 20.0;
  const sdfSoftness = grid.sdfSoftness * 15.0 + 1.0;

  const influence = Math.max(0, Math.min(1, cfg.opacityInfluence));
  const softness = Math.max(0.02, Math.min(1, cfg.opacitySoftness));
  const lo = 0.5 - softness / 2;
  const hi = 0.5 + softness / 2;

  // Wave Amplitude, by architecture, only scales calculateWave's DISPLACEMENT output — never its
  // scalar `.value` (intensity), since amplitude in this engine means "how far things move," not "how
  // strong the pulse reads." Since these boxes deliberately never move (task: preserve the packed
  // grid), Amplitude is folded in here instead as a genuine strength multiplier on the opacity signal,
  // via the SAME baseAmp the engine already derives from waveAmplitude (+ any audio-mapped delta) —
  // so turning Amplitude down measurably dampens the reveal, and up strengthens it, without ever
  // displacing a box.
  const ampFactor = Math.max(0, Math.min(1.5, waveFrameCtx.baseAmp));

  const particles: Particle[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const centerX = item.x + item.w / 2;
    const centerY = item.y + item.h / 2;

    if (useTextMask) {
      const sdfDist = sampleSDF(sdf, centerX, centerY, width, height);
      const distVal = font.invertText ? -sdfDist : sdfDist;
      const normalizedDist = Math.max(0, Math.min(1, (distVal + sdfThreshold) / sdfSoftness));
      if (normalizedDist <= 0.01) continue;
    }

    // Ripple → opacity mapping (task item 3): sample the real wave engine at this box's center.
    calculateWave(centerX, centerY, width, height, time, wave, audioSignal, waveFrameCtx, sharedWaveRes, audioConfig);

    let t = Math.max(0, Math.min(1, (sharedWaveRes.value / 1.6) * ampFactor));
    if (cfg.invertOpacity) t = 1 - t;
    const edgeT = hi > lo ? Math.max(0, Math.min(1, (t - lo) / (hi - lo))) : t < lo ? 0 : 1;
    const smoothT = edgeT * edgeT * (3 - 2 * edgeT);
    const rippleOpacity = cfg.minOpacity + (cfg.maxOpacity - cfg.minOpacity) * smoothT;
    const finalOpacity = cfg.baseOpacity * (1 - influence) + rippleOpacity * influence;

    particles.push({
      x: centerX,
      y: centerY,
      radius: item.h / 2,
      fillColor: item.fillColor,
      opacity: Math.max(0, Math.min(1, finalOpacity)),
      shape: 'typography_box',
      width: item.w,
      height: item.h,
      char: item.word,
      fontSize: cfg.fontSize,
      fontFamily: cfg.fontFamily,
      glyphColor: cfg.textColor,
      strokeColor: cfg.strokeColor,
      strokeWidth: cfg.strokeWidth,
      cornerRadius: item.cornerRadius,
      isFilled: item.isFilled
    });
  }

  return particles;
}

// ============================================================================
// SPORTS — SINE MESH NET
// A wireframe grid whose intersections are displaced by the SAME wave engine (calculateWave) every
// other material already uses — a circular wave pattern from the existing Ripple Origin reads
// exactly like a ball-impact ripple spreading through a net, with zero bespoke physics. Rendered
// entirely with EXISTING particle shapes (line segments as 'tangent_line', node points as 'circle')
// so no new Canvas/SVG rendering code was needed at all.
// ============================================================================

export const DEFAULT_MESH_NET_CONFIG: MeshNetConfig = {
  meshWidth: 0.62,
  meshHeight: 0.62,
  densityX: 16,
  densityY: 12,
  lineThickness: 2,
  showNodes: true,
  nodeSize: 2.6,
  curvature: 0.15,
  perspectiveAmount: 0.2,
  displacementStrength: 1.1,
  damping: 0.35,
  lineColor: '#E8ECF5',
  nodeColor: '#FFFFFF',
  accentColor: '#39FF9E',
  lineOpacity: 0.55,
  glowIntensity: 0.8
};

interface MeshNetPoint {
  x0: number; // base (flat/curved/perspective) position — BEFORE wave displacement
  y0: number;
}

let cachedMeshNetKey = '';
let cachedMeshNetPoints: MeshNetPoint[] = [];
let cachedMeshNetCols = 0;
let cachedMeshNetRows = 0;

/**
 * Builds the flat base grid (with optional curvature/perspective already folded in) once and caches
 * it — only geometry settings or canvas size invalidate it, never the wave/ripple state (task item:
 * cache mesh geometry, don't rebuild every frame).
 */
function getCachedMeshNetGrid(
  cfg: MeshNetConfig,
  width: number,
  height: number
): { points: MeshNetPoint[]; cols: number; rows: number } {
  const cols = Math.max(1, Math.round(cfg.densityX));
  const rows = Math.max(1, Math.round(cfg.densityY));
  const key = `${cfg.meshWidth}|${cfg.meshHeight}|${cols}|${rows}|${cfg.curvature}|${cfg.perspectiveAmount}|${width}|${height}`;
  if (key === cachedMeshNetKey && cachedMeshNetPoints.length > 0) {
    return { points: cachedMeshNetPoints, cols: cachedMeshNetCols, rows: cachedMeshNetRows };
  }

  const cx = width / 2;
  const cy = height / 2;
  const meshW = cfg.meshWidth * width;
  const meshH = cfg.meshHeight * height;

  const points: MeshNetPoint[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = rows > 0 ? row / rows - 0.5 : 0; // -0.5..0.5, top to bottom
    // Perspective: rows further from the mesh's own center compress horizontally, simulating a
    // slight tilt/depth (a net viewed at an angle) without a real 3D camera.
    const perspScale = 1 - cfg.perspectiveAmount * v * 0.6;
    for (let col = 0; col <= cols; col++) {
      const u = cols > 0 ? col / cols - 0.5 : 0; // -0.5..0.5, left to right
      // Curvature: gentle vertical sag across the width — a hanging-net bow, strongest at center.
      const sag = cfg.curvature * Math.cos(u * Math.PI) * meshH * 0.18;
      points.push({
        x0: cx + u * meshW * perspScale,
        y0: cy + v * meshH + sag
      });
    }
  }

  cachedMeshNetKey = key;
  cachedMeshNetPoints = points;
  cachedMeshNetCols = cols;
  cachedMeshNetRows = rows;
  return { points, cols, rows };
}

/**
 * Computes particles for the Sine Mesh Net material. Every intersection samples calculateWave() at
 * its own (undisplaced) base position — the exact same call every other material makes — so Wave
 * Frequency/Speed/Amplitude/Softness/Thickness, Ripple Origin (= impact point), Radial Thickness
 * (= impact falloff), Wave Pattern (circular = radial impact ripple, linear = directional sweep),
 * Dynamic Thickness, and Audio Reactivity all drive the net's motion automatically. `damping` further
 * fades displacement from the MESH's own center outward, on top of whatever falloff the wave pattern
 * itself already has, for a more net-like "impact settles toward the edges" feel.
 *
 * SVG logo support: if the user has uploaded Custom SVG layers (grid.customSvgLayers — the SAME
 * asset the 'custom_svg' dotShape and Original Stitch Pattern both reuse), the mesh's NODE points
 * render that logo instead of a plain dot, using the exact 'custom_svg' particle shape/renderer — the
 * knots of the net become your logo. Lines stay thread-like ('tangent_line'); a logo squeezed into a
 * thin rope segment wouldn't read, so line rendering is unaffected. Text/SVG-as-mask (Object Mask =
 * SVG LOGO in the TEXT tab) is separate — see the `useTextMask` block below, gated on the SAME
 * `grid.hideBackgroundDots` toggle every other bypass-SDF material in this app already uses.
 */
export function computeMeshNetParticles(
  grid: GridConfig,
  wave: WaveConfig,
  style: StyleConfig,
  font: FontConfig,
  sdf: SDFData,
  width: number,
  height: number,
  time: number,
  audioSignal?: AudioSignal,
  audioConfig?: AudioConfig
): Particle[] {
  const cfg: MeshNetConfig = { ...DEFAULT_MESH_NET_CONFIG, ...(grid.meshNet || {}) };
  const { points, cols, rows } = getCachedMeshNetGrid(cfg, width, height);
  const waveFrameCtx = createWaveFrameContext(width, height, time, wave, audioSignal, audioConfig);

  const meshHalfDiag =
    Math.sqrt(Math.pow(cfg.meshWidth * width, 2) + Math.pow(cfg.meshHeight * height, 2)) / 2 || 1;

  // Uploaded Custom SVG layers — identical extraction logic to the standard particle loop / Original
  // Stitch Pattern, so this material reuses the exact same asset already active elsewhere.
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
  const svgDistributionMode: CustomSvgDistribution = grid.customSvgDistribution || 'cycle';
  const logoRadius = Math.max(cfg.nodeSize * 2.5, 6);

  // Text / SVG-mask gate — same toggle and math as Original Stitch Pattern (HIDE BG DOTS). OFF by
  // default so the shipped preset's look never changes; ON hides mesh points outside the current
  // headline text (or an uploaded SVG-as-mask logo from Object Mask → SVG LOGO) silhouette.
  const useTextMask = !!grid.hideBackgroundDots;
  const sdfThreshold = grid.sdfThreshold * 20.0;
  const sdfSoftness = grid.sdfSoftness * 15.0 + 1.0;

  const dispX = new Float32Array(points.length);
  const dispY = new Float32Array(points.length);
  const strength = new Float32Array(points.length);
  const masked = new Uint8Array(points.length); // 1 = hidden by text/SVG mask

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    calculateWave(p.x0, p.y0, width, height, time, wave, audioSignal, waveFrameCtx, sharedWaveRes, audioConfig);

    const distFromMeshCenter = Math.hypot(p.x0 - width / 2, p.y0 - height / 2);
    const dampFactor = Math.max(0, 1 - cfg.damping * Math.min(1, distFromMeshCenter / meshHalfDiag));

    dispX[i] = p.x0 + sharedWaveRes.displacementX * cfg.displacementStrength * dampFactor;
    dispY[i] = p.y0 + sharedWaveRes.displacementY * cfg.displacementStrength * dampFactor;
    strength[i] = Math.max(0, Math.min(1, Math.abs(sharedWaveRes.value - 0.5) * 2));

    if (useTextMask) {
      const sdfDist = sampleSDF(sdf, p.x0, p.y0, width, height);
      const distVal = font.invertText ? -sdfDist : sdfDist;
      const normalizedDist = Math.max(0, Math.min(1, (distVal + sdfThreshold) / sdfSoftness));
      masked[i] = normalizedDist <= 0.01 ? 1 : 0;
    }
  }

  const particles: Particle[] = [];
  const colsPerRow = cols + 1;
  const idx = (col: number, row: number) => row * colsPerRow + col;

  const pushSegment = (i1: number, i2: number) => {
    if (masked[i1] || masked[i2]) return;
    const x1 = dispX[i1];
    const y1 = dispY[i1];
    const x2 = dispX[i2];
    const y2 = dispY[i2];
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 0.5) return;

    const segStrength = (strength[i1] + strength[i2]) / 2;
    const glow = segStrength * cfg.glowIntensity;
    const fillColor = glow > 0.02 ? mixHexColors(cfg.lineColor, cfg.accentColor, Math.min(1, glow)) : cfg.lineColor;

    particles.push({
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
      radius: cfg.lineThickness / 2,
      fillColor,
      opacity: Math.max(0.05, Math.min(1, cfg.lineOpacity + glow * 0.45)),
      shape: 'tangent_line',
      width: len,
      height: cfg.lineThickness,
      angleDeg: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
    });
  };

  // Horizontal threads, then vertical threads — the two families of lines that make up the net.
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col < cols; col++) {
      pushSegment(idx(col, row), idx(col + 1, row));
    }
  }
  for (let col = 0; col <= cols; col++) {
    for (let row = 0; row < rows; row++) {
      pushSegment(idx(col, row), idx(col, row + 1));
    }
  }

  if (cfg.showNodes) {
    for (let i = 0; i < points.length; i++) {
      if (masked[i]) continue;
      const glow = strength[i] * cfg.glowIntensity;

      if (activeCustomLayers.length > 0) {
        let assignedLayerIndices: number[];
        if (svgDistributionMode === 'stacked') {
          assignedLayerIndices = activeCustomLayers.map((_, idx2) => idx2);
        } else if (svgDistributionMode === 'random') {
          const hash = Math.abs((i * 2654435761) | 0);
          assignedLayerIndices = [hash % activeCustomLayers.length];
        } else if (svgDistributionMode === 'size_tier') {
          // Unlike the standard grid (tiered by a STABLE distance-from-text value), this material's
          // only per-point signal is wave `strength`, which is continuously animated — tiering the
          // assigned LAYER by it would swap a node's logo every frame (the same class of bug as the
          // fillColor cache-thrashing issue above). Falls back to the same stable assignment as
          // 'cycle' so multi-layer uploads stay visually stable here.
          assignedLayerIndices = [i % activeCustomLayers.length];
        } else {
          assignedLayerIndices = [i % activeCustomLayers.length];
        }
        particles.push({
          // fillColor stays the STABLE cfg.nodeColor here — not blended with glow like the plain-
          // circle fallback below. getOrCacheSvgImage() keys its cache on this exact color (recolorMode
          // 'theme'/'original'), so a value that changes every frame (glow is continuously animated)
          // would force a brand-new Image()/data-URI decode for every node on every frame — never
          // hitting the cache, never finishing decode in time to draw, and starving the render loop.
          // That was the actual cause of nodes appearing to vanish/flicker once an SVG logo was active.
          // The "impact glow" cue still reads clearly through opacity below, which is cheap per-frame.
          x: dispX[i],
          y: dispY[i],
          radius: logoRadius,
          fillColor: cfg.nodeColor,
          opacity: Math.max(0.1, Math.min(1, cfg.lineOpacity + 0.35 + glow * 0.45)),
          shape: 'custom_svg',
          customLayers: activeCustomLayers,
          assignedLayerIndices
        });
      } else {
        const fillColor = glow > 0.02 ? mixHexColors(cfg.nodeColor, cfg.accentColor, Math.min(1, glow)) : cfg.nodeColor;
        particles.push({
          x: dispX[i],
          y: dispY[i],
          radius: cfg.nodeSize,
          fillColor,
          opacity: Math.max(0.1, Math.min(1, cfg.lineOpacity + 0.25 + glow * 0.45)),
          shape: 'circle'
        });
      }
    }
  }

  return particles;
}

// ============================================================================
// SPORTS — SPEED STRIPE FIELD
// A field of diagonal dash units rendered entirely with the EXISTING 'tile' particle shape (a sharp-
// cornered rotated rectangle already used by Style 09 Kinetic Tile Vortex) — no new Canvas/SVG
// rendering code needed. Every dash samples the SAME wave engine (calculateWave) every other material
// uses, at its own center, so Wave Frequency/Speed/Amplitude/Origin/Pattern (WAVE tab) drive the
// ripple itself; this material only decides how strongly/which way each dash READS that ripple.
// ============================================================================

export const DEFAULT_SPEED_STRIPE_CONFIG: SpeedStripeConfig = {
  dashAngle: 35,
  dashWidth: 52,
  dashHeight: 16,
  spacingX: 6,
  spacingY: 6,
  rowOffset: 0.5,
  columnCount: 12,
  rowCount: 9,
  fieldWidth: 0.72,
  fieldHeight: 0.5,
  scaleProgression: 0,
  variationMode: 'wave_activated',
  rippleInfluence: 0.9,
  animSpeed: 1.0,
  displacementAmount: 0.25,
  opacityInfluence: 0.6,
  scalePulseAmount: 0.3,
  staggerAmount: 0,
  motionDirection: 0,
  primaryColor: '#FFF200',
  secondaryColor: '#000000',
  baseOpacity: 0.85,
  minOpacity: 0.3,
  maxOpacity: 1.0,
  contrast: 1.0
};

interface SpeedStripePoint {
  col: number;
  row: number;
  bx: number; // base center x, BEFORE wave displacement
  by: number; // base center y
  dashW: number; // pre-scaled dash render width (already clamped to its cell pitch)
  dashH: number; // pre-scaled dash render height
}

let cachedSpeedStripeKey = '';
let cachedSpeedStripePoints: SpeedStripePoint[] = [];

/**
 * Builds the dash field's base positions/sizes once and caches them — only geometry settings or
 * canvas size invalidate it, never the wave/ripple state (same cache-geometry-not-per-frame pattern
 * as getCachedMeshNetGrid / buildTypographyBoxItems above).
 */
function getCachedSpeedStripeGrid(cfg: SpeedStripeConfig, width: number, height: number): SpeedStripePoint[] {
  const cols = Math.max(1, Math.round(cfg.columnCount));
  const rows = Math.max(1, Math.round(cfg.rowCount));
  const key = `${cfg.fieldWidth}|${cfg.fieldHeight}|${cols}|${rows}|${cfg.dashWidth}|${cfg.dashHeight}|${cfg.spacingX}|${cfg.spacingY}|${cfg.rowOffset}|${cfg.scaleProgression}|${width}|${height}`;
  if (key === cachedSpeedStripeKey && cachedSpeedStripePoints.length > 0) {
    return cachedSpeedStripePoints;
  }

  const fieldW = cfg.fieldWidth * width;
  const fieldH = cfg.fieldHeight * height;
  const fieldX0 = width / 2 - fieldW / 2;
  const fieldY0 = height / 2 - fieldH / 2;
  const colPitch = fieldW / cols;
  const rowPitch = fieldH / rows;
  const baseDashW = Math.max(1, Math.min(cfg.dashWidth, colPitch - cfg.spacingX));
  const baseDashH = Math.max(1, Math.min(cfg.dashHeight, rowPitch - cfg.spacingY));

  const points: SpeedStripePoint[] = [];
  for (let row = 0; row < rows; row++) {
    const rowOffsetPx = row % 2 === 1 ? cfg.rowOffset * colPitch : 0;
    for (let col = 0; col < cols; col++) {
      // Static scaling progression across the field (FORM STRUCTURE: "optional scaling progression").
      const t = cols > 1 ? col / (cols - 1) - 0.5 : 0; // -0.5..0.5
      const progressionMul = 1 + cfg.scaleProgression * t * 2;
      points.push({
        col,
        row,
        bx: fieldX0 + col * colPitch + rowOffsetPx + colPitch / 2,
        by: fieldY0 + row * rowPitch + rowPitch / 2,
        dashW: Math.max(1, baseDashW * progressionMul),
        dashH: Math.max(1, baseDashH * progressionMul)
      });
    }
  }

  cachedSpeedStripeKey = key;
  cachedSpeedStripePoints = points;
  return points;
}

/**
 * Computes particles for the Speed Stripe Field material. Each dash calls calculateWave() at its own
 * base position — the exact same function every other material calls — so by default the dash field
 * genuinely RADIATES from the WAVE tab's Ripple Origin exactly like every other preset (circular wave
 * pattern spreading outward), instead of a bespoke motion system. `staggerAmount` defaults to 0 for
 * this reason — it's an OPTIONAL extra directional "sweep" (time-shifting each dash's OWN
 * calculateWave() call based on its projected position along `motionDirection`, no second motion
 * system), only for when a user deliberately wants a linear drift on top of/instead of the natural
 * radiating ripple. `rippleInfluence`/`opacityInfluence`/`displacementAmount`/`scalePulseAmount` decide
 * how strongly each dash's own wave sample shows up as opacity, position, and size.
 */
export function computeSpeedStripeParticles(
  grid: GridConfig,
  wave: WaveConfig,
  style: StyleConfig,
  font: FontConfig,
  sdf: SDFData,
  width: number,
  height: number,
  time: number,
  audioSignal?: AudioSignal,
  audioConfig?: AudioConfig
): Particle[] {
  const cfg: SpeedStripeConfig = { ...DEFAULT_SPEED_STRIPE_CONFIG, ...(grid.speedStripe || {}) };
  const points = getCachedSpeedStripeGrid(cfg, width, height);
  const waveFrameCtx = createWaveFrameContext(width, height, time, wave, audioSignal, audioConfig);

  const fieldDiag = Math.sqrt(Math.pow(cfg.fieldWidth * width, 2) + Math.pow(cfg.fieldHeight * height, 2)) || 1;
  const dirRad = (cfg.motionDirection * Math.PI) / 180;
  const dirX = Math.cos(dirRad);
  const dirY = Math.sin(dirRad);
  const useStagger = cfg.variationMode === 'staggered' || cfg.variationMode === 'wave_activated';
  const useScalePulse = cfg.variationMode === 'scaled' || cfg.variationMode === 'wave_activated';
  const useAlternating = cfg.variationMode === 'alternating';
  const rippleGate = Math.max(0, Math.min(1, cfg.rippleInfluence));

  // Text / SVG-mask gate — same toggle and math as Original Stitch Pattern / Sine Mesh Net.
  const useTextMask = !!grid.hideBackgroundDots;
  const sdfThreshold = grid.sdfThreshold * 20.0;
  const sdfSoftness = grid.sdfSoftness * 15.0 + 1.0;

  const particles: Particle[] = [];

  for (const p of points) {
    if (useTextMask) {
      const sdfDist = sampleSDF(sdf, p.bx, p.by, width, height);
      const distVal = font.invertText ? -sdfDist : sdfDist;
      const normalizedDist = Math.max(0, Math.min(1, (distVal + sdfThreshold) / sdfSoftness));
      if (normalizedDist <= 0.01) continue;
    }

    let effectiveTime = time * cfg.animSpeed;
    if (useStagger) {
      const proj = (p.bx * dirX + p.by * dirY) / fieldDiag; // roughly -1..1
      effectiveTime -= proj * cfg.staggerAmount * 1.5;
    }

    calculateWave(p.bx, p.by, width, height, effectiveTime, wave, audioSignal, waveFrameCtx, sharedWaveRes, audioConfig);

    const rawStrength = Math.max(0, Math.min(1, Math.abs(sharedWaveRes.value - 0.5) * 2));
    const contrasted = Math.max(0, Math.min(1, 0.5 + (rawStrength - 0.5) * cfg.contrast));
    const gatedStrength = contrasted * rippleGate;

    const x = p.bx + sharedWaveRes.displacementX * cfg.displacementAmount;
    const y = p.by + sharedWaveRes.displacementY * cfg.displacementAmount;

    const scaleMul = useScalePulse ? 1 + gatedStrength * cfg.scalePulseAmount : 1;
    const dashW = p.dashW * scaleMul;
    const dashH = p.dashH * scaleMul;

    let fillColor: string;
    if (useAlternating) {
      fillColor = (p.col + p.row) % 2 === 0 ? cfg.primaryColor : cfg.secondaryColor;
    } else {
      fillColor = gatedStrength > 0.04 ? mixHexColors(cfg.primaryColor, cfg.secondaryColor, Math.min(1, gatedStrength * 1.2)) : cfg.primaryColor;
    }

    const rippleOpacity = cfg.minOpacity + (cfg.maxOpacity - cfg.minOpacity) * gatedStrength;
    const opacity = Math.max(0, Math.min(1, cfg.baseOpacity * (1 - cfg.opacityInfluence) + rippleOpacity * cfg.opacityInfluence));

    particles.push({
      x,
      y,
      radius: dashH / 2,
      fillColor,
      opacity,
      shape: 'tile',
      width: dashW,
      height: dashH,
      angleDeg: cfg.dashAngle
    });
  }

  return particles;
}

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

// ============================================================================
// TYPOGRAPHY RADIAL RIPPLE (Breaking Signal redesign #2)
// Paragraph text laid out as individual character blocks (colored cell + glyph), radially displaced
// by the SAME existing wave/ripple engine (wave.ts calculateWave — circular/pulse/flow), not a bespoke
// motion system. Reuses the same Particle[] pipeline; only compositionMode === 'typography_ripple'
// opts into this path, so every other preset is completely unaffected.
// ============================================================================

export const DEFAULT_TYPOGRAPHY_RIPPLE_CONFIG: TypographyRippleConfig = {
  text:
    'SIGNAL LOST IN THE BROADCAST SEQUENCE OF THIS DISRUPTED TRANSMISSION. THE NETWORK REROUTES EVERY FREQUENCY THROUGH LAYERS OF INTERFERENCE AS EDITORIAL DESKS RACE TO CONFIRM THE SOURCE.\n\nAcross every channel, fragmented signals rebuild themselves into a single verified broadcast, carrying the story forward before the next disruption arrives.',
  fontFamily: 'Times New Roman',
  fontSize: 29,
  textColor: '#FFFFFF',
  blockWidth: 16,
  blockHeight: 32,
  lineHeight: 42,
  marginX: 90,
  paragraphGap: 55,
  verticalPulseStrength: 18,
  blockScaleAmount: 0.08
};

interface TypoCharCell {
  char: string;
  baseX: number;
  baseY: number;
  color: string;
  phase: number;
}

let cachedTypoKey = '';
let cachedTypoCells: TypoCharCell[] = [];

/**
 * Word-wraps the paragraph text into fixed-width character cells (monospace-style layout regardless
 * of actual glyph metrics, matching the reference sketch) and assigns each character a color from the
 * existing multi-color palette system, then centers the whole block vertically. Cached by every input
 * that affects layout/color so it isn't rebuilt every animation frame — only recomputed when the user
 * edits text, typography, or color settings (item 7 / performance).
 */
function buildTypographyCells(
  cfg: TypographyRippleConfig,
  style: StyleConfig,
  width: number,
  height: number,
  seed: number
): TypoCharCell[] {
  const palette =
    style.enableMultiColor && style.multiColorPalette && style.multiColorPalette.length > 0
      ? style.multiColorPalette
      : [style.dotColor];
  const distribution = style.multiColorDistribution || 'palette_list';

  const key = `${cfg.text}|${cfg.blockWidth}|${cfg.lineHeight}|${cfg.marginX}|${cfg.paragraphGap}|${width}|${height}|${seed}|${palette.join(
    ','
  )}|${distribution}`;
  if (key === cachedTypoKey && cachedTypoCells.length > 0) {
    return cachedTypoCells;
  }

  const paragraphs = cfg.text.split('\n');
  const availableWidth = Math.max(cfg.blockWidth * 4, width - cfg.marginX * 2);
  const maxChars = Math.max(1, Math.floor(availableWidth / cfg.blockWidth));

  const cells: TypoCharCell[] = [];
  let currentY = 0;
  let lineIndex = 0;
  let charIndex = 0;

  for (const rawParagraph of paragraphs) {
    const paragraph = rawParagraph.trim();
    if (paragraph.length === 0) {
      currentY += cfg.paragraphGap;
      continue;
    }

    const words = paragraph.split(' ');
    const wrappedLines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine.length === 0 ? word : currentLine + ' ' + word;
      if (testLine.length > maxChars && currentLine.length > 0) {
        wrappedLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0) wrappedLines.push(currentLine);

    for (const lineText of wrappedLines) {
      const lineWidth = lineText.length * cfg.blockWidth;
      const startX = width / 2 - lineWidth / 2;

      for (let i = 0; i < lineText.length; i++) {
        const ch = lineText[i];
        if (ch === ' ') continue;

        let color = palette[0];
        if (distribution === 'random') {
          color = palette[Math.abs((charIndex * 2654435761 + seed) | 0) % palette.length];
        } else if (distribution === 'grouped') {
          color = palette[lineIndex % palette.length];
        } else if (distribution === 'gradient_based') {
          const t = Math.max(0, Math.min(0.999, i / Math.max(1, lineText.length - 1)));
          color = palette[Math.floor(t * palette.length)];
        } else {
          // 'palette_list' — smooth-ish clustering via a coarse deterministic hash of (column, line),
          // matching the reference's noise-based color blobs without needing a Perlin implementation.
          const h = prng(seed + 613, Math.floor(i / 2) * 31 + lineIndex * 7);
          color = palette[Math.floor(h * palette.length) % palette.length];
        }

        cells.push({
          char: ch,
          baseX: startX + i * cfg.blockWidth + cfg.blockWidth / 2,
          baseY: currentY,
          color,
          phase: prng(seed + 919, charIndex) * Math.PI * 2
        });
        charIndex++;
      }

      currentY += cfg.lineHeight;
      lineIndex++;
    }

    currentY += 5;
  }

  // Center the whole composition vertically within the canvas
  if (cells.length > 0) {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const c of cells) {
      minY = Math.min(minY, c.baseY);
      maxY = Math.max(maxY, c.baseY);
    }
    const compositionCenterY = (minY + maxY) / 2;
    const offsetY = height / 2 - compositionCenterY;
    for (const c of cells) c.baseY += offsetY;
  }

  cachedTypoKey = key;
  cachedTypoCells = cells;
  return cells;
}

/**
 * Computes particles for the Typography Radial Ripple mode. Each character cell's displacement,
 * envelope intensity, and scale pulse come directly from the existing wave engine (calculateWave —
 * circular/pulse pattern by convention, but honors whatever pattern/mode the user has configured), so
 * this is a real ripple driven by the same engine as every other preset, not a standalone effect.
 */
export function computeTypographyRippleParticles(
  grid: GridConfig,
  wave: WaveConfig,
  style: StyleConfig,
  width: number,
  height: number,
  time: number,
  audioSignal?: AudioSignal,
  audioConfig?: AudioConfig
): Particle[] {
  const cfg: TypographyRippleConfig = { ...DEFAULT_TYPOGRAPHY_RIPPLE_CONFIG, ...(grid.typographyRipple || {}) };
  const seed = wave.randomSeed || 42;
  const cells = buildTypographyCells(cfg, style, width, height, seed);
  const waveFrameCtx = createWaveFrameContext(width, height, time, wave, audioSignal, audioConfig);

  const particles: Particle[] = [];

  for (const cell of cells) {
    calculateWave(cell.baseX, cell.baseY, width, height, time, wave, audioSignal, waveFrameCtx, sharedWaveRes, audioConfig);

    const envelope = Math.max(0, Math.min(1.6, sharedWaveRes.value));
    const currentX = cell.baseX + sharedWaveRes.displacementX;
    const verticalPulse =
      envelope * cfg.verticalPulseStrength * Math.sin(time * (wave.waveSpeed || 1.0) * 3.0 + cell.phase);
    const currentY = cell.baseY + sharedWaveRes.displacementY + verticalPulse;

    const blockScale = 1 + envelope * cfg.blockScaleAmount;

    particles.push({
      x: currentX,
      y: currentY,
      radius: (cfg.blockWidth * blockScale) / 2,
      fillColor: cell.color,
      opacity: 1.0,
      shape: 'typo_block',
      width: cfg.blockWidth * blockScale,
      height: cfg.blockHeight * blockScale,
      char: cell.char,
      fontSize: cfg.fontSize * blockScale,
      fontFamily: cfg.fontFamily,
      glyphColor: cfg.textColor
    });
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
  audioSignal?: AudioSignal,
  audioConfig?: AudioConfig
): Particle[] {
  // Modular Signal Field (Breaking Signal redesign) uses its own dedicated point-generation path —
  // staggered vertical strips, not the text-masked grid below. Gated on compositionMode so no other
  // preset (which never sets it) is affected.
  if (compositionMode === 'modular_signal_field') {
    return computeModularStripParticles(grid, wave, style, width, height, time);
  }

  // Typography Radial Ripple (Breaking Signal redesign #2) uses its own dedicated point-generation
  // path — paragraph text laid out as character cells, displaced by the shared wave engine below —
  // rather than the text-masked grid. Gated on compositionMode so no other preset is affected.
  if (compositionMode === 'typography_ripple') {
    return computeTypographyRippleParticles(grid, wave, style, width, height, time, audioSignal, audioConfig);
  }

  // 3D Radial Wave mode uses its own dedicated point-generation path (concentric rings projected
  // through a lightweight 3D rotation) rather than the text-masked grid below — see
  // computeRadial3DParticles. It still returns the same Particle[] shape consumed by every renderer.
  if (wave.pattern === 'radial_3d') {
    return computeRadial3DParticles(wave, style, width, height, time);
  }

  // Culture — Original Stitch Pattern uses its own dedicated 120x120 point-generation path (exact
  // port of the source sketch) rather than the text-masked grid below — see
  // computeOriginalStitchParticles. Gated on dotShape so no other preset/style is affected.
  if (grid.dotShape === 'original_stitch') {
    return computeOriginalStitchParticles(wave, style, grid, font, sdf, width, height, time, audioSignal, audioConfig);
  }

  // News — Typography Box Material uses its own dedicated word-box grid (see
  // computeTypographyBoxParticles) rather than the standard text-masked grid below — the packed word
  // grid fills the canvas by default, but can optionally be clipped to a text/SVG-logo silhouette via
  // HIDE BG DOTS (see the Clip Mask support inside computeTypographyBoxParticles). Gated on dotShape so
  // no other preset is affected.
  if (grid.dotShape === 'typography_box') {
    return computeTypographyBoxParticles(grid, wave, style, font, sdf, width, height, time, audioSignal, audioConfig);
  }

  // Sports — Sine Mesh Net uses its own dedicated wireframe grid (see computeMeshNetParticles) rather
  // than the text-masked grid below. Gated on dotShape so no other preset/style is affected.
  if (grid.dotShape === 'mesh_net') {
    return computeMeshNetParticles(grid, wave, style, font, sdf, width, height, time, audioSignal, audioConfig);
  }

  // Sports — Speed Stripe Field uses its own dedicated diagonal dash grid (see
  // computeSpeedStripeParticles) rather than the text-masked grid below. Gated on dotShape so no other
  // preset/style is affected.
  if (grid.dotShape === 'speed_stripe') {
    return computeSpeedStripeParticles(grid, wave, style, font, sdf, width, height, time, audioSignal, audioConfig);
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
  const waveFrameCtx = createWaveFrameContext(width, height, time, wave, audioSignal, audioConfig);

  // Pre-calculate color gradient LUT if gradient is enabled
  const gradientLUT = style.enableColorGradient && !style.uniformColorBrightness ? getGradientLUT(dotColor, gradientColor) : null;

  // Audio Reactivity — Parameter Mapping Matrix targets that apply per-particle (item 7): computed
  // ONCE per frame (bass/mid/high/beatPulse/overallEnergy don't vary per point), not per particle.
  let audioSizeDelta = 0;
  let audioOpacityDelta = 0;
  const audioReactiveActive = !!(audioConfig?.enabled && audioSignal?.isActive);
  if (audioReactiveActive && audioConfig?.mappings) {
    for (const m of audioConfig.mappings) {
      let sourceVal = 0;
      switch (m.source) {
        case 'bass': sourceVal = audioSignal!.bass; break;
        case 'mid': sourceVal = audioSignal!.mid; break;
        case 'high': sourceVal = audioSignal!.high; break;
        case 'overallEnergy': sourceVal = audioSignal!.rmsVolume; break;
        case 'beatPulse': sourceVal = audioSignal!.beatPulse ?? 0; break;
        case 'vocal': sourceVal = audioSignal!.vocal ?? 0; break;
        case 'fullMix': sourceVal = audioSignal!.fullMix ?? 0; break;
      }
      const delta = sourceVal * m.amount;
      if (m.target === 'particleSize') audioSizeDelta += delta * 0.8;
      else if (m.target === 'particleOpacity') audioOpacityDelta += delta * 0.7;
    }
  }

  let particleIndex = 0;

  for (let pi = 0; pi < points.length; pi++) {
    const { x0, y0, rowIdx, colIdx } = points[pi];
    calculateWave(x0, y0, width, height, time, wave, audioSignal, waveFrameCtx, sharedWaveRes, audioConfig);

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
    let finalRadius = Math.max(0.0, baseRadius * (1.0 + waveBoost));
    if (audioSizeDelta !== 0) {
      finalRadius = Math.max(0.0, finalRadius * (1.0 + audioSizeDelta));
    }

    if (finalRadius < 0.2) {
      continue;
    }

    let opacity = style.uniformColorBrightness ? 1.0 : Math.min(1.0, Math.max(0.05, 0.35 + sharedWaveRes.value * 0.65));
    if (audioOpacityDelta !== 0) {
      opacity = Math.min(1.0, Math.max(0.05, opacity + audioOpacityDelta));
    }

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

    // Audio Reactivity — optional dynamic color shift + beat glow (item 8). OFF by default; the
    // user's chosen palette/colors are never forcibly replaced unless they explicitly enable this.
    if (audioReactiveActive && audioConfig?.audioColorShift) {
      const lvl = Math.max(0, Math.min(1, sharedWaveRes.value));
      if (audioConfig.audioColorShiftMode === 'p5_inverted') {
        const targetHex = rgbToHex(255 - lvl * 242, 255 - lvl * 242, Math.min(255, 51 + lvl * 204));
        fillColor = mixHexColors(fillColor, targetHex, 0.75);
      } else if (audioConfig.audioColorShiftMode === 'spectrum_shift') {
        const hue = (lvl * 0.8 + time * 0.15) % 1;
        const targetHex = hslToHex(hue, 0.75, 0.6);
        fillColor = mixHexColors(fillColor, targetHex, 0.8);
      } else {
        // 'accent_glow' (default): morph toward the theme's accent color
        fillColor = mixHexColors(fillColor, style.accentColor, lvl * 0.9);
      }
    }
    if (audioReactiveActive && audioConfig?.audioBeatGlow && (audioSignal?.beatPulse ?? 0) > 0.01) {
      fillColor = mixHexColors(fillColor, style.accentColor, Math.min(0.6, (audioSignal!.beatPulse ?? 0) * 0.4));
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
      particle.stitchTapered = mode === 'diagonal_sashiko';
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
 * Renders original typography layer for Molecule Wave Only / Editorial Collage modes on HTML5 Canvas.
 * When Object Mask is set to SVG LOGO (font.maskMode === 'svg_mask'), draws the uploaded logo crisply
 * here instead of text — this "crisp headline" layer previously only ever knew how to draw font.text,
 * so an uploaded SVG logo simply never appeared on it (the generative particle layer still honored the
 * SVG as a mask, but this overlay silently ignored it).
 */
export function renderOriginalTypographyToCanvas(
  ctx: CanvasRenderingContext2D,
  font: FontConfig,
  style: StyleConfig,
  canvasWidth: number,
  canvasHeight: number
): void {
  const scale = style.editorialHeadlineScale ?? 1.0;
  const offsetX = style.editorialHeadlineOffsetX ?? 0;
  const offsetY = style.editorialHeadlineOffsetY ?? 0;
  const color = style.editorialHeadlineColor || '#ffffff';
  const opacity = style.editorialHeadlineOpacity ?? 1.0;

  if (font.maskMode === 'svg_mask' && font.maskSvgXml) {
    const img = getOrCacheEditorialSvgImage(font.maskSvgXml, color);
    if (!img) return; // still decoding — will draw on a later frame once the cache resolves

    const maxW = canvasWidth * 0.6;
    const maxH = canvasHeight * 0.45;
    const intrinsicW = img.naturalWidth || 1;
    const intrinsicH = img.naturalHeight || 1;
    const baseScale = Math.min(maxW / intrinsicW, maxH / intrinsicH);
    const drawW = intrinsicW * baseScale * scale;
    const drawH = intrinsicH * baseScale * scale;
    const cx = canvasWidth * 0.5 + offsetX;
    const cy = canvasHeight * 0.5 + offsetY;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    ctx.restore();
    return;
  }

  const text = font.text.trim();
  if (!text) return;

  ctx.save();
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
  const scale = style.editorialHeadlineScale ?? 1.0;
  const offsetX = style.editorialHeadlineOffsetX ?? 0;
  const offsetY = style.editorialHeadlineOffsetY ?? 0;
  const color = style.editorialHeadlineColor || '#ffffff';
  const opacity = style.editorialHeadlineOpacity ?? 1.0;

  if (font.maskMode === 'svg_mask' && font.maskSvgXml) {
    const processedXml = recolorSvgXml(font.maskSvgXml, color, 'theme');
    try {
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(processedXml, 'image/svg+xml');
      const svgEl = parsedDoc.querySelector('svg');
      if (!svgEl) return;

      const viewBox = svgEl.getAttribute('viewBox');
      const parts = viewBox ? viewBox.trim().split(/[\s,]+/).map(Number) : [];
      const intrinsicW = parts.length === 4 && parts[2] > 0 ? parts[2] : parseFloat(svgEl.getAttribute('width') || '') || 100;
      const intrinsicH = parts.length === 4 && parts[3] > 0 ? parts[3] : parseFloat(svgEl.getAttribute('height') || '') || 100;
      const vbX = parts.length === 4 ? parts[0] : 0;
      const vbY = parts.length === 4 ? parts[1] : 0;

      const maxW = canvasWidth * 0.6;
      const maxH = canvasHeight * 0.45;
      const baseScale = Math.min(maxW / intrinsicW, maxH / intrinsicH);
      const drawScale = baseScale * scale;
      const cx = canvasWidth * 0.5 + offsetX;
      const cy = canvasHeight * 0.5 + offsetY;

      const logoGroup = svgDoc.createElementNS(SVG_NS, 'g');
      logoGroup.setAttribute('opacity', opacity.toFixed(2));
      logoGroup.setAttribute(
        'transform',
        `translate(${cx.toFixed(2)}, ${cy.toFixed(2)}) scale(${drawScale.toFixed(4)}) translate(${(-vbX - intrinsicW / 2).toFixed(2)}, ${(-vbY - intrinsicH / 2).toFixed(2)})`
      );
      for (const child of Array.from(svgEl.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          logoGroup.appendChild(svgDoc.importNode(child, true));
        }
      }
      svgGroup.appendChild(logoGroup);
    } catch (e) {
      console.warn('SVG parse error for editorial headline export:', e);
    }
    return;
  }

  const text = font.text.trim();
  if (!text) return;

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
    if (particle.stitchTapered) {
      // Diagonal Sashiko: a pointed "leaf/eye" mark — widest at the middle, pinched to a sharp point
      // at each end — instead of the rounded-pill mark every other stitch mode uses.
      const tip = len * 0.22;
      ctx.moveTo(-len / 2, 0);
      ctx.quadraticCurveTo(-tip, -thick / 2, 0, -thick / 2);
      ctx.quadraticCurveTo(tip, -thick / 2, len / 2, 0);
      ctx.quadraticCurveTo(tip, thick / 2, 0, thick / 2);
      ctx.quadraticCurveTo(-tip, thick / 2, -len / 2, 0);
      ctx.closePath();
    } else if ('roundRect' in ctx && typeof ctx.roundRect === 'function') {
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
  } else if (shape === 'original_stitch') {
    // Culture — Original Stitch Pattern: exact geometry from the source sketch — a single rotated
    // ellipse per stitch, no highlight stroke, no rounded-rect capsule (those belong to the other
    // 'stitch'/'woven' shapes only). particle.width/height are p5-style diameters (ellipse(0,0,w,h)),
    // so Canvas2D's radius-based ellipse() call halves them.
    const w = particle.width ?? radius * 0.8;
    const h = particle.height ?? radius * 2;
    const angleRad = ((particle.angleDeg ?? 0) * Math.PI) / 180;

    ctx.translate(x, y);
    ctx.rotate(angleRad);

    if (particle.customLayers && particle.assignedLayerIndices) {
      // Uploaded SVG logo, reusing the SAME cached-image draw path as the 'custom_svg' dotShape —
      // but rotated by THIS stitch's own alternating angle (set above) rather than only the layer's
      // static rotationOffset, so the woven look survives even when stitches render as a logo.
      for (const idx of particle.assignedLayerIndices) {
        const layer = particle.customLayers[idx];
        if (!layer || layer.enabled === false) continue;

        const layerColor =
          layer.recolorMode === 'custom' ? layer.customColor || '#00F0FF' : fillColor;
        const img = getOrCacheSvgImage(layer, layerColor);
        const layerOpacity = particle.opacity * (layer.opacity ?? 1.0);

        ctx.save();
        ctx.globalAlpha = layerOpacity;
        if (layer.rotationOffset) ctx.rotate((layer.rotationOffset * Math.PI) / 180);

        if (img) {
          let drawW = w;
          let drawH = h;
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            const aspect = img.naturalWidth / img.naturalHeight;
            if (aspect > 1) drawH = w / aspect;
            else if (aspect < 1) drawW = h * aspect;
          }
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
          ctx.fillStyle = layerColor;
          ctx.beginPath();
          ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    } else {
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (shape === 'typography_box') {
    // News — Typography Box Material: rounded box + centered word, one material unit. Fill, stroke,
    // and text all inherit ctx.globalAlpha (set from particle.opacity at the top of this function), so
    // all three fade together with the ripple — never just the background (task item 4).
    const w = particle.width ?? radius * 3;
    const h = particle.height ?? radius * 2;
    const cr = Math.min(particle.cornerRadius ?? 50, Math.min(w, h) / 2);

    ctx.translate(x, y);
    ctx.beginPath();
    if ('roundRect' in ctx && typeof ctx.roundRect === 'function') {
      ctx.roundRect(-w / 2, -h / 2, w, h, cr);
    } else {
      ctx.rect(-w / 2, -h / 2, w, h);
    }
    if (particle.isFilled) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = particle.strokeColor || '#000000';
    ctx.lineWidth = particle.strokeWidth ?? 3;
    ctx.stroke();

    if (particle.char) {
      ctx.font = `bold ${particle.fontSize || 52}px "${particle.fontFamily || 'Arial'}", sans-serif`;
      ctx.fillStyle = particle.glyphColor || '#000000';
      ctx.textAlign = 'center';
      const label = particle.char.toUpperCase();
      // `textBaseline: 'middle'` centers on the FONT's declared ascent/descent box, which reserves
      // room for descenders (g/y/p/...) that never appear in these all-caps words — so the visible
      // glyphs consistently rode high inside the pill. Measuring the glyphs' actual rendered ink
      // (actualBoundingBoxAscent/Descent) and centering on THAT instead gives true optical vertical
      // centering regardless of the word's shape. Falls back to 'middle' on engines without ink
      // metrics (older Safari).
      const metrics = ctx.measureText(label);
      if (typeof metrics.actualBoundingBoxAscent === 'number' && typeof metrics.actualBoundingBoxDescent === 'number') {
        ctx.textBaseline = 'alphabetic';
        const inkCenterOffset = (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
        ctx.fillText(label, 0, inkCenterOffset);
      } else {
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
      }
    }
  } else if (shape === 'modular_strip') {
    // Flat, hard-edged vertical color block — no rotation, no soft gradient, per the
    // "flat editorial color blocks" form language of the Modular Signal Field mode.
    const w = particle.width ?? radius * 2;
    const h = particle.height ?? radius * 4;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fill();
  } else if (shape === 'typo_block') {
    // Typography Radial Ripple: a colored character cell (flat block) with its glyph drawn on top —
    // the pairing that gives Breaking Signal its "colored typewriter block" look.
    const w = particle.width ?? radius * 2;
    const h = particle.height ?? radius * 4;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.rect(x - w / 2, y - h / 2, w, h);
    ctx.fill();

    if (particle.char) {
      const fSize = particle.fontSize || Math.max(8, h * 0.75);
      ctx.font = `${fSize}px "${particle.fontFamily || 'Times New Roman'}", serif`;
      ctx.fillStyle = particle.glyphColor || '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(particle.char, x, y - h * 0.03);
    }
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
    if (particle.stitchTapered) {
      // Diagonal Sashiko: same pointed "leaf/eye" mark as the Canvas branch, as a vector path.
      const tip = len * 0.22;
      const path = svgDoc.createElementNS(SVG_NS, 'path');
      path.setAttribute(
        'd',
        `M ${(-len / 2).toFixed(2)},0 ` +
          `Q ${(-tip).toFixed(2)},${(-thick / 2).toFixed(2)} 0,${(-thick / 2).toFixed(2)} ` +
          `Q ${tip.toFixed(2)},${(-thick / 2).toFixed(2)} ${(len / 2).toFixed(2)},0 ` +
          `Q ${tip.toFixed(2)},${(thick / 2).toFixed(2)} 0,${(thick / 2).toFixed(2)} ` +
          `Q ${(-tip).toFixed(2)},${(thick / 2).toFixed(2)} ${(-len / 2).toFixed(2)},0 Z`
      );
      path.setAttribute('fill', fillColor);
      path.setAttribute('opacity', opacity.toFixed(2));
      path.setAttribute('transform', `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${angleDeg.toFixed(1)})`);
      svgGroup.appendChild(path);
    } else {
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
    }
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
  } else if (shape === 'original_stitch') {
    // Culture — Original Stitch Pattern: exact rotated-ellipse geometry, matching the Canvas branch.
    const w = particle.width ?? radius * 0.8;
    const h = particle.height ?? radius * 2;
    const angleDeg = particle.angleDeg ?? 0;

    if (particle.customLayers && particle.assignedLayerIndices) {
      // Uploaded SVG logo — same vector embedding as the 'custom_svg' export branch below, nested
      // inside the stitch's own alternating-angle rotation so the woven look survives in exports too.
      for (const idx of particle.assignedLayerIndices) {
        const layer = particle.customLayers[idx];
        if (!layer || layer.enabled === false) continue;

        const layerColor = layer.recolorMode === 'custom' ? layer.customColor || '#00F0FF' : fillColor;
        const targetColor = layer.recolorMode === 'original' ? null : layerColor;
        const processedXml = recolorSvgXml(layer.svgXml, targetColor, layer.recolorMode);
        const layerOpacity = opacity * (layer.opacity ?? 1.0);
        const layerRot = layer.rotationOffset ?? 0;

        const layerG = svgDoc.createElementNS(SVG_NS, 'g');
        layerG.setAttribute('opacity', layerOpacity.toFixed(2));

        try {
          const parser = new DOMParser();
          const parsedDoc = parser.parseFromString(processedXml, 'image/svg+xml');
          const svgEl = parsedDoc.querySelector('svg');
          if (svgEl) {
            const viewBox = svgEl.getAttribute('viewBox');
            const baseTransform = `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${(angleDeg + layerRot).toFixed(1)})`;
            if (viewBox) {
              const parts = viewBox.split(/[\s,]+/).map(Number);
              if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                const maxDim = Math.max(parts[2], parts[3]);
                const scaleFactorX = w / maxDim;
                const scaleFactorY = h / maxDim;
                layerG.setAttribute(
                  'transform',
                  `${baseTransform} scale(${scaleFactorX.toFixed(4)}, ${scaleFactorY.toFixed(4)}) translate(${(-parts[0] - parts[2] / 2).toFixed(2)}, ${(-parts[1] - parts[3] / 2).toFixed(2)})`
                );
              } else {
                layerG.setAttribute('transform', `${baseTransform} scale(${(w / 100).toFixed(4)}, ${(h / 100).toFixed(4)}) translate(-50, -50)`);
              }
            } else {
              layerG.setAttribute('transform', `${baseTransform} scale(${(w / 100).toFixed(4)}, ${(h / 100).toFixed(4)}) translate(-50, -50)`);
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
    } else {
      const ellipse = svgDoc.createElementNS(SVG_NS, 'ellipse');
      ellipse.setAttribute('cx', '0');
      ellipse.setAttribute('cy', '0');
      ellipse.setAttribute('rx', (w / 2).toFixed(2));
      ellipse.setAttribute('ry', (h / 2).toFixed(2));
      ellipse.setAttribute('fill', fillColor);
      ellipse.setAttribute('opacity', opacity.toFixed(2));
      ellipse.setAttribute('transform', `translate(${x.toFixed(2)}, ${y.toFixed(2)}) rotate(${angleDeg.toFixed(1)})`);
      svgGroup.appendChild(ellipse);
    }
  } else if (shape === 'typography_box') {
    // News — Typography Box Material: rect + text wrapped in one <g opacity> so fill/stroke/text all
    // fade together in exports too, matching the Canvas branch.
    const w = particle.width ?? radius * 3;
    const h = particle.height ?? radius * 2;
    const cr = Math.min(particle.cornerRadius ?? 50, Math.min(w, h) / 2);

    const g = svgDoc.createElementNS(SVG_NS, 'g');
    g.setAttribute('opacity', opacity.toFixed(3));
    g.setAttribute('transform', `translate(${x.toFixed(2)}, ${y.toFixed(2)})`);

    const rect = svgDoc.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', (-w / 2).toFixed(2));
    rect.setAttribute('y', (-h / 2).toFixed(2));
    rect.setAttribute('width', w.toFixed(2));
    rect.setAttribute('height', h.toFixed(2));
    rect.setAttribute('rx', cr.toFixed(2));
    rect.setAttribute('fill', particle.isFilled ? fillColor : 'none');
    rect.setAttribute('stroke', particle.strokeColor || '#000000');
    rect.setAttribute('stroke-width', (particle.strokeWidth ?? 3).toFixed(2));
    g.appendChild(rect);

    if (particle.char) {
      const textEl = svgDoc.createElementNS(SVG_NS, 'text');
      textEl.setAttribute('x', '0');
      textEl.setAttribute('y', '0');
      textEl.setAttribute('font-family', `${particle.fontFamily || 'Arial'}, sans-serif`);
      textEl.setAttribute('font-size', (particle.fontSize || 52).toFixed(1));
      textEl.setAttribute('font-weight', 'bold');
      textEl.setAttribute('fill', particle.glyphColor || '#000000');
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'central');
      textEl.textContent = particle.char.toUpperCase();
      g.appendChild(textEl);
    }

    svgGroup.appendChild(g);
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
  } else if (shape === 'typo_block') {
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

    if (particle.char) {
      const fSize = particle.fontSize || Math.max(8, h * 0.75);
      const textEl = svgDoc.createElementNS(SVG_NS, 'text');
      textEl.setAttribute('x', x.toFixed(2));
      textEl.setAttribute('y', (y - h * 0.03).toFixed(2));
      textEl.setAttribute('font-family', `${particle.fontFamily || 'Times New Roman'}, serif`);
      textEl.setAttribute('font-size', fSize.toFixed(1));
      textEl.setAttribute('fill', particle.glyphColor || '#FFFFFF');
      textEl.setAttribute('opacity', opacity.toFixed(2));
      textEl.setAttribute('text-anchor', 'middle');
      textEl.setAttribute('dominant-baseline', 'central');
      textEl.textContent = particle.char;
      svgGroup.appendChild(textEl);
    }
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

function rgbToHex(r: number, g: number, b: number): string {
  const rr = Math.max(0, Math.min(255, Math.round(r)));
  const gg = Math.max(0, Math.min(255, Math.round(g)));
  const bb = Math.max(0, Math.min(255, Math.round(b)));
  return `#${((1 << 24) + (rr << 16) + (gg << 8) + bb).toString(16).slice(1)}`;
}

/** Minimal HSL→hex conversion for the audio spectrum color-shift mode. */
function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  if (s === 0) {
    const v = l * 255;
    return rgbToHex(v, v, v);
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hue2rgb(p, q, h + 1 / 3);
  const g = hue2rgb(p, q, h);
  const b = hue2rgb(p, q, h - 1 / 3);
  return rgbToHex(r * 255, g * 255, b * 255);
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


