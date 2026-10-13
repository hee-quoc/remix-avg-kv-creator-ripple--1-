import React, { useState } from 'react';
import { FlipDiscConfig } from '../../flipDisc/types';
import { PillButton } from '../ui';
import { Copy, Check, History as HistoryIcon } from 'lucide-react';

interface FlipDiscHistoryPanelProps {
  config: FlipDiscConfig;
}

/**
 * Flip Disc counterpart to Kinetic's HistoryPanel — scoped down to just "copy current settings as
 * JSON" (same clipboard-with-textarea-fallback logic as HistoryPanel.tsx's copyStateJson). Flip Disc
 * has no settings-history tracking today (Kinetic's is driven by useSettingsHistory in App.tsx,
 * watching `state`, not `flipDiscConfig`) — building that out wasn't asked for, so there's no
 * undo/redo or history list here, just the one export affordance the test team actually needs.
 */
export const FlipDiscHistoryPanel: React.FC<FlipDiscHistoryPanelProps> = ({ config }) => {
  const [copied, setCopied] = useState(false);

  const copyConfigJson = async () => {
    const text = JSON.stringify(config, null, 2);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('clipboard API unavailable');
      }
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
      } catch {
        /* best effort only */
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <span className="text-[13px] font-semibold flex items-center gap-1.5">
        <HistoryIcon className="w-3.5 h-3.5" /> Lịch sử chỉnh sửa
      </span>
      <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
        Flip Disc chưa có lịch sử chỉnh sửa / undo-redo như Kinetic. Dùng nút bên dưới để copy toàn bộ
        cài đặt hiện tại dạng JSON — hữu ích để lưu lại hoặc gửi cho người khác dựng lại chính xác look
        này.
      </p>

      <PillButton onClick={copyConfigJson} className="w-full justify-center">
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" /> Đã copy
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" /> Copy cài đặt hiện tại (JSON)
          </>
        )}
      </PillButton>
    </div>
  );
};
