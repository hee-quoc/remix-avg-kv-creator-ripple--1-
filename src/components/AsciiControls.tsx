import React from 'react';
import { RenderState } from '../types';
import { Terminal, Hash, Type } from 'lucide-react';

interface AsciiControlsProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
}

const CHARSET_PRESETS = [
  { label: '01 BINARY', value: '0 1' },
  { label: 'MATH / LOGIC', value: '+ - * / = % < > ~' },
  { label: 'MATRIX DATA', value: '0 1 2 3 4 5 6 7 8 9' },
  { label: 'ASCII DENSE', value: '0 1 + - * / . : % $ # @' },
  { label: 'BLOCK SHADES', value: '· ░ ▒ ▓ █' }
];

export const AsciiControls: React.FC<AsciiControlsProps> = ({ state, onUpdateState }) => {
  const isAscii = state.grid.dotShape === 'ascii';

  return (
    <div className="space-y-3 p-3 bg-[#0a0a0d] border border-[#222] rounded-lg font-mono">
      <div className="flex items-center justify-between pb-1 border-b border-[#222]">
        <div className="flex items-center space-x-2 text-[#00F0FF]">
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase">
            ASCII MOLECULE CONTROLS
          </span>
        </div>
        {!isAscii && (
          <button
            onClick={() =>
              onUpdateState((prev) => ({
                ...prev,
                grid: { ...prev.grid, dotShape: 'ascii' }
              }))
            }
            className="text-[9px] bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 px-2 py-0.5 rounded font-bold uppercase"
          >
            ACTIVATE ASCII SHAPE
          </button>
        )}
      </div>

      {/* Charset selector & Quick presets */}
      <div>
        <label className="text-[#888] text-[10px] uppercase block mb-1">
          CHARACTER SET (SPACE SEPARATED)
        </label>
        <input
          type="text"
          value={state.grid.asciiCharset || '0 1 + - * / . : % $'}
          onChange={(e) =>
            onUpdateState((prev) => ({
              ...prev,
              grid: { ...prev.grid, asciiCharset: e.target.value }
            }))
          }
          className="w-full bg-[#121212] border border-[#222] rounded p-2 text-[#00F0FF] font-mono text-xs focus:outline-none focus:border-[#00F0FF]"
        />

        {/* Presets */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {CHARSET_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  grid: { ...prev.grid, asciiCharset: p.value }
                }))
              }
              className="text-[9px] px-1.5 py-0.5 rounded bg-[#161616] text-[#888] hover:text-[#00F0FF] border border-[#222] hover:border-[#444]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ASCII Font Size */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[#888] text-[10px] uppercase">ASCII FONT SIZE</label>
          <span className="text-[#00F0FF] text-[10px]">
            {state.grid.asciiFontSize || 14}px
          </span>
        </div>
        <input
          type="range"
          min="6"
          max="36"
          step="1"
          value={state.grid.asciiFontSize || 14}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            onUpdateState((prev) => ({
              ...prev,
              grid: { ...prev.grid, asciiFontSize: val }
            }));
          }}
          className="w-full accent-[#00F0FF] bg-[#1a1a1a] h-1 rounded appearance-none cursor-pointer"
        />
      </div>

      {/* Variable sizing with wave amplitude */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] text-[#ccc] block font-bold uppercase">
            SCALE WITH WAVE AMPLITUDE
          </span>
          <span className="text-[9px] text-[#666]">
            Characters enlarge dynamically at wave crests
          </span>
        </div>
        <input
          type="checkbox"
          checked={state.grid.asciiVariableSize ?? true}
          onChange={(e) =>
            onUpdateState((prev) => ({
              ...prev,
              grid: { ...prev.grid, asciiVariableSize: e.target.checked }
            }))
          }
          className="w-4 h-4 accent-[#00F0FF] bg-[#0A0A0A] border-[#333] cursor-pointer"
        />
      </div>

      {/* Distribution Mode */}
      <div>
        <label className="text-[#888] text-[10px] uppercase block mb-1">
          CHARACTER DISTRIBUTION
        </label>
        <div className="grid grid-cols-4 gap-1">
          {(['flow', 'random', 'grid', 'radial'] as const).map((dist) => (
            <button
              key={dist}
              onClick={() =>
                onUpdateState((prev) => ({
                  ...prev,
                  grid: { ...prev.grid, asciiDistribution: dist }
                }))
              }
              className={`py-1 rounded text-[10px] uppercase font-bold border transition-all ${
                (state.grid.asciiDistribution || 'flow') === dist
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/60'
                  : 'bg-[#121212] text-[#777] border-[#222] hover:text-[#ccc]'
              }`}
            >
              {dist}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
