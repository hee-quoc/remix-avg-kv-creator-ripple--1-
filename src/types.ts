export type GridType = 'square' | 'hexagonal' | 'radial';
export type DotShape = 
  | 'circle' 
  | 'ring' 
  | 'soft_circle' 
  | 'square' 
  | 'concentric_arc' 
  | 'tangent_line' 
  | 'wave_ripple' 
  | 'custom_svg'
  | 'ascii'
  | 'extruded_block'
  | 'tile'
  | 'stitch'
  | 'woven'
  | 'magnetic_needle'
  | 'modular_strip';

export type WaveMode = 'stable' | 'flow';
export type WavePattern = 'circular' | 'linear' | 'spiral' | 'interference' | 'market_chart' | 'radial_3d';
export type WaveType = 'sine' | 'pulse' | 'square' | 'gaussian' | 'burst';

// Advanced Frequency Control — independent frequency mappings (generic, applies to all wave patterns)
export type FrequencyMappingMode = 'spatial_only' | 'thickness_only' | 'motion_only' | 'combined';

// Dynamic Visual Thickness (2D) — ported from the 3D Radial Wave's per-ring thickness modulation
// (see Radial3DConfig.thicknessAnimEnabled/minThickness/.../thicknessRandomness below) and adapted to
// the existing 2D concentric wavefront system so each ring/wave can carry its own independently
// animated stroke width, instead of a single global amplitude. Additive-only: `enabled` defaults to
// false for every existing preset, so this has zero effect until a user explicitly turns it on.
export type ThicknessBehaviorMode = 'uniform' | 'radial_gradient' | 'random' | 'animated';

export interface DynamicThicknessConfig {
  enabled: boolean; // default false — off reproduces today's exact wave thickness behavior
  mode: ThicknessBehaviorMode; // default 'animated'
  baseThickness: number; // multiplier used directly by 'uniform' mode, default 1.0
  minThickness: number; // multiplier, default 0.4
  maxThickness: number; // multiplier, default 1.8
  thicknessFrequency: number; // how quickly thickness varies ring-to-ring, default 1.0 (independent of Spatial Frequency)
  animSpeed: number; // time multiplier for 'animated' mode, default 1.0
  phaseOffset: number; // radians, per-ring phase spread, default 0.6
  randomness: number; // 0..1, per-ring jitter; combinable with 'animated' or standalone with 'random'
  audioThicknessInfluence: number; // 0..1, smooth bass-driven thickness boost on existing rings, default 0
}

// 3D Radial Wave — material system (reuses the existing particle/SVG shape renderers)
export type RadialWaveMaterial = 'line' | 'dot_matrix' | 'ascii' | 'diamond' | 'custom_svg' | 'stitch';

export interface Radial3DConfig {
  // Geometry
  ringCount: number; // default 20
  baseRadius: number; // px, starting radius of innermost ring
  ringSpacing: number; // px, radial step between rings, default 17
  angularResolutionDeg: number; // sample step around each ring, default 10
  depthDisplacement: number; // Z amplitude in px, default 50
  // Thickness animation
  thicknessAnimEnabled: boolean; // default true; when false, uses fixed thickness
  minThickness: number; // default 0.5
  maxThickness: number; // default 5
  thicknessFrequency: number; // per-ring phase multiplier, default 1.0
  thicknessPhaseOffset: number; // radians, default 0
  thicknessSpeed: number; // time multiplier, default 1.0
  thicknessRandomness: number; // 0..1, default 0
  // Z-axis motion
  zMotionFrequency: number; // per-ring phase multiplier, default 1.0
  zMotionSpeed: number; // time multiplier, default 1.0
  zPhaseDifference: number; // extra per-ring phase spread, default 0
  zMotionDirection: 1 | -1; // default 1
  // Interactive 3D rotation (degrees)
  rotationX: number; // default 66
  rotationY: number; // default 0
  rotationZ: number; // default 0
  perspective: number; // projection strength, default 900
  // Material
  material: RadialWaveMaterial; // default 'line'
  lineThickness: number; // default 2
  dotSize: number; // default 3
  asciiCharset: string;
  asciiSizeVariation: number; // 0..1
  stitchLength: number;
  stitchAngleFollowsRing: boolean;
  customSvgLayers?: CustomSvgLayer[]; // reused for 'diamond' (preloaded) & 'custom_svg' (user upload)
}
export type ThemeId = 
  | 'dark_radar' 
  | 'swiss_editorial' 
  | 'neon_scientific' 
  | 'blueprint_cyan' 
  | 'cyber_freq' 
  | 'solarized' 
  | 'thermal' 
  | 'minimal_noir';

