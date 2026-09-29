import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RenderState } from '../types';
import { generateTextSDF, generateImageSDF, SDFData } from '../utils/sdf';
import {
  computeParticles,
  renderParticleToCanvas,
  renderParticlesToCanvas,
  renderConstellationLinesToCanvas,
  renderOriginalTypographyToCanvas,
  renderLedBackdropToCanvas,
  resetTypographyBoxCache,
  snapshotParticles,
  Particle,
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  DEFAULT_RADIAL3D_CONFIG
} from '../utils/particleRenderer';
import { generateSVGFromParticles, downloadSVG } from '../utils/exportSvg';
import { recordCanvasVideo, downloadVideoBlob } from '../utils/exportVideo';
import { audioAnalyzerInstance } from '../utils/audioAnalyzer';
import { renderKVLayoutToCanvas } from '../utils/kvLayoutTemplates';

interface KineticCanvasProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  onFpsUpdate?: (fps: number, dotCount: number) => void;
}

/**
 * Builds the lightweight per-call audio signal for exports from the analyzer's cached last snapshot
 * (never triggers a fresh `.update()` — that only ever runs once per frame from the render loop;
 * see item 11). Returns undefined signal/config when Audio Reactivity is off, so export output
 * matches the live preview exactly.
 */
function buildExportAudioSignal(state: RenderState) {
  const enabled = !!state.audio?.enabled;
  const data = audioAnalyzerInstance.getLastAnalysis();
  if (!enabled || !data) {
    return { audioSignal: undefined, audioConfigForWave: undefined };
  }
  return {
    audioSignal: {
      rmsVolume: data.overallEnergy,
      bass: data.bass,
      mid: data.mid,
      high: data.high,
      isActive: data.isPlaying,
      beatPulse: data.beatPulse,
      smoothedBeatIntensity: data.smoothedBeatIntensity,
      secondWavePhase: data.secondWavePhase,
      volumeHistory: data.volumeHistory,
      vocal: data.vocal,
      fullMix: data.fullMix,
      vocalRippleInfluence: data.vocalRippleInfluence
    },
    audioConfigForWave: state.audio
  };
}

