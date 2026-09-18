import React from 'react';
import { RenderState } from '../types';
import { PRESETS } from '../data/presets';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  FileCode,
  Video,
  Eye,
  EyeOff,
  Palette,
  Sliders,
  Radio
} from 'lucide-react';

interface HeaderBarProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  fps: number;
  dotCount: number;
  onToggleControls: () => void;
  isControlsOpen: boolean;
  onSelectPreset: (presetId: string) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  state,
  onUpdateState,
  fps,
  dotCount,
  onToggleControls,
  isControlsOpen,
  onSelectPreset
}) => {
  const triggerExport = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.click();
  };

  return (
    <header className="h-14 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 flex items-center justify-between text-slate-100 z-30 shrink-0">
      {/* Brand & Mode Indicator */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <h1 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-100 flex items-center space-x-2">
            <span>HALFTONE KINETIC</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono font-normal">
              SDF ENGINE v2.0
            </span>
          </h1>
          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <span>MODE:</span>
            <span className="text-cyan-400 font-semibold uppercase">
              {state.wave.mode === 'stable' ? 'Stable' : 'Flow'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-semibold uppercase">
              {state.compositionMode === 'molecule_wave_only'
                ? 'Wave Only'
                : state.compositionMode === 'editorial_collage'
                ? 'Collage'
                : 'Masked'}
            </span>
            {state.audioActive && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-semibold uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AUDIO
                </span>
              </>
            )}
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="hidden sm:inline">DOTS: <strong className="text-slate-200">{dotCount.toLocaleString()}</strong></span>
            <span className="text-slate-600 hidden md:inline">|</span>
            <span className="hidden md:inline">FPS: <strong className="text-emerald-400">{fps}</strong></span>
            <span className="text-slate-600 hidden lg:inline">|</span>
            <div className="hidden lg:flex items-center space-x-1 text-[10px] font-mono">
              <span className="text-slate-400">QUALITY:</span>
              {(['auto', 'high', 'performance'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateState((prev) => ({ ...prev, previewQuality: q }))}
                  className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
                    (state.previewQuality || 'auto') === q
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={`Preview Quality: ${q.toUpperCase()}`}
                >
                  {q === 'performance' ? 'PERF' : q.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center Quick Controls: Play/Pause, Reset, Mode Toggle */}
      <div className="hidden md:flex items-center space-x-2 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
        <button
          onClick={() =>
            onUpdateState((prev) => ({
              ...prev,
              wave: { ...prev.wave, mode: prev.wave.mode === 'stable' ? 'flow' : 'stable' }
            }))
          }
          className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
            state.wave.mode === 'stable'
              ? 'bg-cyan-500 text-slate-950 shadow-xs'
              : 'bg-indigo-600 text-white'
          }`}
        >
          {state.wave.mode === 'stable' ? 'STABLE WAVE' : 'FLOW WAVE'}
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <button
          onClick={() =>
            onUpdateState((prev) => ({
              ...prev,
              grid: { ...prev.grid, hideBackgroundDots: !prev.grid.hideBackgroundDots }
            }))
          }
          className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all flex items-center space-x-1.5 border ${
            state.grid.hideBackgroundDots
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
          }`}
          title={state.grid.hideBackgroundDots ? 'Show background dots outside text' : 'Hide background dots outside text'}
        >
          {state.grid.hideBackgroundDots ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
          <span>{state.grid.hideBackgroundDots ? 'BG DOTS: HIDDEN' : 'HIDE BG DOTS'}</span>
        </button>

        <button
          onClick={() =>
            onUpdateState((prev) => ({
              ...prev,
              style: { ...prev.style, uniformColorBrightness: !prev.style.uniformColorBrightness }
            }))
          }
          className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all flex items-center space-x-1.5 border ${
            state.style.uniformColorBrightness
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
              : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
          }`}
          title={
            state.style.uniformColorBrightness
              ? 'Switch back to wave-modulated color & brightness'
              : 'Make wave ripple and all dots share same color & 100% brightness'
          }
        >
          <Palette className={`w-3.5 h-3.5 ${state.style.uniformColorBrightness ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span>{state.style.uniformColorBrightness ? 'SAME COLOR: ON' : 'SAME DOT COLOR'}</span>
        </button>

        <div className="h-4 w-px bg-slate-800" />

        <button
          onClick={() =>
            onUpdateState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
          }
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title={state.isPlaying ? 'Pause Animation' : 'Play Animation'}
        >
          {state.isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={() =>
            onUpdateState((prev) => ({ ...prev, time: 0 }))
          }
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Reset Animation Time"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Right Action Tools: Presets, Exports & Drawer Toggle */}
      <div className="flex items-center space-x-2">
        {/* Presets Selector Dropdown */}
        <div className="relative group">
          <button className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">PRESETS</span>
          </button>

          <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-1.5 hidden group-hover:block z-50">
            <div className="px-2 py-1 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800 flex items-center justify-between">
              <span>8 KV Presets</span>
              <span className="text-cyan-400">6 Categories</span>
            </div>
            <div className="max-h-80 overflow-y-auto mt-1 space-y-1">
              {PRESETS.map((preset) => {
                const isSelected = state.activePresetId === preset.id;
                const dotColor = preset.config.style?.dotColor || '#00f0ff';
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset.id)}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors text-xs font-mono flex items-center justify-between ${
                      isSelected ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: dotColor }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block truncate pl-3.5">
                        {preset.category}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-[9px] text-cyan-400 font-bold shrink-0">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-md border border-slate-800">
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                transparentBg: !prev.transparentBg
              }))
            }
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono font-medium transition-colors border ${
              state.transparentBg
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
            title={
              state.transparentBg
                ? 'Transparent background enabled (exports PNG, SVG & Video with alpha)'
                : 'Enable transparent background for PNG, SVG & Video exports'
            }
          >
            <span className="w-3 h-3 rounded-xs border border-current flex items-center justify-center text-[9px] font-bold">
              {state.transparentBg ? 'α' : '■'}
            </span>
            <span className="hidden xl:inline">{state.transparentBg ? 'ALPHA BG: ON' : 'TRANSPARENT'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <button
            onClick={() => triggerExport('export-png-trigger')}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors"
            title="Export PNG Frame"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">PNG</span>
          </button>

          <button
            onClick={() => triggerExport('export-svg-trigger')}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors"
            title="Export Vector SVG"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">SVG</span>
          </button>

          <button
            onClick={() => triggerExport('export-mp4-trigger')}
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors"
            title="Export MP4 Video Animation"
          >
            <Video className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden lg:inline">MP4</span>
          </button>
        </div>

        {/* Drawer Toggle */}
        <button
          onClick={onToggleControls}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-colors ${
            isControlsOpen
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CONTROLS</span>
        </button>
      </div>
    </header>
  );
};
