import React, { useEffect, useRef, useState } from 'react';
import { FlipDiscConfig } from './types';
import { FlipDiscGLRenderer } from './flipDiscGL';
import { SDFData } from '../utils/sdf';
import { resolveFlipDiscMask, flipDiscMaskKey } from './flipDiscMask';

export interface FlipDiscImageActions {
  loadFront: (file: File) => void;
  loadBack: (file: File) => void;
  clearFront: () => void;
  clearBack: () => void;
}

interface FlipDiscCanvasProps {
  config: FlipDiscConfig;
  isPlaying: boolean;
  transparentBg?: boolean;
  onFpsUpdate?: (fps: number, tileCount: number) => void;
  exportRequestRef?: React.MutableRefObject<(() => void) | null>;
  imageActionsRef?: React.MutableRefObject<FlipDiscImageActions | null>;
  onImageStatus?: (which: 'front' | 'back', label: string) => void;
}

/**
 * Standalone WebGL canvas + render loop for the Prismatic Flip Circle scene (flipDiscGL.ts).
 * Deliberately independent of KineticCanvas.tsx — separate refs, separate resize handling, separate
 * rAF loop — since this is a self-contained system (see types.ts header comment) rather than a mode
 * bolted onto the particle engine's Canvas2D render pipeline.
 */
export const FlipDiscCanvas: React.FC<FlipDiscCanvasProps> = ({
  config,
  isPlaying,
  transparentBg = false,
  onFpsUpdate,
  exportRequestRef,
  imageActionsRef,
  onImageStatus
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FlipDiscGLRenderer | null>(null);
  const configRef = useRef<FlipDiscConfig>(config);
  const maskRef = useRef<SDFData | null>(null);
  const maskKeyRef = useRef<string>('none');
  const transparentBgRef = useRef<boolean>(transparentBg);
  const timeRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(performance.now());
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [glError, setGlError] = useState<string | null>(null);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    transparentBgRef.current = transparentBg;
  }, [transparentBg]);

  // Rebuild the Clip Mask (built-in shape or uploaded SVG logo) with light debouncing to keep slider
  // scrubbing fluid — mirrors KineticCanvas.tsx's SDF regeneration effect. Cheap for 'none'/'shape'
  // (synchronous), and cancellation-safe for the async SVG-image-decode path.
  useEffect(() => {
    let cancelMask: (() => void) | null = null;
    const timer = setTimeout(() => {
      cancelMask = resolveFlipDiscMask(config, (mask) => {
        maskRef.current = mask;
        maskKeyRef.current = flipDiscMaskKey(config);
      });
    }, 60);
    return () => {
      clearTimeout(timer);
      if (cancelMask) cancelMask();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.maskMode, config.maskShapeType, config.maskSvgDataUrl, config.maskSvgXml, config.maskScale]);

  // Resize handling
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

  // Create the WebGL renderer once, and the render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: FlipDiscGLRenderer;
    try {
      renderer = new FlipDiscGLRenderer(canvas);
      rendererRef.current = renderer;
    } catch (err) {
      setGlError(err instanceof Error ? err.message : 'Could not initialize WebGL.');
      return;
    }

    if (imageActionsRef) {
      imageActionsRef.current = {
        loadFront: (file) =>
          renderer.loadFaceImage(
            'front',
            file,
            (name) => onImageStatus?.('front', name),
            (msg) => onImageStatus?.('front', msg)
          ),
        loadBack: (file) =>
          renderer.loadFaceImage(
            'back',
            file,
            (name) => onImageStatus?.('back', name),
            (msg) => onImageStatus?.('back', msg)
          ),
        clearFront: () => {
          renderer.clearFaceImage('front');
          onImageStatus?.('front', 'No image');
        },
        clearBack: () => {
          renderer.clearFaceImage('back');
          onImageStatus?.('back', 'No image');
        }
      };
    }

    const render = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = now;

      if (isPlayingRef.current) {
        timeRef.current += dt;
      }

      renderer.render(
        configRef.current,
        timeRef.current,
        canvas.width,
        canvas.height,
        maskRef.current,
        maskKeyRef.current,
        transparentBgRef.current
      );

      frameCountRef.current++;
      if (now - fpsTimerRef.current >= 500) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - fpsTimerRef.current));
        frameCountRef.current = 0;
        fpsTimerRef.current = now;
        if (onFpsUpdate) {
          const count = Math.max(4, Math.round(configRef.current.density));
          onFpsUpdate(fps, count * count);
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      rendererRef.current = null;
      if (imageActionsRef) imageActionsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PNG export — renders one frame at a higher fixed resolution on a throwaway offscreen WebGL canvas
  useEffect(() => {
    if (!exportRequestRef) return;
    exportRequestRef.current = () => {
      const offscreen = document.createElement('canvas');
      const exportW = 1600;
      const exportH = Math.round(1600 * (canvasSize.height / canvasSize.width || 1));
      offscreen.width = exportW;
      offscreen.height = exportH;
      try {
        const exportRenderer = new FlipDiscGLRenderer(offscreen);
        exportRenderer.render(
          configRef.current,
          timeRef.current,
          exportW,
          exportH,
          maskRef.current,
          maskKeyRef.current,
          transparentBgRef.current
        );
        const dataUrl = offscreen.toDataURL('image/png');
        exportRenderer.dispose();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `playful-bloom-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Flip Disc PNG export failed:', err);
      }
    };
    return () => {
      if (exportRequestRef) exportRequestRef.current = null;
    };
  }, [exportRequestRef, canvasSize]);

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative overflow-hidden ${
        transparentBg
          ? 'bg-[#0a0a0a] bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px]'
          : 'bg-black'
      }`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {glError && (
        <div className="absolute inset-0 flex items-center justify-center text-center p-6">
          <p className="text-rose-300 text-sm font-mono max-w-md">
            WebGL is unavailable in this browser/context: {glError}
          </p>
        </div>
      )}
    </div>
  );
};