export type MaskMode = 'text' | 'shape' | 'svg_mask';
export type ObjectShapeType = 'circle' | 'square' | 'ring' | 'star' | 'heart' | 'hexagon' | 'diamond' | 'shield';

export type CompositionMode = 'full_molecule' | 'molecule_wave_only' | 'editorial_collage' | 'modular_signal_field' | 'typography_ripple';
export type PresetCategory = 'News' | 'Technology' | 'Finance' | 'Automotive' | 'Entertainment' | 'Sports' | 'Culture' | 'Children';

export type VisualStyleId =
  | 'modular_pixel'
  | 'ascii_flow'
  | 'editorial_collage'
  | 'dot_matrix'
  | 'data_constellation'
  | 'binary_typography'
  | 'extruded_particles'
  | 'halftone_collage'
  | 'kinetic_vortex'
  | 'pixel_art'
  | 'stitch_craft';

export interface FontConfig {
  text: string;
  fontFamily: string;
  fontSize: number; // in px or scale
  fontWeight: number; // 300..900
  letterSpacing: number; // in px
  lineHeight: number; // multiplier e.g. 1.2
  textAlign: 'center' | 'left' | 'right';
  invertText: boolean; // True: dots inside text, False: dots outside/everywhere
  customFontName?: string;
  customFontUrl?: string;
  maskMode?: MaskMode;
  shapeType?: ObjectShapeType;
  maskSvgDataUrl?: string;
  maskSvgXml?: string;
  maskSvgName?: string;
  maskScale?: number;
  maskScaleX?: number;
  maskScaleY?: number;
}

export interface CustomSvgLayer {
  id: string;
  name: string;
  svgXml: string;
  dataUrl?: string;
  recolorMode: 'original' | 'theme' | 'custom';
  customColor?: string;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotationOffset?: number;
  opacity?: number;
  enabled?: boolean;
}

export type CustomSvgDistribution = 'cycle' | 'random' | 'size_tier' | 'stacked';

export interface GridConfig {
  gridType: GridType;
  density: number; // Step size between dots in px (e.g., 6 to 30)
  minRadius: number; // Minimum dot radius in px
  maxRadius: number; // Maximum dot radius in px
  dotShape: DotShape;
  sdfThreshold: number; // Cutoff for text boundary (0.0 to 1.0)
  sdfSoftness: number; // Transition width for distance falloff
  hideBackgroundDots?: boolean; // Hide all dots outside the text boundary
  customSvgDataUrl?: string; // Data URL or Image src for custom SVG dot shape
  customSvgXml?: string; // Raw SVG string for vector exports
  customSvgName?: string; // Name of uploaded SVG file
  customSvgLayers?: CustomSvgLayer[]; // Multiple custom SVG layers
  customSvgDistribution?: CustomSvgDistribution; // Distribution mode across particles
  // Feature C: ASCII Molecule parameters
  asciiCharset?: string; // e.g. '0 1 + - * / . :' or '01'
  asciiFontSize?: number;
  asciiVariableSize?: boolean;
  asciiDistribution?: 'grid' | 'radial' | 'flow' | 'random';
  // Breaking Signal line controls
  lineThickness?: number; // 0.8 to 12 px
  lineLength?: number; // 1.5 to 12 multiplier
  lineDirection?: 'tangent' | 'radial' | 'linear';
  lineAngle?: number; // 0 to 360 deg
  // Culture & Stitch materiality parameters
  culturalMaterial?: 'stitch' | 'woven' | 'textile_loom' | 'sashiko';
  stitchLength?: number; // 3 to 35 px
  stitchThickness?: number; // 1 to 8 px
  stitchAngleMode?: StitchAngleMode;
  stitchAngle?: number; // -90 to +90 deg
  stitchSoftness?: number; // 0.0 to 1.0 (thread fiber feel)
  stitchTensionAnim?: boolean; // dynamic thread tension animation
  // Automotive Magnetic Needle Field parameters
  magneticScale?: number; // 1 to 4
  magneticGridN?: number; // default 60
  magneticLineLength?: number; // default 20
  magneticWeight?: number; // default 4
  // Modular Signal Field (Breaking Signal redesign) parameters — used when dotShape === 'modular_strip'
  modularStrip?: ModularStripConfig;
  // Typography Radial Ripple (Breaking Signal redesign #2) — used when compositionMode === 'typography_ripple'
  typographyRipple?: TypographyRippleConfig;
}

