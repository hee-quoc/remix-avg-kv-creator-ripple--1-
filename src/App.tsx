import React, { useState, useCallback, useRef, startTransition } from 'react';
import { RenderState } from './types';
import { applyPresetToState, BASE_DEFAULT_STATE } from './data/presets';
import { KineticCanvas } from './components/KineticCanvas';
import { HeaderBar } from './components/HeaderBar';
import { CanvasToolbar } from './components/CanvasToolbar';
import { PresetStrip } from './components/PresetStrip';
import { InspectorShell } from './components/InspectorShell';
import { useSettingsHistory } from './hooks/useSettingsHistory';
import { FlipDiscConfig } from './flipDisc/types';
import { applyFlipDiscPreset, FLIP_DISC_PRESETS } from './flipDisc/presets';
import { FlipDiscCanvas, FlipDiscImageActions } from './flipDisc/FlipDiscCanvas';
import { TypographyTilesConfig } from './typographyTiles/types';
import { applyTypographyTilesPreset } from './typographyTiles/presets';
import { TypographyTilesCanvas } from './typographyTiles/TypographyTilesCanvas';
import { TypographyTilesControls } from './typographyTiles/TypographyTilesControls';
import { TypographyTilesHeaderBar } from './typographyTiles/TypographyTilesHeaderBar';
import ComponentDemo from './dev/ComponentDemo';

type EngineMode = 'kinetic' | 'flip_disc' | 'typography_tiles';

