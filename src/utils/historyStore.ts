import { RenderState } from '../types';

// Settings History — a running log of every settled edit the user makes (slider drags, color
// changes, preset switches, ...), so a good combination of values is never silently lost by
// accidentally overshooting a slider or clicking a different preset. Persisted to localStorage so it
// survives a page reload, not just the current tab session.

export interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  state: RenderState;
}

const STORAGE_KEY = 'avg_kv_creator_settings_history_v1';
export const MAX_HISTORY_ENTRIES = 40;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable (private browsing, etc.) — history just stays in-memory for
    // this session instead; not worth surfacing an error for.
  }
}

const SECTION_LABELS: { key: keyof RenderState; label: string }[] = [
  { key: 'font', label: 'Text' },
  { key: 'grid', label: 'Grid' },
  { key: 'wave', label: 'Wave' },
  { key: 'style', label: 'Style' },
  { key: 'kvLayout', label: 'Layout' },
  { key: 'audio', label: 'Audio' },
  { key: 'compositionMode', label: 'Mode' },
  { key: 'activeVisualStyle', label: 'Visual Style' }
];

/**
 * A short human label describing what changed between two states — "Wave, Grid" rather than a
 * generic "Settings #N" — computed by shallow JSON comparison of each top-level RenderState section.
 */
export function summarizeChange(prev: RenderState, next: RenderState): string {
  const changed: string[] = [];
  for (const { key, label } of SECTION_LABELS) {
    if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) changed.push(label);
  }
  if (prev.activePresetId !== next.activePresetId && next.activePresetId) {
    return `Preset: ${next.activePresetId}`;
  }
  return changed.length > 0 ? changed.join(', ') : 'Settings';
}