/**
 * Modular strip / vertical block system for the "Modular Signal Field" composition
 * (Breaking Signal redesign): a field of staggered vertical color bars layered over crisp
 * typography — fragmented transmission / scanning motion rather than a particle burst.
 */
export interface ModularStripConfig {
  // Block / Strip form
  barWidth: number; // px, default ~26
  heightMin: number; // px, default ~40
  heightMax: number; // px, default ~220
  density: number; // stacked segments per column, default ~10
  spacing: number; // gap between columns in px, default ~6
  columnCount: number; // number of vertical columns across the canvas, default ~26
  verticalOffsetAmount: number; // px, base vertical offset range applied per segment
  staggerAmount: number; // 0..1, how much each column/cluster's phase differs from neighbors
  clusterSize: number; // number of adjacent columns grouped to move together, default ~3
  overlapIntensity: number; // 0..1, strip opacity / how strongly strips cover the text beneath
  // Motion
  animSpeed: number; // multiplier, default 1.0
  offsetTiming: number; // extra per-cluster time offset, default 0.6
  movementAmplitude: number; // px, vertical bounce amplitude, default ~60
  verticalMotionAmount: number; // 0..1 scales movementAmplitude actually applied, default 1.0
  horizontalDriftAmount: number; // px, subtle horizontal sway, default ~4
  loopSpeed: number; // multiplier controlling loop period, default 1.0
  randomnessAmount: number; // 0..1 per-strip jitter, default 0.3
  syncVsStagger: number; // 0 = fully synchronized, 1 = fully staggered, default 0.85
}

export type StitchAngleMode = 'diagonal_sashiko' | 'cross_stitch' | 'contour_flow' | 'alternating_weave';

/**
 * Typography Radial Ripple (Breaking Signal redesign #2): paragraph text laid out as individual
 * character blocks (colored cell + glyph on top), displaced by the SAME existing wave/ripple engine
 * (wave.ts calculateWave — circular/pulse/flow) rather than a bespoke motion system. Text content and
 * character colors (via style.multiColorPalette below) are both user-editable.
 */
export interface TypographyRippleConfig {
  text: string; // paragraph(s), blank line ("\n\n") = paragraph break
  fontFamily: string;
  fontSize: number; // glyph size in px
  textColor: string; // glyph color drawn on top of each colored block
  blockWidth: number; // px, fixed per-character cell width (monospace-style layout, like the reference)
  blockHeight: number; // px, colored block height
  lineHeight: number; // px, vertical spacing between wrapped lines
  marginX: number; // px, left/right margin used for word-wrap width
  paragraphGap: number; // px, extra vertical gap between paragraphs
  verticalPulseStrength: number; // px, extra vertical bounce riding the ripple envelope
  blockScaleAmount: number; // 0..1, how much each block scales up as the ripple passes through it
}

