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
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222]">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white">
            VISUAL STYLE LIBRARY
          </span>
        </div>
        <span className="text-[10px] text-[#888] font-mono">
          {VISUAL_STYLES.length} CURATED STYLES
        </span>
      </div>

      <p className="text-[10px] text-[#888] font-sans leading-relaxed">
        Apply specialized visual rendering techniques, from architectural pixel grids and ASCII matrices to 2.5D extruded blocks and constellation network lines.
      </p>

      {/* Grid of Styles */}
      <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
        {VISUAL_STYLES.map((style) => {
          const isSelected = state.activeVisualStyle === style.id || state.style.visualStyle === style.id;

          return (
            <div
              key={style.id}
              onClick={() => handleSelectStyle(style)}
              className={`p-3 rounded-lg border transition-all cursor-pointer text-left relative overflow-hidden group ${
                isSelected
                  ? 'bg-[#181c24] border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'bg-[#0e0e11] border-[#222] hover:border-[#444] hover:bg-[#141418]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded bg-[#222] text-[#00F0FF] border border-[#333] flex items-center justify-center text-[10px] font-bold">
                    {style.thumbnailBadge}
                  </span>
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-[#00F0FF]' : 'text-white group-hover:text-[#00F0FF]'}`}>
                      {style.name}
                    </h4>
                    <span className="text-[9px] text-[#777] font-mono uppercase">
                      {style.category}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="flex items-center space-x-1 text-[10px] text-[#00F0FF] font-bold">
                    <Check className="w-3 h-3" />
                    <span>ACTIVE</span>
                  </span>
                )}
              </div>

              <p className="text-[10px] text-[#aaa] font-sans leading-relaxed mt-2">
                {style.description}
              </p>

              <div className="mt-2 text-[9px] text-[#666] italic font-sans border-t border-[#1f1f26] pt-1.5">
                {style.referenceDescription}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
