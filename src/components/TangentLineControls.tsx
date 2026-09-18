import React from 'react';
import { RenderState } from '../types';
import { Sliders, Waves, Compass, Activity } from 'lucide-react';

interface BreakingSignalControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

export const BreakingSignalControls: React.FC<BreakingSignalControlsProps> = ({
  state,
  onUpdateState
}) => {
  const lineDirection = state.grid.lineDirection || 'tangent';
  const lineThickness = state.grid.lineThickness ?? Math.max(1.2, state.grid.maxRadius * 0.4);
  const lineLength = state.grid.lineLength ?? 4.5;
  const lineAngle = state.grid.lineAngle ?? state.wave.linearAngle ?? 45;

  return (
    <div className="p-3 bg-[#0d0d12] border border-[#262630] rounded-lg space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#222] pb-2">
        <div className="flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
            BREAKING SIGNAL LINE CONTROLS
          </span>
        </div>
        <span className="text-[9px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
          DIRECTIONAL LINES
        </span>
      </div>

      {/* Line Direction Mode */}
      <div>
        <label className="block text-[#888888] mb-1 text-[10px] uppercase tracking-wider flex items-center gap-1">
          <Compass className="w-3 h-3 text-[#00F0FF]" /> LINE ORIENTATION / DIRECTION
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              { id: 'tangent', label: 'TANGENT', desc: 'Perpendicular to wave' },
              { id: 'radial', label: 'RADIAL', desc: 'Radiating from origin' },
              { id: 'linear', label: 'UNIFORM ANGLE', desc: 'Custom directional slant' }
            ] as const
          ).map((dir) => (
            <button
              key={dir.id}
              type="button"
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  grid: { ...prev.grid, lineDirection: dir.id }
                }))
              }
              className={`p-1.5 rounded border text-center font-mono transition-colors ${
                lineDirection === dir.id
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-[0_0_8px_rgba(244,63,94,0.25)]'
                  : 'bg-[#111] border-[#222] text-[#888] hover:text-white'
              }`}
            >
              <span className="block text-[9px] font-bold">{dir.label}</span>
              <span className="text-[7.5px] opacity-70 block">{dir.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Uniform Angle Slider (when linear direction selected) */}
      {lineDirection === 'linear' && (
        <div>
          <div className="flex justify-between text-[#888888] mb-1 text-[10px] font-mono">
            <span>LINE ANGLE</span>
            <span className="text-rose-400 font-bold">{lineAngle.toFixed(0)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={lineAngle}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, lineAngle: val },
                wave: { ...prev.wave, linearAngle: val }
              }));
            }}
            className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      )}

      {/* Line Density & Line Thickness */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[#888888] mb-1 text-[10px] font-mono">
            <span>LINE DENSITY (SPACING)</span>
            <span className="text-rose-400">{state.grid.density}px</span>
          </div>
          <input
            type="range"
            min="6"
            max="28"
            step="1"
            value={state.grid.density}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, density: parseFloat(e.target.value) }
              }))
            }
            className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[#888888] mb-1 text-[10px] font-mono">
            <span>LINE THICKNESS</span>
            <span className="text-rose-400">{lineThickness.toFixed(1)}px</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="8.0"
            step="0.2"
            value={lineThickness}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, lineThickness: parseFloat(e.target.value) }
              }))
            }
            className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      </div>

      {/* Line Length & Distortion */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[#888888] mb-1 text-[10px] font-mono">
            <span>LINE LENGTH MULTIPLIER</span>
            <span className="text-rose-400">{lineLength.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="10.0"
            step="0.25"
            value={lineLength}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, lineLength: parseFloat(e.target.value) }
              }))
            }
            className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[#888888] mb-1 text-[10px] font-mono">
            <span>WAVE DISTORTION</span>
            <span className="text-rose-400">{(state.wave.vectorDistortion ?? 1.0).toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="3.0"
            step="0.1"
            value={state.wave.vectorDistortion ?? 1.0}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                wave: { ...prev.wave, vectorDistortion: parseFloat(e.target.value) }
              }))
            }
            className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      </div>

      {/* Animation Speed */}
      <div>
        <div className="flex justify-between text-[#888888] mb-1 text-[10px] font-mono">
          <span>ANIMATION SPEED</span>
          <span className="text-rose-400">{state.wave.waveSpeed.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.05"
          value={state.wave.waveSpeed}
          onChange={(e) =>
            onUpdateState((prev) => ({
              ...prev,
              wave: { ...prev.wave, waveSpeed: parseFloat(e.target.value) }
            }))
          }
          className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-rose-500"
        />
      </div>
    </div>
  );
};
