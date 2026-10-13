import React, { useMemo, useState } from 'react';
import { RenderState, PresetCategory } from '../types';
import { PRESETS } from '../data/presets';
import { FLIP_DISC_PRESETS } from '../flipDisc/presets';
import { TYPOGRAPHY_TILES_PRESETS } from '../typographyTiles/presets';
import { copyJsonToClipboard } from '../utils/clipboard';
import { Chip } from './ui';
import { Copy, Check } from 'lucide-react';

interface PresetStripProps {
  state: RenderState;
  onSelectPreset: (presetId: string) => void;
  onSelectFlipDiscPreset?: (presetId: string) => void;
  onSelectTypographyTilesPreset?: (presetId: string) => void;
}

interface StripCard {
  id: string;
  name: string;
  category: string;
  pinned: boolean;
  swatch: string[];
  isActive: boolean;
  onClick: () => void;
  config: unknown;
}

type Filter = 'pinned' | 'all' | PresetCategory | 'Interactive';

const CATEGORY_CHIPS: { id: Filter; label: string }[] = [
  { id: 'pinned', label: 'Bộ pitch' },
  { id: 'all', label: 'Tất cả' },
  { id: 'News', label: 'News' },
  { id: 'Technology', label: 'Tech' },
  { id: 'Automotive', label: 'Auto' },
  { id: 'Entertainment', label: 'Entertainment' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Culture', label: 'Culture' },
  { id: 'Children', label: 'Children' },
  { id: 'Interactive', label: 'Interactive' }
];

/**
 * Redesign V1-B, Phase P3 — the new horizontal preset strip below the canvas (spec section 3),
 * replacing the old header "PRESETS" hover dropdown as the primary entry point. Reuses the exact same
 * preset data/selection handlers as before (PresetGallery, still reachable from the inspector's rail
 * isn't wired here — this is purely a new, more prominent front door to the SAME presets).
 *
 * "Nhập JSON" / "Xuất JSON" / "+ Lưu look hiện tại" from the mockup are intentionally NOT included yet
 * — those are real unbuilt features (Phase P6 and the "preset của tôi" piece of P5), not just a
 * layout change, so showing non-functional buttons here would be misleading rather than honest.
 */
export const PresetStrip: React.FC<PresetStripProps> = ({
  state,
  onSelectPreset,
  onSelectFlipDiscPreset,
  onSelectTypographyTilesPreset
}) => {
  const [filter, setFilter] = useState<Filter>('pinned');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCard = async (e: React.SyntheticEvent, card: StripCard) => {
    e.stopPropagation();
    await copyJsonToClipboard(card.config);
    setCopiedId(card.id);
    window.setTimeout(() => setCopiedId((cur) => (cur === card.id ? null : cur)), 1500);
  };

  const allCards: StripCard[] = useMemo(() => {
    const kinetic: StripCard[] = PRESETS.filter((p) => !p.hidden).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      pinned: !!p.pinned,
      swatch: [p.config.style?.dotColor || '#00f0ff', p.config.style?.bgColor || '#0a0d14', p.config.style?.accentColor || '#38bdf8'],
      isActive: state.activePresetId === p.id,
      onClick: () => onSelectPreset(p.id),
      config: p.config
    }));

    const flipDisc: StripCard[] = onSelectFlipDiscPreset
      ? FLIP_DISC_PRESETS.map((p) => ({
          id: p.id,
          name: p.name,
          category: 'Children',
          pinned: !!p.pinned,
          swatch: [p.config.frontColor, p.config.backColor, p.config.sideColor],
          isActive: false,
          onClick: () => onSelectFlipDiscPreset(p.id),
          config: p.config
        }))
      : [];

    const tileBreak: StripCard[] = onSelectTypographyTilesPreset
      ? TYPOGRAPHY_TILES_PRESETS.map((p) => ({
          id: p.id,
          name: p.name,
          category: 'Interactive',
          pinned: !!p.pinned,
          swatch: p.config.palette.slice(0, 3),
          isActive: false,
          onClick: () => onSelectTypographyTilesPreset(p.id),
          config: p.config
        }))
      : [];

    return [...kinetic, ...flipDisc, ...tileBreak];
  }, [state.activePresetId, onSelectPreset, onSelectFlipDiscPreset, onSelectTypographyTilesPreset]);

  const visible = useMemo(() => {
    if (filter === 'pinned') return allCards.filter((c) => c.pinned);
    if (filter === 'all') return allCards;
    return allCards.filter((c) => c.category === filter);
  }, [allCards, filter]);

  const countFor = (f: Filter) => {
    if (f === 'pinned') return allCards.filter((c) => c.pinned).length;
    if (f === 'all') return allCards.length;
    return allCards.filter((c) => c.category === f).length;
  };

  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-3.5 flex flex-col gap-3"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <strong className="text-sm">Presets</strong>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORY_CHIPS.map((c) => {
            const count = countFor(c.id);
            if (c.id !== 'pinned' && c.id !== 'all' && count === 0) return null;
            return (
              <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
                {c.label} ({count})
              </Chip>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {visible.length === 0 && (
          <p className="text-xs text-[var(--muted)] py-4">Chưa có preset nào trong nhóm này.</p>
        )}
        {visible.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={card.onClick}
            className="relative w-[150px] shrink-0 rounded-[14px] bg-[var(--surface)] border text-left overflow-hidden transition-colors"
            style={{ borderColor: card.isActive ? 'var(--ink)' : 'var(--border)', borderWidth: card.isActive ? 2 : 1 }}
          >
            <div
              className="h-[84px] flex items-center justify-center gap-1.5"
              style={{ background: card.swatch[1] || '#0b1020' }}
            >
              {card.swatch.map((c, i) => (
                <span key={i} className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => handleCopyCard(e, card)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleCopyCard(e, card);
              }}
              title="Copy cấu hình preset (JSON)"
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
            >
              {copiedId === card.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </span>
            <div className="px-2.5 py-2 flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>
                {card.name}
              </span>
              <span className="text-[11.5px]" style={{ color: 'var(--muted)' }}>
                {card.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
