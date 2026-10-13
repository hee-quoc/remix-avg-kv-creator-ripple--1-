import React, { useState } from 'react';
import { RenderState } from '../types';
import { HistoryEntry } from '../utils/historyStore';
import { QuickPanel } from './inspector/QuickPanel';
import { TextPanel } from './inspector/TextPanel';
import { EffectPanel } from './inspector/EffectPanel';
import { AppearancePanel } from './inspector/AppearancePanel';
import { HistoryPanel } from './inspector/HistoryPanel';
import { Zap, Type, Sparkles, Palette as PaletteIcon, Clock } from 'lucide-react';

interface InspectorShellProps {
  state: RenderState;
  onUpdateState: (updater: (prev: RenderState) => RenderState) => void;
  onSelectPreset: (presetId: string) => void;
  onSelectFlipDiscPreset?: (presetId: string) => void;
  onSelectTypographyTilesPreset?: (presetId: string) => void;
  history?: HistoryEntry[];
  onRestoreHistory?: (snapshot: RenderState) => void;
  onClearHistory?: () => void;
  onRemoveHistoryEntry?: (id: string) => void;
}

type RailItem = 'quick' | 'text' | 'effect' | 'appearance' | 'history';

const RAIL_ITEMS: { id: RailItem; label: string; icon: React.ReactNode }[] = [
  { id: 'quick', label: 'Nhanh', icon: <Zap className="w-[18px] h-[18px]" /> },
  { id: 'text', label: 'Text', icon: <Type className="w-[18px] h-[18px]" /> },
  { id: 'effect', label: 'Hiệu ứng', icon: <Sparkles className="w-[18px] h-[18px]" /> },
  { id: 'appearance', label: 'Màu sắc', icon: <PaletteIcon className="w-[18px] h-[18px]" /> },
  { id: 'history', label: 'Lịch sử', icon: <Clock className="w-[18px] h-[18px]" /> }
];

/**
 * Redesign V1-B, Phase P4 — the real 4-group inspector (spec section 5), rebuilt from the ground up
 * (registry + new design-system components), NOT the old 8-tab ControlsDrawer wrapped in a shell.
 * Per explicit instruction, "Bố cục" (Composition) is dropped entirely rather than kept as its own
 * group — CompositionModeControls/TextLayoutControls are folded into Text's "Nâng cao" instead (see
 * TextPanel.tsx), and gridType/density moved into Hiệu ứng > Hình hạt, so nothing is orphaned.
 * "Hiệu ứng" is ONE rail destination with an internal sub-segment (Hình hạt | Sóng | Âm thanh),
 * matching spec section 4.3 exactly instead of splitting shape/wave across two rail icons.
 */
export const InspectorShell: React.FC<InspectorShellProps> = ({
  state,
  onUpdateState,
  history = [],
  onRestoreHistory,
  onClearHistory,
  onRemoveHistoryEntry
}) => {
  const [rail, setRail] = useState<RailItem>('text');

  return (
    <aside
      className="w-full h-full bg-[var(--surface)] border border-[var(--border)] rounded-[inherit] flex overflow-hidden text-[var(--ink)]"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {rail === 'quick' && (
          <QuickPanel state={state} onUpdateState={onUpdateState} onNavigate={(r) => setRail(r)} />
        )}
        {rail === 'text' && <TextPanel state={state} onUpdateState={onUpdateState} />}
        {rail === 'effect' && <EffectPanel state={state} onUpdateState={onUpdateState} />}
        {rail === 'appearance' && <AppearancePanel state={state} onUpdateState={onUpdateState} />}
        {rail === 'history' && (
          <HistoryPanel
            state={state}
            history={history}
            onRestoreHistory={onRestoreHistory}
            onClearHistory={onClearHistory}
            onRemoveHistoryEntry={onRemoveHistoryEntry}
          />
        )}
      </div>

      <nav
        className="w-[72px] shrink-0 border-l flex flex-col items-center gap-1.5 py-3.5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
        aria-label="Nhóm chỉnh sửa"
      >
        {RAIL_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRail(item.id)}
            className="w-14 rounded-[var(--radius-rail)] py-2.5 flex flex-col items-center gap-1 text-[10.5px] transition-colors"
            style={{
              background: rail === item.id ? 'var(--ink)' : 'transparent',
              color: rail === item.id ? 'var(--surface)' : 'var(--muted)'
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};
