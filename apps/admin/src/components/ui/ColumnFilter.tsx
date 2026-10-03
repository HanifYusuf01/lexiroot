import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ListFilter } from 'lucide-react';

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  label: string;
  allLabel: string;
  value: T | undefined;
  options: Option<T>[];
  onChange: (next: T | undefined) => void;
}

const MENU_WIDTH = 208;

/**
 * Header label with a filter dropdown. The menu is portalled to <body> with
 * fixed positioning because the table sits in an overflow-x-auto wrapper,
 * which would otherwise clip it.
 */
export function ColumnFilter<T extends string | number>({
  label,
  allLabel,
  value,
  options,
  onChange,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const active = value !== undefined;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const left = Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8);
    setPos({ top: rect.bottom + 6, left: Math.max(8, left) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    // A fixed menu would drift away from its header on scroll, so close instead.
    function close() {
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  function pick(next: T | undefined) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`-mx-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 uppercase tracking-wide hover:bg-white/70 ${
          active ? 'text-primary' : ''
        }`}
      >
        {label}
        <ListFilter size={12} className={active ? 'text-primary' : 'text-neutral-variant'} />
        {active ? <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden /> : null}
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_WIDTH }}
              className="z-50 max-h-72 overflow-y-auto rounded-xl border border-border bg-white p-1.5 normal-case tracking-normal shadow-lg"
            >
              <MenuItem selected={!active} label={allLabel} onClick={() => pick(undefined)} />
              {options.map((o) => (
                <MenuItem
                  key={String(o.value)}
                  selected={value === o.value}
                  label={o.label}
                  onClick={() => pick(o.value)}
                />
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MenuItem({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm text-neutral hover:bg-neutral-soft"
    >
      <span className={selected ? 'font-bold text-primary' : ''}>{label}</span>
      {selected ? <Check size={14} className="text-primary" /> : null}
    </button>
  );
}
