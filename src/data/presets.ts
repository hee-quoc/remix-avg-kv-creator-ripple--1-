import { Preset, RenderState, PresetCategory } from '../types';
import { getDefaultKVLayout } from '../utils/kvLayoutTemplates';
import { DEFAULT_AUDIO_CONFIG } from '../utils/audioAnalyzer';
import { DEFAULT_DYNAMIC_THICKNESS_CONFIG } from '../utils/wave';
export type { PresetCategory };

export const BASE_DEFAULT_STATE: RenderState = {
  previewQuality: 'auto',
  font: {
    text: 'RADAR\nFIELDS',
    fontFamily: 'Space Grotesk',
    fontSize: 140,
    fontWeight: 700,
    letterSpacing: 4,
    lineHeight: 0.95,
    textAlign: 'center',
    invertText: false,
    maskMode: 'text'
  },
  grid: {
    gridType: 'square',
    density: 10,
    minRadius: 1,
    maxRadius: 5.5,
    dotShape: 'circle',
    sdfThreshold: 0.5,
    sdfSoftness: 0.8,
    hideBackgroundDots: false,
    asciiCharset: '0 1 + - * / . :',
    asciiFontSize: 14,
    asciiVariableSize: true,
    asciiDistribution: 'grid'
  },
  wave: {
    mode: 'stable',
    pattern: 'circular',
    waveType: 'pulse',
    waveSpeed: 0.8,
    waveFrequency: 1.2,
    waveAmplitude: 0.85,
    waveSoftness: 0.35,
    frequencyThickness: 1.0,
    radialThickness: 0.0,
    emphasizeWavefront: false,
    wavefrontEmphasis: 0.7,
    wavefrontArcLength: 1.0,
    wavefrontCurveWidth: 1.2,
    wavefrontStyle: 'concentric_arcs',
    wavefrontMatchDotStyle: false,
    wavefrontMaxTextDist: 0,
    originX: 0.5,
    originY: 0.5,
    secondaryOriginX: 0.3,
    secondaryOriginY: 0.7,
    followMouse: false,
    linearAngle: 45,
    vectorDistortion: 0.8,
    blendBack: 0.8,
    frequencyVariation: 0.0,
    amplitudeVariation: 0.0,
    sizeRandomness: 0.0,
    randomSeed: 42,
    soundReactivity: 0.0,
    soundSensitivity: 1.2,
    soundReactionBand: 'all',
    dynamicThickness: { ...DEFAULT_DYNAMIC_THICKNESS_CONFIG }
  },
  style: {
    theme: 'dark_radar',
    dotColor: '#00f0ff',
    bgColor: '#0a0d14',
    accentColor: '#38bdf8',
    enableColorGradient: true,
    gradientColor: '#818cf8',
    vignette: true,
    uniformColorBrightness: false,
    showRadarGrid: false,
    radarGridOpacity: 0.25,
    showEmitterHandle: false,
    visualStyle: 'dot_matrix',
    extrusionDepth: 16,
    extrusionAngle: 120,
    extrusionLightIntensity: 0.7,
    constellationMaxDistance: 50,
    constellationShowLabels: true,
    showConnections: false,
    vortexTwist: 1.2,
    pixelArtScale: 16,
    editorialHeadlineOffsetX: 0,
    editorialHeadlineOffsetY: 0,
    editorialHeadlineScale: 1.0,
    editorialHeadlineColor: '#ffffff',
    editorialHeadlineOpacity: 1.0,
    editorialLayerOrder: 'behind_wave'
  },
  compositionMode: 'full_molecule',
  activeVisualStyle: 'dot_matrix',
  // Text Layer A (generative Effect Text) is visible by default, matching every existing preset's
  // current appearance. Text Layer B (independent Original Text / KV Layout) is disabled by default
  // so it has zero effect until a user explicitly enables it from the Text Layout controls.
  showEffectText: true,
  kvLayout: { ...getDefaultKVLayout('without_ui', 'clean_focus'), enabled: false },
  isPlaying: true,
  time: 0,
  // Audio Reactivity is OFF by default for every existing preset (item 1/10) — enabling it is an
  // explicit user action from the Audio Reactivity panel.
  audio: { ...DEFAULT_AUDIO_CONFIG },
  audioActive: false
};

