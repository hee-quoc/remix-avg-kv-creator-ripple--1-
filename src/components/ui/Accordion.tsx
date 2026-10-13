import React, { useEffect, useState } from 'react';

export interface AccordionProps {
  title: string;
  /** localStorage key this section's open/closed state is remembered under (spec 4.3). */
  storageKey: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}

const readOpen = (key: string, fallback: boolean): boolean => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : raw === '1';
  } catch {
    return fallback;
  }
};

/** Collapsible "Nâng cao" (advanced) section — remembers open/closed per storageKey across sessions. */
export const Accordion: React.FC<AccordionProps> = ({ title, storageKey, defaultOpen = false, badge, children }) => {
  const [open, setOpen] = useState(() => readOpen(storageKey, defaultOpen));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, open ? '1' : '0');
    } catch {
      /* localStorage unavailable (private mode etc.) — open state just won't persist */
    }
  }, [storageKey, open]);

  return (
    <div className="kv-accordion">
      <button type="button" className="kv-accordion-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="kv-accordion-chevron" data-open={open}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
        <span className="kv-accordion-title">{title}</span>
        {badge}
      </button>
      {open && <div className="kv-accordion-body">{children}</div>}
    </div>
  );
};
