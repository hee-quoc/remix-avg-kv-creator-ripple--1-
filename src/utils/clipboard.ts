/**
 * Clipboard-write-with-fallback, shared by every "Copy JSON" affordance in the app (History tabs,
 * PresetStrip's per-card copy button) — previously duplicated verbatim in HistoryPanel.tsx and
 * FlipDiscHistoryPanel.tsx. Falls back to a hidden textarea + execCommand('copy') when the async
 * Clipboard API is unavailable (non-secure context, older browser, etc.).
 */
export async function copyJsonToClipboard(value: unknown): Promise<void> {
  const text = JSON.stringify(value, null, 2);
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    throw new Error('clipboard API unavailable');
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
}