export const PRESETS: Preset[] = [
  // 01 — GLOBAL PULSE
  {
    id: 'global_pulse',
    name: '01. Global Pulse',
    category: 'News',
    description: 'Concentric planetary spherical wavefronts radiating worldwide information with full molecular typography and pulsating circular nodes.',
    formulaDescription: 'Concentric spherical wave propagation; dots form the text and radiate harmonic pulses outwardly through the letterforms.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'dot_matrix',
    tags: ['Globe', 'Concentric', 'Full Molecule', 'Circular Nodes', 'Pulse'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'dot_matrix',
      font: {
        text: 'GLOBAL\nPULSE',
        fontFamily: 'Space Grotesk',
        fontSize: 140,
        fontWeight: 700,
        letterSpacing: 4,
        lineHeight: 0.95,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 10,
        minRadius: 1.0,
        maxRadius: 6.0,
        dotShape: 'circle',
        sdfThreshold: 0.5,
        sdfSoftness: 0.8,
        hideBackgroundDots: false
      },
      wave: {
        mode: 'stable',
        pattern: 'circular',
        waveType: 'pulse',
        waveSpeed: 0.8,
        waveFrequency: 1.2,
        waveAmplitude: 0.85,
        waveSoftness: 0.35,
        frequencyThickness: 1.0,
        radialThickness: 0.0,
        emphasizeWavefront: false,
        originX: 0.5,
        originY: 0.5,
        vectorDistortion: 0.8,
        blendBack: 0.8,
        frequencyVariation: 0.3,
        amplitudeVariation: 0.35,
        sizeRandomness: 0.3,
        randomSeed: 101,
        soundReactivity: 0.0
      },
      style: {
        theme: 'dark_radar',
        visualStyle: 'dot_matrix',
        dotColor: '#00f0ff',
        bgColor: '#0a0d14',
        accentColor: '#38bdf8',
        enableColorGradient: true,
        gradientColor: '#818cf8',
        vignette: true,
        uniformColorBrightness: false,
        showRadarGrid: false,
        radarGridOpacity: 0.18,
        showEmitterHandle: false
      }
    }
  },

  // 02 — BREAKING SIGNAL
  // Redesigned: modular vertical strip field (fragmented transmission / scanning motion) layered
  // over crisp editorial typography, instead of the previous particle-burst molecule look.
  {
    id: 'breaking_signal',
    name: '02. Breaking Signal',
    category: 'News',
    description: 'Typography radial ripple — editorial paragraph text broken into colored character blocks, rippling outward from the center in concentric waves.',
    formulaDescription: 'Paragraph text word-wrapped into fixed-width character cells, each colored from the palette and displaced by the same circular/pulse ripple engine used across the app.',
    compositionMode: 'typography_ripple',
    defaultVisualStyle: 'modular_pixel',
    tags: ['Ripple', 'Typography', 'Editorial', 'Broadcast'],
    config: {
      compositionMode: 'typography_ripple',
      activeVisualStyle: 'modular_pixel',
      showEffectText: false,
      font: {
        text: 'BREAKING\nSIGNAL',
        fontFamily: 'Anton',
        fontSize: 160,
        fontWeight: 400,
        letterSpacing: 3,
        lineHeight: 0.9,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 10,
        minRadius: 1.5,
        maxRadius: 7.0,
        dotShape: 'circle',
        sdfThreshold: 0.5,
        sdfSoftness: 0.75,
        hideBackgroundDots: false,
        typographyRipple: {
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
        }
      },
      wave: {
        mode: 'flow',
        pattern: 'circular',
        waveType: 'pulse',
        waveSpeed: 0.5,
        waveFrequency: 0.8,
        waveAmplitude: 1.0,
        waveSoftness: 0.35,
        frequencyThickness: 1.4,
        vectorDistortion: 1.1,
        blendBack: 0.0,
        originX: 0.5,
        originY: 0.5,
        frequencyVariation: 0.0,
        amplitudeVariation: 0.0,
        sizeRandomness: 0.0,
        randomSeed: 202,
        soundReactivity: 0.0
      },
      style: {
        theme: 'swiss_editorial',
        visualStyle: 'modular_pixel',
        dotColor: '#c9e21b',
        bgColor: '#f7f6f2',
        accentColor: '#1c1c1e',
        enableColorGradient: false,
        gradientColor: '#fb7185',
        vignette: false,
        uniformColorBrightness: true,
        showRadarGrid: false,
        radarGridOpacity: 0.2,
        showEmitterHandle: false,
        enableMultiColor: true,
        multiColorPalette: ['#c7aa20', '#9ba8c2', '#ea148c', '#f3a000', '#b4ed00', '#0d78de', '#ef3f32', '#252a29', '#a49b56'],
        multiColorDistribution: 'palette_list'
      }
    }
  },

  // 03 — ENCODED REALITY
  {
    id: 'encoded_reality',
    name: '03. Encoded Reality',
    category: 'Technology',
    description: 'Structured digital matrix grid where cryptographic binary characters are modulated by passing waves.',
    formulaDescription: 'Dense algorithmic grid of ASCII characters & binary digits ("0 1 + - * / . :") deformed by spatial wave interference vectors.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'binary_typography',
    tags: ['ASCII Molecule', 'Binary', 'Encryption', 'Tech Matrix'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'binary_typography',
      font: {
        text: 'DIGITAL\nWORLD',
        fontFamily: 'JetBrains Mono',
        fontSize: 135,
        fontWeight: 800,
        letterSpacing: 4,
        lineHeight: 0.95,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 12,
        minRadius: 2.0,
        maxRadius: 7.2,
        dotShape: 'ascii',
        sdfThreshold: 0.5,
        sdfSoftness: 0.75,
        hideBackgroundDots: false,
        asciiCharset: '0 1 + - * / . : # @ % &',
        asciiFontSize: 14,
        asciiVariableSize: true,
        asciiDistribution: 'grid'
      },
      wave: {
        mode: 'flow',
        pattern: 'interference',
        waveType: 'pulse',
        waveSpeed: 0.75,
        waveFrequency: 1.3,
        waveAmplitude: 0.95,
        waveSoftness: 0.4,
        vectorDistortion: 1.1,
        blendBack: 0.78,
        originX: 0.35,
        originY: 0.45,
        secondaryOriginX: 0.68,
        secondaryOriginY: 0.55,
        frequencyVariation: 0.4,
        amplitudeVariation: 0.5,
        sizeRandomness: 0.45,
        randomSeed: 303
      },
      style: {
        theme: 'neon_scientific',
        visualStyle: 'binary_typography',
        dotColor: '#22c55e',
        bgColor: '#021207',
        accentColor: '#4ade80',
        enableColorGradient: true,
        gradientColor: '#06b6d4',
        vignette: true,
        uniformColorBrightness: false,
        showRadarGrid: true,
        radarGridOpacity: 0.2,
        showEmitterHandle: false
      }
    }
  },

  // 04 — MARKET FLUCTUATION (Technology — merged with the former Finance category, see
  // PresetGallery.tsx's category tabs / PresetCategory in types.ts)
  {
    id: 'market_fluctuation',
    name: '04. Market Fluctuation',
    category: 'Technology',
    description: 'Market data reimagined as a scrolling ASCII ticker field — green and blue characters modulated by a concentric ripple.',
    formulaDescription: 'Dense ASCII character grid (ticker/market symbols) colored green-to-blue, deformed by the same concentric circular wave every preset uses.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'binary_typography',
    tags: ['Technology', 'Finance', 'ASCII Molecule', 'Market Data'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'binary_typography',
      font: {
        text: 'MARKET IN\nMOTION',
        fontFamily: 'Syne',
        fontSize: 120,
        fontWeight: 800,
        letterSpacing: 4,
        lineHeight: 0.95,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 11,
        minRadius: 1.4,
        maxRadius: 6.8,
        dotShape: 'ascii',
        sdfThreshold: 0.49,
        sdfSoftness: 0.75,
        hideBackgroundDots: false,
        asciiCharset: '0 1 $ % + - . : # @',
        asciiFontSize: 14,
        asciiVariableSize: true,
        asciiDistribution: 'grid'
      },
      // Concentric, in-phase circular ripple from canvas center — no per-point frequency/amplitude/
      // size jitter, so every dot on a given ring stays in phase with its neighbors instead of
      // reading as scattered noise.
      wave: {
        mode: 'flow',
        pattern: 'circular',
        waveType: 'sine',
        waveSpeed: 0.6,
        waveFrequency: 0.9,
        waveAmplitude: 1.0,
        waveSoftness: 0.4,
        vectorDistortion: 1.0,
        frequencyVariation: 0.0,
        amplitudeVariation: 0.0,
        sizeRandomness: 0.0,
        randomSeed: 404,
        originX: 0.5,
        originY: 0.5
      },
      // Hard-set green-to-blue ASCII palette, matching Encoded Reality's Technology look.
      style: {
        theme: 'neon_scientific',
        visualStyle: 'binary_typography',
        dotColor: '#22c55e',
        bgColor: '#03140f',
        accentColor: '#3b82f6',
        enableColorGradient: true,
        gradientColor: '#3b82f6',
        vignette: true,
        uniformColorBrightness: false,
        showRadarGrid: true,
        radarGridOpacity: 0.15,
        showEmitterHandle: false
      }
    }
  },

  // 05 — VELOCITY CURVES (Automotive / Entertainment)
  {
    id: 'velocity_curves',
    name: '05. Velocity Curves',
    category: 'Automotive',
    description: 'Tangent-line vector field curving around a central impact point, activated by a clean concentric ripple.',
    formulaDescription: 'A dense tangent-line dot field whose orientation reads tangent to the circular wave origin, driven by the same in-phase concentric ripple engine as every other preset.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'kinetic_vortex',
    tags: ['Automotive', 'Vector Field', 'Tangent Lines', 'Concentric Ripple'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'kinetic_vortex',
      font: {
        text: 'AERO\nVELOCITY',
        fontFamily: 'Syne',
        fontSize: 140,
        fontWeight: 800,
        letterSpacing: 4,
        lineHeight: 0.92,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 18,
        minRadius: 2.0,
        maxRadius: 8.0,
        // 'magnetic_needle' had no renderer at all (the standalone magneticFieldSim.ts it was meant
        // for was never wired in — see task 5 cleanup) and silently fell back to plain circles.
        // Replaced with 'tangent_line', a real, working shape whose angle already reads tangent to
        // the circular wave's origin — the same "flow lines curving around a center" feel, but
        // actually rendered.
        dotShape: 'tangent_line',
        lineLength: 4.5,
        lineThickness: 2.2,
        sdfThreshold: 0.5,
        sdfSoftness: 0.75,
        hideBackgroundDots: false
      },
      // Concentric, in-phase circular ripple from canvas center (was a directional linear sweep).
      wave: {
        mode: 'flow',
        pattern: 'circular',
        waveType: 'sine',
        waveSpeed: 0.6,
        waveFrequency: 1.0,
        waveAmplitude: 1.0,
        waveSoftness: 0.4,
        frequencyThickness: 1.0,
        radialThickness: 0.0,
        vectorDistortion: 1.0,
        blendBack: 0.70,
        originX: 0.5,
        originY: 0.5,
        frequencyVariation: 0.0,
        amplitudeVariation: 0.0,
        sizeRandomness: 0.0,
        randomSeed: 505
      },
      style: {
        theme: 'minimal_noir',
        visualStyle: 'kinetic_vortex',
        dotColor: '#38bdf8',
        bgColor: '#05070d',
        accentColor: '#6432ff',
        enableColorGradient: true,
        gradientColor: '#a855f7',
        vignette: true,
        uniformColorBrightness: false,
        showRadarGrid: false,
        radarGridOpacity: 0.14,
        showEmitterHandle: false
      }
    }
  },

  // 06 — CHAMPIONSHIP WAVE (Sports)
  {
    id: 'championship_wave',
    name: '06. Championship Wave',
    category: 'Sports',
    description: 'Stadium-scale concentric wave dynamics and rhythmic athletic surge patterns.',
    formulaDescription: 'Concentric surges pulsating with athletic energy, optimized for visual stability with standalone internal dynamics.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'dot_matrix',
    tags: ['Sports', 'Stadium Wave', 'Athletic Energy', 'Surge'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'dot_matrix',
      font: {
        text: 'GOLDEN\nVICTORY',
        fontFamily: 'Anton',
        fontSize: 155,
        fontWeight: 400,
        letterSpacing: 3,
        lineHeight: 0.9,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'hexagonal',
        density: 9,
        minRadius: 1.0,
        maxRadius: 6.5,
        dotShape: 'circle',
        sdfThreshold: 0.5,
        sdfSoftness: 0.8,
        hideBackgroundDots: false
      },
      wave: {
        mode: 'flow',
        pattern: 'circular',
        waveType: 'pulse',
        waveSpeed: 0.95,
        waveFrequency: 1.35,
        waveAmplitude: 1.0,
        waveSoftness: 0.35,
        vectorDistortion: 1.3,
        blendBack: 0.72,
        originX: 0.5,
        originY: 0.48,
        frequencyVariation: 0.5,
        amplitudeVariation: 0.6,
        sizeRandomness: 0.45,
        randomSeed: 606,
        soundReactivity: 0.0,
        soundSensitivity: 1.0
      },
      style: {
        theme: 'cyber_freq',
        visualStyle: 'dot_matrix',
        dotColor: '#eab308',
        bgColor: '#0f051d',
        accentColor: '#f97316',
        enableColorGradient: true,
        gradientColor: '#ec4899',
        vignette: true,
        uniformColorBrightness: false,
        showRadarGrid: true,
        radarGridOpacity: 0.22,
        showEmitterHandle: true,
        extrusionDepth: 14,
        extrusionAngle: 90
      }
    }
  },

  // 07 — CULTURAL STITCH (Culture)
  {
    id: 'heritage_echo',
    name: '07. Cultural Stitch',
    category: 'Culture',
    description: 'Hand-crafted embroidered stitch units and woven thread materiality animating with textile tension.',
    formulaDescription: 'Generative sashiko and embroidery thread stitches animating dynamically into place with thread tension, crafted marks, and rich textile resonance.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'stitch_craft',
    tags: ['Culture', 'Stitch', 'Embroidery', 'Textile', 'Craft'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'stitch_craft',
      font: {
        text: 'CULTURAL\nSTITCH',
        fontFamily: 'Cinzel',
        fontSize: 125,
        fontWeight: 700,
        letterSpacing: 5,
        lineHeight: 1.0,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 12,
        minRadius: 1.2,
        maxRadius: 6.5,
        // Hard-set to the classic 'stitch' thread material — Diagonal Sashiko mode, whose marks now
        // pinch to a point at both ends (the "grain" shape) — instead of the Original Stitch Pattern
        // checkerboard this preset briefly defaulted to.
        dotShape: 'stitch',
        culturalMaterial: 'stitch',
        stitchLength: 16,
        stitchThickness: 3.2,
        stitchAngleMode: 'diagonal_sashiko',
        stitchAngle: 32,
        stitchSoftness: 0.22,
        stitchTensionAnim: true,
        sdfThreshold: 0.48,
        sdfSoftness: 0.8,
        hideBackgroundDots: false
      },
      // Concentric, in-phase circular ripple from dead-center — no secondary origin offset and no
      // per-point frequency/amplitude/size jitter, so the ripple reads as one clean radiating wave.
      wave: {
        mode: 'flow',
        pattern: 'circular',
        waveType: 'sine',
        waveSpeed: 0.5,
        waveFrequency: 1.0,
        waveAmplitude: 0.5,
        waveSoftness: 0.4,
        vectorDistortion: 0.6,
        blendBack: 0.82,
        frequencyThickness: 1.0,
        radialThickness: 0.2,
        originX: 0.5,
        originY: 0.5,
        secondaryOriginX: 0.5,
        secondaryOriginY: 0.5,
        frequencyVariation: 0.0,
        amplitudeVariation: 0.0,
        sizeRandomness: 0.0,
        randomSeed: 808
      },
      style: {
        theme: 'minimal_noir',
        visualStyle: 'stitch_craft',
        // Two-tone checkerboard variant — noStroke(); alternating fill(color1/color2, 200);
        // background(0). Opacity (200/255) is applied by the 'original_stitch' shape renderer itself,
        // not via these colors' alpha. dotColor is kept as the single-color fallback (used whenever
        // Multi-Color is switched off from the GRID tab).
        dotColor: '#0793B3',
        enableMultiColor: true,
        multiColorPalette: ['#0793B3', '#F24A48'],
        multiColorDistribution: 'palette_list',
        bgColor: '#000000',
        accentColor: '#F24A48',
        enableColorGradient: false,
        gradientColor: '#81b29a',
        vignette: false,
        uniformColorBrightness: false,
        showRadarGrid: false,
        radarGridOpacity: 0.16,
        showEmitterHandle: false,
        constellationMaxDistance: 45,
        constellationShowLabels: false
      }
    }
  },

  // 08 — GLOBAL WIRE (News)
  {
    id: 'global_wire',
    name: '08. Global Wire',
    category: 'News',
    description: 'A cached grid of colorful multilingual word-boxes whose opacity is driven live by the Ripple Engine.',
    formulaDescription: 'Packed rounded-rect typography boxes (existing Typography Box Material) sampled by the shared wave engine at each box center — opacity, not position, follows the wavefront.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'dot_matrix',
    tags: ['News', 'Typography', 'Ripple', 'Multilingual'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'dot_matrix',
      font: {
        text: 'GLOBAL\nWIRE',
        fontFamily: 'Space Grotesk',
        fontSize: 140,
        fontWeight: 700,
        letterSpacing: 4,
        lineHeight: 0.95,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 10,
        minRadius: 1,
        maxRadius: 5.5,
        dotShape: 'typography_box',
        sdfThreshold: 0.5,
        sdfSoftness: 0.8,
        hideBackgroundDots: false,
        // Exact port of the source material's own defaults (words, palette, geometry) — see
        // DEFAULT_TYPOGRAPHY_BOX_CONFIG in particleRenderer.ts. Spelled out here too so the preset
        // is self-documenting and independently editable from the GRID tab without surprises.
        // Hard-set per the user's own hand-tuned panel values (Box Geometry + Ripple Response) —
        // boxes are fully hidden at rest (baseOpacity/minOpacity 0) and only reveal where the
        // (now properly centered, see buildTypographyBoxItems) circular ripple actually passes.
        typographyBox: {
          words: ['caffeine', 'Hola!', 'Hallo!', 'Bonjour!', 'caffeine', '你好', 'こんにちは', 'Привет'],
          colorPalette: ['#FFF533', '#F64FA7', '#73F849'],
          fontFamily: 'Arial',
          fontSize: 52,
          boxHeight: 58,
          horizontalPadding: 34,
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
          baseOpacity: 0.0,
          minOpacity: 0.0,
          maxOpacity: 1.0,
          opacityInfluence: 0.92,
          opacitySoftness: 0.5,
          invertOpacity: false
        }
      },
      wave: {
        mode: 'flow',
        pattern: 'circular',
        waveType: 'sine',
        waveSpeed: 1.6,
        // Ring spacing (2*PI / (waveFrequency*0.05) px) at the old 1.0 produced a ~126px ring period —
        // close enough to the box grid's own ~95-115px pitch to alias against it, so the ripple read as
        // patchy/random noise instead of one clean expanding ring. Lowered so the ring period is much
        // larger than the box pitch and the box grid's own bounding diagonal, giving a single readable
        // wavefront that sweeps outward from center instead of several interfering rings at once.
        waveFrequency: 0.2,
        waveAmplitude: 1.35,
        waveSoftness: 0.5,
        frequencyThickness: 1.0,
        radialThickness: 0.0,
        originX: 0.5,
        originY: 0.5,
        secondaryOriginX: 0.5,
        secondaryOriginY: 0.5,
        vectorDistortion: 0.8,
        frequencyVariation: 0.0,
        amplitudeVariation: 0.0,
        sizeRandomness: 0.0,
        randomSeed: 2024
      },
      style: {
        theme: 'swiss_editorial',
        visualStyle: 'dot_matrix',
        dotColor: '#111111',
        bgColor: '#FFFFFF',
        accentColor: '#F64FA7',
        enableColorGradient: false,
        gradientColor: '#818cf8',
        vignette: false,
        uniformColorBrightness: false,
        showRadarGrid: false,
        radarGridOpacity: 0.25,
        showEmitterHandle: false
      }
    }
  },

  // 09 — SINE MESH NET (Sports)
  {
    id: 'sine_mesh_net',
    name: '09. Sine Mesh Net',
    category: 'Sports',
    description: '3D Net Vibration / Goal Impact — a wireframe sports net rippling with sine-wave motion from an impact point.',
    formulaDescription: 'A wireframe mesh grid displaced by the existing circular wave engine from the Ripple Origin, reading like a ball-impact ripple traveling through a net.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'dot_matrix',
    tags: ['Sports', 'Mesh', 'Net', 'Impact', 'Sine Wave'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'dot_matrix',
      font: {
        text: 'GOAL\nIMPACT',
        fontFamily: 'Anton',
        fontSize: 150,
        fontWeight: 400,
        letterSpacing: 3,
        lineHeight: 0.9,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 10,
        minRadius: 1,
        maxRadius: 5.5,
        dotShape: 'mesh_net',
        sdfThreshold: 0.5,
        sdfSoftness: 0.8,
        hideBackgroundDots: false,
        meshNet: {
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
        }
      },
      wave: {
        mode: 'flow',
        pattern: 'circular',
        waveType: 'sine',
        waveSpeed: 0.85,
        waveFrequency: 1.1,
        waveAmplitude: 1.15,
        waveSoftness: 0.45,
        frequencyThickness: 1.0,
        radialThickness: 0.35,
        vectorDistortion: 1.0,
        blendBack: 0.7,
        originX: 0.5,
        originY: 0.5,
        secondaryOriginX: 0.5,
        secondaryOriginY: 0.5,
        frequencyVariation: 0.0,
        amplitudeVariation: 0.0,
        sizeRandomness: 0.0,
        randomSeed: 1010
      },
      style: {
        theme: 'blueprint_cyan',
        visualStyle: 'dot_matrix',
        dotColor: '#E8ECF5',
        bgColor: '#05070C',
        accentColor: '#39FF9E',
        enableColorGradient: false,
        gradientColor: '#7dd3fc',
        vignette: true,
        uniformColorBrightness: false,
        showRadarGrid: false,
        radarGridOpacity: 0.18,
        showEmitterHandle: false
      }
    }
  },

  // 10 — SPEED STRIPE FIELD (Sports)
  {
    id: 'speed_stripe_field',
    name: '10. Speed Stripe Field',
    category: 'Sports',
    description: 'Velocity Dash — bold diagonal dash units in yellow-on-black, activated by a directional speed pulse.',
    formulaDescription: 'A field of diagonal dash units sampling the existing wave engine at each dash center, with a local directional stagger sweeping the ripple across the field.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'dot_matrix',
    tags: ['Sports', 'Speed', 'Stripe', 'Dash', 'Motion'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'dot_matrix',
      font: {
        text: 'SPRINT\nFIELD',
        fontFamily: 'Anton',
        fontSize: 150,
        fontWeight: 400,
        letterSpacing: 3,
        lineHeight: 0.9,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 10,
        minRadius: 1,
        maxRadius: 5.5,
        dotShape: 'speed_stripe',
        sdfThreshold: 0.5,
        sdfSoftness: 0.8,
        hideBackgroundDots: false,
        // More dash "seeds" packed into a much bigger field (closer to full-canvas, near-square
        // aspect) so the ripple reads as an expanding circle rather than a small rectangle.
        speedStripe: {
          dashAngle: 35,
          dashWidth: 58,
          dashHeight: 18,
          spacingX: 6,
          spacingY: 6,
          rowOffset: 0.5,
          columnCount: 18,
          rowCount: 13,
          fieldWidth: 0.9,
          fieldHeight: 0.82,
          scaleProgression: 0,
          variationMode: 'wave_activated',
          rippleInfluence: 0.9,
          animSpeed: 1.0,
          displacementAmount: 0.25,
          opacityInfluence: 0.6,
          scalePulseAmount: 0.3,
          staggerAmount: 0,
          motionDirection: 35,
          primaryColor: '#FFF200',
          secondaryColor: '#000000',
          baseOpacity: 0.85,
          minOpacity: 0.3,
          maxOpacity: 1.0,
          contrast: 1.1
        }
      },
      wave: {
        mode: 'flow',
        pattern: 'circular',
        waveType: 'pulse',
        waveSpeed: 1.1,
        // Ring period stays comfortably above the (now bigger) dash field's own column pitch, so
        // several concentric rings ("seeds") can be visible across the field at once without
        // aliasing into the patchy/moiré look that a too-high frequency caused before.
        waveFrequency: 0.4,
        waveAmplitude: 1.0,
        waveSoftness: 0.35,
        frequencyThickness: 1.0,
        radialThickness: 0.3,
        vectorDistortion: 0.8,
        blendBack: 0.7,
        originX: 0.5,
        originY: 0.5,
        secondaryOriginX: 0.5,
        secondaryOriginY: 0.5,
        linearAngle: 35,
        frequencyVariation: 0.0,
        amplitudeVariation: 0.0,
        sizeRandomness: 0.0,
        randomSeed: 2025
      },
      style: {
        theme: 'minimal_noir',
        visualStyle: 'dot_matrix',
        dotColor: '#FFF200',
        bgColor: '#000000',
        accentColor: '#FFF200',
        enableColorGradient: false,
        gradientColor: '#FFF200',
        vignette: false,
        uniformColorBrightness: true,
        showRadarGrid: false,
        radarGridOpacity: 0.18,
        showEmitterHandle: false
      }
    }
  }
];

