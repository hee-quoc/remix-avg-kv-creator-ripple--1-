// ============================================================================
// FLIP DISC 3D — "Prismatic Flip Circle" — a standalone generative system (Children / Playful
// Creativity theme). Rendered with real WebGL (see flipDiscGL.ts), ported closely from the user's
// reference p5.js/WebGL sketch: a grid of discs, each a real 3D mesh (front face + back face + side
// walls) that flips via a rotation matrix, shaded by a small material library (matte/glossy/
// metallic/iridescent) in the fragment shader.
//
// This is deliberately NOT integrated into the existing Halftone Kinetic particle/wave engine
// (RenderState / WaveConfig / computeParticles) — that engine has no notion of front/back/side
// faces, disc materials, or a flip transform, and grafting one on would mean inventing behavior
// under the guise of "reusing existing code" that doesn't actually exist. It's built as its own
// self-contained renderer living entirely under src/flipDisc/, wired into App.tsx as an alternate
// "engine mode" alongside (not replacing) the Kinetic engine.
// ============================================================================

export type FlipDiscShape = 'clover' | 'circle' | 'square';
export type FlipDiscMaterial = 'matte' | 'glossy' | 'iridescent' | 'metallic';

export interface FlipDiscConfig {
  // Shape
  shape: FlipDiscShape;
  density: number; // grid resolution (discs across the field), reference default 40
  discRadius: number; // 0.1 - 0.49, disc radius as a fraction of grid spacing
  thickness: number; // 0.01 - 0.32, disc depth (visible on the side walls / edge-on view)

  // Colors
  frontColor: string;
  backColor: string;
  sideColor: string;
  backgroundColor: string;

  // Material
  material: FlipDiscMaterial;
  glossIntensity: number; // 0..1 (currently only meaningful for the legacy 2D fallback preview, unused by the WebGL shader which derives gloss from the material itself)
  rainbowIntensity: number; // 0..1, iridescent film strength — only visible when material = iridescent
  saturation: number; // 0..2.5 multiplier applied to the final rendered color

  // Grain
  grain: number; // 0..0.3
  grainSize: number; // 1..4 px, size of each grain cell
  animateGrain: boolean;

  // Motion — defaults exactly reproduce the reference sketch's fixed constants
  flipSpeed: number; // multiplier on the flip cycle; period = 5s / flipSpeed, default 1.0 = 5s period
  rippleDelay: number; // how strongly distance-from-center delays a disc's flip phase, default 0.42
  motionSoftness: number; // the flip's sinusoidal easing strength, default 0.52 (reference's fixed value)
  waveTiming: number; // extra multiplier on top of rippleDelay's spatial falloff, default 1.0 = no change
}

export const DEFAULT_FLIP_DISC_CONFIG: FlipDiscConfig = {
  shape: 'circle',
  density: 40,
  discRadius: 0.43,
  thickness: 0.11,
  frontColor: '#0B9EB8',
  backColor: '#D43D11',
  sideColor: '#34314D',
  backgroundColor: '#000000',
  material: 'iridescent',
  glossIntensity: 0.35,
  rainbowIntensity: 1.0,
  saturation: 1.65,
  grain: 0.1,
  grainSize: 1.0,
  animateGrain: true,
  flipSpeed: 1.0,
  rippleDelay: 0.42,
  motionSoftness: 0.52,
  waveTiming: 1.0
};

export interface FlipDiscPreset {
  id: string;
  name: string;
  category: 'Children';
  description: string;
  config: FlipDiscConfig;
}
