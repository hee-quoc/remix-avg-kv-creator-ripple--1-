import React, { useState, useCallback } from 'react';
import { RenderState } from './types';
import { applyPresetToState, BASE_DEFAULT_STATE } from './data/presets';
import { KineticCanvas } from './components/KineticCanvas';
import { HeaderBar } from './components/HeaderBar';
import { ControlsDrawer } from './components/ControlsDrawer';

export default function App() {
  // Reuses the single canonical default state from data/presets.ts (previously this component kept
  // its own hand-maintained copy that had drifted out of sync — e.g. missing compositionMode,
  // activeVisualStyle, and the wave-variation fields — which risked inconsistent behavior on first
  // load before any preset is picked).
  const [state, setState] = useState<RenderState>(() => JSON.parse(JSON.stringify(BASE_DEFAULT_STATE)));
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [fps, setFps] = useState(60);
  const [dotCount, setDotCount] = useState(12000);

  const handleUpdateState = useCallback(
    (updater: (prev: RenderState) => RenderState) => {
      setState(updater);
    },
    []
  );

  const handleSelectPreset = useCallback((presetId: string) => {
    setState((prev) => applyPresetToState(presetId, prev));
  }, []);

  const handleFpsUpdate = useCallback((newFps: number, newDotCount: number) => {
    setFps(newFps);
    setDotCount(newDotCount);
  }, []);

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
        />
      </div>
    </div>
  );
}