/**
 * Creates a clean, reproducible RenderState from a selected Preset without leftover dirty properties
 */
export function applyPresetToState(presetOrId: Preset | string, currentState?: RenderState): RenderState {
  const preset = typeof presetOrId === 'string'
    ? PRESETS.find((p) => p.id === presetOrId) || PRESETS[0]
    : presetOrId;

  const base = JSON.parse(JSON.stringify(BASE_DEFAULT_STATE)) as RenderState;

  // Preserve user custom text if already customized and not empty
  const textToUse = preset.config.font?.text || currentState?.font?.text || base.font.text;

  const merged: RenderState = {
    ...base,
    activePresetId: preset.id,
    compositionMode: preset.config.compositionMode || preset.compositionMode || 'full_molecule',
    activeVisualStyle: preset.config.activeVisualStyle || preset.defaultVisualStyle || 'dot_matrix',
    font: {
      ...base.font,
      ...preset.config.font,
      text: textToUse,
      // Uploaded SVG-as-text-mask logo is a cross-cutting user asset, not a preset-owned visual
      // default — no preset currently bakes in its own maskSvgXml, so carry the user's upload (and
      // the maskMode that activates it) forward across preset switches instead of discarding it.
      ...(preset.config.font?.maskSvgXml === undefined &&
      currentState?.font?.maskMode === 'svg_mask' &&
      currentState?.font?.maskSvgXml
        ? {
            maskMode: currentState.font.maskMode,
            maskSvgDataUrl: currentState.font.maskSvgDataUrl,
            maskSvgXml: currentState.font.maskSvgXml,
            maskSvgName: currentState.font.maskSvgName,
            maskScale: currentState.font.maskScale,
            maskScaleX: currentState.font.maskScaleX,
            maskScaleY: currentState.font.maskScaleY
          }
        : {})
    },
    grid: {
      ...base.grid,
      ...preset.config.grid,
      // Uploaded SVG dot-shape logo(s) — same cross-cutting-asset reasoning as the text mask above.
      // The preset's own dotShape still takes effect (a preset switch legitimately changes which
      // shape renders by default), but the uploaded asset itself is preserved and instantly
      // reusable via the SVG panel's ENABLE SVG toggle rather than requiring a re-upload.
      ...(preset.config.grid?.customSvgLayers === undefined && currentState?.grid?.customSvgLayers
        ? {
            customSvgDataUrl: currentState.grid.customSvgDataUrl,
            customSvgXml: currentState.grid.customSvgXml,
            customSvgName: currentState.grid.customSvgName,
            customSvgLayers: currentState.grid.customSvgLayers,
            customSvgDistribution: currentState.grid.customSvgDistribution
          }
        : {})
    },
    wave: {
      ...base.wave,
      ...preset.config.wave,
      // Dynamic Visual Thickness is a cross-cutting session setting (like Audio Reactivity below),
      // not a preset-owned visual default — no preset currently bakes in its own
      // `config.wave.dynamicThickness`, so the user's current setting carries forward across preset
      // switches instead of silently resetting, while still defaulting to disabled on first load.
      dynamicThickness: preset.config.wave?.dynamicThickness
        ? { ...(base.wave.dynamicThickness as NonNullable<RenderState['wave']['dynamicThickness']>), ...preset.config.wave.dynamicThickness }
        : currentState?.wave?.dynamicThickness || base.wave.dynamicThickness,
      // Radial 3D's own uploaded SVG shape (a separate asset slot from the 2D grid's above, since
      // it's a dedicated rendering engine) is likewise a cross-cutting user asset.
      radial3D: preset.config.wave?.radial3D
        ? { ...(base.wave.radial3D || {}), ...preset.config.wave.radial3D }
        : currentState?.wave?.radial3D || base.wave.radial3D
    },
    style: {
      ...base.style,
      ...preset.config.style
    },
    // Text Layer B (Original Text / KV Layout): use the preset's own baked-in default if it defines
    // one (e.g. Breaking Signal's modular text cascade), otherwise the neutral disabled default.
    // NOTE: deliberately does NOT carry the previous preset's kvLayout/showEffectText forward — a
    // preset's own opinionated defaults (like Breaking Signal's) must never bleed into a different
    // preset selected afterward, which a "carry the user's layer forward" merge would otherwise do.
    kvLayout: preset.config.kvLayout
      ? { ...(base.kvLayout as NonNullable<RenderState['kvLayout']>), ...preset.config.kvLayout }
      : base.kvLayout,
    showEffectText: preset.config.showEffectText ?? base.showEffectText,
    // Audio Reactivity is a cross-cutting session setting (like previewQuality), not a preset-owned
    // visual default — no preset currently bakes in its own `config.audio`, so carrying the user's
    // current audio session forward across preset switches is safe and avoids interrupting playback
    // or duplicating analysis loops (item 12) while still resetting to the disabled default on first load.
    audio: preset.config.audio
      ? { ...(base.audio as RenderState['audio']), ...preset.config.audio }
      : currentState?.audio || base.audio,
    isPlaying: true,
    time: 0,
    previewQuality: currentState?.previewQuality || 'auto',
    audioActive: currentState?.audioActive || false
  };

  return merged;
}