export interface WaveConfig {
  mode: WaveMode; // 'stable' or 'flow'
  pattern: WavePattern; // 'circular', 'linear', 'spiral', 'interference', 'market_chart'
  waveType: WaveType; // 'sine', 'pulse', 'square', 'gaussian', 'burst'
  waveSpeed: number; // Speed multiplier (e.g., 0.1 to 3.0)
  waveFrequency: number; // Frequency / wavelength multiplier
  waveAmplitude: number; // Impact on dot size / displacement
  waveSoftness: number; // Softness of wave peaks
  frequencyThickness?: number; // Base wave frequency thickness factor (0.2 to 3.0)
  radialThickness?: number; // Center vs Edge thickness bias (-1.0 = center thin, +1.0 = center thick)
  emphasizeWavefront?: boolean; // Emphasize concentric ripple curve wavefronts
  wavefrontEmphasis?: number; // Strength of ripple curve emphasis (0.0 to 1.0)
  wavefrontArcLength?: number; // Arc dash length for tangent/ripple shapes (0.2 to 2.0)
  wavefrontCurveWidth?: number; // Stroke weight / arc thickness factor (0.2 to 3.0)
  wavefrontStyle?: 'concentric_arcs' | 'tangent_strokes' | 'ripple_rings' | 'wave_dashes';
  wavefrontMatchDotStyle?: boolean; // Inherit color, gradient & opacity from text dots
  wavefrontMaxTextDist?: number; // Distance in px from text contour (0 = unlimited / everywhere)
  originX: number; // Normalized 0..1 (0.5 center)
  originY: number; // Normalized 0..1 (0.5 center)
  secondaryOriginX: number; // For interference mode
  secondaryOriginY: number;
  followMouse: boolean;
  linearAngle: number; // Angle in degrees for linear wave
  vectorDistortion: number; // Strength of dot displacement in Flow mode
  blendBack: number; // How strongly dots pull back to original letterform (0..1)
  // Feature B: Dynamic Wave Variation parameters (per-wavefront, deterministic via randomSeed)
  frequencyVariation?: number; // 0.0 to 1.0 (per-wave frequency deviation)
  amplitudeVariation?: number; // 0.0 to 1.0 (per-wave crest intensity deviation)
  sizeRandomness?: number; // 0.0 to 1.0 (per-wave thickness / radius size deviation)
  intervalVariation?: number; // 0.0 to 1.0 (irregular timing/spacing offset between consecutive wavefronts)
  randomSeed?: number; // Reproducible seed integer (1..99999)
  soundReactivity?: number; // 0.0 to 1.0 (audio reactivity influence)
  soundSensitivity?: number; // 0.5 to 3.0 (audio gain multiplier)
  soundReactionBand?: 'all' | 'bass' | 'mid' | 'treble';

  // Advanced Frequency Control (generic — applies across all wave patterns, additive-only).
  // Defaults reproduce today's behavior exactly ('spatial_only', all influences 0): Frequency
  // continues to only drive spatial distribution unless a user explicitly opts into Thickness/
  // Motion/Combined mapping or raises the new Thickness/Motion systems below.
  frequencyMapping?: FrequencyMappingMode; // default 'spatial_only'
  // freqThicknessInfluence now drives the ring-based Dynamic Visual Thickness system's frequency
  // (WaveConfig.dynamicThickness — see DynamicThicknessControls.tsx) instead of a separate per-point
  // thickness system. The two were consolidated: they controlled visually near-identical behavior
  // (a min/max/frequency/speed/randomness thickness oscillation) from two different panels in the
  // same WAVE tab, which read as a confusing duplicate rather than two distinct features.
  freqThicknessInfluence?: number; // 0..1, how much the master Frequency also drives Dynamic Thickness's frequency
  freqMotionInfluence?: number; // 0..1, how much the master Frequency also drives Motion Frequency
  // Motion Frequency system (independent per-wave organic phase motion)
  waveMotionFrequency?: number; // default 1.0
  waveMotionSpeed?: number; // default 1.0
  waveMotionAmplitude?: number; // 0..1, default 0 (0 = no extra motion, preserves current behavior)
  waveMotionPhaseOffset?: number; // radians, default 0
  waveMotionVariation?: number; // 0..1, per-point phase jitter, default 0

  // 3D Radial Wave mode configuration (only used when pattern === 'radial_3d')
  radial3D?: Radial3DConfig;

  // Dynamic Visual Thickness (2D) — applies to circular/linear/spiral/interference/market_chart
  // patterns only; radial_3d keeps using its own dedicated Radial3DConfig thickness system.
  dynamicThickness?: DynamicThicknessConfig;
}

