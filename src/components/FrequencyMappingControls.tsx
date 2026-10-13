import React from 'react';
import { RenderState, WaveConfig, FrequencyMappingMode } from '../types';
import { GitBranch, Move } from 'lucide-react';

interface FrequencyMappingControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const MODES: { id: FrequencyMappingMode; name: string; desc: string }[] = [
  { id: 'spatial_only', name: 'Chỉ không gian', desc: 'Frequency chỉ điều khiển khoảng cách sóng (mặc định)' },
  { id: 'thickness_only', name: 'Chỉ độ dày', desc: 'Frequency chỉ điều khiển tần số của Dynamic Thickness' },
  { id: 'motion_only', name: 'Chỉ chuyển động', desc: 'Frequency chỉ điều khiển pha chuyển động của sóng' },
  { id: 'combined', name: 'Kết hợp', desc: 'Một Frequency chủ điều khiển cả ba cùng lúc' }
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
        <label className="text-[10px] uppercase" style={{ color: 'var(--muted)' }}>{label}</label>
        <span className="text-[10px] font-bold" style={{ color: 'var(--modified-ink)' }}>
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
        className="w-full h-[2px] appearance-none cursor-pointer"
        style={{ background: 'var(--track)', accentColor: 'var(--modified)' }}
      />
    </div>
  );

  const showMotion = mapping === 'motion_only' || mapping === 'combined' || (wave.waveMotionAmplitude ?? 0) > 0;

  return (
    <div className="space-y-3 p-3 rounded-[var(--radius-input)] border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', fontFamily: 'var(--font-ui)' }}>
      <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center space-x-2" style={{ color: 'var(--modified-ink)' }}>
          <GitBranch className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">Điều khiển tần số nâng cao</span>
        </div>
      </div>

      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Hai kiểu ánh xạ tần số độc lập: Không gian (khoảng cách sóng — slider Frequency ở trên) và
        Chuyển động (lệch pha hữu cơ từng sóng). Frequency Mapping chọn kiểu nào mà slider Frequency chủ
        cũng điều khiển. Ánh xạ độ dày sẽ nạp vào panel Dynamic Visual Thickness bên dưới.
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => updateWave({ frequencyMapping: m.id })}
            title={m.desc}
            className="p-1.5 rounded-[var(--radius-input)] border text-left transition-colors"
            style={
              mapping === m.id
                ? { background: 'var(--modified-bg)', borderColor: 'var(--modified)', color: 'var(--modified-ink)' }
                : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)' }
            }
          >
            <span className="block text-[9.5px] font-bold uppercase">{m.name}</span>
          </button>
        ))}
      </div>

      {(mapping === 'thickness_only' || mapping === 'combined') && (
        <p className="text-[10px] -mt-1" style={{ color: 'var(--muted)' }}>
          Bật Dynamic Visual Thickness bên dưới (chế độ khác Uniform) để thấy ảnh hưởng của mục này.
        </p>
      )}

      {mapping === 'combined' && (
        <div className="grid grid-cols-2 gap-3 pt-1">
          {slider('→ Ảnh hưởng độ dày', wave.freqThicknessInfluence || 0, 'freqThicknessInfluence', 0, 1, 0.05, '', 2)}
          {slider('→ Ảnh hưởng chuyển động', wave.freqMotionInfluence || 0, 'freqMotionInfluence', 0, 1, 0.05, '', 2)}
        </div>
      )}

      {mapping === 'thickness_only' &&
        slider('→ Ảnh hưởng độ dày', wave.freqThicknessInfluence || 0, 'freqThicknessInfluence', 0, 1, 0.05, '', 2)}

      <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[10px] font-bold uppercase flex items-center gap-1.5" style={{ color: 'var(--ink)' }}>
          <Move className="w-3 h-3" style={{ color: 'var(--modified-ink)' }} /> Tần số chuyển động
        </span>
        {slider('Biên độ chuyển động', wave.waveMotionAmplitude || 0, 'waveMotionAmplitude', 0, 1, 0.02, '', 2)}
        {showMotion && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {slider('Tần số chuyển động', wave.waveMotionFrequency ?? 1.0, 'waveMotionFrequency', 0, 5, 0.1, '', 1)}
              {slider('Tốc độ chuyển động', wave.waveMotionSpeed ?? 1.0, 'waveMotionSpeed', 0, 4, 0.05, 'x', 2)}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {slider('Lệch pha', wave.waveMotionPhaseOffset || 0, 'waveMotionPhaseOffset', -6.3, 6.3, 0.1, ' rad', 1)}
              {slider('Biến thiên chuyển động', wave.waveMotionVariation || 0, 'waveMotionVariation', 0, 1, 0.05, '', 2)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
