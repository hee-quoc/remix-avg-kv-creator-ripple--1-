import React from 'react';
import { RenderState, MeshNetConfig } from '../types';
import { DEFAULT_MESH_NET_CONFIG } from '../utils/particleRenderer';
import { Grid3x3, Waves, Target, Sparkles } from 'lucide-react';

interface MeshNetControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const MATERIAL_VARIATIONS: { name: string; desc: string; patch: Partial<MeshNetConfig> }[] = [
  {
    name: 'Wireframe Mesh',
    desc: 'Thin lines, no knots — clean sine-wave plane',
    patch: { lineThickness: 1.5, showNodes: false, nodeSize: 2, glowIntensity: 0.7 }
  },
  {
    name: 'Node + Mesh',
    desc: 'Visible knots at every intersection',
    patch: { lineThickness: 2, showNodes: true, nodeSize: 3.5, glowIntensity: 0.8 }
  },
  {
    name: 'Rope Net',
    desc: 'Thick rounded threads, heavier knots',
    patch: { lineThickness: 4, showNodes: true, nodeSize: 5, densityX: 12, densityY: 9, glowIntensity: 0.6 }
  },
  {
    name: 'Elastic Grid',
    desc: 'Fine dense weave, strong glow response',
    patch: { lineThickness: 1.2, showNodes: true, nodeSize: 1.8, densityX: 24, densityY: 18, glowIntensity: 1.0 }
  },
  {
    name: 'Sports Hoop Tunnel',
    desc: 'Curved + tilted, like looking through a net',
    patch: { curvature: 0.55, perspectiveAmount: 0.6, densityX: 14, densityY: 16, glowIntensity: 0.85 }
  }
];

/**
 * Sine Mesh Net controls (Sports) — mesh geometry + how the material READS the wave. The sine motion
 * itself (Frequency/Speed/Amplitude/Softness/Thickness), impact point (Ripple Origin), impact falloff
 * (Radial Thickness), and wave direction (Wave Pattern: circular = radial impact ripple, linear = a
 * directional sweep) are the SAME existing WAVE tab controls used by every other preset — this panel
 * never duplicates them.
 */
