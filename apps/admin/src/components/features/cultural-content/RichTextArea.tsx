import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Underline,
} from 'lucide-react';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
  /** Enable Yoruba shortcut typing (a/ → á, e. → ẹ, …) + Á palette button. */
  yoruba?: boolean;
}

const BLOCK_OPTIONS: { tag: 'p' | 'h2' | 'h3'; label: string }[] = [
  { tag: 'p', label: 'Paragraph' },
  { tag: 'h2', label: 'Heading' },
  { tag: 'h3', label: 'Subheading' },
];

const TRIGGER_KEYS = new Set(['/', '\\', ';', '.']);

const SHORTCUTS: Record<string, string> = {
  'a/': 'á', 'e/': 'é', 'i/': 'í', 'o/': 'ó', 'u/': 'ú',
  'A/': 'Á', 'E/': 'É', 'I/': 'Í', 'O/': 'Ó', 'U/': 'Ú',
  'a\\': 'à', 'e\\': 'è', 'i\\': 'ì', 'o\\': 'ò', 'u\\': 'ù',
  'A\\': 'À', 'E\\': 'È', 'I\\': 'Ì', 'O\\': 'Ò', 'U\\': 'Ù',
  'a;': 'à', 'e;': 'è', 'i;': 'ì', 'o;': 'ò', 'u;': 'ù',
  'A;': 'À', 'E;': 'È', 'I;': 'Ì', 'O;': 'Ò', 'U;': 'Ù',
  'e.': 'ẹ', 'o.': 'ọ', 's.': 'ṣ',
  'E.': 'Ẹ', 'O.': 'Ọ', 'S.': 'Ṣ',
  'ẹ/': 'ẹ́', 'ọ/': 'ọ́',
  'ẹ\\': 'ẹ̀', 'ọ\\': 'ọ̀',
  'ẹ;': 'ẹ̀', 'ọ;': 'ọ̀',
  'Ẹ/': 'Ẹ́', 'Ọ/': 'Ọ́',
  'Ẹ\\': 'Ẹ̀', 'Ọ\\': 'Ọ̀',
  'Ẹ;': 'Ẹ̀', 'Ọ;': 'Ọ̀',
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

/**
 * contentEditable rich-text editor. Toolbar buttons call document.execCommand,
 * which is deprecated but is the lightest way to get bold/italic/lists/etc.
 * working without pulling in a heavy editor dep.
 *
 * Caret handling: we do NOT use dangerouslySetInnerHTML — React would replace
 * the editor DOM on every parent render, which collapses the selection to the
 * start of the editor and causes typed characters to land in reverse order.
 * The DOM is initialized once via a ref and only re-synced when an *external*
 * value change arrives (e.g. loading saved content), not when our own emit()
 * round-trips through the parent.
 */
export function RichTextArea({
  value,
  onChange,
  placeholder,
  maxLength = 20000,
  minHeight = 160,
  yoruba = false,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const blockMenuRef = useRef<HTMLDivElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const lastEmittedRef = useRef<string>(value);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<'p' | 'h2' | 'h3'>('p');
  const [isEmpty, setIsEmpty] = useState(() => stripHtml(value).length === 0);

  useClickOutside(blockMenuRef, () => setBlockMenuOpen(false), blockMenuOpen);
  useClickOutside(paletteRef, () => setPaletteOpen(false), paletteOpen);

  // Initialize once on mount; thereafter only sync when an external value
  // change arrives that isn't our own emission and differs from current DOM.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (!initializedRef.current) {
      el.innerHTML = value || '';
      initializedRef.current = true;
      setIsEmpty(stripHtml(value).length === 0);
      return;
    }
    if (value !== lastEmittedRef.current && value !== el.innerHTML) {
      el.innerHTML = value || '';
      setIsEmpty(stripHtml(value).length === 0);
    }
  }, [value]);

  function emit() {
    const el = editorRef.current;
    if (!el) return;
    let html = el.innerHTML;
    if (stripHtml(html).length > maxLength) {
      html = html.slice(0, maxLength);
      el.innerHTML = html;
    }
    lastEmittedRef.current = html;
    setIsEmpty(stripHtml(html).length === 0);
    onChange(html);
  }

  function exec(command: string, arg?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    syncCurrentBlock();
    emit();
  }

  function applyBlock(tag: 'p' | 'h2' | 'h3') {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag.toUpperCase());
    setCurrentBlock(tag);
    setBlockMenuOpen(false);
    emit();
  }

  function syncCurrentBlock() {
    try {
      const block = document.queryCommandValue('formatBlock').toLowerCase();
      if (block === 'h2' || block === 'h3') {
        setCurrentBlock(block);
      } else {
        setCurrentBlock('p');
      }
    } catch {
      setCurrentBlock('p');
    }
  }

  function handleLink() {
    const url = window.prompt('Enter URL');
    if (!url) return;
    exec('createLink', url);
  }

  function insertChar(ch: string) {
    editorRef.current?.focus();
    document.execCommand('insertText', false, ch);
    emit();
  }

  // Yoruba shortcut interception. Reads the character immediately before the
  // caret straight from the DOM (the text node + offset), then if it pairs
  // with the trigger key into a known glyph, swallows the trigger and replaces
  // the previous character with the glyph in one move.
  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (!yoruba) return;
    if (!TRIGGER_KEYS.has(e.key)) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const container = range.startContainer;
    if (container.nodeType !== Node.TEXT_NODE) return;
    const offset = range.startOffset;
    if (offset < 1) return;
    const text = container.textContent ?? '';
    const prev = text[offset - 1];
    if (!prev) return;
    const pair = prev + e.key;
    const replacement = SHORTCUTS[pair];
    if (!replacement) return;
    e.preventDefault();
    const repRange = document.createRange();
    repRange.setStart(container, offset - 1);
    repRange.setEnd(container, offset);
    repRange.deleteContents();
    sel.removeAllRanges();
    sel.addRange(repRange);
    document.execCommand('insertText', false, replacement);
    emit();
  }

  const charCount = stripHtml(value).length;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-neutral-soft/40 px-2 py-1.5 text-neutral-variant">
        <div ref={blockMenuRef} className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setBlockMenuOpen((o) => !o)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-neutral hover:bg-white"
          >
            {BLOCK_OPTIONS.find((b) => b.tag === currentBlock)?.label ?? 'Paragraph'}
            <ChevronDown size={12} />
          </button>
          {blockMenuOpen ? (
            <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-md border border-border bg-white py-1 shadow-md">
              {BLOCK_OPTIONS.map((opt) => (
                <button
                  key={opt.tag}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyBlock(opt.tag)}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-soft ${
                    currentBlock === opt.tag ? 'font-bold text-primary' : 'text-neutral'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <span className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton label="Bold" onClick={() => exec('bold')}>
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec('italic')}>
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec('underline')}>
          <Underline size={14} />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton label="Bullet list" onClick={() => exec('insertUnorderedList')}>
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec('insertOrderedList')}>
          <ListOrdered size={14} />
        </ToolbarButton>

        <span className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton label="Align left" onClick={() => exec('justifyLeft')}>
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton label="Align center" onClick={() => exec('justifyCenter')}>
          <AlignCenter size={14} />
        </ToolbarButton>
        <ToolbarButton label="Align right" onClick={() => exec('justifyRight')}>
          <AlignRight size={14} />
        </ToolbarButton>
        <ToolbarButton label="Insert link" onClick={handleLink}>
          <LinkIcon size={14} />
        </ToolbarButton>

        {yoruba ? (
          <>
            <span className="mx-1 h-4 w-px bg-border" />
            <div ref={paletteRef} className="relative">
              <button
                type="button"
                title="Insert Yoruba character"
                aria-label="Insert Yoruba character"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setPaletteOpen((o) => !o)}
                className="rounded px-2 py-1 text-sm font-bold text-neutral hover:bg-white"
              >
                Á
              </button>
              {paletteOpen ? (
                <div
                  onMouseDown={(e) => e.preventDefault()}
                  className="absolute right-0 top-full z-20 mt-1 rounded-lg border border-border bg-white p-2 shadow-lg"
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
                            onClick={() => {
                              insertChar(ch);
                              setPaletteOpen(false);
                            }}
                            className="h-8 w-8 rounded-md border border-border bg-white text-sm font-semibold text-neutral hover:border-primary hover:bg-primary-softer"
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="mb-1 mt-2 text-[10px] font-bold uppercase tracking-wider text-neutral-variant">
                    Uppercase
                  </div>
                  <div className="flex flex-col gap-1">
                    {PALETTE_UPPER.map((row, ri) => (
                      <div key={`u-${ri}`} className="flex gap-1">
                        {row.map((ch) => (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => {
                              insertChar(ch);
                              setPaletteOpen(false);
                            }}
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
                    <span className="font-semibold">/</span> á ·{' '}
                    <span className="font-semibold">; or \</span> à ·{' '}
                    <span className="font-semibold">.</span> ẹ ọ ṣ
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={emit}
          onBlur={emit}
          onKeyDown={handleKeyDown}
          onKeyUp={syncCurrentBlock}
          onMouseUp={syncCurrentBlock}
          className="prose-cultural w-full bg-white p-3 pr-16 text-sm text-neutral outline-none [&_h2]:mb-1 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-extrabold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-bold [&_a]:text-primary [&_a]:underline [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          style={{ minHeight }}
        />
        {isEmpty && placeholder ? (
          <span className="pointer-events-none absolute left-3 top-3 text-sm text-neutral-variant">
            {placeholder}
          </span>
        ) : null}
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-neutral-variant">
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded p-1.5 hover:bg-white"
    >
      {children}
    </button>
  );
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}
