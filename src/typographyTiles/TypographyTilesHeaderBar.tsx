import React from 'react';
import { ArrowLeft, Type, Download, Sliders } from 'lucide-react';
import { TYPOGRAPHY_TILES_PRESETS } from './presets';

interface TypographyTilesHeaderBarProps {
  activePresetId: string;
  fps: number;
  tileCount: number;
  onSelectPreset: (id: string) => void;
  onExportPNG: () => void;
  onBackToKinetic: () => void;
  onToggleControls: () => void;
  isControlsOpen: boolean;
}

export const TypographyTilesHeaderBar: React.FC<TypographyTilesHeaderBarProps> = ({
  activePresetId,
  fps,
  tileCount,
  onSelectPreset,
  onExportPNG,
  onBackToKinetic,
  onToggleControls,
  isControlsOpen
}) => {
  return (
    <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-slate-950 border-b border-slate-800">
      <div className="flex items-center space-x-3">
        <button
          onClick={onBackToKinetic}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors"
          title="Back to Kinetic Engine"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">KINETIC ENGINE</span>
        </button>
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <Type className="w-4 h-4 text-amber-400" />
          <span className="font-mono font-bold text-sm text-white uppercase tracking-wider">Tile Break</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            INTERACTIVE
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-3 pl-3 border-l border-slate-800 text-[10px] font-mono text-slate-400">
          <span>
            TILES: <span className="text-amber-300">{tileCount}</span>
          </span>
          <span>
            FPS: <span className="text-emerald-400">{fps}</span>
          </span>
        </div>
      </div>

      <div className="hidden lg:flex items-center space-x-1.5">
        {TYPOGRAPHY_TILES_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPreset(p.id)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase border transition-colors ${
              activePresetId === p.id
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {p.name.replace(/^12[a-c]?\.\s*/, '')}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onExportPNG}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PNG</span>
        </button>
        <button
          onClick={onToggleControls}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono transition-colors ${
            isControlsOpen
              ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CONTROLS</span>
        </button>
      </div>
    </div>
  );
};
