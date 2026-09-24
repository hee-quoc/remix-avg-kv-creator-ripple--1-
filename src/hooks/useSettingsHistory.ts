import { useCallback, useEffect, useRef, useState } from 'react';
import { RenderState } from '../types';
import { HistoryEntry, MAX_HISTORY_ENTRIES, loadHistory, saveHistory, summarizeChange } from '../utils/historyStore';

const SETTLE_DELAY_MS = 900;

/**
 * Watches `state` and, once it settles (no further edits for SETTLE_DELAY_MS), records a snapshot —
 * so every deliberate combination of slider/color/preset values the user lands on gets a restorable
 * entry, without spamming one entry per slider-drag tick. Lives in App.tsx (always mounted) rather
 * than inside the closable ControlsDrawer, so tracking never pauses just because the drawer is
 * collapsed.
 */
export function useSettingsHistory(state: RenderState) {
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const lastSnapshotRef = useRef<RenderState | null>(
    history.length > 0 ? history[history.length - 1].state : null
  );
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const prev = lastSnapshotRef.current;
      if (prev && JSON.stringify(prev) === JSON.stringify(state)) return;

      const snapshot: RenderState = JSON.parse(JSON.stringify(state));
      const entry: HistoryEntry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        label: prev ? summarizeChange(prev, state) : 'Initial',
        state: snapshot
      };
      lastSnapshotRef.current = snapshot;

      setHistory((h) => {
        const next = [...h, entry].slice(-MAX_HISTORY_ENTRIES);
        saveHistory(next);
        return next;
      });
    }, SETTLE_DELAY_MS);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [state]);

  const clearHistory = useCallback(() => {
    lastSnapshotRef.current = null;
    setHistory([]);
    saveHistory([]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((h) => {
      const next = h.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
  }, []);

  return { history, clearHistory, removeEntry };
}
