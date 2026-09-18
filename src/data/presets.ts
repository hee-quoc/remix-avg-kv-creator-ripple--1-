import { Preset, RenderState, PresetCategory } from '../types';
import { getDefaultKVLayout } from '../utils/kvLayoutTemplates';
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
    soundReactionBand: 'all'
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
  audioActive: false,
  audioSource: 'none',
  audioLevel: 0
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
    description: 'Modular signal field of staggered vertical color-block strips scanning across layered editorial typography — fragmented transmission, not a particle burst.',
    formulaDescription: 'Columns of variable-height strips animate with clustered, staggered phase offsets over an independent crisp text layer; strips interrupt and mask the type as they pass.',
    compositionMode: 'modular_signal_field',
    defaultVisualStyle: 'modular_pixel',
    tags: ['Signal', 'Modular', 'Scanning', 'Editorial Motion'],
    config: {
      compositionMode: 'modular_signal_field',
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
        dotShape: 'modular_strip',
        sdfThreshold: 0.5,
        sdfSoftness: 0.75,
        hideBackgroundDots: false,
        modularStrip: {
          barWidth: 30,
          heightMin: 36,
          heightMax: 210,
          density: 9,
          spacing: 5,
          columnCount: 24,
          verticalOffsetAmount: 26,
          staggerAmount: 0.75,
          clusterSize: 3,
          overlapIntensity: 1.0,
          animSpeed: 0.9,
          offsetTiming: 0.6,
          movementAmplitude: 70,
          verticalMotionAmount: 1.0,
          horizontalDriftAmount: 3,
          loopSpeed: 1.0,
          randomnessAmount: 0.3,
          syncVsStagger: 0.8
        }
      },
      wave: {
        mode: 'flow',
        pattern: 'linear',
        waveType: 'pulse',
        waveSpeed: 1.1,
        waveFrequency: 1.4,
        waveAmplitude: 1.0,
        waveSoftness: 0.3,
        linearAngle: 45,
        vectorDistortion: 1.2,
        blendBack: 0.75,
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
        bgColor: '#f1ede4',
        accentColor: '#1c1c1e',
        enableColorGradient: false,
        gradientColor: '#fb7185',
        vignette: false,
        uniformColorBrightness: true,
        showRadarGrid: false,
        radarGridOpacity: 0.2,
        showEmitterHandle: false,
        enableMultiColor: true,
        multiColorPalette: ['#c9e21b', '#c99a2e', '#f2600c', '#0f9bd7', '#e0158c', '#dc2626', '#1c1c1e', '#a8a3b8'],
        multiColorDistribution: 'palette_list'
      },
      kvLayout: {
        enabled: true,
        mode: 'without_ui',
        templateId: 'clean_focus',
        graphicElements: [],
        textBlocks: [
          { id: 'bs_l1', name: 'Line 1', text: 'SIGNAL LOST IN THE BROADCAST SE', x: 40, y: 90, fontSize: 38, fontFamily: 'Inter', fontWeight: 600, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.95 },
          { id: 'bs_l2', name: 'Line 2', text: 'QUENCE OF THIS DISRUPTED TRANS', x: 130, y: 160, fontSize: 34, fontFamily: 'Inter', fontWeight: 500, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.9 },
          { id: 'bs_l3', name: 'Line 3', text: 'MISSION THE OTHER RECURRING', x: 210, y: 230, fontSize: 40, fontFamily: 'Inter', fontWeight: 600, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.95 },
          { id: 'bs_l4', name: 'Line 4', text: 'FREQUENCIES BUILDING URGEN', x: 330, y: 300, fontSize: 34, fontFamily: 'Inter', fontWeight: 500, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.9 },
          { id: 'bs_l5', name: 'Line 5', text: 'T ALERTS ACROSS THE NETWORK', x: 470, y: 370, fontSize: 38, fontFamily: 'Inter', fontWeight: 600, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.95 },
          { id: 'bs_l6', name: 'Line 6', text: 'THE GEOPOLITICAL RESPONSE', x: 610, y: 440, fontSize: 34, fontFamily: 'Inter', fontWeight: 500, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.9 },
          { id: 'bs_l7', name: 'Line 7', text: 'FRAGMENTED CHANNELS AND', x: 60, y: 660, fontSize: 36, fontFamily: 'Inter', fontWeight: 600, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.92 },
          { id: 'bs_l8', name: 'Line 8', text: 'THEIR INTERFERENCE PATTERNS', x: 200, y: 730, fontSize: 34, fontFamily: 'Inter', fontWeight: 500, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.9 },
          { id: 'bs_l9', name: 'Line 9', text: 'THE FORCES OF LATE CAPI', x: 340, y: 800, fontSize: 40, fontFamily: 'Inter', fontWeight: 600, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.95 },
          { id: 'bs_l10', name: 'Line 10', text: 'TAL BROADCASTING SYSTEMS OF', x: 480, y: 870, fontSize: 34, fontFamily: 'Inter', fontWeight: 500, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.9 },
          { id: 'bs_l11', name: 'Line 11', text: 'RESISTANCE TO THEIR REFRAIN', x: 610, y: 940, fontSize: 36, fontFamily: 'Inter', fontWeight: 600, letterSpacing: 0, lineHeight: 1.1, textAlign: 'left', color: '#ffffff', opacity: 0.92 }
        ]
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

  // 04 — MARKET FLUCTUATION
  {
    id: 'market_fluctuation',
    name: '04. Market Fluctuation',
    category: 'Finance',
    description: 'Financial market volatility with directional chart waves, fluctuating peaks, and editable multi-color dots.',
    formulaDescription: 'Abstract directional wave geometry modeled after stock ticker candles and trend curves, rendered with multi-color dots and fluctuating chart motion.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'extruded_particles',
    tags: ['Finance', 'Chart Wave', 'Multi-Color Dots', 'Market Data'],
    config: {
      compositionMode: 'full_molecule',
      activeVisualStyle: 'extruded_particles',
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
        dotShape: 'circle',
        sdfThreshold: 0.49,
        sdfSoftness: 0.75,
        hideBackgroundDots: false
      },
      wave: {
        mode: 'stable',
        pattern: 'market_chart',
        waveType: 'sine',
        waveSpeed: 0.75,
        waveFrequency: 1.5,
        waveAmplitude: 1.1,
        waveSoftness: 0.35,
        vectorDistortion: 1.4,
        linearAngle: 32,
        frequencyVariation: 0.55,
        amplitudeVariation: 0.7,
        sizeRandomness: 0.5,
        randomSeed: 404,
        originX: 0.2,
        originY: 0.7
      },
      style: {
        theme: 'solarized',
        visualStyle: 'extruded_particles',
        dotColor: '#10b981',
        bgColor: '#05130e',
        accentColor: '#f59e0b',
        enableColorGradient: false,
        enableMultiColor: true,
        multiColorPalette: ['#10b981', '#ef4444', '#06b6d4', '#f59e0b', '#8b5cf6'],
        multiColorDistribution: 'palette_list',
        vignette: true,
        uniformColorBrightness: false,
        showRadarGrid: true,
        radarGridOpacity: 0.15,
        showEmitterHandle: false,
        extrusionDepth: 16,
        extrusionAngle: 125,
        extrusionLightIntensity: 0.8,
        constellationMaxDistance: 45,
        constellationShowLabels: true
      }
    }
  },

  // 05 — VELOCITY CURVES (Automotive / Entertainment)
  {
    id: 'velocity_curves',
    name: '05. Velocity Curves',
    category: 'Automotive',
    description: 'Magnetic needle vector field simulation with dynamic noise forces, neighbor tension coupling, and interactive mouse-press wave propagation.',
    formulaDescription: '60x60 magnetic dipole array rotating with Perlin noise forces and neighbor tension coupling; mouse press propagates magnetic wave shockwaves.',
    compositionMode: 'full_molecule',
    defaultVisualStyle: 'kinetic_vortex',
    tags: ['Automotive', 'Magnetic Needle', 'Vector Field', 'Interactive Wave'],
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
        dotShape: 'magnetic_needle',
        magneticGridN: 60,
        magneticScale: 2.4,
        magneticLineLength: 24,
        magneticWeight: 4,
        sdfThreshold: 0.5,
        sdfSoftness: 0.75,
        hideBackgroundDots: false
      },
      wave: {
        mode: 'flow',
        pattern: 'linear',
        waveType: 'pulse',
        waveSpeed: 0.25,
        waveFrequency: 2.20,
        waveAmplitude: 0.00,
        waveSoftness: 0.10,
        frequencyThickness: 0.70,
        radialThickness: 0.0,
        linearAngle: 42,
        vectorDistortion: 1.70,
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

  // 07 — KINETIC PAVILION (Culture)
  {
    id: 'kinetic_pavilion',
    name: '07. Kinetic Pavilion',
    category: 'Culture',
    description: 'Parametric architectural structures, undulating facade louvers, and cultural installation geometry.',
    formulaDescription: '3D structural particle extrusion with parametric wave undulation and clean typography, evoking dynamic kinetic pavilion facades.',
    compositionMode: 'editorial_collage',
    defaultVisualStyle: 'extruded_particles',
    tags: ['Culture', 'Architecture', 'Kinetic Pavilion', 'Parametric 2.5D'],
    config: {
      compositionMode: 'editorial_collage',
      activeVisualStyle: 'extruded_particles',
      font: {
        text: 'PAVILION\nBIENNALE',
        fontFamily: 'Syne',
        fontSize: 130,
        fontWeight: 800,
        letterSpacing: 4,
        lineHeight: 0.95,
        textAlign: 'center',
        invertText: false
      },
      grid: {
        gridType: 'square',
        density: 12,
        minRadius: 1.5,
        maxRadius: 7.0,
        dotShape: 'extruded_block',
        sdfThreshold: 0.5,
        sdfSoftness: 0.75,
        hideBackgroundDots: false
      },
      wave: {
        mode: 'stable',
        pattern: 'spiral',
        waveType: 'sine',
        waveSpeed: 0.65,
        waveFrequency: 1.2,
        waveAmplitude: 0.9,
        waveSoftness: 0.4,
        frequencyThickness: 1.25,
        originX: 0.5,
        originY: 0.5,
        frequencyVariation: 0.35,
        amplitudeVariation: 0.45,
        sizeRandomness: 0.35,
        randomSeed: 707
      },
      style: {
        theme: 'swiss_editorial',
        visualStyle: 'extruded_particles',
        dotColor: '#f1f5f9',
        bgColor: '#0f172a',
        accentColor: '#38bdf8',
        enableColorGradient: true,
        gradientColor: '#94a3b8',
        vignette: true,
        uniformColorBrightness: false,
        showRadarGrid: true,
        radarGridOpacity: 0.16,
        showEmitterHandle: false,
        extrusionDepth: 18,
        extrusionAngle: 60,
        extrusionLightIntensity: 0.85,
        editorialHeadlineOffsetX: 0,
        editorialHeadlineOffsetY: 200,
        editorialHeadlineScale: 1.05,
        editorialHeadlineColor: '#f8fafc',
        editorialHeadlineOpacity: 1.0,
        editorialLayerOrder: 'behind_wave'
      }
    }
  },

  // 08 — CULTURAL STITCH (Culture)
  {
    id: 'heritage_echo',
    name: '08. Cultural Stitch',
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
      wave: {
        mode: 'flow',
        pattern: 'interference',
        waveType: 'sine',
        waveSpeed: 0.65,
        waveFrequency: 1.4,
        waveAmplitude: 0.92,
        waveSoftness: 0.38,
        vectorDistortion: 1.15,
        blendBack: 0.75,
        frequencyThickness: 1.2,
        radialThickness: 0.3,
        emphasizeWavefront: true,
        wavefrontEmphasis: 0.85,
        wavefrontArcLength: 1.3,
        wavefrontCurveWidth: 1.4,
        originX: 0.4,
        originY: 0.5,
        secondaryOriginX: 0.6,
        secondaryOriginY: 0.5,
        frequencyVariation: 0.3,
        amplitudeVariation: 0.35,
        sizeRandomness: 0.25,
        randomSeed: 808
      },
      style: {
        theme: 'solarized',
        visualStyle: 'stitch_craft',
        dotColor: '#f59e0b',
        bgColor: '#170c04',
        accentColor: '#e07a5f',
        enableColorGradient: true,
        gradientColor: '#81b29a',
        vignette: true,
        uniformColorBrightness: false,
        showRadarGrid: true,
        radarGridOpacity: 0.16,
        showEmitterHandle: false,
        constellationMaxDistance: 45,
        constellationShowLabels: false
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
      text: textToUse
    },
    grid: {
      ...base.grid,
      ...preset.config.grid
    },
    wave: {
      ...base.wave,
      ...preset.config.wave
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
    isPlaying: true,
    time: 0,
    previewQuality: currentState?.previewQuality || 'auto',
    audioActive: currentState?.audioActive || false,
    audioSource: currentState?.audioSource || 'none'
  };

  return merged;
}
