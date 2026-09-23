import React from 'react';
import { RenderState, StitchAngleMode } from '../types';
import { Sparkles, Layers, Sliders, Scissors } from 'lucide-react';

interface StitchCraftControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const STITCH_MODES: { id: StitchAngleMode; label: string; desc: string }[] = [
  { id: 'diagonal_sashiko', label: 'DIAGONAL SASHIKO', desc: 'Alternating angled stitch rhythm' },
  { id: 'cross_stitch', label: 'CROSS-STITCH (X)', desc: 'Diagonal cross thread marks' },
  { id: 'contour_flow', label: 'CONTOUR FLOW', desc: 'Stitches follow wave crest curvature' },
  { id: 'alternating_weave', label: 'WOVEN WEFT & WARP', desc: 'Perpendicular 90° interlacing threads' }
];

export const StitchCraftControls: React.FC<StitchCraftControlsProps> = ({
  state,
  onUpdateState
}) => {
  const stitchLength = state.grid.stitchLength ?? 16;
  const stitchThickness = state.grid.stitchThickness ?? 3.2;
  const stitchAngle = state.grid.stitchAngle ?? 32;
  const stitchAngleMode = state.grid.stitchAngleMode || 'diagonal_sashiko';
  const stitchSoftness = state.grid.stitchSoftness ?? 0.22;
  const stitchTensionAnim = state.grid.stitchTensionAnim !== false;

  return (
    <div className="p-3 bg-[#110e0a] border border-[#2b2214] rounded-lg space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-[#241c10] pb-2">
        <div className="flex items-center space-x-2">
          <Scissors className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">
            TEXTILE & STITCH MATERIALITY
          </span>
        </div>
        <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
          CRAFT MATERIAL
        </span>
      </div>

      {/* Material Library: switch the underlying crafted-surface material */}
      <div>
        <label className="block text-[#a8957e] mb-1.5 text-[10px] uppercase tracking-wider">
          MATERIAL LIBRARY
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateState((prev) => ({ ...prev, grid: { ...prev.grid, dotShape: 'stitch', culturalMaterial: 'stitch' } }))}
            className={`p-2 rounded border text-left font-mono transition-colors ${
              state.grid.dotShape === 'stitch'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                : 'bg-[#18140e] border-[#292014] text-[#888] hover:text-amber-100'
            }`}
          >
            <span className="block text-[9.5px] font-bold uppercase">Stitch / Embroidery</span>
            <span className="text-[7.5px] opacity-75 block">Individual hand-stitched thread units</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateState((prev) => ({ ...prev, grid: { ...prev.grid, dotShape: 'woven', culturalMaterial: 'woven' } }))}
            className={`p-2 rounded border text-left font-mono transition-colors ${
              state.grid.dotShape === 'woven'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                : 'bg-[#18140e] border-[#292014] text-[#888] hover:text-amber-100'
            }`}
          >
            <span className="block text-[9.5px] font-bold uppercase">Woven Textile</span>
            <span className="text-[7.5px] opacity-75 block">Interlacing weft &amp; warp surface</span>
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, dotShape: 'original_stitch', culturalMaterial: 'original_stitch' }
              }))
            }
            className={`p-2 rounded border text-left font-mono transition-colors ${
              state.grid.dotShape === 'original_stitch'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                : 'bg-[#18140e] border-[#292014] text-[#888] hover:text-amber-100'
            }`}
          >
            <span className="block text-[9.5px] font-bold uppercase">Original Stitch</span>
            <span className="text-[7.5px] opacity-75 block">Exact 120×120 rotated-ellipse weave</span>
          </button>
        </div>
      </div>

      {state.grid.dotShape === 'original_stitch' && (
        <p className="text-[9px] text-amber-200/80 bg-amber-500/10 border border-amber-500/30 rounded px-2.5 py-2 leading-relaxed">
          Original Stitch uses its own fixed 120×120 layout (source-exact geometry) — the Stitch
          Pattern/Thread Geometry controls below apply to the Stitch/Woven materials only. Use the
          Multi-Color Dot System panel above for its two-tone palette, and the WAVE tab for Ripple.
        </p>
      )}

      {/* Stitch/Woven-only geometry controls — inert for Original Stitch, which uses its own fixed
          source-exact 120x120 layout, so they're hidden rather than left visible-but-disconnected. */}
      {state.grid.dotShape !== 'original_stitch' && (
      <>
      {/* Stitch Pattern / Angle Mode */}
      <div>
        <label className="block text-[#a8957e] mb-1.5 text-[10px] uppercase tracking-wider">
          STITCH PATTERN & THREAD GEOMETRY
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {STITCH_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  grid: { ...prev.grid, stitchAngleMode: mode.id, dotShape: 'stitch' }
                }))
              }
              className={`p-2 rounded border text-left font-mono transition-colors ${
                stitchAngleMode === mode.id
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                  : 'bg-[#18140e] border-[#292014] text-[#888] hover:text-amber-100'
              }`}
            >
              <span className="block text-[9.5px] font-bold uppercase">{mode.label}</span>
              <span className="text-[7.5px] opacity-75 block">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stitch Length & Stitch Thickness */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[#a8957e] mb-1 text-[10px] font-mono">
            <span>STITCH LENGTH</span>
            <span className="text-amber-400 font-bold">{stitchLength}px</span>
          </div>
          <input
            type="range"
            min="6"
            max="36"
            step="1"
            value={stitchLength}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, stitchLength: val }
              }));
            }}
            className="w-full h-[2px] bg-[#292014] appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[#a8957e] mb-1 text-[10px] font-mono">
            <span>THREAD THICKNESS</span>
            <span className="text-amber-400 font-bold">{stitchThickness.toFixed(1)}px</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="8.0"
            step="0.2"
            value={stitchThickness}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, stitchThickness: val }
              }));
            }}
            className="w-full h-[2px] bg-[#292014] appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Stitch Angle & Softness */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="flex justify-between text-[#a8957e] mb-1 text-[10px] font-mono">
            <span>BASE STITCH ANGLE</span>
            <span className="text-amber-400 font-bold">{stitchAngle}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="2"
            value={stitchAngle}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, stitchAngle: val }
              }));
            }}
            className="w-full h-[2px] bg-[#292014] appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[#a8957e] mb-1 text-[10px] font-mono">
            <span>FIBER SOFTNESS</span>
            <span className="text-amber-400 font-bold">{stitchSoftness.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.8"
            step="0.05"
            value={stitchSoftness}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, stitchSoftness: val }
              }));
            }}
            className="w-full h-[2px] bg-[#292014] appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>

      {/* Dynamic Thread Tension Animation Toggle */}
      <div className="p-2 bg-[#18140e] border border-[#292014] rounded flex items-center justify-between">
        <div>
          <span className="block text-[10px] font-bold text-amber-200 uppercase">
            THREAD TENSION ANIMATION
          </span>
          <span className="block text-[8px] text-[#888]">
            Stitch length pulses and tightens with wave crest tension
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            onUpdateState((prev) => ({
              ...prev,
              grid: { ...prev.grid, stitchTensionAnim: !stitchTensionAnim }
            }))
          }
          className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase border transition-colors ${
            stitchTensionAnim
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
              : 'bg-[#111] text-[#777] border-[#333]'
          }`}
        >
          {stitchTensionAnim ? 'ENABLED' : 'STATIC'}
        </button>
      </div>
      </>
      )}
    </div>
  );
};
