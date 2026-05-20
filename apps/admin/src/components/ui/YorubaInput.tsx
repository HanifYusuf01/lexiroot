import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

/**
 * Yoruba-aware text input.
 *
 * Provides two ways to type Yoruba special characters:
 *
 * 1. **Shortcut conversion** — passive transformer on every keystroke. Combinations
 *    map to a Yoruba glyph and replace the two-char sequence in place:
 *      - `/` after a vowel → high tone (acute):  a/ → á  e/ → é  i/ → í  o/ → ó  u/ → ú
 *      - `\` after a vowel → low  tone (grave):  a\ → à  e\ → è  i\ → ì  o\ → ò  u\ → ù
 *      - `.` after e/o/s → sub-dot:              e. → ẹ  o. → ọ  s. → ṣ
 *      - Capital forms apply identically (A/ → Á, etc.).
 *
 * 2. **Palette popover** — the "Á" button opens a grid of Yoruba glyphs. Clicking a
 *    glyph inserts it at the cursor.
 *
 * Combine the two for combined marks (e.g. ẹ́ = e. then /): typing `e./` produces
 * `ẹ́` because the first transform fires on the `.`, then `ẹ/` triggers the next.
 */

interface YorubaInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  inputClassName?: string;
  /** When true, hide the "Á" palette button — only keystroke shortcuts work. */
  hideTrigger?: boolean;
}

const SHORTCUTS: Record<string, string> = {
  // acute  (/)
  'a/': 'á',
  'e/': 'é',
  'i/': 'í',
  'o/': 'ó',
  'u/': 'ú',
  'A/': 'Á',
  'E/': 'É',
  'I/': 'Í',
  'O/': 'Ó',
  'U/': 'Ú',
  // grave  (\ or ;)
  'a\\': 'à',
  'e\\': 'è',
  'i\\': 'ì',
  'o\\': 'ò',
  'u\\': 'ù',
  'A\\': 'À',
  'E\\': 'È',
  'I\\': 'Ì',
  'O\\': 'Ò',
  'U\\': 'Ù',
  'a;': 'à',
  'e;': 'è',
  'i;': 'ì',
  'o;': 'ò',
  'u;': 'ù',
  'A;': 'À',
  'E;': 'È',
  'I;': 'Ì',
  'O;': 'Ò',
  'U;': 'Ù',
  // sub-dot  (.)
  'e.': 'ẹ',
  'o.': 'ọ',
  's.': 'ṣ',
  'E.': 'Ẹ',
  'O.': 'Ọ',
  'S.': 'Ṣ',
  // sub-dot vowels with tone (e.g. user types ẹ then /)
  'ẹ/': 'ẹ́',
  'ọ/': 'ọ́',
  'ẹ\\': 'ẹ̀',
  'ọ\\': 'ọ̀',
  'ẹ;': 'ẹ̀',
  'ọ;': 'ọ̀',
  'Ẹ/': 'Ẹ́',
  'Ọ/': 'Ọ́',
  'Ẹ\\': 'Ẹ̀',
  'Ọ\\': 'Ọ̀',
  'Ẹ;': 'Ẹ̀',
  'Ọ;': 'Ọ̀',
};

const PALETTE_LOWER: string[][] = [
  ['á', 'à', 'é', 'è', 'í', 'ì'],
  ['ó', 'ò', 'ú', 'ù', 'ẹ', 'ọ'],
  ['ṣ', 'ẹ́', 'ẹ̀', 'ọ́', 'ọ̀'],
];

const PALETTE_UPPER: string[][] = [
  ['Á', 'À', 'É', 'È', 'Í', 'Ì'],
  ['Ó', 'Ò', 'Ú', 'Ù', 'Ẹ', 'Ọ'],
  ['Ṣ', 'Ẹ́', 'Ẹ̀', 'Ọ́', 'Ọ̀'],
];

const TRIGGER_KEYS = new Set(['/', '\\', ';', '.']);

