import React from 'react';
import { RenderState, MultiColorDistribution } from '../types';
import { Palette, Plus, Trash2, Shuffle, Sparkles } from 'lucide-react';

interface MultiColorDotControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const PRESET_PALETTES = [
  {
    name: 'Market Tickers',
    colors: ['#10b981', '#ef4444', '#06b6d4', '#f59e0b', '#8b5cf6']
  },
  {
    name: 'Cyber Frequency',
    colors: ['#00f0ff', '#f43f5e', '#a855f7', '#fbbf24', '#3b82f6']
  },
  {
    name: 'Solar Heatmap',
    colors: ['#ef4444', '#f97316', '#facc15', '#10b981', '#06b6d4']
  },
  {
    name: 'Earthy Craft',
    colors: ['#f59e0b', '#e07a5f', '#81b29a', '#f2cc8f', '#3d405b']
  },
  {
    name: 'Cool Monochrome',
    colors: ['#ffffff', '#cbd5e1', '#94a3b8', '#64748b', '#38bdf8']
  }
];

const DISTRIBUTION_MODES: { id: MultiColorDistribution; label: string; desc: string }[] = [
  { id: 'palette_list', label: 'SEQUENTIAL', desc: 'Rhythmic alternating grid pattern' },
  { id: 'random', label: 'RANDOM HASH', desc: 'Deterministic scattered particle seed' },
  { id: 'grouped', label: 'COLUMNS / GROUPED', desc: 'Vertical ticker market clusters' },
  { id: 'gradient_based', label: 'WAVE ENERGY', desc: 'Color shifts with local wave amplitude' }
];

export const MultiColorDotControls: React.FC<MultiColorDotControlsProps> = ({
  state,
  onUpdateState
}) => {
  const isEnabled = state.style.enableMultiColor ?? false;
  const currentPalette = state.style.multiColorPalette || ['#10b981', '#ef4444', '#06b6d4', '#f59e0b', '#8b5cf6'];
  const currentDistribution = state.style.multiColorDistribution || 'palette_list';

  const handleToggle = () => {
    onUpdateState((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        enableMultiColor: !prev.style.enableMultiColor,
        multiColorPalette: prev.style.multiColorPalette || currentPalette,
        multiColorDistribution: prev.style.multiColorDistribution || 'palette_list'
      }
    }));
  };

  const handleSelectPreset = (colors: string[]) => {
    onUpdateState((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        enableMultiColor: true,
        multiColorPalette: [...colors]
      }
    }));
  };

  const handleColorChange = (index: number, newColor: string) => {
    const updated = [...currentPalette];
    updated[index] = newColor;
    onUpdateState((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        multiColorPalette: updated
      }
    }));
  };

  const handleAddColor = () => {
    if (currentPalette.length >= 8) return;
    const randomColors = ['#ec4899', '#14b8a6', '#6366f1', '#eab308', '#f97316'];
    const newColor = randomColors[currentPalette.length % randomColors.length];
    onUpdateState((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        multiColorPalette: [...currentPalette, newColor]
      }
    }));
  };

  const handleRemoveColor = (index: number) => {
    if (currentPalette.length <= 2) return;
    const updated = currentPalette.filter((_, i) => i !== index);
    onUpdateState((prev) => ({
      ...prev,
      style: {
        ...prev.style,
        multiColorPalette: updated
      }
    }));
  };

  return (
    <div className="p-3 bg-[#0a0f18] border border-[#1e293b] rounded-lg space-y-3 font-mono">
      {/* Header with Enable Switch */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
        <div className="flex items-center space-x-2">
          <Palette className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
            MULTI-COLOR DOT SYSTEM
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase border transition-colors ${
            isEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
              : 'bg-[#121218] text-[#888] border-[#333]'
          }`}
        >
          {isEnabled ? 'ACTIVE' : 'OFF'}
        </button>
      </div>

      {isEnabled && (
        <>
          {/* Preset Palettes */}
          <div>
            <label className="block text-[#888888] mb-1 text-[10px] uppercase tracking-wider">
              CURATED MULTI-COLOR PALETTES
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_PALETTES.map((pal) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => handleSelectPreset(pal.colors)}
                  className="p-1.5 rounded bg-[#111622] hover:bg-[#182030] border border-[#223048] flex items-center justify-between text-left transition-colors"
                >
                  <span className="text-[9.5px] text-[#cbd5e1]">{pal.name}</span>
                  <div className="flex items-center space-x-1">
                    {pal.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-black/40"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Distribution Mode */}
          <div>
            <label className="block text-[#888888] mb-1 text-[10px] uppercase tracking-wider">
              COLOR DISTRIBUTION LOGIC
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {DISTRIBUTION_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() =>
                    onUpdateState((prev) => ({
                      ...prev,
                      style: { ...prev.style, multiColorDistribution: mode.id }
                    }))
                  }
                  className={`p-1.5 rounded border text-left font-mono transition-colors ${
                    currentDistribution === mode.id
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                      : 'bg-[#111622] border-[#223048] text-[#888] hover:text-white'
                  }`}
                >
                  <span className="block text-[9px] font-bold uppercase">{mode.label}</span>
                  <span className="text-[7.5px] opacity-75 block">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Palette Chips */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#888888] text-[10px] uppercase tracking-wider">
                CUSTOMIZE PALETTE SWATCHES ({currentPalette.length}/8)
              </label>
              {currentPalette.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="flex items-center space-x-1 text-[9px] text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>ADD COLOR</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {currentPalette.map((color, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1 bg-[#111622] border border-[#223048] p-1 rounded group"
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(idx, e.target.value)}
                    className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span className="text-[9px] text-[#cbd5e1] font-mono uppercase">{color}</span>
                  {currentPalette.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(idx)}
                      className="text-gray-500 hover:text-rose-400 pl-1"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
