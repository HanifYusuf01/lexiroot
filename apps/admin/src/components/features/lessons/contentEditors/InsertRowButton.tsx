import { ArrowUp, Plus } from 'lucide-react';

interface Props {
  onClick: () => void;
  /** Tooltip and accessible name, e.g. "Insert row below". */
  label: string;
  /** `top` renders the labelled toolbar variant used for inserting at position 0. */
  variant?: 'row' | 'top';
}

/**
 * Insert-a-row control, shared by every lesson content editor.
 *
 * Bordered rather than a bare glyph on purpose. The first version was a grey
 * 14px icon explained only by a hover tooltip, and it read as decoration — the
 * feature worked, but authors couldn't find it and concluded rows could only be
 * appended. Looking like the "Add" button it sits beside is what makes it
 * legible as a control.
 */
export function InsertRowButton({ onClick, label, variant = 'row' }: Props) {
  if (variant === 'top') {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={label}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-white px-2.5 text-xs font-semibold text-neutral hover:bg-neutral-soft"
      >
        <ArrowUp size={12} />
        Add to top
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white text-neutral-variant transition hover:border-primary-border hover:bg-primary-softer hover:text-primary"
    >
      <Plus size={14} />
    </button>
  );
}
