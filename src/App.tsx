import React, { useState, useCallback, useRef } from 'react';
import { RenderState } from './types';
import { applyPresetToState, BASE_DEFAULT_STATE } from './data/presets';
import { KineticCanvas } from './components/KineticCanvas';
import { HeaderBar } from './components/HeaderBar';
import { ControlsDrawer } from './components/ControlsDrawer';
import { useSettingsHistory } from './hooks/useSettingsHistory';
import { FlipDiscConfig } from './flipDisc/types';
import { applyFlipDiscPreset } from './flipDisc/presets';
import { FlipDiscCanvas, FlipDiscImageActions } from './flipDisc/FlipDiscCanvas';
import { FlipDiscControls } from './flipDisc/FlipDiscControls';
import { FlipDiscHeaderBar } from './flipDisc/FlipDiscHeaderBar';

type EngineMode = 'kinetic' | 'flip_disc';

export default function App() {
  // Reuses the single canonical default state from data/presets.ts (previously this component kept
  // its own hand-maintained copy that had drifted out of sync — e.g. missing compositionMode,
  // activeVisualStyle, and the wave-variation fields — which risked inconsistent behavior on first
  // load before any preset is picked).
  const [state, setState] = useState<RenderState>(() => JSON.parse(JSON.stringify(BASE_DEFAULT_STATE)));
  const { history, clearHistory, removeEntry } = useSettingsHistory(state);
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

  const handleUpdateState = useCallback(
    (updater: (prev: RenderState) => RenderState) => {
      setState(updater);
    },
    []
  );

  const handleRestoreHistory = useCallback((snapshot: RenderState) => {
    setState(JSON.parse(JSON.stringify(snapshot)));
  }, []);

  const handleSelectPreset = useCallback((presetId: string) => {
    setEngineMode('kinetic');
    setState((prev) => applyPresetToState(presetId, prev));
  }, []);

  const handleSelectFlipDiscPreset = useCallback((presetId: string) => {
    const applied = applyFlipDiscPreset(presetId);
    setEngineMode('flip_disc');
    setFlipDiscPresetId(applied.presetId);
    setFlipDiscConfig(applied.config);
  }, []);

  const handleUpdateFlipDiscConfig = useCallback((patch: Partial<FlipDiscConfig>) => {
    setFlipDiscConfig((prev) => ({ ...prev, ...patch }));
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

  if (engineMode === 'flip_disc') {
    return (
      <div className="w-screen h-screen flex flex-col overflow-hidden bg-black font-sans select-none">
        <FlipDiscHeaderBar
          activePresetId={flipDiscPresetId}
          isPlaying={flipDiscPlaying}
          fps={flipDiscFps}
          tileCount={flipDiscTileCount}
          onTogglePlay={() => setFlipDiscPlaying((v) => !v)}
          onSelectPreset={handleSelectFlipDiscPreset}
          onExportPNG={() => flipDiscExportRef.current?.()}
          onBackToKinetic={() => setEngineMode('kinetic')}
          onToggleControls={() => setIsControlsOpen((v) => !v)}
          isControlsOpen={isControlsOpen}
        />
        <div className="flex-1 flex overflow-hidden relative">
          <FlipDiscCanvas
            config={flipDiscConfig}
            isPlaying={flipDiscPlaying}
            onFpsUpdate={handleFlipDiscFpsUpdate}
            exportRequestRef={flipDiscExportRef}
            imageActionsRef={flipDiscImageActionsRef}
            onImageStatus={handleFlipDiscImageStatus}
          />
          {isControlsOpen && (
            <div className="w-[340px] shrink-0 bg-[#08080b] border-l border-[#222] overflow-y-auto">
              <FlipDiscControls
                config={flipDiscConfig}
                onUpdate={handleUpdateFlipDiscConfig}
                imageActionsRef={flipDiscImageActionsRef}
                frontImageStatus={flipDiscFrontImageStatus}
                backImageStatus={flipDiscBackImageStatus}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Navigation & Toolbar Header */}
      <HeaderBar
        state={state}
        onUpdateState={handleUpdateState}
        fps={fps}
        dotCount={dotCount}
        onToggleControls={() => setIsControlsOpen((v) => !v)}
        isControlsOpen={isControlsOpen}
        onSelectPreset={handleSelectPreset}
        onSelectFlipDiscPreset={handleSelectFlipDiscPreset}
      />

      {/* Main Workspace Area: WebGL Canvas + Docked Controls Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        <KineticCanvas
          state={state}
          onUpdateState={handleUpdateState}
          onFpsUpdate={handleFpsUpdate}
        />

        <ControlsDrawer
          state={state}
          onUpdateState={handleUpdateState}
          isOpen={isControlsOpen}
          onClose={() => setIsControlsOpen(false)}
          onSelectPreset={handleSelectPreset}
          onSelectFlipDiscPreset={handleSelectFlipDiscPreset}
          history={history}
          onRestoreHistory={handleRestoreHistory}
          onClearHistory={clearHistory}
          onRemoveHistoryEntry={removeEntry}
        />
      </div>
    </div>
  );
}
