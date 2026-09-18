import React from 'react';
import { RenderState, DynamicThicknessConfig, ThicknessBehaviorMode } from '../types';
import { DEFAULT_DYNAMIC_THICKNESS_CONFIG } from '../utils/wave';
import { Layers, Activity } from 'lucide-react';

interface DynamicThicknessControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const MODES: { id: ThicknessBehaviorMode; name: string; desc: string }[] = [
  { id: 'uniform', name: 'UNIFORM', desc: 'All waves share the same thickness' },
  { id: 'radial_gradient', name: 'RADIAL GRADIENT', desc: 'Thickness changes from center to edge' },
  { id: 'random', name: 'RANDOM', desc: 'Each wave gets a different deterministic thickness' },
  { id: 'animated', name: 'ANIMATED', desc: 'Thickness oscillates continuously between min/max' }
];

/**
 * Dynamic Visual Thickness (2D) — ports the 3D Radial Wave's per-ring thickness modulation
 * (Radial3DConfig.thicknessAnimEnabled/min/max/frequency/phaseOffset/speed/randomness) into the
 * existing 2D concentric ripple system, without bringing over 3D rotation/camera/depth. Reuses the
 * same wave calculation pipeline (wave.ts -> localThickness), so it works across every material
 * (Line, Dot Matrix, ASCII, Diamond, Custom SVG, Stitch) automatically since they all read the same
 * wave intensity/band width. Disabled by default — zero effect on any existing preset until enabled.
 */
export const DynamicThicknessControls: React.FC<DynamicThicknessControlsProps> = ({ state, onUpdateState }) => {
  const dt = state.wave.dynamicThickness ?? DEFAULT_DYNAMIC_THICKNESS_CONFIG;

  const updateDT = (patch: Partial<DynamicThicknessConfig>) => {
    onUpdateState((prev) => ({
      ...prev,
      wave: {
        ...prev.wave,
        dynamicThickness: { ...(prev.wave.dynamicThickness ?? DEFAULT_DYNAMIC_THICKNESS_CONFIG), ...patch }
      }
    }));
  };

  const slider = (
    label: string,
    value: number,
    field: keyof DynamicThicknessConfig,
    min: number,
    max: number,
    step: number,
    unit = '',
    decimals = 2
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[#888] text-[10px] uppercase">{label}</label>
        <span className="text-[#00F0FF] text-[10px] font-bold">
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
        onChange={(e) => updateDT({ [field]: parseFloat(e.target.value) } as Partial<DynamicThicknessConfig>)}
        className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
      />
    </div>
  );

  const showMinMax = dt.mode !== 'uniform';
  const showAnimated = dt.mode === 'animated';
  const showRandomness = dt.mode === 'animated' || dt.mode === 'random';

  return (
    <div className="space-y-3 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg font-mono">
      <div className="flex items-center justify-between pb-1 border-b border-[#222]">
        <div className="flex items-center space-x-2 text-[#00F0FF]">
          <Layers className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">DYNAMIC VISUAL THICKNESS</span>
        </div>
        <button
          type="button"
          onClick={() => updateDT({ enabled: !dt.enabled })}
          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border transition-all ${
            dt.enabled
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
              : 'bg-[#181818] text-[#777] border-[#333]'
          }`}
        >
          {dt.enabled ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        Gives each concentric wave its own independent visual width — e.g. Wave 1 thick, Wave 2 thin,
        Wave 3 medium — ported from the 3D Radial Wave's ring thickness system. This is the width of the
        wave band itself, not particle size or amplitude. Works with every material since it modulates
        the shared wave calculation. Spatial Frequency (wave spacing) stays fully independent — unless
        Advanced Frequency Control above is set to Thickness Only / Combined, which also nudges the
        Thickness Frequency slider below.
      </p>

      {dt.enabled && (
        <>
          {/* Behavior Mode selector */}
          <div className="grid grid-cols-2 gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => updateDT({ mode: m.id })}
                title={m.desc}
                className={`p-1.5 rounded border text-left transition-colors ${
                  dt.mode === m.id
                    ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold'
                    : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
                }`}
              >
                <span className="block text-[9px] font-bold uppercase">{m.name}</span>
              </button>
            ))}
          </div>

          {dt.mode === 'uniform' &&
            slider('BASE THICKNESS', dt.baseThickness, 'baseThickness', 0.1, 4, 0.05, 'x', 2)}

          {showMinMax && (
            <div className="grid grid-cols-2 gap-3">
              {slider('MINIMUM THICKNESS', dt.minThickness, 'minThickness', 0.05, 3, 0.05, 'x', 2)}
              {slider('MAXIMUM THICKNESS', dt.maxThickness, 'maxThickness', 0.1, 4, 0.05, 'x', 2)}
            </div>
          )}

          {showAnimated && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {slider('THICKNESS FREQUENCY', dt.thicknessFrequency, 'thicknessFrequency', 0, 5, 0.1, '', 1)}
                {slider('ANIMATION SPEED', dt.animSpeed, 'animSpeed', 0, 4, 0.05, 'x', 2)}
              </div>
              {slider('PHASE OFFSET', dt.phaseOffset, 'phaseOffset', -6.3, 6.3, 0.1, ' rad', 1)}
            </>
          )}

          {showRandomness &&
            slider(
              dt.mode === 'animated' ? 'THICKNESS RANDOMNESS (COMBINE)' : 'THICKNESS RANDOMNESS',
              dt.randomness,
              'randomness',
              0,
              1,
              0.05,
              '',
              2
            )}

          {/* Audio Thickness Influence */}
          <div className="pt-2 border-t border-[#1a1a1a] space-y-2">
            <span className="text-[10px] font-bold uppercase text-white flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[#00F0FF]" /> AUDIO THICKNESS INFLUENCE
            </span>
            <p className="text-[9px] text-[#666] font-sans leading-relaxed">
              Bass smoothly increases ring thickness; quiet passages relax it back. Requires Audio
              Reactivity enabled below — never spawns new rings, only modulates these existing ones.
            </p>
            {slider('INFLUENCE AMOUNT', dt.audioThicknessInfluence, 'audioThicknessInfluence', 0, 1, 0.05, '', 2)}
          </div>
        </>
      )}
    </div>
  );
};
