import React, { useState } from 'react';
import { RenderState } from '../types';
import { PRESETS, PresetCategory } from '../data/presets';
import { FLIP_DISC_PRESETS } from '../flipDisc/presets';
import { Sparkles, Check, Radio, Flower2 } from 'lucide-react';

interface PresetGalleryProps {
  state: RenderState;
  onSelectPreset: (presetId: string) => void;
  onSelectFlipDiscPreset?: (presetId: string) => void;
}

const CATEGORIES: { id: PresetCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'ALL' },
  { id: 'News', label: 'NEWS' },
  { id: 'Technology', label: 'TECH' },
  { id: 'Finance', label: 'FINANCE' },
  { id: 'Automotive', label: 'AUTO' },
  { id: 'Entertainment', label: 'ENTERTAINMENT' },
  { id: 'Sports', label: 'SPORTS' },
  { id: 'Culture', label: 'CULTURE' },
  { id: 'Children', label: 'CHILDREN' }
];

export const PresetGallery: React.FC<PresetGalleryProps> = ({ state, onSelectPreset, onSelectFlipDiscPreset }) => {
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'ALL'>('ALL');

  const filteredPresets = selectedCategory === 'ALL'
    ? PRESETS
    : selectedCategory === 'Children'
    ? []
    : PRESETS.filter(
        (p) =>
          p.category === selectedCategory ||
          p.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase())
      );

  // Flip Disc 3D — a separate, self-contained "Children" engine (src/flipDisc/), shown alongside the
  // normal RenderState-based preset cards but routed through onSelectFlipDiscPreset instead.
  const showFlipDiscCards = selectedCategory === 'ALL' || selectedCategory === 'Children';

  return (
    <div className="space-y-4 font-mono">
      {/* Header & Subtitle */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            KV PRESET SYSTEM
          </span>
        </div>
        <span className="text-[10px] text-[#888] font-mono">
          {PRESETS.length + FLIP_DISC_PRESETS.length} PRESETS / {CATEGORIES.length - 1} CATEGORIES
        </span>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => {
          const count = cat.id === 'ALL'
            ? PRESETS.length + FLIP_DISC_PRESETS.length
            : cat.id === 'Children'
            ? FLIP_DISC_PRESETS.length
            : PRESETS.filter((p) => p.category === cat.id).length;

          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono tracking-wider transition-all border ${
                isActive
                  ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/60 font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                  : 'bg-[#121212] text-[#888] border-[#222] hover:text-[#ccc] hover:border-[#444]'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Preset Cards List */}
      <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
        {filteredPresets.map((preset) => {
          const isActive = state.activePresetId === preset.id;
          const config = preset.config;
          const dotColor = config.style?.dotColor || '#00f0ff';
          const bgColor = config.style?.bgColor || '#0a0d14';
          const accentColor = config.style?.accentColor || '#38bdf8';

          return (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={`p-3 rounded-lg border transition-all cursor-pointer text-left relative overflow-hidden group ${
                isActive
                  ? 'bg-[#181c24] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'bg-[#0e0e11] border-[#222] hover:border-[#444] hover:bg-[#141418]'
              }`}
            >
              {/* Category Badge & Palette swatch */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-[#1a1a24] text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
                    {preset.category}
                  </span>
                  {config.compositionMode === 'molecule_wave_only' && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      WAVE ONLY
                    </span>
                  )}
                  {(config.wave?.soundReactivity ?? 0) > 0 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                      <Radio className="w-2.5 h-2.5 animate-pulse" />
                      <span>AUDIO</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5">
                  <div
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: bgColor }}
                    title={`BG: ${bgColor}`}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: dotColor }}
                    title={`Dot: ${dotColor}`}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white/20 shadow-xs"
                    style={{ backgroundColor: accentColor }}
                    title={`Accent: ${accentColor}`}
                  />
                </div>
              </div>

              {/* Title & Name */}
              <div className="flex items-center justify-between">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-[#00F0FF]' : 'text-white group-hover:text-[#00F0FF]'}`}>
                  {preset.name}
                </h4>
                {isActive && (
                  <span className="flex items-center space-x-1 text-[10px] text-[#00F0FF] font-bold">
                    <Check className="w-3 h-3" />
                    <span>ACTIVE</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[10px] text-[#999] leading-relaxed mt-1 font-sans line-clamp-2">
                {preset.description}
              </p>

              {/* Formula Blueprint Pills */}
              <div className="mt-2.5 pt-2 border-t border-[#1f1f26] flex flex-wrap gap-1 text-[9px] text-[#777]">
                <span className="bg-[#16161c] px-1.5 py-0.5 rounded border border-[#2a2a35] text-[#bbb]">
                  Wave: {config.wave?.pattern || 'circular'}
                </span>
                <span className="bg-[#16161c] px-1.5 py-0.5 rounded border border-[#2a2a35] text-[#bbb]">
                  Shape: {config.grid?.dotShape || 'circle'}
                </span>
                <span className="bg-[#16161c] px-1.5 py-0.5 rounded border border-[#2a2a35] text-[#bbb]">
                  Grid: {config.grid?.gridType || 'square'}
                </span>
              </div>
            </div>
          );
        })}

        {/* Flip Disc 3D — separate "Children" engine (src/flipDisc/), routed through
            onSelectFlipDiscPreset instead of the RenderState preset pipeline above. */}
        {showFlipDiscCards &&
          onSelectFlipDiscPreset &&
          FLIP_DISC_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onSelectFlipDiscPreset(preset.id)}
              className="p-3 rounded-lg border border-pink-500/30 bg-[#160e18] hover:border-pink-500/60 hover:bg-[#1d1220] transition-all cursor-pointer text-left relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/30 font-bold flex items-center gap-1">
                    <Flower2 className="w-2.5 h-2.5" /> Children
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                    FLIP DISC 3D
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: preset.config.frontColor }} />
                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: preset.config.backColor }} />
                  <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: preset.config.sideColor }} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white group-hover:text-pink-300">
                  {preset.name}
                </h4>
              </div>

              <p className="text-[10px] text-[#999] leading-relaxed mt-1 font-sans line-clamp-2">
                {preset.description}
              </p>

              <div className="mt-2.5 pt-2 border-t border-[#1f1f26] flex flex-wrap gap-1 text-[9px] text-[#777]">
                <span className="bg-[#16161c] px-1.5 py-0.5 rounded border border-[#2a2a35] text-[#bbb]">
                  Shape: {preset.config.shape}
                </span>
                <span className="bg-[#16161c] px-1.5 py-0.5 rounded border border-[#2a2a35] text-[#bbb]">
                  Material: {preset.config.material}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
