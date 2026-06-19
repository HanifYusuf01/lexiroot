import { useAppSelector } from '../store/hooks';
import { selectIsOnline } from '../store/slices/networkSlice';

/** Returns whether the device currently has a usable internet connection. */
export function useIsOnline(): boolean {
  return useAppSelector(selectIsOnline);
}
