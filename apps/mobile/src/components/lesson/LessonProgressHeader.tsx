import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface LessonProgressHeaderProps {
  /** 0..1 — fraction of the level completed. */
  progress: number;
  xp: number;
  speed?: '1x' | '0.75x' | '0.5x';
  onSpeedToggle?: () => void;
  onClose: () => void;
}

export function LessonProgressHeader({
  progress,
  xp,
  speed = '1x',
  onSpeedToggle,
  onClose,
}: LessonProgressHeaderProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.neutral} />
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
        </View>
        <Text style={styles.xp}>
          {xp} <Ionicons name="flame" size={11} color={colors.primary} />
          <Text style={styles.xpLabel}> XP</Text>
        </Text>
      </View>
      <View style={styles.speedRow}>
        <Pressable onPress={onSpeedToggle} style={styles.speedPill}>
          <Text style={styles.speedText}>{speed}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  close: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  xp: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.primary,
  },
  xpLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  speedRow: {
    alignItems: 'flex-end',
  },
  speedPill: {
    minWidth: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySofter,
    alignItems: 'center',
  },
  speedText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
});
