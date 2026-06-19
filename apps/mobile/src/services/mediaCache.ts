import * as FileSystem from 'expo-file-system/legacy';

/** All downloaded lesson media lives under one directory in app storage. */
const MEDIA_DIR = `${FileSystem.documentDirectory}offline-media/`;

let dirReady = false;

async function ensureDir(): Promise<void> {
  if (dirReady) return;
  const info = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  dirReady = true;
}

/** Stable, collision-resistant-enough hash for deriving a local filename. */
function hashUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i += 1) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Local destination path for a remote URL, preserving the file extension so
 * the audio/image decoders can still sniff the format. */
function localPathFor(url: string): string {
  const withoutQuery = url.split('?')[0];
  const ext = withoutQuery.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() ?? 'bin';
  return `${MEDIA_DIR}${hashUrl(url)}.${ext}`;
}

/**
 * Downloads a remote media URL into app storage and returns the local `file://`
 * URI. If the file is already present, returns the existing path without
 * re-downloading — making repeated/partial downloads idempotent.
 */
export async function downloadMedia(url: string): Promise<string> {
  await ensureDir();
  const dest = localPathFor(url);
  const existing = await FileSystem.getInfoAsync(dest);
  if (existing.exists) return existing.uri;
  const result = await FileSystem.downloadAsync(url, dest);
  return result.uri;
}

/** Removes a single downloaded file. Safe to call if it's already gone. */
export async function deleteMedia(localUri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch {
    // best-effort cleanup — a missing file is not an error here
  }
}

/** Wipes every downloaded media file (e.g. on logout or "clear downloads"). */
export async function clearAllMedia(): Promise<void> {
  try {
    await FileSystem.deleteAsync(MEDIA_DIR, { idempotent: true });
  } catch {
    // ignore
  }
  dirReady = false;
}

/**
 * Walks an arbitrary lesson payload (entries, exercises, nested options) and
 * collects every downloadable media URL. Schema-agnostic: it picks up any
 * absolute http(s) string ending in a known audio/image extension, so new
 * media fields don't need to be registered here.
 */
const MEDIA_EXT = /\.(mp3|m4a|wav|aac|ogg|oga|png|jpe?g|webp|gif)(\?|$)/i;

export function collectMediaUrls(...payloads: unknown[]): string[] {
  const found = new Set<string>();
  const visit = (node: unknown): void => {
    if (typeof node === 'string') {
      if (/^https?:\/\//i.test(node) && MEDIA_EXT.test(node)) found.add(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === 'object') {
      Object.values(node).forEach(visit);
    }
  };
  payloads.forEach(visit);
  return Array.from(found);
}