export const MeshNetControls: React.FC<MeshNetControlsProps> = ({ state, onUpdateState }) => {
  const cfg: MeshNetConfig = { ...DEFAULT_MESH_NET_CONFIG, ...(state.grid.meshNet || {}) };
  const hasUploadedSvg = !!(
    (state.grid.customSvgLayers && state.grid.customSvgLayers.some((l) => l.enabled !== false && l.svgXml)) ||
    state.grid.customSvgXml
  );

  const update = (patch: Partial<MeshNetConfig>) => {
    onUpdateState((prev) => ({
      ...prev,
      grid: {
        ...prev.grid,
        meshNet: { ...DEFAULT_MESH_NET_CONFIG, ...(prev.grid.meshNet || {}), ...patch }
      }
    }));
  };

  const slider = (
    label: string,
    value: number,
    field: keyof MeshNetConfig,
    min: number,
    max: number,
    step: number,
    unit = '',
    decimals = 2
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[#888] text-[10px] uppercase">{label}</label>
        <span className="text-emerald-400 text-[10px] font-bold">
          {value.toFixed(decimals)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => update({ [field]: parseFloat(e.target.value) } as Partial<MeshNetConfig>)}
        className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );

  const colorField = (label: string, value: string, field: keyof MeshNetConfig) => (
    <div>
      <label className="text-[#888] text-[10px] uppercase block mb-1">{label}</label>
      <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#222] rounded p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => update({ [field]: e.target.value } as Partial<MeshNetConfig>)}
          className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
        <span className="text-[10px] text-[#cbd5e1] uppercase">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Grid3x3 className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            SINE MESH NET
          </span>
        </div>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        A wireframe net displaced by the SAME wave engine every other preset uses — the WAVE tab's
        Frequency/Speed/Amplitude drive the sine vibration, Ripple Origin is the impact point, Wave
        Pattern picks the direction (Circular = ball-impact ripple, Linear = a sweep), and Radial
        Thickness shapes the impact falloff. This panel only sets the net's own geometry and glow.
      </p>

      {/* Mesh Geometry */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
          <Grid3x3 className="w-3.5 h-3.5" /> MESH GEOMETRY
        </span>
        <div className="grid grid-cols-2 gap-3">
          {slider('MESH WIDTH', cfg.meshWidth, 'meshWidth', 0.1, 1, 0.02, '', 2)}
          {slider('MESH HEIGHT', cfg.meshHeight, 'meshHeight', 0.1, 1, 0.02, '', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('DENSITY X', cfg.densityX, 'densityX', 3, 40, 1, '', 0)}
          {slider('DENSITY Y', cfg.densityY, 'densityY', 3, 40, 1, '', 0)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('LINE THICKNESS', cfg.lineThickness, 'lineThickness', 0.5, 8, 0.25, 'px', 2)}
          {slider('NODE SIZE', cfg.nodeSize, 'nodeSize', 0.5, 8, 0.25, 'px', 2)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {slider('CURVATURE', cfg.curvature, 'curvature', 0, 1, 0.02, '', 2)}
          {slider('PERSPECTIVE', cfg.perspectiveAmount, 'perspectiveAmount', 0, 1, 0.02, '', 2)}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-[#1a1a1a]">
          <span className="text-[10px] uppercase text-white font-bold">SHOW NODES</span>
          <button
            type="button"
            onClick={() => update({ showNodes: !cfg.showNodes })}
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border transition-all ${
              cfg.showNodes
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-[#181818] text-[#777] border-[#333]'
            }`}
          >
            {cfg.showNodes ? 'ON' : 'OFF'}
          </button>
        </div>
        {cfg.showNodes && (
          <p className="text-[8px] text-[#666] font-sans leading-relaxed">
            {hasUploadedSvg
              ? 'Your uploaded SVG (GRID tab → 02_Custom SVG panel) is active — net knots render as that logo.'
              : 'Upload an SVG from the GRID tab\'s "02_Custom SVG Dot Layers" panel to use it as the net knots.'}
          </p>
        )}
      </div>

      {/* Motion Response */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
          <Waves className="w-3.5 h-3.5" /> MOTION RESPONSE
        </span>
        <p className="text-[8px] text-[#666] font-sans leading-relaxed -mt-1">
          Scales the wave engine's own displacement vector at each intersection — the sine motion
          itself lives in the WAVE tab above.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {slider('DISPLACEMENT STRENGTH', cfg.displacementStrength, 'displacementStrength', 0, 3, 0.05, 'x', 2)}
          {slider('DAMPING', cfg.damping, 'damping', 0, 1, 0.02, '', 2)}
        </div>
      </div>

      {/* Impact note (reuses WAVE tab — no duplicate sliders) */}
      <div className="p-3 bg-[#0d0d12] border border-[#262630] rounded-lg space-y-1.5">
        <span className="text-[11px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" /> IMPACT ORIGIN
        </span>
        <p className="text-[8px] text-[#666] font-sans leading-relaxed">
          Set from the WAVE tab: Ripple Origin X/Y is the impact point, Radial Thickness is the impact
          falloff, and Wave Pattern (Circular/Linear/Spiral/Interference) picks how the ripple spreads.
        </p>
      </div>

      {/* Style */}
      <div className="space-y-2.5 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> STYLE & GLOW
        </span>
        <div className="grid grid-cols-2 gap-3">
          {colorField('LINE COLOR', cfg.lineColor, 'lineColor')}
          {colorField('NODE COLOR', cfg.nodeColor, 'nodeColor')}
        </div>
        {colorField('ACCENT (IMPACT GLOW)', cfg.accentColor, 'accentColor')}
        <div className="grid grid-cols-2 gap-3">
          {slider('LINE OPACITY', cfg.lineOpacity, 'lineOpacity', 0, 1, 0.02, '', 2)}
          {slider('GLOW INTENSITY', cfg.glowIntensity, 'glowIntensity', 0, 1.5, 0.02, '', 2)}
        </div>
      </div>

      {/* Material Variations */}
      <div className="space-y-2 p-3 bg-[#0d0d12] border border-[#262630] rounded-lg">
        <span className="text-[11px] font-bold uppercase text-emerald-400">MATERIAL VARIATIONS</span>
        <div className="grid grid-cols-1 gap-1.5">
          {MATERIAL_VARIATIONS.map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => update(m.patch)}
              className="p-1.5 rounded bg-[#121622] hover:bg-[#182030] border border-[#223048] text-left transition-colors"
            >
              <span className="block text-[9.5px] font-bold uppercase text-[#cbd5e1]">{m.name}</span>
              <span className="text-[7.5px] opacity-70 block text-[#888]">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
