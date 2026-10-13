import React, { useEffect, useRef, useState } from 'react';
import { TypographyTilesConfig } from './types';

interface Tile {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  c: number; // 0..1 colour blend (white -> palette colour)
  ci: number; // active colour index
  baseCi: number; // hover colour index, fixed by horizontal position like the reference sketch
  active: boolean;
}

interface Ripple {
  x: number;
  y: number;
  r: number; // current radius, px
  strength: number; // 1 at spawn, linearly fades to 0 at rippleMaxRadius
}

interface TypographyTilesCanvasProps {
  config: TypographyTilesConfig;
  onUpdateConfig: (patch: Partial<TypographyTilesConfig>) => void;
  onFpsUpdate?: (fps: number, tileCount: number) => void;
  exportRequestRef?: React.MutableRefObject<(() => void) | null>;
}

/**
 * Standalone Canvas2D render + physics loop for the Interactive Generative Typography engine.
 * Deliberately independent of KineticCanvas.tsx / particleRenderer.ts's Particle[] pipeline (this is
 * a wholly different rendering technique — drawImage blits of a pre-rendered text image, not
 * per-particle draws) and of the shared calculateWave engine (see types.ts's doc comment for why the
 * ripple here is its own bespoke one-shot system instead).
 */
export const TypographyTilesCanvas: React.FC<TypographyTilesCanvasProps> = ({
  config,
  onUpdateConfig,
  onFpsUpdate,
  exportRequestRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef<TypographyTilesConfig>(config);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const whiteLayerRef = useRef<HTMLCanvasElement | null>(null);
  const colorLayersRef = useRef<HTMLCanvasElement[]>([]);
  const dottedWhiteRef = useRef<HTMLCanvasElement | null>(null);
  const tilesRef = useRef<Tile[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const mouseRef = useRef<{ x: number; y: number; inside: boolean }>({ x: -9999, y: -9999, inside: false });
  const lastFrameTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const fpsTimerRef = useRef(performance.now());

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Resize handling — mirrors FlipDiscCanvas.tsx
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setCanvasSize({ width: Math.max(200, rect.width), height: Math.max(200, rect.height) });
    };
    updateSize();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateSize);
      ro.observe(containerRef.current);
    } else {
      window.addEventListener('resize', updateSize);
    }
    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Canvas backing store sizing (devicePixelRatio aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvasSize.width * dpr);
    canvas.height = Math.round(canvasSize.height * dpr);
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;
  }, [canvasSize]);

  // Build the text layers (one white + one per palette colour) and slice them into a dot grid, plus
  // a pre-baked "resting" dotted texture. Cached: only rebuilt when text/font/dot-geometry/canvas-size
  // actually change, matching the codebase's "build geometry once, recompute per-frame state" rule.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const W = canvas.width;
      const H = canvas.height;
      const cfg = configRef.current;

      const makeLayer = (color: string) => {
        const g = document.createElement('canvas');
        g.width = W;
        g.height = H;
        const gctx = g.getContext('2d')!;
        gctx.clearRect(0, 0, W, H);
        gctx.fillStyle = color;
        gctx.textAlign = 'center';
        gctx.textBaseline = 'middle';
        gctx.font = `${cfg.fontWeight} ${cfg.fontSize}px "${cfg.fontFamily}"`;
        const lines = cfg.text.split('\n');
        const lineHeight = cfg.fontSize * 1.05;
        const startY = H / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, i) => gctx.fillText(line, W / 2, startY + i * lineHeight));
        return g;
      };

      const white = makeLayer('#FFFFFF');
      const colors = (cfg.palette.length > 0 ? cfg.palette : ['#FFFFFF']).map((c) => makeLayer(c));

      const wctx = white.getContext('2d')!;
      const { data } = wctx.getImageData(0, 0, W, H);
      const tileSize = Math.max(2, cfg.tileSize);
      const tiles: Tile[] = [];
      const paletteLen = Math.max(1, cfg.palette.length);

      const hasInk = (tx: number, ty: number) => {
        const maxX = Math.min(tx + tileSize, W);
        const maxY = Math.min(ty + tileSize, H);
        const step = Math.max(1, Math.floor(tileSize / 3));
        for (let y = ty; y < maxY; y += step) {
          for (let x = tx; x < maxX; x += step) {
            if (data[(x + y * W) * 4 + 3] > 10) return true;
          }
        }
        return false;
      };

      const half = tileSize / 2;
      const baseRadius = Math.max(0.5, half * Math.max(0.1, Math.min(1, cfg.baseDotScale)));

      // Base "resting" texture: every dot pre-clipped to a circle at its resting radius, baked once
      // so the idle/no-interaction frame is a single cheap full-canvas blit instead of a per-dot draw
      // every frame.
      const dotted = document.createElement('canvas');
      dotted.width = W;
      dotted.height = H;
      const dctx = dotted.getContext('2d')!;

      for (let ty = 0; ty < H; ty += tileSize) {
        for (let tx = 0; tx < W; tx += tileSize) {
          if (!hasInk(tx, ty)) continue;
          const ci = Math.min(paletteLen - 1, Math.floor((tx / W) * paletteLen));
          tiles.push({ hx: tx, hy: ty, x: tx, y: ty, vx: 0, vy: 0, c: 0, ci, baseCi: ci, active: false });

          const cx = tx + half;
          const cy = ty + half;
          dctx.save();
          dctx.beginPath();
          dctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
          dctx.clip();
          dctx.drawImage(white, tx, ty, tileSize, tileSize, tx, ty, tileSize, tileSize);
          dctx.restore();
        }
      }

      if (cancelled) return;
      whiteLayerRef.current = white;
      colorLayersRef.current = colors;
      dottedWhiteRef.current = dotted;
      tilesRef.current = tiles;
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canvasSize.width,
    canvasSize.height,
    config.text,
    config.fontFamily,
    config.fontWeight,
    config.fontSize,
    config.tileSize,
    config.baseDotScale,
    JSON.stringify(config.palette)
  ]);

  // Pointer interaction: continuous hover push, and click spawns a new expanding ripple ring at the
  // click point (a self-contained {x,y,r,strength} entry — see types.ts's doc comment). Rapid clicks
  // can have several rings in flight at once, same as the reference sketch.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const toBackingCoords = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / rect.width) * canvas.width,
        y: ((clientY - rect.top) / rect.height) * canvas.height
      };
    };

    const handleMove = (e: PointerEvent) => {
      const { x, y } = toBackingCoords(e.clientX, e.clientY);
      mouseRef.current = { x, y, inside: true };
    };
    const handleLeave = () => {
      mouseRef.current.inside = false;
    };
    const handleDown = (e: PointerEvent) => {
      const { x, y } = toBackingCoords(e.clientX, e.clientY);
      mouseRef.current = { x, y, inside: true };
      ripplesRef.current.push({ x, y, r: 0, strength: 1 });
    };

    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerleave', handleLeave);
    canvas.addEventListener('pointerdown', handleDown);
    return () => {
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerleave', handleLeave);
      canvas.removeEventListener('pointerdown', handleDown);
    };
  }, []);

  // Main render/physics loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      const cfg = configRef.current;
      const W = canvas.width;
      const H = canvas.height;
      const white = whiteLayerRef.current;
      const colors = colorLayersRef.current;
      const dottedWhite = dottedWhiteRef.current;
      const tiles = tilesRef.current;
      const ripples = ripplesRef.current;

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = cfg.bgColor;
      ctx.fillRect(0, 0, W, H);

      if (!white || !dottedWhite || tiles.length === 0) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
      // Resting dots are already baked into dottedWhite, so the idle frame is one cheap full-canvas
      // blit — only dots currently pushed by hover or pulsing from an active ripple need an
      // individual draw call below.
      ctx.drawImage(dottedWhite, 0, 0);

      // Advance every in-flight ripple ring; drop it once it's fully faded.
      for (let k = ripples.length - 1; k >= 0; k--) {
        const rp = ripples[k];
        rp.r += cfg.rippleSpeed * dt;
        rp.strength = 1 - rp.r / Math.max(1, cfg.rippleMaxRadius);
        if (rp.strength <= 0) ripples.splice(k, 1);
      }

      const s = Math.max(2, cfg.tileSize);
      const half = s / 2;
      const baseRadius = Math.max(0.5, half * Math.max(0.1, Math.min(1, cfg.baseDotScale)));
      const mouse = mouseRef.current;
      const hoverR2 = cfg.hoverRadius * cfg.hoverRadius;
      const paletteLen = Math.max(1, cfg.palette.length);
      const thickness = Math.max(1, cfg.rippleThickness);

      let anyActive = false;

      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        let targetC = 0;

        // Hover is the ONLY thing that physically moves a dot — a small, cursor-local push.
        if (cfg.hoverEnabled && mouse.inside) {
          const dx = t.hx + half - mouse.x;
          const dy = t.hy + half - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < hoverR2) {
            const d = Math.sqrt(d2);
            let inf = 1 - d / cfg.hoverRadius;
            inf = inf * inf * (3 - 2 * inf);
            targetC = inf;
            t.ci = t.baseCi;
            if (d > 0.001) {
              const f = (inf * cfg.hoverPushForce) / d;
              t.vx += dx * f;
              t.vy += dy * f;
            }
          }
        }

        // Click ripple: each in-flight ring only affects dots within `thickness` px of its current
        // radius — a bounded, one-shot travelling band, ported straight from the reference sketch.
        // It NEVER moves a dot (per feedback): only size/colour pulse in place.
        if (ripples.length > 0) {
          const cx = t.hx + half;
          const cy = t.hy + half;
          for (let k = 0; k < ripples.length; k++) {
            const rp = ripples[k];
            const rx = cx - rp.x;
            const ry = cy - rp.y;
            const rd = Math.sqrt(rx * rx + ry * ry);
            const off = Math.abs(rd - rp.r);
            if (off >= thickness) continue;
            let w = 1 - off / thickness;
            w = w * w * (3 - 2 * w) * rp.strength;
            if (w > targetC) {
              targetC = w;
              t.ci = cfg.rippleColorBandSize > 0 ? Math.floor(rd / cfg.rippleColorBandSize) % paletteLen : t.baseCi;
            }
          }
        }

        // Spring always targets home — only hover ever pulls a dot away from it.
        t.vx = (t.vx + (t.hx - t.x) * cfg.spring) * cfg.friction;
        t.vy = (t.vy + (t.hy - t.y) * cfg.spring) * cfg.friction;
        t.x += t.vx;
        t.y += t.vy;
        t.c += (targetC - t.c) * cfg.colorEase;

        const resting =
          Math.abs(t.x - t.hx) < 0.08 &&
          Math.abs(t.y - t.hy) < 0.08 &&
          Math.abs(t.vx) < 0.08 &&
          Math.abs(t.vy) < 0.08 &&
          t.c < 0.004;

        if (resting) {
          t.x = t.hx;
          t.y = t.hy;
          t.vx = 0;
          t.vy = 0;
          t.c = 0;
          t.active = false;
        } else {
          t.active = true;
          anyActive = true;
        }
      }

      if (anyActive) {
        for (let i = 0; i < tiles.length; i++) {
          const t = tiles[i];
          if (!t.active) continue;

          const moved = t.x !== t.hx || t.y !== t.hy;
          const radius = baseRadius + cfg.ripplePulseStrength * half * t.c;
          const cx = t.x + half;
          const cy = t.y + half;
          // Dots have gaps between them by design (baseDotScale < 1), so there's no neighbor-seam
          // risk here — enlarging/recoloring a dot just draws a bigger circle over its own (smaller)
          // resting circle already in dottedWhite. Only a dot pushed away from home needs its home
          // circle cleared first.
          if (moved) {
            ctx.fillStyle = cfg.bgColor;
            ctx.beginPath();
            ctx.arc(t.hx + half, t.hy + half, baseRadius + 1, 0, Math.PI * 2);
            ctx.fill();
          }

          const cropSize = Math.max(s, radius * 2 + 2);
          const cropHalf = cropSize / 2;
          const sx = t.hx + half - cropHalf;
          const sy = t.hy + half - cropHalf;
          const dxp = cx - cropHalf;
          const dyp = cy - cropHalf;

          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.globalAlpha = 1;
          ctx.drawImage(white, sx, sy, cropSize, cropSize, dxp, dyp, cropSize, cropSize);
          const layer = colors[t.ci];
          if (t.c > 0.01 && layer) {
            ctx.globalAlpha = Math.min(1, t.c);
            ctx.drawImage(layer, sx, sy, cropSize, cropSize, dxp, dyp, cropSize, cropSize);
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      frameCountRef.current++;
      if (now - fpsTimerRef.current >= 500) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - fpsTimerRef.current));
        frameCountRef.current = 0;
        fpsTimerRef.current = now;
        onFpsUpdate?.(fps, tiles.length);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PNG export — simple full-resolution snapshot of the live backing-store canvas
  useEffect(() => {
    if (!exportRequestRef) return;
    exportRequestRef.current = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `typography-tiles-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    return () => {
      if (exportRequestRef) exportRequestRef.current = null;
    };
  }, [exportRequestRef]);

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none cursor-crosshair" />
    </div>
  );
};