export interface StyleConfig {
  theme: ThemeId;
  dotColor: string; // Hex color
  bgColor: string; // Hex color
  accentColor: string; // Hex color for active wave / radar indicators
  enableColorGradient: boolean;
  gradientColor: string; // Secondary dot color
  vignette: boolean;
  uniformColorBrightness?: boolean; // When true, all dots share identical color and opacity (no wave vibrancy difference)
  showRadarGrid: boolean;
  radarGridOpacity: number;
  showEmitterHandle: boolean;
  // Visual Style specific parameters
  visualStyle?: VisualStyleId;
  extrusionDepth?: number; // 0 to 40 (Simulated 2.5D depth)
  extrusionAngle?: number; // 0 to 360 deg
  extrusionLightIntensity?: number; // 0 to 1
  constellationMaxDistance?: number; // 10 to 180 (connecting line distance)
  constellationLineColor?: string;
  constellationShowLabels?: boolean;
  constellationClusterStrength?: number;
  vortexTwist?: number; // 0 to 3.0 (swirl strength)
  pixelArtScale?: number; // 4 to 32 px
  // Feature A & Style 03: Separate Headline / Molecule Wave Only parameters
  editorialHeadlineOffsetX?: number; // -500 to +500 px
  editorialHeadlineOffsetY?: number; // -500 to +500 px
  editorialHeadlineScale?: number; // 0.5 to 2.5
  editorialHeadlineColor?: string;
  editorialHeadlineOpacity?: number;
  editorialLayerOrder?: 'behind_wave' | 'in_front_wave';
  editorialOverlayImageUrl?: string;
  // Multi-Color Dot System (Finance & Market Data)
  enableMultiColor?: boolean;
  multiColorPalette?: string[];
  multiColorDistribution?: 'palette_list' | 'random' | 'grouped' | 'gradient_based';
}

export type MultiColorDistribution = 'palette_list' | 'random' | 'grouped' | 'gradient_based';

export type PreviewQuality = 'auto' | 'high' | 'performance';

export type KVLayoutMode = 'with_ui' | 'without_ui';

export type KVTemplateId =
  | 'question_bar'
  | 'brand_spread'
  | 'poster_pair'
  | 'promo_card'
  | 'report_cover'
  | 'cut_poster'
  | 'hero_layout'
  | 'article_strip'
  | 'clean_focus';

export interface KVTextBlock {
  id: string;
  name?: string; // label e.g. "Main Headline", "Question Bar Text", "Author"
  text: string;
  x: number; // 0..1920 (in design coordinate space)
  y: number; // 0..1080
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  letterSpacing: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  opacity: number;
  rotation?: number; // degrees
  scale?: number;
  uppercase?: boolean;
  maxWidth?: number;
}

export interface KVGraphicElement {
  id: string;
  name?: string;
  type: 'box' | 'badge' | 'bar' | 'frame' | 'line' | 'pill_button' | 'cut_frame';
  x: number; // 0..1920
  y: number; // 0..1080
  width: number;
  height: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  textLabel?: string; // optional label inside badge or CTA button
  textColor?: string;
  textFontSize?: number;
}

export interface UploadedFont {
  name: string;
  family: string;
  format?: 'ttf' | 'otf' | 'woff' | 'woff2';
  url?: string;
}

export interface KVLayoutConfig {
  enabled: boolean;
  mode: KVLayoutMode; // 'with_ui' | 'without_ui'
  templateId: KVTemplateId;
  textBlocks: KVTextBlock[];
  graphicElements: KVGraphicElement[];
  uploadedFonts?: UploadedFont[];
  selectedElementId?: string | null;
  // Frame or visual bounding box if user restricts generative visual
  effectContainer?: {
    x: number;
    y: number;
    width: number;
    height: number;
    useContainerBounds?: boolean;
  };
}

// ============================================================================
// AUDIO REACTIVITY — ported from AVG SoundText Ripple's audio engine and adapted
// to the existing Canvas2D wave/particle architecture (see utils/audioAnalyzer.ts,
// utils/wave.ts, components/AudioReactivityControls.tsx).
// ============================================================================

export interface AudioMappingConfig {
  source: 'bass' | 'mid' | 'high' | 'overallEnergy' | 'beatPulse';
  target:
    | 'waveAmplitude'
    | 'waveSpeed'
    | 'waveFrequency'
    | 'waveThickness'
    | 'radialDisplacement'
    | 'particleSize'
    | 'particleOpacity'
    | 'wavefrontScale'
    | 'wavefrontThreshold';
  amount: number; // 0..1 influence multiplier
}

export interface BeatRippleWave {
  id: number;
  radius: number;
  strength: number;
  speed: number;
  width: number;
  baseWidth?: number;
  decay: number;
  age: number;
  originX?: number;
  originY?: number;
}

