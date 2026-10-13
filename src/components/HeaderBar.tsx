import React, { useState } from 'react';
import { RenderState } from '../types';
import { PRESETS } from '../data/presets';
import { PillButton, Chip } from './ui';
import { useTheme } from '../hooks/useTheme';
import { Radio, Undo2, Redo2, ChevronDown, Download, FileCode, Video, Sliders, Sun, Moon } from 'lucide-react';

interface HeaderBarProps {
  engineMode: 'kinetic' | 'flip_disc';
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  onToggleControls: () => void;
  isControlsOpen: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // Flip Disc — only meaningful when engineMode === 'flip_disc'. Export there is a single PNG frame
  // (imperative ref call, not a hidden-trigger click like Kinetic's PNG/SVG/MP4 buttons below), and
  // its own transparent-bg flag lives in App.tsx's flipDiscTransparentBg state, separate from
  // state.transparentBg which only ever applies to the Kinetic engine.
  flipDiscPresetName?: string;
  flipDiscTransparentBg?: boolean;
  onToggleFlipDiscTransparentBg?: () => void;
  onExportFlipDiscPNG?: () => void;
}

/**
 * Redesign V1-B, Phase P3 header (spec section 3) — logo/breadcrumb, Undo/Redo, and a single "Xuất
 * file" dropdown consolidating what used to be 4 separate header buttons (Transparent BG toggle +
 * PNG/SVG/MP4 export triggers). Preset browsing, FPS/dot-count, Stable/Flow, Masked and Quality all
 * moved out — see PresetStrip.tsx and CanvasToolbar.tsx, matching the spec's "Ra khỏi panel phải"
 * reassignment table.
 *
 * Merge pass — shared with Flip Disc too now (see App.tsx), instead of Flip Disc having its own
 * separate FlipDiscHeaderBar. `engineMode` swaps the breadcrumb source and narrows the export
 * dropdown to Flip Disc's one real export (PNG); Undo/Redo stay wired the same way regardless (App.tsx
 * already passes canUndo/canRedo as false while in flip_disc mode, since there's no history for it).
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  engineMode,
  state,
  onUpdateState,
  onToggleControls,
  isControlsOpen,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  flipDiscPresetName,
  flipDiscTransparentBg,
  onToggleFlipDiscTransparentBg,
  onExportFlipDiscPNG
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isFlipDisc = engineMode === 'flip_disc';
  const activePresetName = isFlipDisc
    ? flipDiscPresetName || 'Chưa chọn preset'
    : state.activePresetId
      ? PRESETS.find((p) => p.id === state.activePresetId)?.name || state.activePresetId
      : 'Chưa chọn preset';

  const triggerExport = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.click();
    setExportOpen(false);
  };

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-2.5 sm:px-5 gap-2 sm:gap-4"
      style={{ background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-ui)' }}
    >
      <div className="flex items-center gap-2.5 shrink-0 lg:w-[300px]">
        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--chip)' }}>
          <Radio className="w-4 h-4" style={{ color: 'var(--ink)' }} />
        </div>
        <strong className="text-[17px] hidden sm:inline">Nevo</strong>
      </div>

      <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13.5px] min-w-0 px-1">
        <span className="hidden sm:inline" style={{ color: 'var(--muted)' }}>
          Dự án
        </span>
        <span className="hidden sm:inline" style={{ color: 'var(--border-strong)' }}>
          /
        </span>
        <span className="font-semibold truncate">{activePresetName}</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0 lg:w-[300px] justify-end">
        <PillButton
          className="kv-pill-icon"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng'}
        >
          {theme === 'light' ? <Moon className="w-[15px] h-[15px]" /> : <Sun className="w-[15px] h-[15px]" />}
        </PillButton>
        <PillButton className="kv-pill-icon" onClick={onUndo} disabled={!canUndo} aria-label="Hoàn tác">
          <Undo2 className="w-[15px] h-[15px]" />
        </PillButton>
        <PillButton className="kv-pill-icon" onClick={onRedo} disabled={!canRedo} aria-label="Làm lại">
          <Redo2 className="w-[15px] h-[15px]" />
        </PillButton>

        <div className="relative">
          <PillButton variant="primary" onClick={() => setExportOpen((v) => !v)}>
            <Download className="w-3.5 h-3.5 sm:hidden" />
            <span className="hidden sm:inline">Xuất file</span>
            <ChevronDown className="w-3 h-3 hidden sm:inline" />
          </PillButton>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 flex flex-col gap-1 z-50"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-modal)' }}
              >
                {isFlipDisc ? (
                  <button
                    type="button"
                    onClick={() => {
                      onExportFlipDiscPNG?.();
                      setExportOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] hover:bg-[var(--chip)] text-left"
                  >
                    <Download className="w-4 h-4" /> PNG frame
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => triggerExport('export-png-trigger')}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] hover:bg-[var(--chip)] text-left"
                    >
                      <Download className="w-4 h-4" /> PNG frame
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerExport('export-svg-trigger')}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] hover:bg-[var(--chip)] text-left"
                    >
                      <FileCode className="w-4 h-4" /> Vector SVG
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerExport('export-mp4-trigger')}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] hover:bg-[var(--chip)] text-left"
                    >
                      <Video className="w-4 h-4" /> MP4 video
                    </button>
                  </>
                )}
                <div className="h-px my-1" style={{ background: 'var(--border)' }} />
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-[13px]">Nền trong suốt</span>
                  <Chip
                    tone={(isFlipDisc ? flipDiscTransparentBg : state.transparentBg) ? 'modified' : 'default'}
                    onClick={() =>
                      isFlipDisc
                        ? onToggleFlipDiscTransparentBg?.()
                        : onUpdateState((prev) => ({ ...prev, transparentBg: !prev.transparentBg }))
                    }
                  >
                    {(isFlipDisc ? flipDiscTransparentBg : state.transparentBg) ? 'Bật' : 'Tắt'}
                  </Chip>
                </div>
              </div>
            </>
          )}
        </div>

        <PillButton
          variant={isControlsOpen ? 'active' : 'default'}
          className="kv-pill-icon"
          onClick={onToggleControls}
          aria-label="Ẩn/hiện bảng điều khiển"
        >
          <Sliders className="w-[15px] h-[15px]" />
        </PillButton>
      </div>
    </header>
  );
};
