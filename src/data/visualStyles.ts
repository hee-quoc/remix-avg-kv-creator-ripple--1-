import { VisualStyleId, RenderState } from '../types';

export interface VisualStyleDefinition {
  id: VisualStyleId;
  name: string;
  category: string;
  referenceDescription: string;
  description: string;
  thumbnailBadge: string;
  apply: (prevState: RenderState) => RenderState;
}

export const VISUAL_STYLES: VisualStyleDefinition[] = [
  {
    id: 'modular_pixel',
    name: 'Modular Pixel Grid',
    category: 'Geometric / Structural',
    referenceDescription: 'Inspired by modular architectural composition with colorful square & rectangular blocks.',
    description: 'Square & rectangular particles arranged on a structured grid with variable block scales and selective color accents.',
    thumbnailBadge: '■■',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'modular_pixel',
      grid: {
        ...prev.grid,
        gridType: 'square',
        dotShape: 'square',
        density: 14,
        minRadius: 2,
        maxRadius: 7,
        sdfThreshold: 0.5,
        sdfSoftness: 0.65
      },
      wave: {
        ...prev.wave,
        waveType: 'square',
        waveFrequency: 1.1,
        frequencyThickness: 1.3
      },
      style: {
        ...prev.style,
        visualStyle: 'modular_pixel',
        enableColorGradient: true,
        uniformColorBrightness: false
      }
    })
  },
  {
    id: 'ascii_flow',
    name: 'ASCII Data Flow',
    category: 'Digital / Typographic',
    referenceDescription: 'Inspired by floating numerical and character fields curving across space.',
    description: 'Particles rendered as ASCII characters and numbers following curved trajectories with dynamic wave displacement.',
    thumbnailBadge: '01+',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'ascii_flow',
      grid: {
        ...prev.grid,
        dotShape: 'ascii',
        asciiCharset: '0 1 2 3 4 5 6 7 8 9 + - * / . : % $',
        asciiFontSize: 16,
        asciiVariableSize: true,
        asciiDistribution: 'flow',
        density: 16,
        minRadius: 3,
        maxRadius: 10,
        sdfThreshold: 0.48,
        sdfSoftness: 0.8
      },
      wave: {
        ...prev.wave,
        mode: 'flow',
        pattern: 'spiral',
        waveSpeed: 0.85,
        vectorDistortion: 1.2
      },
      style: {
        ...prev.style,
        visualStyle: 'ascii_flow',
        enableColorGradient: true
      }
    })
  },
  {
    id: 'editorial_collage',
    name: 'Editorial Collage',
    category: 'Publication / Dynamic',
    referenceDescription: 'Inspired by high-energy sports and cultural editorial layouts with large typography and masked imagery.',
    description: 'Combines massive crisp typography with generative particle compositions and asymmetric layout balance.',
    thumbnailBadge: 'EDIT',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'editorial_collage',
      compositionMode: 'molecule_wave_only',
      grid: {
        ...prev.grid,
        density: 11,
        dotShape: 'concentric_arc',
        minRadius: 1.5,
        maxRadius: 6.5
      },
      wave: {
        ...prev.wave,
        pattern: 'linear',
        linearAngle: 35,
        waveSpeed: 0.7,
        wavefrontEmphasis: 0.9,
        wavefrontCurveWidth: 1.5
      },
      style: {
        ...prev.style,
        visualStyle: 'editorial_collage',
        editorialHeadlineOffsetX: -100,
        editorialHeadlineOffsetY: 120,
        editorialHeadlineScale: 1.3,
        editorialLayerOrder: 'behind_wave'
      }
    })
  },
  {
    id: 'dot_matrix',
    name: 'Dot Matrix',
    category: 'Precision / Halftone',
    referenceDescription: 'Inspired by bright, circular dot fields forming graphic silhouettes and negative space.',
    description: 'Crisp, perfectly aligned circular particles forming graphic shapes with variable dot diameter and wave distortion.',
    thumbnailBadge: '●●',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'dot_matrix',
      grid: {
        ...prev.grid,
        gridType: 'hexagonal',
        dotShape: 'circle',
        density: 10,
        minRadius: 1.0,
        maxRadius: 5.8,
        sdfThreshold: 0.5,
        sdfSoftness: 0.7
      },
      wave: {
        ...prev.wave,
        pattern: 'circular',
        waveType: 'sine',
        waveSpeed: 0.75,
        waveFrequency: 1.3
      },
      style: {
        ...prev.style,
        visualStyle: 'dot_matrix',
        uniformColorBrightness: false
      }
    })
  },
  {
    id: 'data_constellation',
    name: 'Data Constellation',
    category: 'Analytical / Minimal',
    referenceDescription: 'Inspired by minimal scattered dots with connecting lines and technical cluster labels.',
    description: 'Sparse molecule distribution with dynamic spatial connection lines and technical telemetry labels.',
    thumbnailBadge: '☊',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'data_constellation',
      grid: {
        ...prev.grid,
        gridType: 'square',
        dotShape: 'circle',
        density: 22,
        minRadius: 1.5,
        maxRadius: 5.5,
        hideBackgroundDots: false
      },
      wave: {
        ...prev.wave,
        pattern: 'circular',
        waveSpeed: 0.5,
        waveAmplitude: 0.9
      },
      style: {
        ...prev.style,
        visualStyle: 'data_constellation',
        constellationMaxDistance: 55,
        constellationShowLabels: true,
        constellationClusterStrength: 0.8,
        showConnections: true
      }
    })
  },
  {
    id: 'binary_typography',
    name: 'Binary Typography',
    category: 'Encryption / Matrix',
    referenceDescription: 'Inspired by oversized letterforms and masks rendered through dense binary character arrays.',
    description: 'Oversized typographic forms constructed from dense binary characters (`0` and `1`) modulated by wavefront pulses.',
    thumbnailBadge: '0101',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'binary_typography',
      grid: {
        ...prev.grid,
        dotShape: 'ascii',
        asciiCharset: '0 1',
        asciiFontSize: 14,
        asciiVariableSize: true,
        density: 12,
        minRadius: 2,
        maxRadius: 8,
        sdfThreshold: 0.52
      },
      wave: {
        ...prev.wave,
        waveType: 'pulse',
        waveSpeed: 0.7,
        waveFrequency: 1.4
      },
      style: {
        ...prev.style,
        visualStyle: 'binary_typography',
        enableColorGradient: true
      }
    })
  },
  {
    id: 'extruded_particles',
    name: 'Extruded Particles',
    category: 'Dimensional 2.5D',
    referenceDescription: 'Inspired by dimensional circular and rectangular pegs with directional lighting and shaded depth.',
    description: 'Particles with simulated 2.5D depth, directional shadows, and wave displacement affecting perceived extrusion height.',
    thumbnailBadge: '3D',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'extruded_particles',
      grid: {
        ...prev.grid,
        dotShape: 'extruded_block',
        density: 12,
        minRadius: 1.8,
        maxRadius: 6.5
      },
      wave: {
        ...prev.wave,
        waveType: 'gaussian',
        waveAmplitude: 1.0,
        waveSpeed: 0.7
      },
      style: {
        ...prev.style,
        visualStyle: 'extruded_particles',
        extrusionDepth: 18,
        extrusionAngle: 135,
        extrusionLightIntensity: 0.75
      }
    })
  },
  {
    id: 'halftone_collage',
    name: 'Halftone & Pattern Collage',
    category: 'Experimental Editorial',
    referenceDescription: 'Inspired by Korean experimental poster design with layered halftone grids and graphic textures.',
    description: 'Layered procedural halftone patterns, contrasting particle scales, and multi-tier graphic textures.',
    thumbnailBadge: 'H/T',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'halftone_collage',
      grid: {
        ...prev.grid,
        gridType: 'hexagonal',
        dotShape: 'concentric_arc',
        density: 9,
        minRadius: 1.0,
        maxRadius: 6.0,
        sdfThreshold: 0.48,
        sdfSoftness: 0.85
      },
      wave: {
        ...prev.wave,
        pattern: 'interference',
        waveType: 'sine',
        waveSpeed: 0.65,
        waveFrequency: 1.5,
        wavefrontEmphasis: 0.85
      },
      style: {
        ...prev.style,
        visualStyle: 'halftone_collage',
        enableColorGradient: true,
        showRadarGrid: true,
        radarGridOpacity: 0.2
      }
    })
  },
  {
    id: 'kinetic_vortex',
    name: 'Kinetic Tile Vortex',
    category: 'Optical Kinetic',
    referenceDescription: 'Inspired by black-and-white 3D tile vortex swirling in perspective with rotational displacement.',
    description: 'Rectangular tiles arranged in radial and spiral formations with directional rotation, depth distortion, and vortex motion.',
    thumbnailBadge: '🌀',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'kinetic_vortex',
      grid: {
        ...prev.grid,
        gridType: 'radial',
        dotShape: 'tile',
        density: 10,
        minRadius: 1.5,
        maxRadius: 6.5
      },
      wave: {
        ...prev.wave,
        pattern: 'spiral',
        waveType: 'pulse',
        waveSpeed: 0.9,
        vectorDistortion: 1.5
      },
      style: {
        ...prev.style,
        visualStyle: 'kinetic_vortex',
        vortexTwist: 1.8,
        extrusionDepth: 12
      }
    })
  },
  {
    id: 'pixel_art',
    name: 'Pixel Art',
    category: 'Retro / Digital Silhouettes',
    referenceDescription: 'Inspired by low-resolution blue & green pixel grid rendering with crisp hard-edged silhouettes.',
    description: 'Low-resolution pixel grid with hard edges, quantized coordinates, and pixelated wave distortion.',
    thumbnailBadge: '👾',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'pixel_art',
      grid: {
        ...prev.grid,
        gridType: 'square',
        dotShape: 'square',
        density: 18,
        minRadius: 8,
        maxRadius: 9,
        sdfThreshold: 0.5,
        sdfSoftness: 0.2
      },
      wave: {
        ...prev.wave,
        waveType: 'square',
        waveSpeed: 0.75,
        waveFrequency: 1.0
      },
      style: {
        ...prev.style,
        visualStyle: 'pixel_art',
        pixelArtScale: 18,
        uniformColorBrightness: false
      }
    })
  },
  {
    id: 'stitch_craft',
    name: 'Cultural Stitch & Weave',
    category: 'Textile / Craft Material',
    referenceDescription: 'Inspired by hand-crafted sashiko embroidery, woven threads, and cultural textile patterns.',
    description: 'Individual embroidered stitch marks and interwoven thread units animating with dynamic textile tension.',
    thumbnailBadge: '🪡',
    apply: (prev) => ({
      ...prev,
      activeVisualStyle: 'stitch_craft',
      grid: {
        ...prev.grid,
        gridType: 'square',
        dotShape: 'stitch',
        density: 12,
        minRadius: 1.5,
        maxRadius: 6.5,
        stitchLength: 16,
        stitchThickness: 3.2,
        stitchAngleMode: 'diagonal_sashiko',
        stitchAngle: 32,
        stitchSoftness: 0.22,
        stitchTensionAnim: true,
        culturalMaterial: 'stitch'
      },
      wave: {
        ...prev.wave,
        mode: 'flow',
        waveSpeed: 0.7,
        waveFrequency: 1.3,
        vectorDistortion: 1.2
      },
      style: {
        ...prev.style,
        visualStyle: 'stitch_craft',
        enableColorGradient: true,
        uniformColorBrightness: false
      }
    })
  }
];
