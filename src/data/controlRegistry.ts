/**
 * Control Registry — redesign V1-B, Phase P1 (see docs/redesign spec, section 9).
 *
 * A single source of truth describing every control the new 4-group inspector (Text / Composition /
 * Appearance / Effect) will render, across all three engines (Kinetic, Flip Disc, Tile Break). This
 * phase is DATA ONLY: nothing in the app reads this registry yet, no UI changed, no preset renders
 * any differently. It exists so later phases (tokens/components, layout, inspector content, quick-
 * tune tab, import/export validation) can all drive off ONE shared definition instead of re-deriving
 * labels/ranges/grouping ad hoc in each component.
 *
 * Scope note: this registers the controls that have a home in the new 4-group mapping (see the spec's
 * "Tab cũ → nhóm mới" table) — i.e. the controls that are either genuinely shared across most presets
 * of an engine, or are the primary dial for a whole material family. It deliberately does NOT attempt
 * to enumerate every nested, material-specific sub-config field (e.g. every ModularStripConfig /
 * MeshNetConfig / SpeedStripeConfig / AudioConfig.mappings[] knob) — those remain the job of each
 * material's own existing control component (TypographyBoxControls.tsx etc.), same as today; trying
 * to flatten all ~250 possible fields into one registry in a single pass would be far more likely to
 * introduce a labeling mistake than to help. Extend this file incrementally as later phases need more
 * entries, rather than front-loading every edge-case field now.
 *
 * `id` is a dotted path into the relevant engine's config object (e.g. 'font.text' -> RenderState.font.text,
 * 'flipDisc.discRadius' -> FlipDiscConfig.discRadius, 'tile.rippleSpeed' -> TypographyTilesConfig.rippleSpeed).
 * Ids are globally unique across all three engines (prefixed per-engine), so a single flat list/map works.
 */

export type ControlEngine = 'kinetic' | 'flip_disc' | 'tile_break';
export type ControlGroup = 'text' | 'composition' | 'appearance' | 'effect';
export type ControlSubgroup = 'shape' | 'wave' | 'audio' | 'motion';
export type ControlTier = 'basic' | 'advanced';
export type ControlType = 'text' | 'textarea' | 'slider' | 'range' | 'toggle' | 'select' | 'color' | 'palette' | 'number';

export interface ControlOption {
  value: string;
  label: { vi: string; en: string };
}

export interface ControlDef {
  id: string;
  engine: ControlEngine;
  label: { vi: string; en: string };
  group: ControlGroup;
  subgroup?: ControlSubgroup;
  tier: ControlTier;
  type: ControlType;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: unknown;
  options?: ControlOption[];
}

const GRID_TYPE_OPTIONS: ControlOption[] = [
  { value: 'square', label: { vi: 'Vuông', en: 'Square' } },
  { value: 'hexagonal', label: { vi: 'Lục giác', en: 'Hexagonal' } },
  { value: 'radial', label: { vi: 'Toả tròn', en: 'Radial' } }
];

const WAVE_MODE_OPTIONS: ControlOption[] = [
  { value: 'stable', label: { vi: 'Ổn định', en: 'Stable' } },
  { value: 'flow', label: { vi: 'Chuyển động', en: 'Flow' } }
];

const WAVE_PATTERN_OPTIONS: ControlOption[] = [
  { value: 'circular', label: { vi: 'Toả tròn', en: 'Circular' } },
  { value: 'linear', label: { vi: 'Thẳng hàng', en: 'Linear' } },
  { value: 'spiral', label: { vi: 'Xoáy ốc', en: 'Spiral' } },
  { value: 'interference', label: { vi: 'Giao thoa', en: 'Interference' } },
  { value: 'market_chart', label: { vi: 'Biểu đồ', en: 'Market chart' } },
  { value: 'radial_3d', label: { vi: 'Radial 3D', en: 'Radial 3D' } }
];

const WAVE_TYPE_OPTIONS: ControlOption[] = [
  { value: 'sine', label: { vi: 'Sine', en: 'Sine' } },
  { value: 'pulse', label: { vi: 'Xung', en: 'Pulse' } },
  { value: 'square', label: { vi: 'Vuông', en: 'Square' } },
  { value: 'gaussian', label: { vi: 'Gaussian', en: 'Gaussian' } },
  { value: 'burst', label: { vi: 'Bùng nổ', en: 'Burst' } }
];

