import React, { useState } from 'react';
import { RenderState } from '../types';
import { PRESETS, PresetCategory } from '../data/presets';
import { Sparkles, Check, Radio } from 'lucide-react';

interface PresetGalleryProps {
  state: RenderState;
  onSelectPreset: (presetId: string) => void;
}

const CATEGORIES: { id: PresetCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'ALL (8)' },
  { id: 'News', label: 'NEWS' },
  { id: 'Technology', label: 'TECH' },
  { id: 'Finance', label: 'FINANCE' },
  { id: 'Automotive', label: 'AUTO' },
  { id: 'Entertainment', label: 'ENTERTAINMENT' },
  { id: 'Sports', label: 'SPORTS' },
  { id: 'Culture', label: 'CULTURE' }
];

export const PresetGallery: React.FC<PresetGalleryProps> = ({ state, onSelectPreset }) => {
  const [selectedCategory, setSelectedCategory] = useState<PresetCategory | 'ALL'>('ALL');

  const filteredPresets = selectedCategory === 'ALL'
    ? PRESETS
    : PRESETS.filter(
        (p) =>
          p.category === selectedCategory ||
          p.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase())
      );

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
          8 PRESETS / 6 CATEGORIES
        </span>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((cat) => {
          const count = cat.id === 'ALL'
            ? PRESETS.length
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
      </div>
    </div>
  );
};
