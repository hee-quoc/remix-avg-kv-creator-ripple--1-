import React from 'react';
import { RenderState } from '../types';
import { VISUAL_STYLES, VisualStyleDefinition } from '../data/visualStyles';
import { Layers, Check, Sparkles } from 'lucide-react';

interface VisualStyleGalleryProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

export const VisualStyleGallery: React.FC<VisualStyleGalleryProps> = ({
  state,
  onUpdateState
}) => {
  const handleSelectStyle = (style: VisualStyleDefinition) => {
    onUpdateState((prev) => {
      const next = style.apply(prev);
      // Every style's apply() unconditionally sets its own grid.dotShape (that's the whole point of
      // a visual style) — which would silently revert an uploaded SVG logo away from view even though
      // its data was never deleted. Unlike a full PRESET switch (a deliberate, holistic look change
      // where the target preset's own default shape legitimately takes over — see the compatibility
      // banor in ControlsDrawer.tsx), a visual STYLE switch is meant to update only the properties
      // that belong to that style; the user's explicit choice to render their own logo doesn't belong
      // to any built-in style, so it survives here instead of requiring a manual re-enable click.
      if (
        prev.grid.dotShape === 'custom_svg' &&
        prev.grid.customSvgLayers &&
        prev.grid.customSvgLayers.length > 0
      ) {
        return { ...next, grid: { ...next.grid, dotShape: 'custom_svg' } };
      }
      return next;
    });
  };

  return (
    <div className="space-y-3" style={{ fontFamily: 'var(--font-ui)' }}>
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5" style={{ color: 'var(--modified)' }} />
          <span className="text-[11px] font-bold uppercase tracking-wider">Thư viện Visual Style</span>
        </div>
        <span className="text-[10px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {VISUAL_STYLES.length} kiểu
        </span>
      </div>

      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Áp dụng kỹ thuật render chuyên biệt, từ lưới pixel kiến trúc, ma trận ASCII đến khối đùn 2.5D và
        mạng lưới constellation.
      </p>

      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {VISUAL_STYLES.map((style) => {
          const isSelected = state.activeVisualStyle === style.id || state.style.visualStyle === style.id;

          return (
            <div
              key={style.id}
              onClick={() => handleSelectStyle(style)}
              className="p-3 rounded-[var(--radius-input)] border transition-all cursor-pointer text-left relative overflow-hidden"
              style={{
                background: isSelected ? 'var(--modified-bg)' : 'var(--surface-2)',
                borderColor: isSelected ? 'var(--modified)' : 'var(--border)'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border"
                    style={{ background: 'var(--chip)', borderColor: 'var(--border-strong)', color: 'var(--ink)' }}
                  >
                    {style.thumbnailBadge}
                  </span>
                  <div>
                    <h4
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: isSelected ? 'var(--modified-ink)' : 'var(--ink)' }}
                    >
                      {style.name}
                    </h4>
                    <span className="text-[9.5px] uppercase" style={{ color: 'var(--muted)' }}>
                      {style.category}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="flex items-center space-x-1 text-[10px] font-bold shrink-0" style={{ color: 'var(--modified-ink)' }}>
                    <Check className="w-3 h-3" />
                    <span>Đang dùng</span>
                  </span>
                )}
              </div>

              <p className="text-[10.5px] leading-relaxed mt-2" style={{ color: 'var(--ink-2)' }}>
                {style.description}
              </p>

              <div className="mt-2 text-[9.5px] italic border-t pt-1.5" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
                {style.referenceDescription}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
