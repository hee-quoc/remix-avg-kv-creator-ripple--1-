import { TypographyTilesPreset, DEFAULT_TYPOGRAPHY_TILES_CONFIG } from './types';

export const TYPOGRAPHY_TILES_PRESETS: TypographyTilesPreset[] = [
  {
    id: 'tile_game',
    name: '12. Tile Break — Game',
    category: 'Interactive',
    description:
      'Bold display type as a halftone dot grid — hover physically pushes dots apart, click sends a single expanding ring (adjustable speed/thickness) that pulses size and colour without ever distorting the letters.',
    config: { ...DEFAULT_TYPOGRAPHY_TILES_CONFIG }
  },
  {
    id: 'tile_neon',
    name: '12a. Tile Break — Neon',
    category: 'Interactive',
    description: 'Hot pink / cyan neon palette on a near-black field, faster ripple.',
    config: {
      ...DEFAULT_TYPOGRAPHY_TILES_CONFIG,
      text: 'NEON',
      palette: ['#FF2E9A', '#00F0FF', '#FFE94A', '#7C4DFF'],
      bgColor: '#050208',
      rippleSpeed: 1200,
      ripplePulseStrength: 0.7
    }
  },
  {
    id: 'tile_paper',
    name: '12b. Tile Break — Paper Cut',
    category: 'Interactive',
    description: 'Muted editorial palette, larger dots, gentler spring — a calmer paper-cut feel.',
    config: {
      ...DEFAULT_TYPOGRAPHY_TILES_CONFIG,
      text: 'PAPER',
      fontFamily: 'Georgia',
      fontWeight: 700,
      tileSize: 12,
      palette: ['#D9C7A3', '#8A8F6B', '#C1543C', '#3B3A36'],
      bgColor: '#F4EFE6',
      spring: 0.06,
      friction: 0.82,
      rippleSpeed: 650,
      rippleThickness: 90
    }
  }
];

export function applyTypographyTilesPreset(id: string) {
  const preset = TYPOGRAPHY_TILES_PRESETS.find((p) => p.id === id) || TYPOGRAPHY_TILES_PRESETS[0];
  return { presetId: preset.id, config: { ...preset.config } };
}
