import { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';

interface Row {
  trigger: string;
  description: string;
  examples: { in: string; out: string }[];
}

const ROWS: Row[] = [
  {
    trigger: '/',
    description: 'High tone (acute) on previous vowel',
    examples: [
      { in: 'a/', out: 'á' },
      { in: 'e/', out: 'é' },
      { in: 'i/', out: 'í' },
      { in: 'o/', out: 'ó' },
      { in: 'u/', out: 'ú' },
    ],
  },
  {
    trigger: '\\ or ;',
    description: 'Low tone (grave) on previous vowel',
    examples: [
      { in: 'a\\', out: 'à' },
      { in: 'e;', out: 'è' },
      { in: 'i\\', out: 'ì' },
      { in: 'o;', out: 'ò' },
      { in: 'u\\', out: 'ù' },
    ],
  },
  {
    trigger: '.',
    description: 'Sub-dot for e / o / s',
    examples: [
      { in: 'e.', out: 'ẹ' },
      { in: 'o.', out: 'ọ' },
      { in: 's.', out: 'ṣ' },
    ],
  },
  {
    trigger: '. then /',
    description: 'Sub-dot + tone (chain shortcuts)',
    examples: [
      { in: 'e./', out: 'ẹ́' },
      { in: 'o.\\', out: 'ọ̀' },
    ],
  },
];

export function YorubaShortcutsHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 rounded-lg border border-primary-border bg-primary-softer">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Info size={14} className="text-primary" />
          <span className="text-xs font-bold text-neutral">
            Yoruba keyboard shortcuts
          </span>
          <span className="text-[11px] text-neutral-variant">
            (works in every text field below)
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-neutral-variant transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? (
        <div className="border-t border-primary-border/60 px-4 py-3">
          <p className="mb-2 text-[11px] text-neutral-variant">
            Type the trigger character right after the letter — the input replaces both
            characters with the Yoruba glyph. Capital letters work too (e.g. <code>A/</code> → Á).
            You can also press the <span className="rounded border border-border bg-white px-1 font-bold">Á</span> button next to any field for a clickable palette.
          </p>
          <div className="overflow-hidden rounded-md border border-border bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-soft/60">
                <tr>
                  <th className="px-2 py-1.5 font-bold text-neutral">Trigger</th>
                  <th className="px-2 py-1.5 font-bold text-neutral">What it does</th>
                  <th className="px-2 py-1.5 font-bold text-neutral">Examples</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.trigger} className="border-t border-border">
                    <td className="px-2 py-1.5 align-top">
                      <code className="rounded bg-neutral-soft px-1.5 py-0.5 font-bold text-primary">
                        {row.trigger}
                      </code>
                    </td>
                    <td className="px-2 py-1.5 align-top text-neutral">{row.description}</td>
                    <td className="px-2 py-1.5 align-top text-neutral">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {row.examples.map((ex, i) => (
                          <span key={i} className="font-mono text-[11px]">
                            <span className="text-neutral-variant">{ex.in}</span>
                            <span className="mx-1 text-neutral-variant">→</span>
                            <span className="font-bold text-neutral">{ex.out}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
