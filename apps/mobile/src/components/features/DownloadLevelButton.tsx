import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { LearningLevel } from '@lexiroot/shared';
import { colors, radius } from '../../constants/theme';
import { useDownloadLesson, useGroupDownloadStatus } from '../../hooks/useDownloadLesson';
import { useIsOnline } from '../../hooks/useIsOnline';
import { useHasFeature } from '../../hooks/useEntitlements';

interface DownloadLevelButtonProps {
  /** Tier + level identify the list query the player reads offline. */
  tier: LearningLevel;
  level: number;
  /** Sub-lesson IDs that make up the level. */
  lessonIds: string[];
}

/**
 * Compact control for downloading a whole level's content for offline use.
 * Reflects aggregate status across the level's sub-lessons: tap to download,
 * spinner while in progress, filled cloud once everything is cached. Hidden
 * when the level has no downloadable content.
 */
export function DownloadLevelButton({ tier, level, lessonIds }: DownloadLevelButtonProps) {
  const status = useGroupDownloadStatus(lessonIds);
  const download = useDownloadLesson();
  const isOnline = useIsOnline();
  const canDownload = useHasFeature('offline_downloads');
  const router = useRouter();

  if (lessonIds.length === 0) return null;

  // Offline downloads are a premium feature — non-entitled users see a locked
  // control that routes to the upgrade flow instead of downloading.
  if (!canDownload) {
    return (
      <Pressable
        onPress={() => router.push('/upgrade' as never)}
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Download for offline (premium)"
      >
        <Ionicons name="lock-closed" size={18} color={colors.neutralVariant} />
      </Pressable>
    );
  }

  const handlePress = () => {
    if (status === 'downloading' || status === 'ready') return;
    if (!isOnline) return; // can't fetch new content while offline
    void download({ tier, level, lessonIds });
  };

  if (status === 'downloading') {
    return (
      <Pressable style={styles.button} disabled>
        <ActivityIndicator size="small" color={colors.primary} />
      </Pressable>
    );
  }

  const ready = status === 'ready';
  const errored = status === 'error';
  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      disabled={ready || !isOnline}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={ready ? 'Downloaded for offline' : 'Download for offline'}
    >
      <Ionicons
        name={ready ? 'cloud-done' : errored ? 'cloud-offline-outline' : 'cloud-download-outline'}
        size={20}
        color={ready ? colors.success : errored ? colors.error : colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySofter,
  },
  pressed: {
    opacity: 0.6,
  },
});
