/**
 * Minimal HTML parser for the cultural content reader. The admin's
 * RichTextArea (contentEditable + execCommand) produces a small, well-defined
 * set of tags — h2/h3/p/ul/ol/li/strong/b/em/i/u/a/br — so we don't need a
 * full DOM parser, just enough to walk blocks and inline runs.
 */

export interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  href?: string;
}

export type Block =
  | { kind: 'heading'; level: 2 | 3; runs: InlineRun[] }
  | { kind: 'paragraph'; runs: InlineRun[] }
  | { kind: 'list'; ordered: boolean; items: InlineRun[][] };

const INLINE_TAGS = new Set([
  'strong',
  'b',
  'em',
  'i',
  'u',
  'a',
  'span',
  'br',
]);

const BLOCK_REGEX =
  /<(h2|h3|p|ul|ol|div)\b([^>]*)>([\s\S]*?)<\/\1>|<br\s*\/?>/gi;

export function parseHtmlBlocks(html: string): Block[] {
  if (!html) return [];
  const blocks: Block[] = [];
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let leadingText = '';

  function flushLoose(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    blocks.push({ kind: 'paragraph', runs: parseInline(trimmed) });
  }

  // Reset state for fresh parse
  BLOCK_REGEX.lastIndex = 0;
  while ((match = BLOCK_REGEX.exec(html)) !== null) {
    const before = html.slice(lastIndex, match.index);
    leadingText += before;
    lastIndex = match.index + match[0].length;

    const tag = match[1]?.toLowerCase();
    const inner = match[3] ?? '';

    if (!tag) {
      // standalone <br> — treat as paragraph break
      flushLoose(leadingText);
      leadingText = '';
      continue;
    }

    if (leadingText.trim()) {
      flushLoose(leadingText);
      leadingText = '';
    }

    if (tag === 'h2' || tag === 'h3') {
      blocks.push({
        kind: 'heading',
        level: tag === 'h2' ? 2 : 3,
        runs: parseInline(inner),
      });
    } else if (tag === 'ul' || tag === 'ol') {
      const items = parseListItems(inner);
      if (items.length > 0) {
        blocks.push({ kind: 'list', ordered: tag === 'ol', items });
      }
    } else {
      // p / div
      const runs = parseInline(inner);
      if (runs.some((r) => r.text.trim().length > 0)) {
        blocks.push({ kind: 'paragraph', runs });
      }
    }
  }

  // Trailing text after the last block
  const tail = html.slice(lastIndex);
  if (tail.trim()) {
    flushLoose(leadingText + tail);
  } else if (leadingText.trim()) {
    flushLoose(leadingText);
  }

  // If we found no blocks at all, fall back to splitting plain text on blank
  // lines so legacy content (or unwrapped strings) still renders.
  if (blocks.length === 0) {
    const text = stripTags(html).trim();
    if (!text) return [];
    return text.split(/\n\s*\n+/).map((para) => ({
      kind: 'paragraph' as const,
      runs: [{ text: para.trim() }],
    }));
  }

  return blocks;
}

const LI_REGEX = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;

function parseListItems(html: string): InlineRun[][] {
  const items: InlineRun[][] = [];
  let match: RegExpExecArray | null;
  LI_REGEX.lastIndex = 0;
  while ((match = LI_REGEX.exec(html)) !== null) {
    items.push(parseInline(match[1] ?? ''));
  }
  return items;
}

interface InlineToken {
  type: 'open' | 'close' | 'self' | 'text';
  tag?: string;
  href?: string;
  text?: string;
}

const INLINE_TOKEN_REGEX = /<(\/?)([a-z]+)\b([^>]*)>|([^<]+)/gi;

function parseInline(html: string): InlineRun[] {
  const tokens: InlineToken[] = [];
  let match: RegExpExecArray | null;
  INLINE_TOKEN_REGEX.lastIndex = 0;
  while ((match = INLINE_TOKEN_REGEX.exec(html)) !== null) {
    const [, slash, tag, attrs, textChunk] = match;
    if (textChunk !== undefined) {
      tokens.push({ type: 'text', text: decodeEntities(textChunk) });
      continue;
    }
    const tagName = tag.toLowerCase();
    if (!INLINE_TAGS.has(tagName)) continue;
    if (tagName === 'br') {
      tokens.push({ type: 'text', text: '\n' });
      continue;
    }
    if (slash) {
      tokens.push({ type: 'close', tag: tagName });
    } else {
      const href =
        tagName === 'a' ? extractAttr(attrs ?? '', 'href') ?? undefined : undefined;
      tokens.push({ type: 'open', tag: tagName, href });
    }
  }

  const stack: Array<{ tag: string; href?: string }> = [];
  const runs: InlineRun[] = [];

  for (const tok of tokens) {
    if (tok.type === 'open' && tok.tag) {
      stack.push({ tag: tok.tag, href: tok.href });
    } else if (tok.type === 'close' && tok.tag) {
      const idx = [...stack].reverse().findIndex((s) => s.tag === tok.tag);
      if (idx !== -1) {
        const realIdx = stack.length - 1 - idx;
        stack.splice(realIdx, 1);
      }
    } else if (tok.type === 'text' && tok.text) {
      const run: InlineRun = { text: tok.text };
      for (const node of stack) {
        if (node.tag === 'strong' || node.tag === 'b') run.bold = true;
        if (node.tag === 'em' || node.tag === 'i') run.italic = true;
        if (node.tag === 'u') run.underline = true;
        if (node.tag === 'a' && node.href) run.href = node.href;
      }
      runs.push(run);
    }
  }

  // Merge adjacent runs that share styling — fewer Text children downstream.
  return mergeRuns(runs);
}

function mergeRuns(runs: InlineRun[]): InlineRun[] {
  const out: InlineRun[] = [];
  for (const r of runs) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.bold === r.bold &&
      prev.italic === r.italic &&
      prev.underline === r.underline &&
      prev.href === r.href
    ) {
      prev.text += r.text;
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

function extractAttr(attrs: string, name: string): string | null {
  const m = new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attrs);
  return m ? m[1] : null;
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ''));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