const MASK_MODE_OPTIONS: ControlOption[] = [
  { value: 'text', label: { vi: 'Chữ', en: 'Text' } },
  { value: 'shape', label: { vi: 'Hình học', en: 'Geometric' } },
  { value: 'svg_mask', label: { vi: 'Logo SVG', en: 'SVG logo' } }
];

const COMPOSITION_MODE_OPTIONS: ControlOption[] = [
  { value: 'full_molecule', label: { vi: 'Full molecule', en: 'Full molecule' } },
  { value: 'molecule_wave_only', label: { vi: 'Chỉ sóng', en: 'Wave only' } },
  { value: 'editorial_collage', label: { vi: 'Editorial collage', en: 'Editorial collage' } },
  { value: 'modular_signal_field', label: { vi: 'Modular signal field', en: 'Modular signal field' } },
  { value: 'typography_ripple', label: { vi: 'Typography ripple', en: 'Typography ripple' } }
];

const THEME_OPTIONS: ControlOption[] = [
  { value: 'dark_radar', label: { vi: 'Dark Radar', en: 'Dark Radar' } },
  { value: 'swiss_editorial', label: { vi: 'Swiss Editorial', en: 'Swiss Editorial' } },
  { value: 'neon_scientific', label: { vi: 'Neon Scientific', en: 'Neon Scientific' } },
  { value: 'blueprint_cyan', label: { vi: 'Blueprint Cyan', en: 'Blueprint Cyan' } },
  { value: 'cyber_freq', label: { vi: 'Cyber Freq', en: 'Cyber Freq' } },
  { value: 'solarized', label: { vi: 'Solarized Gold', en: 'Solarized Gold' } },
  { value: 'thermal', label: { vi: 'Thermal Scan', en: 'Thermal Scan' } },
  { value: 'minimal_noir', label: { vi: 'Minimal Noir', en: 'Minimal Noir' } }
];

const FLIP_DISC_MATERIAL_OPTIONS: ControlOption[] = [
  { value: 'matte', label: { vi: 'Nhám', en: 'Matte' } },
  { value: 'glossy', label: { vi: 'Bóng', en: 'Glossy' } },
  { value: 'metallic', label: { vi: 'Kim loại', en: 'Metallic' } },
  { value: 'iridescent', label: { vi: 'Ánh cầu vồng', en: 'Iridescent' } }
];

const FLIP_DISC_MASK_MODE_OPTIONS: ControlOption[] = [
  { value: 'none', label: { vi: 'Không', en: 'None' } },
  { value: 'shape', label: { vi: 'Hình học', en: 'Shape' } },
  { value: 'svg', label: { vi: 'Logo SVG', en: 'SVG logo' } }
];