export const KineticCanvas: React.FC<KineticCanvasProps> = ({
  state,
  onUpdateState,
  onFpsUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Latest state ref to decouple animation loop from React component re-renders
  const stateRef = useRef<RenderState>(state);
  stateRef.current = state;

  // Local animation clock held in ref so React state is not updated 60x/sec
  const timeRef = useRef<number>(state.time);

  // Synchronize timeRef when preset changes or user scrubs time
  const prevManualTimeRef = useRef<number>(state.time);
  useEffect(() => {
    if (Math.abs(state.time - prevManualTimeRef.current) > 0.05) {
      timeRef.current = state.time;
    }
    prevManualTimeRef.current = state.time;
  }, [state.time]);

  // Track user interaction for idle auto-quality ramp-up
  const lastInteractionTimeRef = useRef<number>(performance.now());
  const adaptiveScaleRef = useRef<number>(1.0);
  const frameDurationsRef = useRef<number[]>([]);

  const [sdfData, setSdfData] = useState<SDFData | null>(null);
  const [draggingEmitter, setDraggingEmitter] = useState<'primary' | 'secondary' | null>(null);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [videoExportProgress, setVideoExportProgress] = useState(0);

  // Interactive 3D Rotation drag state (3D Radial Wave mode only — never interferes with the
  // existing emitter-handle drag, sliders, or text editing elsewhere in the app).
  const isDraggingRotationRef = useRef(false);
  const lastRotationPointerRef = useRef<{ x: number; y: number } | null>(null);
  const rotationUpdateScheduledRef = useRef(false);
  const pendingRotationRef = useRef<{ x: number; y: number; z: number } | null>(null);

  // Canonical particle state reference for the current frozen frame
  const currentParticlesRef = useRef<Particle[]>([]);
  const parsedCustomSvgDocRef = useRef<Document | null>(null);

  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(performance.now());

  // 1. Parse custom SVG XML when configured
  useEffect(() => {
    if (state.grid.dotShape === 'custom_svg' && state.grid.customSvgXml) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(state.grid.customSvgXml, 'image/svg+xml');
        if (doc.getElementsByTagName('parsererror').length === 0) {
          parsedCustomSvgDocRef.current = doc;
        } else {
          parsedCustomSvgDocRef.current = null;
        }
      } catch (e) {
        console.warn('Failed to parse custom SVG XML:', e);
        parsedCustomSvgDocRef.current = null;
      }
    } else {
      parsedCustomSvgDocRef.current = null;
    }
  }, [state.grid.dotShape, state.grid.customSvgXml]);

  // 2. Re-generate SDF with light debouncing to keep slider scrubbing fluid
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const sdfRes = 1024; // Standard high precision 1024x1024 distance map

      if (state.font.maskMode === 'svg_mask' && state.font.maskSvgDataUrl) {
        const img = new Image();
        img.onload = () => {
          if (!active) return;
          try {
            const sdf = generateImageSDF(
              img,
              sdfRes,
              sdfRes,
              state.font.maskScaleX ?? state.font.maskScale ?? 1.0,
              state.font.maskScaleY ?? state.font.maskScale ?? 1.0,
              state.font.maskSvgXml
            );
            setSdfData(sdf);
          } catch (e) {
            console.error('Failed to generate image SDF:', e);
          }
        };
        img.src = state.font.maskSvgDataUrl;
        return;
      }

      // Load custom Google Font or Web Font if needed
      if (state.font.fontFamily) {
        try {
          await document.fonts.load(
            `${state.font.fontWeight} ${state.font.fontSize}px "${state.font.fontFamily}"`
          );
        } catch (e) {
          console.warn('Font load warning:', e);
        }
      }

      if (!active) return;

      const sdf = generateTextSDF(state.font, sdfRes, sdfRes);
      setSdfData(sdf);
    }, 60);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    state.font.text,
    state.font.fontFamily,
    state.font.fontSize,
    state.font.fontWeight,
    state.font.letterSpacing,
    state.font.lineHeight,
    state.font.textAlign,
    state.font.maskMode,
    state.font.shapeType,
    state.font.maskSvgDataUrl,
    state.font.maskSvgXml,
    state.font.maskScale,
    state.font.maskScaleX,
    state.font.maskScaleY
  ]);

  // 2b. Typography Box Material's own word font — a SEPARATE font from the headline above, and one
  // ctx.measureText() (in buildTypographyBoxItems) silently mismeasures if it isn't loaded yet, since
  // canvas text measurement doesn't wait for @font-face the way DOM text does. That cached-too-early
  // layout would otherwise stay wrong forever (the grid never rebuilds on its own once cached), so
  // explicitly load the font and force a rebuild once it's actually ready.
  useEffect(() => {
    const box = state.grid.typographyBox;
    if (state.grid.dotShape !== 'typography_box' || !box?.fontFamily) return;
    let active = true;
    document.fonts
      .load(`bold ${box.fontSize}px "${box.fontFamily}"`)
      .catch((e) => console.warn('Typography Box font load warning:', e))
      .then(() => {
        if (active) resetTypographyBoxCache();
      });
    return () => {
      active = false;
    };
  }, [state.grid.dotShape, state.grid.typographyBox?.fontFamily, state.grid.typographyBox?.fontSize]);

  // 3. Handle Canvas Resize with strict 16:9 aspect ratio and adaptive quality
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !container || !wrapper) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const currentQuality = stateRef.current.previewQuality || 'auto';
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    if (currentQuality === 'performance') {
      dpr = 1.0;
    } else if (currentQuality === 'auto') {
      dpr = Math.max(1.0, dpr * adaptiveScaleRef.current);
    }

    const targetAspect = DESIGN_WIDTH / DESIGN_HEIGHT; // 1920 / 1080 = 1.777777...

    // Subtract outer margin padding inside workspace
    const padding = 32;
    const availW = Math.max(100, rect.width - padding);
    const availH = Math.max(100, rect.height - padding);
    const availAspect = availW / availH;

    let cssW: number;
    let cssH: number;

    if (availAspect > targetAspect) {
      cssH = availH;
      cssW = availH * targetAspect;
    } else {
      cssW = availW;
      cssH = availW / targetAspect;
    }

    const finalW = Math.floor(cssW);
    const finalH = Math.floor(cssH);

    wrapper.style.width = `${finalW}px`;
    wrapper.style.height = `${finalH}px`;

    const displayWidth = Math.floor(finalW * dpr);
    const displayHeight = Math.floor(finalH * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let ro: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateCanvasSize();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (ro) ro.disconnect();
    };
  }, [updateCanvasSize]);

  // 4. Stable, Single requestAnimationFrame Render Loop (Zero React state churn)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sdfData) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isSubscribed = true;

    function render(currentTime: number) {
      if (!isSubscribed || !canvas || !ctx || !sdfData) return;

      const currentState = stateRef.current;
      const delta = Math.min(0.1, (currentTime - lastTimeRef.current) / 1000);
      lastTimeRef.current = currentTime;

      // Update local time clock in ref without causing component re-render
      if (currentState.isPlaying) {
        timeRef.current += delta;
      }

      const frameStartTime = performance.now();

      // Sample real-time audio analysis exactly once per frame from this single render loop (the
      // only place `.update()` is called — item 11: avoid duplicate analysis loops). Runs whenever
      // a source is loaded so meters/transport stay live even if Audio Reactivity is toggled off;
      // the resulting signal is only fed into the wave engine when `audio.enabled` is true.
      const audioData = audioAnalyzerInstance.hasAudio() ? audioAnalyzerInstance.update(currentState.audio) : undefined;
      const audioReactivityOn = !!currentState.audio?.enabled;
      const audioSignal = audioReactivityOn && audioData
        ? {
            rmsVolume: audioData.overallEnergy,
            bass: audioData.bass,
            mid: audioData.mid,
            high: audioData.high,
            isActive: audioData.isPlaying,
            beatPulse: audioData.beatPulse,
            smoothedBeatIntensity: audioData.smoothedBeatIntensity,
            secondWavePhase: audioData.secondWavePhase,
            volumeHistory: audioData.volumeHistory,
            vocal: audioData.vocal,
            fullMix: audioData.fullMix,
            vocalRippleInfluence: audioData.vocalRippleInfluence
          }
        : undefined;
      const audioConfigForWave = audioReactivityOn ? currentState.audio : undefined;

      // Text Layer A (Effect Text / generative molecule layer) visibility — defaults to true so
      // every existing preset's default appearance is unchanged unless the user hides it explicitly.
      // Modular Signal Field and Typography Radial Ripple are exempt: their "particles" ARE the
      // primary visual content (strip blocks / character blocks), not molecule-formed typography, so
      // this flag doesn't gate them.
      const showEffectText =
        currentState.showEffectText !== false ||
        currentState.compositionMode === 'modular_signal_field' ||
        currentState.compositionMode === 'typography_ripple';

      // Compute canonical particles in 1920x1080 logical coordinate space
      const particles = showEffectText
        ? computeParticles(
            sdfData,
            currentState.grid,
            currentState.wave,
            currentState.font,
            currentState.style,
            DESIGN_WIDTH,
            DESIGN_HEIGHT,
            timeRef.current,
            parsedCustomSvgDocRef.current,
            currentState.compositionMode,
            audioSignal,
            audioConfigForWave
          )
        : [];

      // Store current particle snapshot in memory for export
      currentParticlesRef.current = particles;

      // Draw canvas preview
      const scaleX = canvas.width / DESIGN_WIDTH;
      const scaleY = canvas.height / DESIGN_HEIGHT;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!currentState.transparentBg) {
        ctx.fillStyle = currentState.style.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.scale(scaleX, scaleY);

      // Feature A: Molecule Wave Only / Editorial Collage crisp typography layer
      if (currentState.compositionMode === 'molecule_wave_only' || currentState.compositionMode === 'editorial_collage') {
        renderOriginalTypographyToCanvas(ctx, currentState.font, currentState.style, DESIGN_WIDTH, DESIGN_HEIGHT);
      }

      // Modular Signal Field (Breaking Signal redesign): the KV Layout text is the typography layer
      // and must sit UNDERNEATH the moving strip blocks so the strips visually interrupt/mask it —
      // opposite of the normal Text Layer B stacking order used everywhere else.
      const isModularSignalField = currentState.compositionMode === 'modular_signal_field';
      if (isModularSignalField) {
        renderKVLayoutToCanvas(ctx, currentState.kvLayout, DESIGN_WIDTH, DESIGN_HEIGHT, currentState.kvLayout?.selectedElementId);
      }

      // Optional Data Constellation connecting lines — strictly gated on the Data Constellation
      // visual style itself (never a leftover/copy-pasted constellationMaxDistance value alone) AND
      // the explicit Show Connections toggle, which defaults to false.
      if (currentState.style.visualStyle === 'data_constellation' && currentState.style.showConnections) {
        renderConstellationLinesToCanvas(
          ctx,
          particles,
          currentState.style.constellationMaxDistance || 55,
          currentState.style.constellationLineColor || '#00f0ff'
        );
      }

      // LED Backdrop (Typography Box Material only) — its own direct-canvas layer, painted BEHIND
      // the particles/text (see renderLedBackdropToCanvas for why it can't be a Particle[] entry).
      renderLedBackdropToCanvas(ctx, currentState.grid, DESIGN_WIDTH, DESIGN_HEIGHT);

      // High-performance batched particle rendering
      renderParticlesToCanvas(ctx, particles);

      // Text Layer B — independent Original Text / KV Layout (Items 4B & 6). Fully decoupled from
      // the generative engine: reads only currentState.kvLayout, never triggers SDF/particle work.
      if (!isModularSignalField) {
        renderKVLayoutToCanvas(ctx, currentState.kvLayout, DESIGN_WIDTH, DESIGN_HEIGHT, currentState.kvLayout?.selectedElementId);
      }

      // Draw Radar Grid Overlay if enabled
      if (currentState.style.showRadarGrid) {
        ctx.strokeStyle = currentState.style.accentColor;
        ctx.globalAlpha = currentState.style.radarGridOpacity;
        ctx.lineWidth = 1;

        const ox = currentState.wave.originX * DESIGN_WIDTH;
        const oy = currentState.wave.originY * DESIGN_HEIGHT;

        // Concentric radar rings
        for (let r = 80; r < Math.max(DESIGN_WIDTH, DESIGN_HEIGHT); r += 80) {
          ctx.beginPath();
          ctx.arc(ox, oy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Radar Crosshairs
        ctx.beginPath();
        ctx.moveTo(ox, 0);
        ctx.lineTo(ox, DESIGN_HEIGHT);
        ctx.moveTo(0, oy);
        ctx.lineTo(DESIGN_WIDTH, oy);
        ctx.stroke();
      }

      ctx.restore();

      // Adaptive Quality Evaluation
      const frameDuration = performance.now() - frameStartTime;
      const durations = frameDurationsRef.current;
      durations.push(frameDuration);
      if (durations.length > 20) durations.shift();

      if (currentState.previewQuality === 'auto' || !currentState.previewQuality) {
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const isIdle = performance.now() - lastInteractionTimeRef.current > 400;

        if (avgDuration > 22 && !isIdle && adaptiveScaleRef.current > 0.75) {
          // Under interactive load and frame time > 22ms (< 45fps), lower scaling
          adaptiveScaleRef.current = Math.max(0.75, adaptiveScaleRef.current - 0.05);
          updateCanvasSize();
        } else if (isIdle && avgDuration < 15 && adaptiveScaleRef.current < 1.0) {
          // Idle and running smoothly, restore crisp resolution
          adaptiveScaleRef.current = Math.min(1.0, adaptiveScaleRef.current + 0.05);
          updateCanvasSize();
        }
      }

      // Calculate FPS & Dot count statistics (updated every 600ms)
      frameCountRef.current++;
      if (currentTime - fpsTimerRef.current >= 600) {
        const fps = Math.round((frameCountRef.current * 1000) / (currentTime - fpsTimerRef.current));
        if (onFpsUpdate) {
          onFpsUpdate(fps, particles.length);
        }
        frameCountRef.current = 0;
        fpsTimerRef.current = currentTime;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    }

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isSubscribed = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [sdfData, onFpsUpdate, updateCanvasSize]);

  // Interactive 3D Rotation (3D Radial Wave mode) — drag rotates Y (horizontal) / X (vertical);
  // Shift+drag rotates Z. Pointer events unify mouse/touch/pen, so touch works automatically.
  // Takes priority over the emitter-handle drag below and returns early so the two never conflict.
  const handleRotationPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (state.wave.pattern !== 'radial_3d') return false;
    isDraggingRotationRef.current = true;
    lastRotationPointerRef.current = { x: e.clientX, y: e.clientY };
    return true;
  };

  const handleRotationPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRotationRef.current) return false;
    const last = lastRotationPointerRef.current;
    if (!last) {
      lastRotationPointerRef.current = { x: e.clientX, y: e.clientY };
      return true;
    }
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    lastRotationPointerRef.current = { x: e.clientX, y: e.clientY };

    const cfg = stateRef.current.wave.radial3D || DEFAULT_RADIAL3D_CONFIG;
    const sensitivity = 0.4;
    let { rotationX, rotationY, rotationZ } = cfg;

    if (e.shiftKey) {
      rotationZ = rotationZ + dx * sensitivity;
    } else {
      rotationY = rotationY + dx * sensitivity;
      rotationX = rotationX + dy * sensitivity;
    }
    rotationX = Math.max(-180, Math.min(180, rotationX));
    rotationY = Math.max(-180, Math.min(180, rotationY));
    rotationZ = Math.max(-180, Math.min(180, rotationZ));

    // Mutate the ref directly for zero-latency visual feedback in the render loop, then batch the
    // committed React state update to once per animation frame (avoids excessive re-renders).
    stateRef.current.wave.radial3D = { ...DEFAULT_RADIAL3D_CONFIG, ...cfg, rotationX, rotationY, rotationZ };
    pendingRotationRef.current = { x: rotationX, y: rotationY, z: rotationZ };

    if (!rotationUpdateScheduledRef.current) {
      rotationUpdateScheduledRef.current = true;
      requestAnimationFrame(() => {
        rotationUpdateScheduledRef.current = false;
        const pending = pendingRotationRef.current;
        if (!pending) return;
        onUpdateState((prev) => ({
          ...prev,
          wave: {
            ...prev.wave,
            radial3D: {
              ...DEFAULT_RADIAL3D_CONFIG,
              ...(prev.wave.radial3D || {}),
              rotationX: pending.x,
              rotationY: pending.y,
              rotationZ: pending.z
            }
          }
        }));
      });
    }
    return true;
  };

  const handleRotationPointerUp = () => {
    if (isDraggingRotationRef.current) {
      isDraggingRotationRef.current = false;
      lastRotationPointerRef.current = null;
      return true;
    }
    return false;
  };

  // Interactive Drag Emitter Handles
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (handleRotationPointerDown(e)) return;
    if (!wrapperRef.current || !state.style.showEmitterHandle) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const dist1 = Math.hypot(x - state.wave.originX, y - state.wave.originY);
    const dist2 = Math.hypot(x - state.wave.secondaryOriginX, y - state.wave.secondaryOriginY);

    if (state.wave.pattern === 'interference' && dist2 < dist1 && dist2 < 0.15) {
      setDraggingEmitter('secondary');
    } else {
      setDraggingEmitter('primary');
      onUpdateState((prev) => ({
        ...prev,
        wave: {
          ...prev.wave,
          originX: Math.max(0, Math.min(1, x)),
          originY: Math.max(0, Math.min(1, y))
        }
      }));
    }
  };

  const pointerUpdateScheduledRef = useRef(false);
  const pendingEmitterPosRef = useRef<{ type: 'primary' | 'secondary' | 'mouse'; x: number; y: number } | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    lastInteractionTimeRef.current = performance.now();

    if (handleRotationPointerMove(e)) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (state.wave.followMouse) {
      stateRef.current.wave.originX = x;
      stateRef.current.wave.originY = y;
      pendingEmitterPosRef.current = { type: 'mouse', x, y };
    } else if (draggingEmitter === 'primary') {
      stateRef.current.wave.originX = x;
      stateRef.current.wave.originY = y;
      pendingEmitterPosRef.current = { type: 'primary', x, y };
    } else if (draggingEmitter === 'secondary') {
      stateRef.current.wave.secondaryOriginX = x;
      stateRef.current.wave.secondaryOriginY = y;
      pendingEmitterPosRef.current = { type: 'secondary', x, y };
    } else {
      return;
    }

    if (!pointerUpdateScheduledRef.current) {
      pointerUpdateScheduledRef.current = true;
      requestAnimationFrame(() => {
        pointerUpdateScheduledRef.current = false;
        const pending = pendingEmitterPosRef.current;
        if (!pending) return;

        if (pending.type === 'secondary') {
          onUpdateState((prev) => ({
            ...prev,
            wave: { ...prev.wave, secondaryOriginX: pending.x, secondaryOriginY: pending.y }
          }));
        } else {
          onUpdateState((prev) => ({
            ...prev,
            wave: { ...prev.wave, originX: pending.x, originY: pending.y }
          }));
        }
      });
    }
  };

  const handlePointerUp = () => {
    if (handleRotationPointerUp()) return;
    setDraggingEmitter(null);
  };

  // Export Handlers using Snapshot from current frame in memory at full 1920x1080 resolution
  const handleExportPNG = () => {
    if (!sdfData) return;

    // Guaranteed full-quality calculation independent of preview resolution
    const { audioSignal, audioConfigForWave } = buildExportAudioSignal(state);
    const showEffectText =
      state.showEffectText !== false ||
      state.compositionMode === 'modular_signal_field' ||
      state.compositionMode === 'typography_ripple';
    const fullQualityParticles = showEffectText
      ? computeParticles(
          sdfData,
          state.grid,
          state.wave,
          state.font,
          state.style,
          DESIGN_WIDTH,
          DESIGN_HEIGHT,
          timeRef.current,
          parsedCustomSvgDocRef.current,
          state.compositionMode,
          audioSignal,
          audioConfigForWave
        )
      : [];

    // Create offscreen canvas at full design resolution (1920x1080)
    const offscreen = document.createElement('canvas');
    offscreen.width = DESIGN_WIDTH;
    offscreen.height = DESIGN_HEIGHT;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    if (!state.transparentBg) {
      ctx.fillStyle = state.style.bgColor;
      ctx.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    }

    if (state.compositionMode === 'molecule_wave_only' || state.compositionMode === 'editorial_collage') {
      renderOriginalTypographyToCanvas(ctx, state.font, state.style, DESIGN_WIDTH, DESIGN_HEIGHT);
    }

    const isModularSignalFieldExport = state.compositionMode === 'modular_signal_field';
    if (isModularSignalFieldExport) {
      renderKVLayoutToCanvas(ctx, state.kvLayout, DESIGN_WIDTH, DESIGN_HEIGHT);
    }

    if (state.style.visualStyle === 'data_constellation' && state.style.showConnections) {
      renderConstellationLinesToCanvas(
        ctx,
        fullQualityParticles,
        state.style.constellationMaxDistance || 55,
        state.style.constellationLineColor || '#00f0ff'
      );
    }

    renderLedBackdropToCanvas(ctx, state.grid, DESIGN_WIDTH, DESIGN_HEIGHT);
    renderParticlesToCanvas(ctx, fullQualityParticles);
    if (!isModularSignalFieldExport) {
      renderKVLayoutToCanvas(ctx, state.kvLayout, DESIGN_WIDTH, DESIGN_HEIGHT);
    }

    const dataUrl = offscreen.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `halftone-kinetic-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSVG = () => {
    if (!sdfData) return;
    const { audioSignal, audioConfigForWave } = buildExportAudioSignal(state);
    const fullQualityParticles = (
      state.showEffectText !== false ||
      state.compositionMode === 'modular_signal_field' ||
      state.compositionMode === 'typography_ripple'
    )
      ? computeParticles(
          sdfData,
          state.grid,
          state.wave,
          state.font,
          state.style,
          DESIGN_WIDTH,
          DESIGN_HEIGHT,
          timeRef.current,
          parsedCustomSvgDocRef.current,
          state.compositionMode,
          audioSignal,
          audioConfigForWave
        )
      : [];
    const svgStr = generateSVGFromParticles(fullQualityParticles, state, DESIGN_WIDTH, DESIGN_HEIGHT);
    downloadSVG(svgStr, `halftone-kinetic-${Date.now()}.svg`);
  };

  const handleExportVideo = async (durationSec = 5) => {
    const canvas = canvasRef.current;
    if (!canvas || isExportingVideo) return;

    setIsExportingVideo(true);
    setVideoExportProgress(0);

    try {
      const audioEnabled = !!state.audio?.enabled && audioAnalyzerInstance.hasAudio();
      const audioTrack = audioEnabled ? audioAnalyzerInstance.getExportAudioTrack() : null;
      const { blob: videoBlob, hasAudio } = await recordCanvasVideo(canvas, {
        durationSeconds: durationSec,
        fps: 60,
        preferTransparent: state.transparentBg,
        onProgress: (p) => setVideoExportProgress(p),
        audioTrack
      });
      downloadVideoBlob(videoBlob, `halftone-kinetic-${Date.now()}.mp4`);
      // Report the limitation clearly rather than silently shipping a silent file when the user
      // had Audio Reactivity + a live source on but the browser couldn't attach the track (item 13).
      if (audioEnabled && !hasAudio) {
        alert('Video exported without audio: this browser could not attach the live audio track to the recording. The visual ripple is still audio-reactive — only the exported file\'s soundtrack is missing.');
      }
    } catch (err) {
      console.error('Video export error:', err);
      alert('Video export error: ' + (err as Error).message);
    } finally {
      setIsExportingVideo(false);
      setVideoExportProgress(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 w-full h-full min-h-0 overflow-hidden select-none flex items-center justify-center p-4 lg:p-6 transition-all duration-200 ${
        state.transparentBg
          ? 'bg-[#0a0a0a] bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px]'
          : 'bg-slate-950'
      }`}
    >
      {/* 16:9 Aspect Ratio Preview Frame Wrapper */}
      <div
        ref={wrapperRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative aspect-[16/9] flex items-center justify-center rounded-lg overflow-hidden shadow-2xl border border-[#222]/80 bg-black/40 touch-none shrink-0 ${
          state.wave.pattern === 'radial_3d' ? 'cursor-move' : 'cursor-crosshair'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* Interactive Drag Emitter Overlay */}
        {state.style.showEmitterHandle && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-[#00F0FF] bg-[#00F0FF]/10 flex items-center justify-center animate-pulse"
              style={{
                left: `${state.wave.originX * 100}%`,
                top: `${state.wave.originY * 100}%`
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
              <span className="absolute left-8 text-[9px] font-mono uppercase tracking-widest text-[#00F0FF] bg-[#0A0A0A] px-1.5 py-0.5 rounded border border-[#00F0FF]/40">
                EMITTER_01
              </span>
            </div>

            {state.wave.pattern === 'interference' && (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-[#FF0055] bg-[#FF0055]/10 flex items-center justify-center animate-pulse"
                style={{
                  left: `${state.wave.secondaryOriginX * 100}%`,
                  top: `${state.wave.secondaryOriginY * 100}%`
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF0055]" />
                <span className="absolute left-8 text-[9px] font-mono uppercase tracking-widest text-[#FF0055] bg-[#0A0A0A] px-1.5 py-0.5 rounded border border-[#FF0055]/40">
                  EMITTER_02
                </span>
              </div>
            )}
          </div>
        )}

        {/* Video Export Progress Modal Overlay */}
        {isExportingVideo && (
          <div className="absolute inset-0 bg-[#0A0A0A]/90 z-50 flex flex-col items-center justify-center p-6 text-white font-mono">
            <div className="w-10 h-10 rounded-full border-2 border-[#00F0FF] border-t-transparent animate-spin mb-4" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#00F0FF] mb-2">
              ENCODING_MP4_VIDEO...
            </h3>
            <p className="text-[10px] font-mono text-[#888888] mb-4">
              RECORDING CANVAS STREAM AT 60 FPS
            </p>
            <div className="w-64 h-1.5 bg-[#222] rounded overflow-hidden border border-[#333]">
              <div
                className="h-full bg-[#00F0FF] transition-all duration-150"
                style={{ width: `${videoExportProgress * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-[#E0E0E0] mt-2">
              {Math.round(videoExportProgress * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Imperative trigger ref buttons */}
      <input type="hidden" id="export-png-trigger" onClick={handleExportPNG} />
      <input type="hidden" id="export-svg-trigger" onClick={handleExportSVG} />
      <button
        type="button"
        id="export-mp4-trigger"
        className="hidden"
        onClick={() => handleExportVideo(5)}
      />
    </div>
  );
};
