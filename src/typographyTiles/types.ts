/**
 * Interactive Generative Typography ("Tile Break") — a self-contained "Interactive" engine, entirely
 * separate from the Kinetic particle/wave engine and from Flip Disc (see src/App.tsx's EngineMode).
 * Text is rendered once to an offscreen image and sampled as a grid of round dots (halftone-style,
 * like the site's existing dot-matrix materials) while the glyph itself stays crisp underneath (no
 * per-pixel drawing — dots are drawImage crops of the pre-rendered text, clipped to a circle).
 *
 * The click ripple is its OWN bespoke one-shot expanding ring — ported directly from the original
 * reference sketch's `ripples[]` system (mousePressed spawns {x,y,r:0,strength:1}; each ring expands
 * outward at rippleSpeed, fades linearly to 0 by rippleMaxRadius, and is discarded once faded).
 * Deliberately NOT the shared calculateWave/WaveConfig engine other materials (Global Wire etc.) use:
 * that field is an unbounded, continuously-repeating sine train with no literal "thickness," which
 * read as a completely different animation. This ripple is a bounded, single travelling ring per
 * click, with an explicit THICKNESS (ring width in px) control, exactly like the reference.
 *
 * Per earlier feedback, the ripple never displaces/distorts the letterforms — it only pulses each
 * dot's size and colour in place as the ring sweeps past (radius/colour instead of the reference's
 * position push). Only HOVER physically pushes dots (a small, cursor-local, bounded effect).
 */
export interface TypographyTilesConfig {
  text: string;
  fontFamily: string;
  fontWeight: number; // 400 | 700 | 900
  fontSize: number; // px, in canvas backing-store pixels
  tileSize: number; // px — grid pitch (spacing between dot centers); smaller = finer break-up

  palette: string[]; // 1-8 hex colors, cycled by the ripple's colour band and hover reveal

  bgColor: string;

  // Resting dot radius as a fraction of half the grid pitch (0.1..1). <1 leaves visible gaps between
  // dots for a halftone/dot-matrix look, matching the site's existing dot-grid materials.
  baseDotScale: number;

  // Hover push physics (continuous, follows the pointer — independent of the click ripple below)
  hoverEnabled: boolean;
  hoverRadius: number;
  hoverPushForce: number;

  // Shared spring/friction/colour-ease for both hover push and the ripple's size/colour pulse
  spring: number;
  friction: number;
  colorEase: number;

  // Click ripple — see doc comment above.
  rippleSpeed: number; // px/sec the ring expands outward
  rippleThickness: number; // px — width of the travelling ring band (the "thickness" control)
  ripplePulseStrength: number; // extra radius (fraction of half the grid pitch) a dot gains at full hit
  rippleMaxRadius: number; // px — a ring fully fades out once it has travelled this far
  rippleColorBandSize: number; // px — radial distance (from the ring's OWN origin) per palette colour band
}

export const DEFAULT_TYPOGRAPHY_TILES_CONFIG: TypographyTilesConfig = {
  text: 'GAME',
  fontFamily: 'Arial',
  fontWeight: 900,
  fontSize: 220,
  tileSize: 8,
  palette: ['#0511F2', '#5E90F2', '#04F7BF', '#F2B705'],
  bgColor: '#000000',
  baseDotScale: 0.78,
  hoverEnabled: true,
  hoverRadius: 130,
  hoverPushForce: 2.8,
  spring: 0.075,
  friction: 0.78,
  colorEase: 0.12,
  rippleSpeed: 900,
  rippleThickness: 70,
  ripplePulseStrength: 0.55,
  rippleMaxRadius: 1600,
  rippleColorBandSize: 90
};

export interface TypographyTilesPreset {
  id: string;
  name: string;
  category: 'Interactive';
  description: string;
  // Redesign V1-B — see Preset's matching fields in ../types.ts for the full doc comment.
  pinned?: boolean;
  quickControls?: string[];
  legacyName?: string;
  config: TypographyTilesConfig;
}