export const CONTROL_REGISTRY: ControlDef[] = [
  // ============================================================================
  // KINETIC — TEXT
  // ============================================================================
  { id: 'font.text', engine: 'kinetic', label: { vi: 'Nội dung', en: 'Content' }, group: 'text', tier: 'basic', type: 'textarea', default: '' },
  { id: 'font.maskMode', engine: 'kinetic', label: { vi: 'Loại mask', en: 'Mask type' }, group: 'text', tier: 'basic', type: 'select', options: MASK_MODE_OPTIONS, default: 'text' },
  { id: 'font.fontFamily', engine: 'kinetic', label: { vi: 'Font', en: 'Font family' }, group: 'text', tier: 'basic', type: 'select', default: 'Space Grotesk' },
  { id: 'font.fontSize', engine: 'kinetic', label: { vi: 'Cỡ chữ', en: 'Size' }, group: 'text', tier: 'basic', type: 'slider', min: 20, max: 420, step: 1, default: 140 },
  { id: 'font.fontWeight', engine: 'kinetic', label: { vi: 'Độ đậm', en: 'Weight' }, group: 'text', tier: 'basic', type: 'slider', min: 300, max: 900, step: 100, default: 700 },
  { id: 'font.letterSpacing', engine: 'kinetic', label: { vi: 'Giãn chữ', en: 'Letter spacing' }, group: 'text', tier: 'basic', type: 'slider', min: -10, max: 30, step: 1, default: 4 },
  { id: 'font.lineHeight', engine: 'kinetic', label: { vi: 'Giãn dòng', en: 'Line height' }, group: 'text', tier: 'basic', type: 'slider', min: 0.7, max: 2, step: 0.05, default: 0.95 },
  { id: 'font.textAlign', engine: 'kinetic', label: { vi: 'Căn chữ', en: 'Align' }, group: 'text', tier: 'basic', type: 'select', options: [
    { value: 'left', label: { vi: 'Trái', en: 'Left' } },
    { value: 'center', label: { vi: 'Giữa', en: 'Center' } },
    { value: 'right', label: { vi: 'Phải', en: 'Right' } }
  ], default: 'center' },
  { id: 'font.invertText', engine: 'kinetic', label: { vi: 'Đảo ngược mask halftone', en: 'Invert halftone mask' }, group: 'text', tier: 'advanced', type: 'toggle', default: false },
  { id: 'font.maskScale', engine: 'kinetic', label: { vi: 'Tỉ lệ mask (đồng bộ X/Y)', en: 'Mask scale (linked X/Y)' }, group: 'text', tier: 'advanced', type: 'slider', min: 0.3, max: 3, step: 0.05, default: 1 },
  { id: 'font.maskScaleX', engine: 'kinetic', label: { vi: 'Tỉ lệ mask X', en: 'Mask scale X' }, group: 'text', tier: 'advanced', type: 'slider', min: 0.3, max: 3, step: 0.05, default: 1 },
  { id: 'font.maskScaleY', engine: 'kinetic', label: { vi: 'Tỉ lệ mask Y', en: 'Mask scale Y' }, group: 'text', tier: 'advanced', type: 'slider', min: 0.3, max: 3, step: 0.05, default: 1 },

  // ============================================================================
  // KINETIC — COMPOSITION
  // ============================================================================
  { id: 'compositionMode', engine: 'kinetic', label: { vi: 'Bố cục', en: 'Composition' }, group: 'composition', tier: 'basic', type: 'select', options: COMPOSITION_MODE_OPTIONS, default: 'full_molecule' },
  { id: 'grid.gridType', engine: 'kinetic', label: { vi: 'Lưới', en: 'Grid' }, group: 'composition', tier: 'basic', type: 'select', options: GRID_TYPE_OPTIONS, default: 'square' },
  { id: 'grid.density', engine: 'kinetic', label: { vi: 'Mật độ chấm', en: 'Dot density' }, group: 'composition', tier: 'basic', type: 'slider', min: 4, max: 30, step: 1, default: 10 },
  { id: 'kvLayout.enabled', engine: 'kinetic', label: { vi: 'Lớp chữ gốc độc lập (KV layout)', en: 'Original text layer (KV layout)' }, group: 'composition', tier: 'advanced', type: 'toggle', default: false },
  { id: 'grid.hideBackgroundDots', engine: 'kinetic', label: { vi: 'Ẩn chấm nền ngoài chữ', en: 'Hide background dots' }, group: 'composition', tier: 'advanced', type: 'toggle', default: false },

  // ============================================================================
  // KINETIC — APPEARANCE
  // ============================================================================
  { id: 'style.theme', engine: 'kinetic', label: { vi: 'Bảng màu', en: 'Palette' }, group: 'appearance', tier: 'basic', type: 'select', options: THEME_OPTIONS, default: 'dark_radar' },
  { id: 'style.dotColor', engine: 'kinetic', label: { vi: 'Màu chấm', en: 'Dot color' }, group: 'appearance', tier: 'basic', type: 'color', default: '#00f0ff' },
  { id: 'style.bgColor', engine: 'kinetic', label: { vi: 'Màu nền', en: 'Background' }, group: 'appearance', tier: 'basic', type: 'color', default: '#0a0d14' },
  { id: 'style.visualStyle', engine: 'kinetic', label: { vi: 'Thư viện Visual Style', en: 'Visual style library' }, group: 'appearance', tier: 'basic', type: 'select', default: 'dot_matrix' },
  { id: 'style.uniformColorBrightness', engine: 'kinetic', label: { vi: 'Màu đồng nhất / Biến đổi theo sóng', en: 'Same color / Modulated' }, group: 'appearance', tier: 'advanced', type: 'toggle', default: false },
  { id: 'style.enableColorGradient', engine: 'kinetic', label: { vi: 'Gradient màu sóng', en: 'Wave intensity gradient' }, group: 'appearance', tier: 'advanced', type: 'toggle', default: true },
  { id: 'style.gradientColor', engine: 'kinetic', label: { vi: 'Màu gradient phụ', en: 'Secondary gradient color' }, group: 'appearance', tier: 'advanced', type: 'color', default: '#818cf8' },
  { id: 'style.showRadarGrid', engine: 'kinetic', label: { vi: 'Lớp phủ radar', en: 'Radar field overlay' }, group: 'appearance', tier: 'advanced', type: 'toggle', default: false },
  { id: 'style.radarGridOpacity', engine: 'kinetic', label: { vi: 'Độ mờ radar', en: 'Radar opacity' }, group: 'appearance', tier: 'advanced', type: 'slider', min: 0, max: 1, step: 0.02, default: 0.18 },
  { id: 'style.showEmitterHandle', engine: 'kinetic', label: { vi: 'Tay cầm tâm sóng', en: 'Viewport target handle' }, group: 'appearance', tier: 'advanced', type: 'toggle', default: false },

  // ============================================================================
  // KINETIC — EFFECT > SHAPE
  // ============================================================================
  { id: 'grid.dotShape', engine: 'kinetic', label: { vi: 'Hình hạt', en: 'Particle shape' }, group: 'effect', subgroup: 'shape', tier: 'basic', type: 'select', default: 'circle' },
  { id: 'grid.minRadius', engine: 'kinetic', label: { vi: 'Bán kính nhỏ nhất', en: 'Min radius' }, group: 'effect', subgroup: 'shape', tier: 'basic', type: 'slider', min: 0.5, max: 10, step: 0.1, default: 1 },
  { id: 'grid.maxRadius', engine: 'kinetic', label: { vi: 'Bán kính lớn nhất', en: 'Max radius' }, group: 'effect', subgroup: 'shape', tier: 'basic', type: 'slider', min: 1, max: 20, step: 0.1, default: 5.5 },
  { id: 'grid.sdfThreshold', engine: 'kinetic', label: { vi: 'Ngưỡng biên chữ', en: 'SDF threshold' }, group: 'effect', subgroup: 'shape', tier: 'basic', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.5 },
  { id: 'grid.sdfSoftness', engine: 'kinetic', label: { vi: 'Độ mềm biên', en: 'SDF softness' }, group: 'effect', subgroup: 'shape', tier: 'basic', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.8 },
  { id: 'style.enableMultiColor', engine: 'kinetic', label: { vi: 'Đa màu theo nhóm', en: 'Multi-color dot system' }, group: 'effect', subgroup: 'shape', tier: 'advanced', type: 'toggle', default: false },
  { id: 'style.extrusionDepth', engine: 'kinetic', label: { vi: 'Độ sâu 2.5D', en: '2.5D extrusion depth' }, group: 'effect', subgroup: 'shape', tier: 'advanced', type: 'slider', min: 0, max: 40, step: 1, default: 16 },
  { id: 'grid.customSvgLayers', engine: 'kinetic', label: { vi: 'Lớp SVG tuỳ chỉnh', en: 'Custom SVG layers' }, group: 'effect', subgroup: 'shape', tier: 'advanced', type: 'palette', default: [] },
  // Stitch/Craft material (used by "07. Cultural Stitch" and other culturalMaterial presets) — the
  // shape-specific dials the pitch deck's own quick-tune list asks for ("stitch.length"/"stitch.tension").
  { id: 'grid.stitchLength', engine: 'kinetic', label: { vi: 'Độ dài mũi chỉ', en: 'Stitch length' }, group: 'effect', subgroup: 'shape', tier: 'basic', type: 'slider', min: 3, max: 35, step: 1, default: 14 },
  { id: 'grid.stitchSoftness', engine: 'kinetic', label: { vi: 'Độ căng chỉ', en: 'Stitch tension' }, group: 'effect', subgroup: 'shape', tier: 'basic', type: 'slider', min: 0, max: 1, step: 0.02, default: 0.5 },

  // ============================================================================
  // KINETIC — EFFECT > WAVE
  // ============================================================================
  { id: 'wave.mode', engine: 'kinetic', label: { vi: 'Chế độ máy sóng', en: 'Engine' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'select', options: WAVE_MODE_OPTIONS, default: 'stable' },
  { id: 'wave.pattern', engine: 'kinetic', label: { vi: 'Hình dạng sóng', en: 'Wavefront pattern' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'select', options: WAVE_PATTERN_OPTIONS, default: 'circular' },
  { id: 'wave.waveType', engine: 'kinetic', label: { vi: 'Dạng sóng', en: 'Harmonic profile' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'select', options: WAVE_TYPE_OPTIONS, default: 'pulse' },
  { id: 'wave.waveSpeed', engine: 'kinetic', label: { vi: 'Tốc độ sóng', en: 'Speed' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'slider', min: 0.1, max: 3, step: 0.05, default: 0.8 },
  { id: 'wave.waveFrequency', engine: 'kinetic', label: { vi: 'Tần số', en: 'Frequency' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'slider', min: 0.05, max: 2, step: 0.05, default: 1.2 },
  { id: 'wave.waveAmplitude', engine: 'kinetic', label: { vi: 'Biên độ', en: 'Amplitude' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'slider', min: 0, max: 2, step: 0.05, default: 0.85 },
  { id: 'wave.waveSoftness', engine: 'kinetic', label: { vi: 'Độ mềm sóng', en: 'Softness' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.35 },
  { id: 'wave.originX', engine: 'kinetic', label: { vi: 'Tâm sóng X', en: 'Origin X' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.5 },
  { id: 'wave.originY', engine: 'kinetic', label: { vi: 'Tâm sóng Y', en: 'Origin Y' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'slider', min: 0, max: 1, step: 0.01, default: 0.5 },
  { id: 'wave.frequencyThickness', engine: 'kinetic', label: { vi: 'Độ dày tần số', en: 'Frequency thickness' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'slider', min: 0.2, max: 3, step: 0.05, default: 1 },
  { id: 'wave.followMouse', engine: 'kinetic', label: { vi: 'Tâm sóng theo con trỏ', en: 'Cursor emitter tracking' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'toggle', default: false },
  { id: 'wave.frequencyVariation', engine: 'kinetic', label: { vi: 'Biến thiên tần số', en: 'Frequency variation' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'slider', min: 0, max: 1, step: 0.05, default: 0 },
  { id: 'wave.amplitudeVariation', engine: 'kinetic', label: { vi: 'Biến thiên biên độ', en: 'Amplitude variation' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'slider', min: 0, max: 1, step: 0.05, default: 0 },
  { id: 'wave.sizeRandomness', engine: 'kinetic', label: { vi: 'Ngẫu nhiên kích thước', en: 'Size randomness' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'slider', min: 0, max: 1, step: 0.05, default: 0 },
  { id: 'wave.randomSeed', engine: 'kinetic', label: { vi: 'Seed ngẫu nhiên', en: 'Random seed' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'number', min: 1, max: 99999, step: 1, default: 42 },
  { id: 'wave.frequencyMapping', engine: 'kinetic', label: { vi: 'Điều khiển tần số nâng cao', en: 'Advanced frequency control' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'select', default: 'spatial_only' },
  { id: 'wave.dynamicThickness.enabled', engine: 'kinetic', label: { vi: 'Độ dày động theo thời gian', en: 'Dynamic visual thickness' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'toggle', default: false },

  // ============================================================================
  // KINETIC — EFFECT > AUDIO
  // ============================================================================
  { id: 'audio.enabled', engine: 'kinetic', label: { vi: 'Bật phản ứng âm thanh', en: 'Audio reactivity' }, group: 'effect', subgroup: 'audio', tier: 'basic', type: 'toggle', default: false },
  { id: 'audio.sensitivity', engine: 'kinetic', label: { vi: 'Độ nhạy', en: 'Sensitivity' }, group: 'effect', subgroup: 'audio', tier: 'basic', type: 'slider', min: 0.1, max: 3, step: 0.05, default: 1 },
  { id: 'audio.beatDetectionEnabled', engine: 'kinetic', label: { vi: 'Nhận diện beat', en: 'Beat detection' }, group: 'effect', subgroup: 'audio', tier: 'advanced', type: 'toggle', default: true },
  { id: 'audio.audioMusicRippleEnabled', engine: 'kinetic', label: { vi: 'Sóng theo nhạc liên tục', en: 'Continuous music ripple' }, group: 'effect', subgroup: 'audio', tier: 'advanced', type: 'toggle', default: true },
  { id: 'audio.vocalReactivity.mode', engine: 'kinetic', label: { vi: 'Phản ứng giọng hát', en: 'Vocal reactivity' }, group: 'effect', subgroup: 'audio', tier: 'advanced', type: 'select', default: 'off' },

  // ============================================================================
  // FLIP DISC — COMPOSITION
  // ============================================================================
  { id: 'flipDisc.density', engine: 'flip_disc', label: { vi: 'Số lượng đĩa', en: 'Grid count' }, group: 'composition', tier: 'basic', type: 'slider', min: 6, max: 60, step: 1, default: 40 },
  { id: 'flipDisc.discRadius', engine: 'flip_disc', label: { vi: 'Bán kính đĩa', en: 'Disc radius' }, group: 'composition', tier: 'basic', type: 'slider', min: 0.1, max: 0.49, step: 0.01, default: 0.43 },
  { id: 'flipDisc.maskMode', engine: 'flip_disc', label: { vi: 'Khuôn cắt (Clip Mask)', en: 'Clip mask' }, group: 'composition', tier: 'basic', type: 'select', options: FLIP_DISC_MASK_MODE_OPTIONS, default: 'none' },
  { id: 'flipDisc.maskScale', engine: 'flip_disc', label: { vi: 'Tỉ lệ khuôn cắt', en: 'Mask scale' }, group: 'composition', tier: 'basic', type: 'slider', min: 0.3, max: 2.5, step: 0.02, default: 1 },
  { id: 'flipDisc.maskOffsetX', engine: 'flip_disc', label: { vi: 'Vị trí X', en: 'Position X' }, group: 'composition', tier: 'basic', type: 'slider', min: -0.5, max: 0.5, step: 0.01, default: 0 },
  { id: 'flipDisc.maskOffsetY', engine: 'flip_disc', label: { vi: 'Vị trí Y', en: 'Position Y' }, group: 'composition', tier: 'basic', type: 'slider', min: -0.5, max: 0.5, step: 0.01, default: 0 },
  { id: 'flipDisc.thickness', engine: 'flip_disc', label: { vi: 'Độ dày đĩa', en: 'Disc thickness' }, group: 'composition', tier: 'advanced', type: 'slider', min: 0.01, max: 0.32, step: 0.01, default: 0.11 },
  { id: 'flipDisc.radialSizeAmount', engine: 'flip_disc', label: { vi: 'Kích thước theo bán kính (pixelate)', en: 'Radial size (pixelate)' }, group: 'composition', tier: 'advanced', type: 'slider', min: -1, max: 1, step: 0.02, default: 0 },
  { id: 'flipDisc.maskShapeType', engine: 'flip_disc', label: { vi: 'Hình khuôn cắt', en: 'Mask shape' }, group: 'composition', tier: 'advanced', type: 'select', default: 'circle' },

  // ============================================================================
  // FLIP DISC — APPEARANCE
  // ============================================================================
  { id: 'flipDisc.frontColor', engine: 'flip_disc', label: { vi: 'Màu mặt trước', en: 'Front color' }, group: 'appearance', tier: 'basic', type: 'color', default: '#0B9EB8' },
  { id: 'flipDisc.backColor', engine: 'flip_disc', label: { vi: 'Màu mặt sau', en: 'Back color' }, group: 'appearance', tier: 'basic', type: 'color', default: '#D43D11' },
  { id: 'flipDisc.sideColor', engine: 'flip_disc', label: { vi: 'Màu cạnh', en: 'Side color' }, group: 'appearance', tier: 'basic', type: 'color', default: '#34314D' },
  { id: 'flipDisc.backgroundColor', engine: 'flip_disc', label: { vi: 'Màu nền', en: 'Background' }, group: 'appearance', tier: 'basic', type: 'color', default: '#000000' },
  { id: 'flipDisc.material', engine: 'flip_disc', label: { vi: 'Chất liệu', en: 'Material' }, group: 'appearance', tier: 'basic', type: 'select', options: FLIP_DISC_MATERIAL_OPTIONS, default: 'iridescent' },
  { id: 'flipDisc.rainbowIntensity', engine: 'flip_disc', label: { vi: 'Cường độ cầu vồng', en: 'Rainbow intensity' }, group: 'appearance', tier: 'advanced', type: 'slider', min: 0, max: 1, step: 0.02, default: 1 },
  { id: 'flipDisc.saturation', engine: 'flip_disc', label: { vi: 'Độ bão hoà màu', en: 'Saturation' }, group: 'appearance', tier: 'advanced', type: 'slider', min: 0, max: 2.5, step: 0.02, default: 1.65 },

  // ============================================================================
  // FLIP DISC — EFFECT (motion)
  // ============================================================================
  { id: 'flipDisc.flipSpeed', engine: 'flip_disc', label: { vi: 'Tốc độ lật', en: 'Flip speed' }, group: 'effect', subgroup: 'motion', tier: 'basic', type: 'slider', min: 0.1, max: 3, step: 0.05, default: 1 },
  { id: 'flipDisc.rippleDelay', engine: 'flip_disc', label: { vi: 'Độ trễ sóng lan', en: 'Ripple delay' }, group: 'effect', subgroup: 'motion', tier: 'basic', type: 'slider', min: 0, max: 1.5, step: 0.02, default: 0.42 },
  { id: 'flipDisc.motionSoftness', engine: 'flip_disc', label: { vi: 'Độ mềm chuyển động', en: 'Motion softness' }, group: 'effect', subgroup: 'motion', tier: 'advanced', type: 'slider', min: 0, max: 1.2, step: 0.02, default: 0.52 },
  { id: 'flipDisc.waveTiming', engine: 'flip_disc', label: { vi: 'Nhịp sóng', en: 'Wave timing' }, group: 'effect', subgroup: 'motion', tier: 'advanced', type: 'slider', min: 0.2, max: 3, step: 0.05, default: 1 },
  { id: 'flipDisc.grain', engine: 'flip_disc', label: { vi: 'Hạt nhiễu', en: 'Grain amount' }, group: 'effect', subgroup: 'motion', tier: 'advanced', type: 'slider', min: 0, max: 0.3, step: 0.01, default: 0.1 },
  { id: 'flipDisc.grainSize', engine: 'flip_disc', label: { vi: 'Kích thước hạt nhiễu', en: 'Grain size' }, group: 'effect', subgroup: 'motion', tier: 'advanced', type: 'slider', min: 1, max: 4, step: 0.5, default: 1 },
  { id: 'flipDisc.animateGrain', engine: 'flip_disc', label: { vi: 'Hoạt hoạ hạt nhiễu', en: 'Animate grain' }, group: 'effect', subgroup: 'motion', tier: 'advanced', type: 'toggle', default: true },

  // ============================================================================
  // TILE BREAK — TEXT
  // ============================================================================
  { id: 'tile.text', engine: 'tile_break', label: { vi: 'Nội dung', en: 'Content' }, group: 'text', tier: 'basic', type: 'text', default: 'GAME' },
  { id: 'tile.fontFamily', engine: 'tile_break', label: { vi: 'Font', en: 'Font family' }, group: 'text', tier: 'basic', type: 'select', default: 'Arial' },
  { id: 'tile.fontSize', engine: 'tile_break', label: { vi: 'Cỡ chữ', en: 'Size' }, group: 'text', tier: 'basic', type: 'slider', min: 40, max: 420, step: 2, default: 220 },
  { id: 'tile.fontWeight', engine: 'tile_break', label: { vi: 'Độ đậm', en: 'Weight' }, group: 'text', tier: 'advanced', type: 'select', options: [
    { value: '400', label: { vi: 'Thường', en: 'Regular' } },
    { value: '700', label: { vi: 'Đậm', en: 'Bold' } },
    { value: '900', label: { vi: 'Rất đậm', en: 'Black' } }
  ], default: 900 },

  // ============================================================================
  // TILE BREAK — COMPOSITION
  // ============================================================================
  { id: 'tile.tileSize', engine: 'tile_break', label: { vi: 'Khoảng cách dot', en: 'Dot spacing' }, group: 'composition', tier: 'basic', type: 'slider', min: 3, max: 24, step: 1, default: 8 },
  { id: 'tile.baseDotScale', engine: 'tile_break', label: { vi: 'Kích thước dot', en: 'Dot size' }, group: 'composition', tier: 'basic', type: 'slider', min: 0.2, max: 1, step: 0.02, default: 0.78 },

  // ============================================================================
  // TILE BREAK — APPEARANCE
  // ============================================================================
  { id: 'tile.palette', engine: 'tile_break', label: { vi: 'Bảng màu', en: 'Palette' }, group: 'appearance', tier: 'basic', type: 'palette', default: ['#0511F2', '#5E90F2', '#04F7BF', '#F2B705'] },
  { id: 'tile.bgColor', engine: 'tile_break', label: { vi: 'Màu nền', en: 'Background' }, group: 'appearance', tier: 'basic', type: 'color', default: '#000000' },

  // ============================================================================
  // TILE BREAK — EFFECT
  // ============================================================================
  { id: 'tile.hoverEnabled', engine: 'tile_break', label: { vi: 'Đẩy khi di chuột', en: 'Hover push' }, group: 'effect', subgroup: 'motion', tier: 'basic', type: 'toggle', default: true },
  { id: 'tile.hoverRadius', engine: 'tile_break', label: { vi: 'Bán kính di chuột', en: 'Hover radius' }, group: 'effect', subgroup: 'motion', tier: 'basic', type: 'slider', min: 30, max: 400, step: 2, default: 130 },
  { id: 'tile.hoverPushForce', engine: 'tile_break', label: { vi: 'Lực đẩy', en: 'Push force' }, group: 'effect', subgroup: 'motion', tier: 'advanced', type: 'slider', min: 0.2, max: 8, step: 0.1, default: 2.8 },
  { id: 'tile.rippleSpeed', engine: 'tile_break', label: { vi: 'Tốc độ sóng', en: 'Ripple speed' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'slider', min: 100, max: 3000, step: 20, default: 900 },
  { id: 'tile.rippleThickness', engine: 'tile_break', label: { vi: 'Độ dày sóng', en: 'Ripple thickness' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'slider', min: 5, max: 300, step: 5, default: 70 },
  { id: 'tile.ripplePulseStrength', engine: 'tile_break', label: { vi: 'Cường độ phồng', en: 'Pulse strength' }, group: 'effect', subgroup: 'wave', tier: 'basic', type: 'slider', min: 0, max: 1.5, step: 0.05, default: 0.55 },
  { id: 'tile.rippleMaxRadius', engine: 'tile_break', label: { vi: 'Bán kính tắt sóng', en: 'Max radius' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'slider', min: 200, max: 4000, step: 50, default: 1600 },
  { id: 'tile.rippleColorBandSize', engine: 'tile_break', label: { vi: 'Dải màu theo bán kính', en: 'Color band' }, group: 'effect', subgroup: 'wave', tier: 'advanced', type: 'slider', min: 0, max: 300, step: 5, default: 90 },
  { id: 'tile.spring', engine: 'tile_break', label: { vi: 'Độ đàn hồi', en: 'Spring' }, group: 'effect', subgroup: 'motion', tier: 'advanced', type: 'slider', min: 0.01, max: 0.3, step: 0.005, default: 0.075 },
  { id: 'tile.friction', engine: 'tile_break', label: { vi: 'Ma sát', en: 'Friction' }, group: 'effect', subgroup: 'motion', tier: 'advanced', type: 'slider', min: 0.5, max: 0.95, step: 0.01, default: 0.78 },
  { id: 'tile.colorEase', engine: 'tile_break', label: { vi: 'Độ mượt chuyển màu', en: 'Color ease' }, group: 'effect', subgroup: 'motion', tier: 'advanced', type: 'slider', min: 0.02, max: 0.4, step: 0.01, default: 0.12 }
];

const registryById = new Map(CONTROL_REGISTRY.map((c) => [c.id, c]));

export function getControl(id: string): ControlDef | undefined {
  return registryById.get(id);
}

export function getControlsFor(engine: ControlEngine, group: ControlGroup, tier?: ControlTier): ControlDef[] {
  return CONTROL_REGISTRY.filter(
    (c) => c.engine === engine && c.group === group && (tier === undefined || c.tier === tier)
  );
}

export function resolveQuickControls(ids: string[] | undefined): ControlDef[] {
  if (!ids || ids.length === 0) return [];
  return ids.map((id) => registryById.get(id)).filter((c): c is ControlDef => !!c);
}
