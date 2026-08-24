import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from '../../app/(tabs)/_layout';

/**
 * Bottom padding a tab screen's own scrollable content needs to fully clear
 * the floating pill tab bar, so the last item never renders underneath it.
 * Mirrors the math the tab bar itself uses to position above the safe area.
 */
export function useTabBarClearance(extra = 0): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + TAB_BAR_GAP * 2 + TAB_BAR_HEIGHT + extra;
}
