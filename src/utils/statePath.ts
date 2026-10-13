/**
 * Redesign V1-B, Phase P4 — tiny dotted-path get/set helpers so the control registry's `id` strings
 * (e.g. 'font.text', 'wave.dynamicThickness.enabled') can read/write directly into whatever object
 * they're pointed at (RenderState, FlipDiscConfig, TypographyTilesConfig...), without each of the new
 * group panels re-deriving its own per-field updater closure.
 *
 * `setPath` only shallow-copies the objects ALONG the path (same immutable-update shape every other
 * handler in this codebase already uses, e.g. `{...prev, wave: {...prev.wave, waveSpeed: v}}`) — it
 * never deep-clones the whole tree, so this is just as cheap as a hand-written spread chain.
 */
export function getPath<T = unknown>(obj: unknown, path: string): T {
  return path.split('.').reduce<unknown>((acc, key) => (acc == null ? acc : (acc as Record<string, unknown>)[key]), obj) as T;
}

export function setPath<T extends object>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const recur = (node: unknown, idx: number): unknown => {
    const key = keys[idx];
    const current = (node as Record<string, unknown> | undefined) ?? {};
    if (idx === keys.length - 1) {
      return { ...current, [key]: value };
    }
    return { ...current, [key]: recur(current[key], idx + 1) };
  };
  return recur(obj, 0) as T;
}