export function YorubaInput({
  value,
  onChange,
  placeholder,
  className,
  multiline,
  rows = 3,
  disabled,
  inputClassName,
  hideTrigger,
}: YorubaInputProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);

  // Close popover on outside clicks. The popover renders into a portal at
  // document.body, so a wrapper-based click-outside hook would see palette
  // clicks as "outside" and close before they fire.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      const pop = popoverRef.current;
      const trig = triggerRef.current;
      const target = e.target as Node | null;
      if (!target) return;
      if (pop?.contains(target) || trig?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const btn = triggerRef.current;
    const pop = popoverRef.current;
    if (!btn || !pop) return;
    const rect = btn.getBoundingClientRect();
    const popHeight = pop.offsetHeight;
    const popWidth = pop.offsetWidth;
    // Default: above the button, right-aligned to it.
    let top = rect.top - popHeight - 4;
    if (top < 8) top = rect.bottom + 4;
    let left = rect.right - popWidth;
    if (left < 8) left = 8;
    setPopoverPos({ top, left });
  }, [open]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    onChange(e.target.value);
  }

  // Intercept trigger keys *before* they're inserted. Read the previous character
  // straight from the DOM (e.currentTarget.value) — using the closed-over `value`
  // prop lags React's controlled update by one render in concurrent mode, which
  // makes fast typing like "e." miss the match. preventDefault swallows the
  // trigger key so it never lands; we splice the replacement in instead.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!TRIGGER_KEYS.has(e.key)) return;
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start !== end || start < 1) return;
    const live = el.value;
    const prev = live.slice(start - 1, start);
    const pair = prev + e.key;
    const replacement = SHORTCUTS[pair];
    if (!replacement) return;
    e.preventDefault();
    const next = live.slice(0, start - 1) + replacement + live.slice(end);
    onChange(next);
    const nextCaret = start - 1 + replacement.length;
    requestAnimationFrame(() => {
      const elNow = inputRef.current;
      if (elNow) elNow.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function insertChar(ch: string) {
    const el = inputRef.current;
    if (!el) {
      onChange(value + ch);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + ch + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + ch.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const sharedInputClass =
    inputClassName ??
    'h-9 w-full rounded-md border border-border bg-white px-2 text-sm text-neutral outline-none focus:border-primary';

  return (
    <div ref={wrapRef} className={`relative flex items-center gap-1.5 ${className ?? ''}`}>
      {multiline ? (
        <textarea
          ref={(el) => {
            inputRef.current = el;
          }}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={sharedInputClass}
        />
      ) : (
        <input
          ref={(el) => {
            inputRef.current = el;
          }}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={sharedInputClass}
        />
      )}
      {hideTrigger ? null : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          title="Insert Yoruba character"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-white text-sm font-bold text-neutral hover:bg-neutral-soft disabled:opacity-50"
          style={popoverButtonStyle}
        >
          Á
        </button>
      )}
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-50 rounded-lg border border-border bg-white p-2 shadow-lg"
              style={{
                top: popoverPos?.top ?? -9999,
                left: popoverPos?.left ?? -9999,
                visibility: popoverPos ? 'visible' : 'hidden',
              }}
            >
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-variant">
                Lowercase
              </div>
              <div className="flex flex-col gap-1">
                {PALETTE_LOWER.map((row, ri) => (
                  <div key={`l-${ri}`} className="flex gap-1">
                    {row.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => insertChar(ch)}
                        className="h-8 w-8 rounded-md border border-border bg-white text-sm font-semibold text-neutral hover:border-primary hover:bg-primary-softer"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-variant">
                Uppercase
              </div>
              <div className="flex flex-col gap-1">
                {PALETTE_UPPER.map((row, ri) => (
                  <div key={`u-${ri}`} className="flex gap-1">
                    {row.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => insertChar(ch)}
                        className="h-8 w-8 rounded-md border border-border bg-white text-sm font-semibold text-neutral hover:border-primary hover:bg-primary-softer"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-2 border-t border-border pt-1.5 text-[10px] leading-snug text-neutral-variant">
                Shortcuts after a letter:
                <br />
                <span className="font-semibold">/</span> á · <span className="font-semibold">; or \</span> à · <span className="font-semibold">.</span> ẹ ọ ṣ
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

const popoverButtonStyle: CSSProperties = { fontVariant: 'normal' };
