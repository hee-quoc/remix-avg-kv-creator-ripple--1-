import React, { useState } from 'react';
import { RenderState } from '../../types';
import { HistoryEntry } from '../../utils/historyStore';
import { copyJsonToClipboard } from '../../utils/clipboard';
import { PillButton, Chip } from '../ui';
import { Copy, Check, RotateCw, Trash2, History as HistoryIcon } from 'lucide-react';

interface HistoryPanelProps {
  state: RenderState;
  history: HistoryEntry[];
  onRestoreHistory?: (snapshot: RenderState) => void;
  onClearHistory?: () => void;
  onRemoveHistoryEntry?: (id: string) => void;
}

/**
 * Redesign V1-B, Phase P4 — "Lịch sử" (History), restyled with the new design tokens/components.
 * Same underlying data/handlers as before (useSettingsHistory in App.tsx), just a fresh look.
 */
export const HistoryPanel: React.FC<HistoryPanelProps> = ({ state, history, onRestoreHistory, onClearHistory, onRemoveHistoryEntry }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyStateJson = async (id: string, snapshot: RenderState) => {
    await copyJsonToClipboard(snapshot);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold flex items-center gap-1.5">
          <HistoryIcon className="w-3.5 h-3.5" /> Lịch sử chỉnh sửa
        </span>
        {history.length > 0 && (
          <button type="button" onClick={onClearHistory} className="text-[11px] uppercase text-rose-500 hover:underline">
            Xoá hết
          </button>
        )}
      </div>
      <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Mỗi lần bạn chỉnh xong và dừng lại, một bản ghi được lưu tự động — không bao giờ mất một kết
        quả đẹp vì lỡ kéo quá tay. Bấm "Khôi phục" để quay lại bất kỳ lúc nào.
      </p>

      <PillButton onClick={() => copyStateJson('__current__', state)} className="w-full justify-center">
        {copiedId === '__current__' ? (
          <>
            <Check className="w-3.5 h-3.5" /> Đã copy
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" /> Copy cài đặt hiện tại (JSON)
          </>
        )}
      </PillButton>

      {history.length === 0 ? (
        <div
          className="p-4 rounded-[var(--radius-input)] text-center text-[12px]"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Chưa có lịch sử — bắt đầu chỉnh gì đó để thấy ở đây.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {[...history].reverse().map((entry, idx) => (
            <div
              key={entry.id}
              className="p-2.5 rounded-[var(--radius-input)] flex items-center justify-between gap-2"
              style={{ background: 'var(--surface-2)', border: `1px solid ${idx === 0 ? 'var(--modified)' : 'var(--border)'}` }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-semibold truncate">{entry.label}</span>
                  {idx === 0 && <Chip tone="modified">Mới nhất</Chip>}
                </div>
                <span className="text-[10.5px]" style={{ color: 'var(--muted)' }}>
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onRestoreHistory?.(entry.state)}
                  title="Khôi phục"
                  className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-pill)] text-[10.5px] font-semibold"
                  style={{ background: 'var(--modified-bg)', color: 'var(--modified-ink)' }}
                >
                  <RotateCw className="w-3 h-3" /> Khôi phục
                </button>
                <button type="button" onClick={() => copyStateJson(entry.id, entry.state)} title="Copy JSON" className="p-1 rounded" style={{ color: 'var(--muted)' }}>
                  {copiedId === entry.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveHistoryEntry?.(entry.id)}
                  title="Xoá"
                  className="p-1 rounded"
                  style={{ color: 'var(--muted)' }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
