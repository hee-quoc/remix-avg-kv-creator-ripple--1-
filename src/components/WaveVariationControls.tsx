import React, { useRef } from 'react';
import { RenderState } from '../types';
import { Waves, Shuffle } from 'lucide-react';

interface WaveVariationControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

interface StashedVariation {
  frequencyVariation: number;
  amplitudeVariation: number;
  sizeRandomness: number;
  intervalVariation: number;
}

/**
 * Feature B — Advanced Wave Control: Random Wave Variation.
 * Wired directly to the real WaveConfig fields consumed by the wave engine
 * (wave.ts): frequencyVariation, amplitudeVariation, sizeRandomness,
 * intervalVariation, randomSeed. Defaults to 0 for every field the user
 * hasn't touched, so existing presets are unaffected until adjusted here.
 */
export const WaveVariationControls: React.FC<WaveVariationControlsProps> = ({
  state,
  onUpdateState
}) => {
  const wave = state.wave;
  const frequencyVariation = wave.frequencyVariation || 0;
  const amplitudeVariation = wave.amplitudeVariation || 0;
  const sizeRandomness = wave.sizeRandomness || 0;
  const intervalVariation = wave.intervalVariation || 0;

  const isEnabled =
    frequencyVariation > 0 || amplitudeVariation > 0 || sizeRandomness > 0 || intervalVariation > 0;

  // Remembers the last non-zero randomness values so the ENABLED/DISABLED
  // quick-toggle can restore them after being switched off.
  const stashRef = useRef<StashedVariation>({
    frequencyVariation: frequencyVariation || 0.35,
    amplitudeVariation: amplitudeVariation || 0.4,
    sizeRandomness: sizeRandomness || 0.35,
    intervalVariation: intervalVariation || 0.3
  });
  if (isEnabled) {
    stashRef.current = { frequencyVariation, amplitudeVariation, sizeRandomness, intervalVariation };
  }

  const toggleEnabled = () => {
    if (isEnabled) {
      onUpdateState((prev) => ({
        ...prev,
        wave: {
          ...prev.wave,
          frequencyVariation: 0,
          amplitudeVariation: 0,
          sizeRandomness: 0,
          intervalVariation: 0
        }
      }));
    } else {
      const stash = stashRef.current;
      onUpdateState((prev) => ({
        ...prev,
        wave: { ...prev.wave, ...stash }
      }));
    }
  };

  const randomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 9999);
    onUpdateState((prev) => ({
      ...prev,
      wave: { ...prev.wave, randomSeed: newSeed }
    }));
  };

  const slider = (
    label: string,
    value: number,
    field: 'frequencyVariation' | 'amplitudeVariation' | 'sizeRandomness' | 'intervalVariation'
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase" style={{ color: 'var(--muted)' }}>{label}</label>
        <span className="text-[10px]" style={{ color: 'var(--modified-ink)' }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.02"
        value={value}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          onUpdateState((prev) => ({
            ...prev,
            wave: { ...prev.wave, [field]: val }
          }));
        }}
        className="w-full h-1 rounded appearance-none cursor-pointer"
        style={{ accentColor: 'var(--modified)', background: 'var(--track)' }}
      />
    </div>
  );

  return (
    <div className="space-y-3 p-3 rounded-[var(--radius-input)] border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', fontFamily: 'var(--font-ui)' }}>
      <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center space-x-2" style={{ color: 'var(--modified-ink)' }}>
          <Waves className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">Biến thiên sóng ngẫu nhiên</span>
        </div>
        <button
          onClick={toggleEnabled}
          className="text-[9px] px-2 py-0.5 rounded font-bold uppercase border transition-colors"
          style={
            isEnabled
              ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
              : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
          }
        >
          {isEnabled ? 'Bật' : 'Tắt'}
        </button>
      </div>

      <p className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Cho các sóng liên tiếp khác nhau về kích thước, tần số và cường độ (sóng 1 lớn, sóng 2 nhỏ, sóng
        3 trung bình...) thay vì lặp lại giống nhau. Có tính tất định theo seed bên dưới — cùng seed
        luôn tái tạo cùng một chuỗi. Tần số (khoảng cách/lặp lại) và Kích thước (tỉ lệ) là hai tham số
        riêng biệt, khớp với các control thủ công ở tab Sóng phía trên.
      </p>

      {slider('Biến thiên tần số', frequencyVariation, 'frequencyVariation')}
      {slider('Biến thiên biên độ', amplitudeVariation, 'amplitudeVariation')}
      {slider('Độ ngẫu nhiên kích thước sóng', sizeRandomness, 'sizeRandomness')}
      {slider('Biến thiên khoảng cách sóng', intervalVariation, 'intervalVariation')}

      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] uppercase block" style={{ color: 'var(--muted)' }}>Seed ngẫu nhiên</span>
          <span className="text-xs font-bold" style={{ color: 'var(--modified-ink)', fontFamily: 'var(--font-mono)' }}>
            #{wave.randomSeed || 42}
          </span>
        </div>
        <button
          onClick={randomizeSeed}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-[var(--radius-pill)] border text-[10px] font-bold uppercase transition-colors"
          style={{ background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--ink)' }}
        >
          <Shuffle className="w-3 h-3" style={{ color: 'var(--modified-ink)' }} />
          <span>Xáo trộn</span>
        </button>
      </div>
    </div>
  );
};
