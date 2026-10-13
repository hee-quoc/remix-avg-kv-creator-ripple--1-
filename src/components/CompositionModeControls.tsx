import React from 'react';
import { RenderState, CompositionMode } from '../types';
import { Layout, Type, Eye, EyeOff } from 'lucide-react';

interface CompositionModeControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

export const CompositionModeControls: React.FC<CompositionModeControlsProps> = ({
  state,
  onUpdateState
}) => {
  const currentMode = state.compositionMode || 'full_molecule';

  const modes: { id: CompositionMode; title: string; subtitle: string }[] = [
    {
      id: 'full_molecule',
      title: 'Full Molecule',
      subtitle: 'Hạt sóng halftone che trực tiếp theo hình chữ.'
    },
    {
      id: 'molecule_wave_only',
      title: 'Molecule Wave Only',
      subtitle: 'Trường hạt sóng phủ toàn khung hình + lớp chữ sắc nét riêng.'
    },
    {
      id: 'editorial_collage',
      title: 'Editorial Collage',
      subtitle: 'Bố cục editorial tương phản cao với nhiều tầng tỉ lệ chữ.'
    }
  ];

  return (
    <div className="space-y-4" style={{ fontFamily: 'var(--font-ui)' }}>
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center space-x-2">
          <Layout className="w-3.5 h-3.5" style={{ color: 'var(--modified)' }} />
          <span className="text-[11px] font-bold uppercase tracking-wider">Kiến trúc bố cục</span>
        </div>
        <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--modified-ink)', fontFamily: 'var(--font-mono)' }}>
          {currentMode.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Chuyển giữa chế độ halftone che theo hình chữ và trường hạt sóng độc lập với lớp chữ phủ sắc nét.
      </p>

      <div
        className="p-3 rounded-[var(--radius-input)] border flex items-center justify-between"
        style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center space-x-2">
          {state.showEffectText !== false ? (
            <Eye className="w-3.5 h-3.5" style={{ color: 'var(--modified)' }} />
          ) : (
            <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
          )}
          <div>
            <span className="block text-[11px] font-bold uppercase" style={{ color: 'var(--ink)' }}>
              Effect Text (lớp Molecule)
            </span>
            <span className="block text-[9.5px]" style={{ color: 'var(--muted)' }}>
              Lớp chữ dạng hạt/sóng sinh thành
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onUpdateState((prev) => ({
              ...prev,
              showEffectText: prev.showEffectText === false ? true : false
            }))
          }
          className="px-3 py-1.5 rounded-[var(--radius-pill)] text-[10px] font-bold uppercase border transition-colors"
          style={
            state.showEffectText !== false
              ? { background: 'var(--modified-bg)', color: 'var(--modified-ink)', borderColor: 'var(--modified)' }
              : { background: 'var(--chip)', color: 'var(--muted)', borderColor: 'var(--border)' }
          }
        >
          {state.showEffectText !== false ? 'Hiện' : 'Ẩn'}
        </button>
      </div>

      <div className="space-y-2">
        {modes.map((m) => {
          const isSelected = currentMode === m.id;
          return (
            <div
              key={m.id}
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  compositionMode: m.id
                }))
              }
              className="p-3 rounded-[var(--radius-input)] border cursor-pointer transition-colors"
              style={{
                background: isSelected ? 'var(--modified-bg)' : 'var(--surface-2)',
                borderColor: isSelected ? 'var(--modified)' : 'var(--border)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase" style={{ color: isSelected ? 'var(--modified-ink)' : 'var(--ink)' }}>
                  {m.title}
                </span>
                {isSelected && (
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: 'var(--modified)', color: 'var(--surface)', fontFamily: 'var(--font-mono)' }}
                  >
                    ĐANG DÙNG
                  </span>
                )}
              </div>
              <p className="text-[10.5px] mt-1 leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {m.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {(currentMode === 'molecule_wave_only' || currentMode === 'editorial_collage') && (
        <div
          className="space-y-3 pt-3 border-t p-3 rounded-[var(--radius-input)] border"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
        >
          <div className="flex items-center space-x-2" style={{ color: 'var(--modified-ink)' }}>
            <Type className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase">Lớp chữ phủ gốc</span>
          </div>
          <p className="text-[10px] leading-relaxed -mt-1" style={{ color: 'var(--muted)' }}>
            Vị trí/tỉ lệ nhanh cho lớp chữ sắc nét của bố cục này (dùng lại văn bản từ tab Text). Để có
            nội dung, font và bố cục KV hoàn toàn độc lập, dùng các control Text Layout bên dưới.
          </p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase" style={{ color: 'var(--muted)' }}>Tỉ lệ chữ</label>
              <span className="text-[10px]" style={{ color: 'var(--modified-ink)' }}>
                {((state.style.editorialHeadlineScale ?? 1.0) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={state.style.editorialHeadlineScale ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateState((prev) => ({
                  ...prev,
                  style: { ...prev.style, editorialHeadlineScale: val }
                }));
              }}
              className="w-full h-1 rounded appearance-none cursor-pointer"
              style={{ accentColor: 'var(--modified)', background: 'var(--track)' }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase" style={{ color: 'var(--muted)' }}>Độ mờ chữ</label>
              <span className="text-[10px]" style={{ color: 'var(--modified-ink)' }}>
                {((state.style.editorialHeadlineOpacity ?? 1.0) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={state.style.editorialHeadlineOpacity ?? 1.0}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateState((prev) => ({
                  ...prev,
                  style: { ...prev.style, editorialHeadlineOpacity: val }
                }));
              }}
              className="w-full h-1 rounded appearance-none cursor-pointer"
              style={{ accentColor: 'var(--modified)', background: 'var(--track)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase block mb-1" style={{ color: 'var(--muted)' }}>Lệch X</label>
              <input
                type="range"
                min="-300"
                max="300"
                step="5"
                value={state.style.editorialHeadlineOffsetX || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdateState((prev) => ({
                    ...prev,
                    style: { ...prev.style, editorialHeadlineOffsetX: val }
                  }));
                }}
                className="w-full h-1 rounded appearance-none cursor-pointer"
                style={{ accentColor: 'var(--modified)', background: 'var(--track)' }}
              />
              <span className="text-[9.5px] block text-right" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {state.style.editorialHeadlineOffsetX || 0}px
              </span>
            </div>

            <div>
              <label className="text-[10px] uppercase block mb-1" style={{ color: 'var(--muted)' }}>Lệch Y</label>
              <input
                type="range"
                min="-300"
                max="300"
                step="5"
                value={state.style.editorialHeadlineOffsetY || 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onUpdateState((prev) => ({
                    ...prev,
                    style: { ...prev.style, editorialHeadlineOffsetY: val }
                  }));
                }}
                className="w-full h-1 rounded appearance-none cursor-pointer"
                style={{ accentColor: 'var(--modified)', background: 'var(--track)' }}
              />
              <span className="text-[9.5px] block text-right" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {state.style.editorialHeadlineOffsetY || 0}px
              </span>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase block mb-1" style={{ color: 'var(--muted)' }}>Màu lớp phủ</label>
            <div
              className="flex items-center space-x-2 p-1.5 rounded-[var(--radius-input)] border"
              style={{ background: 'var(--chip)', borderColor: 'var(--border)' }}
            >
              <input
                type="color"
                value={state.style.editorialHeadlineColor || '#ffffff'}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    style: { ...prev.style, editorialHeadlineColor: e.target.value }
                  }))
                }
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <input
                type="text"
                value={state.style.editorialHeadlineColor || '#ffffff'}
                onChange={(e) =>
                  onUpdateState((prev) => ({
                    ...prev,
                    style: { ...prev.style, editorialHeadlineColor: e.target.value }
                  }))
                }
                className="w-full bg-transparent text-[10px] focus:outline-none uppercase"
                style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