export type RippleSequenceMode = 'single' | 'cascade' | 'alternate' | 'freq_bands' | 'second_wave';
export type AudioColorShiftMode = 'p5_inverted' | 'accent_glow' | 'spectrum_shift';
export type AudioSourceType = 'none' | 'mic' | 'synth' | 'file';
export type SynthStyle = 'electro' | 'lofi' | 'techno';
export type AudioRippleBand = 'overall' | 'bass' | 'mid' | 'beatPulse';

export interface AudioConfig {
  enabled: boolean; // Master Audio Reactivity toggle — OFF by default for every existing preset.
  sensitivity: number;
  smoothing: number;

  // Beat Detection
  beatDetectionEnabled: boolean;
  beatSensitivity: number;
  beatThreshold: number;
  minBeatInterval: number; // ms
  beatBoost: number;
  beatDecay: number;

  // Frequency Band Sensitivity
  bassSensitivity: number;
  midSensitivity: number;
  highSensitivity: number;

  // Beat Ripple / Sequence Engine
  beatRippleEnabled: boolean;
  beatRippleStrength: number;
  beatRippleSpeed: number;
  beatRippleWidth: number;
  beatRippleDecay: number;
  beatRippleSize: number;
  beatRippleSequenceMode: RippleSequenceMode;
  cascadeCount: number;
  cascadeDelayMs: number;

  // Continuous Music Ripple (volume-history travelling wavefront)
  audioMusicRippleEnabled: boolean;
  audioRippleSpeed: number;
  audioRippleStrength: number;
  audioRippleWavelength: number;
  audioRippleHarmonics: number; // 1..3
  audioRippleBand: AudioRippleBand;

  // Second Wave — modulates the EXISTING rings (thickness + radial movement), never spawns new ones
  secondWaveSpeed: number;
  secondWaveFrequency: number;
  secondWaveBaseThickness: number;
  secondWaveThicknessInfluence: number; // 0..1
  secondWaveMovementStrength: number; // 0..1
  secondWaveBeatSensitivity: number;

  // Audio-reactive color
  audioColorShift: boolean;
  audioColorShiftMode: AudioColorShiftMode;
  audioBeatGlow: boolean;

  // Playback
  loopAudio: boolean;
  synthStyle: SynthStyle;
  synthBpm: number;

  // Parameter mapping matrix
  mappings: AudioMappingConfig[];
}

export interface AudioAnalysisData {
  isPlaying: boolean;
  isLooping: boolean;
  currentTime: number;
  duration: number;
  fileName: string | null;
  sourceType: AudioSourceType;
  overallEnergy: number;
  bass: number;
  mid: number;
  high: number;
  beatDetected: boolean;
  beatStrength: number;
  beatPulse: number;
  smoothedBeatIntensity: number;
  secondWavePhase: number;
  spectrum: Uint8Array;
  waveform: Uint8Array;
  activeRipples: BeatRippleWave[];
  volumeHistory: Float32Array;
}

export interface RenderState {
  activePresetId?: string;
  previewQuality?: PreviewQuality;
  font: FontConfig;
  grid: GridConfig;
  wave: WaveConfig;
  style: StyleConfig;
  kvLayout?: KVLayoutConfig; // Independent KV Layout / "Original Text" Layer (Text Layer B)
  showEffectText?: boolean; // Text Layer A (generative/molecule effect text) visibility. Default true.
  compositionMode?: CompositionMode; // 'full_molecule' | 'molecule_wave_only' | 'editorial_collage'
  activeVisualStyle?: VisualStyleId;
  isPlaying: boolean;
  time: number;
  transparentBg?: boolean;
  audio: AudioConfig; // Comprehensive audio reactivity config — disabled by default for every preset.
  /** @deprecated superseded by `audio.enabled` — kept only for the legacy "LIVE AUDIO" header badge */
  audioActive?: boolean;
}

export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  formulaDescription?: string;
  compositionMode?: CompositionMode;
  defaultVisualStyle?: VisualStyleId;
  tags?: string[];
  config: {
    font?: Partial<FontConfig>;
    grid?: Partial<GridConfig>;
    wave?: Partial<WaveConfig>;
    style?: Partial<StyleConfig>;
    kvLayout?: Partial<KVLayoutConfig>;
    compositionMode?: CompositionMode;
    activeVisualStyle?: VisualStyleId;
    showEffectText?: boolean;
    audio?: Partial<AudioConfig>;
  };
}
