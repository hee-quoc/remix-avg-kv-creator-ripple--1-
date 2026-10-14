import React, { useRef, useState } from 'react';
import { FlipDiscConfig } from '../../flipDisc/types';
import { copyJsonToClipboard } from '../../utils/clipboard';
import { PillButton } from '../ui';
import { Copy, Check, History as HistoryIcon, Upload, FileJson } from 'lucide-react';

interface FlipDiscHistoryPanelProps {
  config: FlipDiscConfig;
  onUpdateConfig?: (patch: Partial<FlipDiscConfig>) => void;
}

/**
 * Flip Disc counterpart to Kinetic's HistoryPanel — scoped down to "copy current settings as JSON"
 * plus its paste/upload counterpart "Nhập JSON" (Flip Disc has no settings-history tracking today,
 * so no undo/redo or history list here — see HistoryPanel.tsx's doc comment for why). FlipDiscConfig
 * is a flat object (no font/grid/wave/style sub-sections like RenderState), so import is a direct
 * shallow merge onto the current config rather than the per-section merge Kinetic's import does.
 */
export const FlipDiscHistoryPanel: React.FC<FlipDiscHistoryPanelProps> = ({ config, onUpdateConfig }) => {
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyConfigJson = async () => {
    await copyJsonToClipboard(config);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const applyImportedJson = (raw: string) => {
    let parsed: Partial<FlipDiscConfig>;
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
    onUpdateConfig?.(parsed);
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
      <span className="text-[13px] font-semibold flex items-center gap-1.5">
        <HistoryIcon className="w-3.5 h-3.5" /> Lịch sử chỉnh sửa
      </span>
      <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Flip Disc chưa có lịch sử chỉnh sửa / undo-redo như Kinetic. Dùng Copy JSON để lưu lại hoặc gửi
        cho người khác dựng lại chính xác look này, hoặc Nhập JSON để áp dụng một cấu hình có sẵn.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <PillButton onClick={copyConfigJson} className="justify-center">
          {copied ? (
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
    </div>
  );
};
