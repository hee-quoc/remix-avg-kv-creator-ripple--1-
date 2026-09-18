import { FlipDiscPreset, DEFAULT_FLIP_DISC_CONFIG } from './types';

export const FLIP_DISC_PRESETS: FlipDiscPreset[] = [
  {
    id: 'playful_bloom',
    name: '07. Playful Bloom',
    category: 'Children',
    description:
      'Prismatic flip-circle field — teal and burnt-orange discs flipping in a real 3D iridescent shimmer, rippling outward from the center.',
    config: { ...DEFAULT_FLIP_DISC_CONFIG }
  },
  {
    id: 'pastel_bloom',
    name: '07a. Pastel Bloom',
    category: 'Children',
    description: 'Softer pink / blue clover variant — matte material, gentler saturation, quieter motion.',
    config: {
      ...DEFAULT_FLIP_DISC_CONFIG,
      shape: 'clover',
      material: 'matte',
      frontColor: '#F7C6E0',
      backColor: '#C9E4FF',
      sideColor: '#4A3F63',
      backgroundColor: '#0A0A0D',
      rainbowIntensity: 0,
      saturation: 1.0,
      motionSoftness: 0.4,
      flipSpeed: 0.7
    }
  },
  {
    id: 'toy_blocks',
    name: '07b. Toy Blocks',
    category: 'Children',
    description: 'Square tiles in brighter primary-adjacent toy colors — a glossy building-block playground look.',
    config: {
      ...DEFAULT_FLIP_DISC_CONFIG,
      shape: 'square',
      material: 'glossy',
      frontColor: '#FF6F61',
      backColor: '#FFD23F',
      sideColor: '#1F2937',
      rainbowIntensity: 0,
      saturation: 1.3,
      discRadius: 0.4,
      density: 30
    }
  },
  {
    id: 'candy_pop',
    name: '07c. Candy Pop',
    category: 'Children',
    description: 'Iridescent material with bright candy tones and a livelier ripple — a sugar-rush variant.',
    config: {
      ...DEFAULT_FLIP_DISC_CONFIG,
      frontColor: '#FF4D9D',
      backColor: '#5AD1E6',
      sideColor: '#241B33',
      saturation: 1.8,
      rainbowIntensity: 1.0,
      flipSpeed: 1.3,
      rippleDelay: 0.55
    }
  }
];

export function applyFlipDiscPreset(id: string) {
  const preset = FLIP_DISC_PRESETS.find((p) => p.id === id) || FLIP_DISC_PRESETS[0];
  return { presetId: preset.id, config: { ...preset.config } };
}
