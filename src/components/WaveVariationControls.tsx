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
        <label className="text-[#888] text-[10px] uppercase">{label}</label>
        <span className="text-[#00F0FF] text-[10px]">{(value * 100).toFixed(0)}%</span>
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
        className="w-full accent-[#00F0FF] bg-[#1a1a1a] h-1 rounded appearance-none cursor-pointer"
      />
    </div>
  );

  return (
    <div className="space-y-3 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg font-mono">
      <div className="flex items-center justify-between pb-1 border-b border-[#222]">
        <div className="flex items-center space-x-2 text-[#00F0FF]">
          <Waves className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">
            RANDOM WAVE VARIATION
          </span>
        </div>
        <button
          onClick={toggleEnabled}
          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border transition-all ${
            isEnabled
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
              : 'bg-[#181818] text-[#777] border-[#333]'
          }`}
        >
          {isEnabled ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>

      <p className="text-[9px] text-[#888] font-sans leading-relaxed">
        Lets consecutive waves differ in size, frequency, and intensity (e.g. wave 1 large, wave 2 small,
        wave 3 medium) instead of repeating identically. Deterministic via the seed below — same seed
        always reproduces the same sequence. Frequency (spacing/repetition) and Size (scale) stay
        separate parameters, matching the manual Wave tab controls above.
      </p>

      {slider('FREQUENCY VARIATION', frequencyVariation, 'frequencyVariation')}
      {slider('AMPLITUDE VARIATION', amplitudeVariation, 'amplitudeVariation')}
      {slider('WAVE SIZE RANDOMNESS', sizeRandomness, 'sizeRandomness')}
      {slider('WAVE INTERVAL VARIATION', intervalVariation, 'intervalVariation')}

      {/* Seed Generator */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[10px] text-[#888] uppercase block">RANDOM SEED</span>
          <span className="text-[#00F0FF] text-xs font-mono font-bold">
            #{wave.randomSeed || 42}
          </span>
        </div>
        <button
          onClick={randomizeSeed}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#181818] hover:bg-[#222] border border-[#333] hover:border-[#00F0FF]/50 text-white text-[10px] font-bold uppercase transition-colors"
        >
          <Shuffle className="w-3 h-3 text-[#00F0FF]" />
          <span>RANDOMIZE</span>
        </button>
      </div>
    </div>
  );
};
