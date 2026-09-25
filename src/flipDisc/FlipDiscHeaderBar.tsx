import React from 'react';
import { ArrowLeft, Sparkles, Play, Pause, Download, Sliders, Square } from 'lucide-react';
import { FLIP_DISC_PRESETS } from './presets';

interface FlipDiscHeaderBarProps {
  activePresetId: string;
  isPlaying: boolean;
  fps: number;
  tileCount: number;
  transparentBg: boolean;
  onToggleTransparentBg: () => void;
  onTogglePlay: () => void;
  onSelectPreset: (id: string) => void;
  onExportPNG: () => void;
  onBackToKinetic: () => void;
  onToggleControls: () => void;
  isControlsOpen: boolean;
}

export const FlipDiscHeaderBar: React.FC<FlipDiscHeaderBarProps> = ({
  activePresetId,
  isPlaying,
  fps,
  tileCount,
  transparentBg,
  onToggleTransparentBg,
  onTogglePlay,
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
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="font-mono font-bold text-sm text-white uppercase tracking-wider">Flip Disc</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/30">
            CHILDREN
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-3 pl-3 border-l border-slate-800 text-[10px] font-mono text-slate-400">
          <span>TILES: <span className="text-pink-300">{tileCount}</span></span>
          <span>FPS: <span className="text-emerald-400">{fps}</span></span>
        </div>
      </div>

      <div className="hidden lg:flex items-center space-x-1.5">
        {FLIP_DISC_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPreset(p.id)}
            className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase border transition-colors ${
              activePresetId === p.id
                ? 'bg-pink-500/20 text-pink-300 border-pink-500/60 font-bold'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {p.name.replace(/^07[a-c]?\.\s*/, '')}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleTransparentBg}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono transition-colors ${
            transparentBg
              ? 'bg-pink-500/20 border-pink-500/60 text-pink-300'
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
          title="Toggle transparent background (preview + PNG export)"
        >
          <Square className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{transparentBg ? 'ALPHA BG: ON' : 'TRANSPARENT'}</span>
        </button>
        <button
          onClick={onTogglePlay}
          className="p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
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
              ? 'bg-pink-500/20 border-pink-500/60 text-pink-300'
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
