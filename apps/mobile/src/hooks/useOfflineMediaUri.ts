import { useAppSelector } from '../store/hooks';
import { selectLocalMediaUri } from '../store/slices/downloadsSlice';

/**
 * Resolves a remote media URL to its downloaded local file when one exists,
 * otherwise returns the original URL. Use this anywhere an `audioUrl`/`imageUrl`
 * is handed to a player or <Image> so offline (and faster online) playback uses
 * the cached file transparently.
 */
export function useOfflineMediaUri(url?: string | null): string | null {
  const clean = typeof url === 'string' && url.length > 0 ? url : null;
  const local = useAppSelector((s) => (clean ? selectLocalMediaUri(s, clean) : null));
  return local ?? clean;
}
