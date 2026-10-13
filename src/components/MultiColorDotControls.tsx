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
  { id: 'palette_list', label: 'Tuần tự', desc: 'Lưới lặp lại theo nhịp' },
  { id: 'random', label: 'Hash ngẫu nhiên', desc: 'Hạt rải tất định theo seed' },
  { id: 'grouped', label: 'Cột / nhóm', desc: 'Cụm dạng ticker theo cột dọc' },
  { id: 'gradient_based', label: 'Năng lượng sóng', desc: 'Màu đổi theo biên độ sóng cục bộ' }
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
    <div className="p-3 rounded-[var(--radius-input)] border space-y-3" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', fontFamily: 'var(--font-ui)' }}>
      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center space-x-2">
          <Palette className="w-3.5 h-3.5" style={{ color: 'var(--modified-ink)' }} />
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>
            Hệ thống đa màu
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="px-2.5 py-1 rounded-[var(--radius-pill)] text-[9px] font-bold uppercase border transition-colors"
          style={
            isEnabled
              ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
              : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
          }
        >
          {isEnabled ? 'Bật' : 'Tắt'}
        </button>
      </div>

      {isEnabled && (
        <>
          <div>
            <label className="block mb-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Bảng màu dựng sẵn
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_PALETTES.map((pal) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => handleSelectPreset(pal.colors)}
                  className="p-1.5 rounded-[var(--radius-input)] border flex items-center justify-between text-left transition-colors"
                  style={{ background: 'var(--chip)', borderColor: 'var(--border)' }}
                >
                  <span className="text-[9.5px]" style={{ color: 'var(--ink-2)' }}>{pal.name}</span>
                  <div className="flex items-center space-x-1">
                    {pal.colors.map((c, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border"
                        style={{ backgroundColor: c, borderColor: 'var(--border-strong)' }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Logic phân phối màu
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
                  className="p-1.5 rounded-[var(--radius-input)] border text-left transition-colors"
                  style={
                    currentDistribution === mode.id
                      ? { background: 'var(--modified-bg)', borderColor: 'var(--modified)', color: 'var(--modified-ink)' }
                      : { background: 'var(--chip)', borderColor: 'var(--border)', color: 'var(--muted)' }
                  }
                >
                  <span className="block text-[9.5px] font-bold uppercase">{mode.label}</span>
                  <span className="text-[8px] opacity-75 block">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Tùy chỉnh mẫu màu ({currentPalette.length}/8)
              </label>
              {currentPalette.length < 8 && (
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="flex items-center space-x-1 text-[9px]"
                  style={{ color: 'var(--modified-ink)' }}
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Thêm màu</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {currentPalette.map((color, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1 p-1 rounded-[var(--radius-input)] border"
                  style={{ background: 'var(--chip)', borderColor: 'var(--border)' }}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(idx, e.target.value)}
                    className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span className="text-[9px] uppercase" style={{ color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>{color}</span>
                  {currentPalette.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(idx)}
                      className="pl-1"
                      style={{ color: 'var(--muted)' }}
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
