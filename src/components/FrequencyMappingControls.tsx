import React from 'react';
import { RenderState, WaveConfig, FrequencyMappingMode } from '../types';
import { GitBranch, Move } from 'lucide-react';

interface FrequencyMappingControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const MODES: { id: FrequencyMappingMode; name: string; desc: string }[] = [
  { id: 'spatial_only', name: 'SPATIAL ONLY', desc: 'Frequency drives wave spacing only (default)' },
  { id: 'thickness_only', name: 'THICKNESS ONLY', desc: 'Frequency drives Dynamic Thickness’s frequency only' },
  { id: 'motion_only', name: 'MOTION ONLY', desc: 'Frequency drives wave motion phase only' },
  { id: 'combined', name: 'COMBINED', desc: 'One master Frequency drives all three at once' }
];

/**
 * Advanced Frequency Control (item 1): lets Frequency become a flexible generative parameter that
 * can influence spatial distribution, thickness, and motion — independently or combined. Every field
 * here is additive-only and defaults to values that reproduce today's exact behavior (Spatial Only,
 * Motion Amplitude 0), so no existing preset changes until a user opts in.
 *
 * Thickness animation itself now lives entirely in the "DYNAMIC VISUAL THICKNESS" panel below (a
 * single ring-based system with Uniform/Radial Gradient/Random/Animated modes) — this panel used to
 * carry its own separate "Thickness Frequency" slider group with near-identical fields (min/max
 * thickness, frequency, animation speed, randomness), which read as a confusing duplicate sitting
 * right next to the newer panel. THICKNESS ONLY / COMBINED here just feed that panel's frequency.
 */
export const FrequencyMappingControls: React.FC<FrequencyMappingControlsProps> = ({ state, onUpdateState }) => {
  const wave = state.wave;
  const mapping = wave.frequencyMapping || 'spatial_only';

  const updateWave = (patch: Partial<WaveConfig>) => {
    onUpdateState((prev) => ({ ...prev, wave: { ...prev.wave, ...patch } }));
  };

  const slider = (
    label: string,
    value: number,
    field: keyof WaveConfig,
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
        onChange={(e) => updateWave({ [field]: parseFloat(e.target.value) } as Partial<WaveConfig>)}
        className="w-full h-[2px] bg-[#222] appearance-none cursor-pointer accent-[#00F0FF]"
      />
    </div>
  );

  const showMotion = mapping === 'motion_only' || mapping === 'combined' || (wave.waveMotionAmplitude ?? 0) > 0;

  return (
    <div className="space-y-3 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg font-mono">
      <div className="flex items-center justify-between pb-1 border-b border-[#222]">
        <div className="flex items-center space-x-2 text-[#00F0FF]">
          <GitBranch className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">ADVANCED FREQUENCY CONTROL</span>
        </div>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        Two independent frequency mappings: Spatial (wave spacing — the existing Frequency slider
        above) and Motion (organic per-wave phase drift). Frequency Mapping picks which one the master
        Frequency slider also drives. Thickness mapping feeds the Dynamic Visual Thickness panel below.
      </p>

      {/* Frequency Mapping selector */}
      <div className="grid grid-cols-2 gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => updateWave({ frequencyMapping: m.id })}
            title={m.desc}
            className={`p-1.5 rounded border text-left transition-colors ${
              mapping === m.id
                ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF] font-bold'
                : 'bg-[#121212] border-[#222] text-[#888] hover:text-white'
            }`}
          >
            <span className="block text-[9px] font-bold uppercase">{m.name}</span>
          </button>
        ))}
      </div>

      {(mapping === 'thickness_only' || mapping === 'combined') && (
        <p className="text-[9px] text-[#666] font-sans -mt-1">
          Enable Dynamic Visual Thickness below (any mode other than Uniform) to see this take effect.
        </p>
      )}

      {mapping === 'combined' && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          {slider('→ THICKNESS INFLUENCE', wave.freqThicknessInfluence || 0, 'freqThicknessInfluence', 0, 1, 0.05, '', 2)}
          {slider('→ MOTION INFLUENCE', wave.freqMotionInfluence || 0, 'freqMotionInfluence', 0, 1, 0.05, '', 2)}
        </div>
      )}

      {mapping === 'thickness_only' &&
        slider('→ THICKNESS INFLUENCE', wave.freqThicknessInfluence || 0, 'freqThicknessInfluence', 0, 1, 0.05, '', 2)}

      {/* Motion Frequency system */}
      <div className="space-y-2 pt-2 border-t border-[#1a1a1a]">
        <span className="text-[10px] font-bold uppercase text-white flex items-center gap-1.5">
          <Move className="w-3 h-3 text-[#00F0FF]" /> MOTION FREQUENCY
        </span>
        {slider('MOTION AMPLITUDE', wave.waveMotionAmplitude || 0, 'waveMotionAmplitude', 0, 1, 0.02, '', 2)}
        {showMotion && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {slider('MOTION FREQUENCY', wave.waveMotionFrequency ?? 1.0, 'waveMotionFrequency', 0, 5, 0.1, '', 1)}
              {slider('MOTION SPEED', wave.waveMotionSpeed ?? 1.0, 'waveMotionSpeed', 0, 4, 0.05, 'x', 2)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {slider('PHASE OFFSET', wave.waveMotionPhaseOffset || 0, 'waveMotionPhaseOffset', -6.3, 6.3, 0.1, ' rad', 1)}
              {slider('MOTION VARIATION', wave.waveMotionVariation || 0, 'waveMotionVariation', 0, 1, 0.05, '', 2)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
