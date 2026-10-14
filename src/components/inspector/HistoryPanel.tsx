import React, { useRef, useState } from 'react';
import { RenderState } from '../../types';
import { HistoryEntry } from '../../utils/historyStore';
import { copyJsonToClipboard } from '../../utils/clipboard';
import { PillButton, Chip } from '../ui';
import { Copy, Check, RotateCw, Trash2, History as HistoryIcon, Upload, FileJson } from 'lucide-react';

interface HistoryPanelProps {
  state: RenderState;
  onUpdateState?: (updater: (prev: RenderState) => RenderState) => void;
  history: HistoryEntry[];
  onRestoreHistory?: (snapshot: RenderState) => void;
  onClearHistory?: () => void;
  onRemoveHistoryEntry?: (id: string) => void;
}

/**
 * Redesign V1-B, Phase P4 — "Lịch sử" (History), restyled with the new design tokens/components.
 * Same underlying data/handlers as before (useSettingsHistory in App.tsx), just a fresh look.
 *
 * "Nhập JSON" is the counterpart to "Copy JSON" — paste or upload a RenderState dump (the exact shape
 * "Copy cài đặt hiện tại" produces, or a bare preset config object with just font/grid/wave/style/...)
 * and apply it onto the live state. Merges per-section (same shallow `{...prev.x, ...parsed.x}`
 * pattern applyPresetToState already uses for presets) rather than replacing the whole state, so a
 * partial JSON — e.g. just a `font` block — only touches what it mentions.
 */
export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  state,
  onUpdateState,
  history,
  onRestoreHistory,
  onClearHistory,
  onRemoveHistoryEntry
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyStateJson = async (id: string, snapshot: RenderState) => {
    await copyJsonToClipboard(snapshot);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
  };

  const applyImportedJson = (raw: string) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setImportError('JSON không hợp lệ — kiểm tra lại nội dung đã dán hoặc file đã chọn.');
      return;
    }
    if (!parsed || typeof parsed !== 'object') {
      setImportError('File/nội dung này không phải một object JSON hợp lệ.');
      return;
    }
    onUpdateState?.((prev) => ({
      ...prev,
      ...(parsed.font ? { font: { ...prev.font, ...(parsed.font as object) } } : {}),
      ...(parsed.grid ? { grid: { ...prev.grid, ...(parsed.grid as object) } } : {}),
      ...(parsed.wave ? { wave: { ...prev.wave, ...(parsed.wave as object) } } : {}),
      ...(parsed.style ? { style: { ...prev.style, ...(parsed.style as object) } } : {}),
      ...(parsed.kvLayout ? { kvLayout: { ...prev.kvLayout, ...(parsed.kvLayout as object) } } : {}),
      ...(parsed.audio ? { audio: { ...prev.audio, ...(parsed.audio as object) } } : {}),
      ...(parsed.compositionMode !== undefined ? { compositionMode: parsed.compositionMode as RenderState['compositionMode'] } : {}),
      ...(parsed.activeVisualStyle !== undefined ? { activeVisualStyle: parsed.activeVisualStyle as RenderState['activeVisualStyle'] } : {}),
      ...(parsed.showEffectText !== undefined ? { showEffectText: parsed.showEffectText as boolean } : {}),
      activePresetId: (parsed.activePresetId as string | undefined) ?? undefined
    }));
    setImportError(null);
    setImportText('');
    setImportOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => applyImportedJson((ev.target?.result as string) || '');
    reader.readAsText(file);
    e.target.value = '';
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

      <div className="grid grid-cols-2 gap-2">
        <PillButton onClick={() => copyStateJson('__current__', state)} className="justify-center">
          {copiedId === '__current__' ? (
            <>
              <Check className="w-3.5 h-3.5" /> Đã copy
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy JSON
            </>
          )}
        </PillButton>
        <PillButton
          variant={importOpen ? 'active' : 'default'}
          onClick={() => {
            setImportOpen((v) => !v);
            setImportError(null);
          }}
          className="justify-center"
        >
          <FileJson className="w-3.5 h-3.5" /> Nhập JSON
        </PillButton>
      </div>

      {importOpen && (
        <div className="p-2.5 rounded-[var(--radius-input)] border flex flex-col gap-2" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Dán nội dung JSON vào đây..."
            rows={5}
            className="w-full rounded-[var(--radius-input)] border p-2 text-[11px] resize-none"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}
          />
          {importError && (
            <p className="text-[11px] leading-relaxed" style={{ color: '#fb7185' }}>
              {importError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <PillButton
              onClick={() => (importText.trim() ? applyImportedJson(importText) : setImportError('Chưa dán nội dung JSON nào.'))}
              className="justify-center"
            >
              Áp dụng
            </PillButton>
            <label className="kv-pill justify-center cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file .json</span>
              <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

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
