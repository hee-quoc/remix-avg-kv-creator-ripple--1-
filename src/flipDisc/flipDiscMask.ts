import { FontConfig } from '../types';
import { SDFData, generateTextSDF, generateImageSDF } from '../utils/sdf';
import { FlipDiscConfig } from './types';

// Resolution of the offscreen mask canvas. The disc field is authored in its own square local
// coordinate space (see flipDiscGL.ts's `half`/`fieldRadius`), independent of the actual on-screen
// canvas aspect ratio, so a modest square mask resolution is both correct and cheap — no need for the
// 1024x1024 precision the main Kinetic engine uses for crisp letterform edges.
const MASK_RESOLUTION = 256;

/**
 * Resolves the Clip Mask silhouette for the Flip Disc field as an SDFData, reusing the EXACT same
 * shape library (generateTextSDF's 'shape' branch → the same 8 ObjectShapeType vector shapes the
 * Kinetic engine's Object Mask panel offers) and SVG-logo rasterization (generateImageSDF, which
 * already preserves the uploaded SVG's true aspect ratio via its viewBox) as the rest of the app —
 * no bespoke rasterizer for Children/FlipDisc. Returns null for maskMode 'none' (every disc visible,
 * the pre-existing default behavior).
 */
export function resolveFlipDiscMask(
  cfg: FlipDiscConfig,
  onResult: (mask: SDFData | null) => void
): () => void {
  let active = true;

  if (cfg.maskMode === 'shape') {
    const fakeFontConfig: FontConfig = {
      text: '',
      fontFamily: '',
      fontSize: 0,
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1,
      textAlign: 'center',
      invertText: false,
      maskMode: 'shape',
      shapeType: cfg.maskShapeType,
      maskScale: cfg.maskScale
    };
    try {
      const sdf = generateTextSDF(fakeFontConfig, MASK_RESOLUTION, MASK_RESOLUTION);
      onResult(sdf);
    } catch (e) {
      console.error('Failed to build Flip Disc shape mask:', e);
      onResult(null);
    }
    return () => {
      active = false;
    };
  }

  if (cfg.maskMode === 'svg' && cfg.maskSvgDataUrl) {
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      try {
        const sdf = generateImageSDF(img, MASK_RESOLUTION, MASK_RESOLUTION, cfg.maskScale, cfg.maskScale, cfg.maskSvgXml);
        onResult(sdf);
      } catch (e) {
        console.error('Failed to build Flip Disc SVG mask:', e);
        onResult(null);
      }
    };
    img.onerror = () => {
      if (active) onResult(null);
    };
    img.src = cfg.maskSvgDataUrl;
    return () => {
      active = false;
    };
  }

  onResult(null);
  return () => {
    active = false;
  };
}

/**
 * A stable string key describing the mask's current identity — changes exactly when the mask should
 * be rebuilt (mode/shape/upload/scale), stays the same across every other config change (color,
 * material, motion, ...) so the WebGL mesh cache in flipDiscGL.ts isn't rebuilt needlessly per frame.
 */
export function flipDiscMaskKey(cfg: FlipDiscConfig): string {
  if (cfg.maskMode === 'shape') return `shape:${cfg.maskShapeType}:${cfg.maskScale}`;
  if (cfg.maskMode === 'svg') return `svg:${cfg.maskSvgName || ''}:${(cfg.maskSvgXml || '').length}:${cfg.maskScale}`;
  return 'none';
}