export default function App() {
  // Redesign V1-B, Phase P2 — temporary, hash-gated route to the shared UI component demo screen.
  // Never reachable in normal use (the hash is never set by anything in the app itself); remove once
  // P3+ wire these components into the real inspector and visual sign-off no longer needs it.
  if (typeof window !== 'undefined' && window.location.hash === '#ui-demo') {
    return <ComponentDemo />;
  }

  // Reuses the single canonical default state from data/presets.ts (previously this component kept
  // its own hand-maintained copy that had drifted out of sync — e.g. missing compositionMode,
  // activeVisualStyle, and the wave-variation fields — which risked inconsistent behavior on first
  // load before any preset is picked).
  const [state, setState] = useState<RenderState>(() => JSON.parse(JSON.stringify(BASE_DEFAULT_STATE)));
  const { history, clearHistory, removeEntry } = useSettingsHistory(state);
  // Redesign V1-B — basic Undo/Redo (spec section 4.6) over the existing settled-edit history log.
  // `null` cursor = "live" (at/after the newest entry); editing via the normal onUpdateState path
  // always drops back to `null`, abandoning whatever redo trail existed — same as any standard
  // undo/redo stack once a fresh edit branches off from a undone state.
  const [historyCursor, setHistoryCursor] = useState<number | null>(null);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [fps, setFps] = useState(60);
  const [dotCount, setDotCount] = useState(12000);

  // Flip Disc 3D — a self-contained "Children" theme engine, entirely separate from the Kinetic
  // particle/wave engine above (see src/flipDisc/types.ts). App only owns which engine is on screen.
  const [engineMode, setEngineMode] = useState<EngineMode>('kinetic');
  const firstFlipDisc = applyFlipDiscPreset('playful_bloom');
  const [flipDiscPresetId, setFlipDiscPresetId] = useState(firstFlipDisc.presetId);
  const [flipDiscConfig, setFlipDiscConfig] = useState<FlipDiscConfig>(firstFlipDisc.config);
  const [flipDiscPlaying, setFlipDiscPlaying] = useState(true);
  const [flipDiscFps, setFlipDiscFps] = useState(60);
  const [flipDiscTileCount, setFlipDiscTileCount] = useState(0);
  const flipDiscExportRef = useRef<(() => void) | null>(null);
  const flipDiscImageActionsRef = useRef<FlipDiscImageActions | null>(null);
  const [flipDiscFrontImageStatus, setFlipDiscFrontImageStatus] = useState<string>('No image');
  const [flipDiscBackImageStatus, setFlipDiscBackImageStatus] = useState<string>('No image');
  const [flipDiscTransparentBg, setFlipDiscTransparentBg] = useState(false);

  // Interactive Generative Typography ("Tile Break") — another self-contained engine, entirely
  // separate from Kinetic and Flip Disc (see src/typographyTiles/). App only owns which engine is on
  // screen, same pattern as Flip Disc above.
  const firstTiles = applyTypographyTilesPreset('tile_game');
  const [typographyTilesPresetId, setTypographyTilesPresetId] = useState(firstTiles.presetId);
  const [typographyTilesConfig, setTypographyTilesConfig] = useState<TypographyTilesConfig>(firstTiles.config);
  const [typographyTilesFps, setTypographyTilesFps] = useState(60);
  const [typographyTilesTileCount, setTypographyTilesTileCount] = useState(0);
  const typographyTilesExportRef = useRef<(() => void) | null>(null);

  const handleUpdateState = useCallback(
    (updater: (prev: RenderState) => RenderState) => {
      setHistoryCursor(null);
      setState(updater);
    },
    []
  );

  const handleRestoreHistory = useCallback((snapshot: RenderState) => {
    setHistoryCursor(null);
    setState(JSON.parse(JSON.stringify(snapshot)));
  }, []);

  const handleUndo = useCallback(() => {
    setHistoryCursor((cursor) => {
      if (history.length === 0) return cursor;
      let idx: number;
      if (cursor === null) {
        // "Live" — the latest history entry has usually already settled to match the current state
        // (the 900ms debounce fired), so the first Undo needs to skip past it to the entry BEFORE;
        // but if the user undoes mid-edit (before that debounce fires), the latest entry is still the
        // last SETTLED state and genuinely is the right undo target. Compare instead of assuming.
        const latest = history[history.length - 1];
        const latestMatchesCurrent = latest && JSON.stringify(latest.state) === JSON.stringify(state);
        idx = latestMatchesCurrent ? history.length - 2 : history.length - 1;
      } else {
        idx = cursor - 1;
      }
      if (idx < 0) return cursor;
      setState(JSON.parse(JSON.stringify(history[idx].state)));
      return idx;
    });
  }, [history, state]);

  const handleRedo = useCallback(() => {
    setHistoryCursor((cursor) => {
      if (cursor === null) return cursor;
      const idx = cursor + 1;
      if (idx >= history.length) return cursor;
      setState(JSON.parse(JSON.stringify(history[idx].state)));
      return idx;
    });
  }, [history]);

  const canUndo = history.length > 0 && (historyCursor === null || historyCursor > 0);
  const canRedo = historyCursor !== null && historyCursor < history.length - 1;

  const handleSelectPreset = useCallback((presetId: string) => {
    setHistoryCursor(null);
    setState((prev) => applyPresetToState(presetId, prev));
    // Mounting KineticCanvas is cheap, but switching ENGINES (e.g. away from a live WebGL context)
    // can still cost a frame or two — see the matching comment on handleSelectFlipDiscPreset below
    // for why this is wrapped in startTransition rather than a plain setState.
    startTransition(() => setEngineMode('kinetic'));
  }, []);

  const handleSelectFlipDiscPreset = useCallback((presetId: string) => {
    const applied = applyFlipDiscPreset(presetId);
    setFlipDiscPresetId(applied.presetId);
    setFlipDiscConfig(applied.config);
    // Mounting FlipDiscCanvas for the first time compiles WebGL shaders and builds the full disc
    // mesh (up to density^2 tiles, each a real 3D front/back/side geometry) synchronously in a
    // layout-adjacent effect — measured ~550ms blocking the main thread, which Chrome's INP tooling
    // flags against whatever DOM element the originating click bubbled through (a PresetStrip card),
    // even though the actual cost has nothing to do with that element. startTransition marks this
    // state update as interruptible/low-priority, letting React yield to the browser and paint
    // intermediate frames instead of blocking the whole commit — it doesn't make the WebGL init
    // itself faster, but it stops that cost from being attributed to "this click froze the page".
    startTransition(() => setEngineMode('flip_disc'));
  }, []);

  const handleUpdateFlipDiscConfig = useCallback((patch: Partial<FlipDiscConfig>) => {
    setFlipDiscConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSelectTypographyTilesPreset = useCallback((presetId: string) => {
    const applied = applyTypographyTilesPreset(presetId);
    setEngineMode('typography_tiles');
    setTypographyTilesPresetId(applied.presetId);
    setTypographyTilesConfig(applied.config);
  }, []);

  const handleUpdateTypographyTilesConfig = useCallback((patch: Partial<TypographyTilesConfig>) => {
    setTypographyTilesConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleTypographyTilesFpsUpdate = useCallback((newFps: number, tileCount: number) => {
    setTypographyTilesFps(newFps);
    setTypographyTilesTileCount(tileCount);
  }, []);

  const handleFpsUpdate = useCallback((newFps: number, newDotCount: number) => {
    setFps(newFps);
    setDotCount(newDotCount);
  }, []);

  const handleFlipDiscFpsUpdate = useCallback((newFps: number, tileCount: number) => {
    setFlipDiscFps(newFps);
    setFlipDiscTileCount(tileCount);
  }, []);

  const handleFlipDiscImageStatus = useCallback((which: 'front' | 'back', label: string) => {
    if (which === 'front') setFlipDiscFrontImageStatus(label);
    else setFlipDiscBackImageStatus(label);
  }, []);

  if (engineMode === 'typography_tiles') {
    return (
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-black font-sans select-none">
        <TypographyTilesHeaderBar
          activePresetId={typographyTilesPresetId}
          fps={typographyTilesFps}
          tileCount={typographyTilesTileCount}
          onSelectPreset={handleSelectTypographyTilesPreset}
          onExportPNG={() => typographyTilesExportRef.current?.()}
          onBackToKinetic={() => setEngineMode('kinetic')}
          onToggleControls={() => setIsControlsOpen((v) => !v)}
          isControlsOpen={isControlsOpen}
        />
        <div className="flex-1 flex overflow-hidden relative">
          <TypographyTilesCanvas
            config={typographyTilesConfig}
            onUpdateConfig={handleUpdateTypographyTilesConfig}
            onFpsUpdate={handleTypographyTilesFpsUpdate}
            exportRequestRef={typographyTilesExportRef}
          />
          {isControlsOpen && (
            <div className="w-[340px] shrink-0 bg-[#08080b] border-l border-[#222] overflow-y-auto">
              <TypographyTilesControls config={typographyTilesConfig} onUpdate={handleUpdateTypographyTilesConfig} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Merge pass — Flip Disc ("Children" theme engine) used to live behind its own completely separate
  // page (own header, own 340px dark panel) via an early return here, so picking a Flip Disc preset
  // from the shared PresetStrip felt like being dropped into a different, older app. It now shares
  // the exact same HeaderBar/CanvasToolbar/PresetStrip/InspectorShell shell as Kinetic below —
  // `engineMode` only swaps which canvas renders and which fields those shell components show/bind
  // to. The Flip Disc render engine itself (FlipDiscCanvas, flipDiscGL.ts) is untouched.
  const isFlipDisc = engineMode === 'flip_disc';
  const flipDiscPresetName = FLIP_DISC_PRESETS.find((p) => p.id === flipDiscPresetId)?.name;

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden select-none" style={{ background: 'var(--bg)' }}>
      {/* Redesign V1-B layout (spec section 3): new header, canvas card + floating toolbar, preset
          strip below canvas, inspector card + icon rail on the right. */}
      <HeaderBar
        engineMode={isFlipDisc ? 'flip_disc' : 'kinetic'}
        state={state}
        onUpdateState={handleUpdateState}
        onToggleControls={() => setIsControlsOpen((v) => !v)}
        isControlsOpen={isControlsOpen}
        canUndo={!isFlipDisc && canUndo}
        canRedo={!isFlipDisc && canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        flipDiscPresetName={flipDiscPresetName}
        flipDiscTransparentBg={flipDiscTransparentBg}
        onToggleFlipDiscTransparentBg={() => setFlipDiscTransparentBg((v) => !v)}
        onExportFlipDiscPNG={() => flipDiscExportRef.current?.()}
      />

      <div className="flex-1 flex overflow-hidden gap-4 p-4 min-h-0">
        <div className="flex-1 min-w-0 flex flex-col gap-3.5 min-h-0">
          <div className="flex-1 relative min-h-0">
            <CanvasToolbar
              engineMode={isFlipDisc ? 'flip_disc' : 'kinetic'}
              state={state}
              onUpdateState={handleUpdateState}
              fps={fps}
              dotCount={dotCount}
              flipDiscPlaying={flipDiscPlaying}
              onToggleFlipDiscPlaying={() => setFlipDiscPlaying((v) => !v)}
              flipDiscFps={flipDiscFps}
              flipDiscTileCount={flipDiscTileCount}
            />
            {isFlipDisc ? (
              <FlipDiscCanvas
                config={flipDiscConfig}
                isPlaying={flipDiscPlaying}
                transparentBg={flipDiscTransparentBg}
                onFpsUpdate={handleFlipDiscFpsUpdate}
                exportRequestRef={flipDiscExportRef}
                imageActionsRef={flipDiscImageActionsRef}
                onImageStatus={handleFlipDiscImageStatus}
              />
            ) : (
              <KineticCanvas state={state} onUpdateState={handleUpdateState} onFpsUpdate={handleFpsUpdate} />
            )}
          </div>
          <PresetStrip
            state={state}
            onSelectPreset={handleSelectPreset}
            onSelectFlipDiscPreset={handleSelectFlipDiscPreset}
            onSelectTypographyTilesPreset={handleSelectTypographyTilesPreset}
          />
        </div>

        {isControlsOpen && (
          <>
            {/* Backdrop — only below the lg breakpoint, where the inspector becomes an overlay
                (drawer/bottom-sheet) instead of a normal inline panel, so the canvas never has to
                shrink below ~50% of the viewport on narrow screens (spec section 3, responsive). */}
            <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setIsControlsOpen(false)} />
            <div
              className="fixed inset-x-0 bottom-0 h-[75vh] rounded-t-[var(--radius-card)] z-40 overflow-hidden
                         md:inset-x-auto md:bottom-auto md:top-0 md:right-0 md:h-full md:w-[380px] md:rounded-t-none md:rounded-l-[var(--radius-card)]
                         lg:static lg:w-[400px] lg:h-auto lg:rounded-[var(--radius-card)] lg:z-auto lg:shrink-0"
            >
              <InspectorShell
                engineMode={isFlipDisc ? 'flip_disc' : 'kinetic'}
                state={state}
                onUpdateState={handleUpdateState}
                onSelectPreset={handleSelectPreset}
                onSelectFlipDiscPreset={handleSelectFlipDiscPreset}
                onSelectTypographyTilesPreset={handleSelectTypographyTilesPreset}
                history={history}
                onRestoreHistory={handleRestoreHistory}
                onClearHistory={clearHistory}
                onRemoveHistoryEntry={removeEntry}
                flipDiscConfig={flipDiscConfig}
                flipDiscPresetId={flipDiscPresetId}
                onUpdateFlipDiscConfig={handleUpdateFlipDiscConfig}
                flipDiscImageActionsRef={flipDiscImageActionsRef}
                flipDiscFrontImageStatus={flipDiscFrontImageStatus}
                flipDiscBackImageStatus={flipDiscBackImageStatus}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
