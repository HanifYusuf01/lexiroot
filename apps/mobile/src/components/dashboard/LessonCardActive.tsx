import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface LessonCardActiveProps {
  level: number;
  title: string;
  currentXp: number;
  targetXp: number;
  xpPerLesson: number;
  onPress?: () => void;
}

export function LessonCardActive({
  level,
  title,
  currentXp,
  targetXp,
  xpPerLesson,
  onPress,
}: LessonCardActiveProps) {
  const progress = Math.min(1, currentXp / targetXp);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Lvl {level}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.level}>Level {level}</Text>
        </View>
        <Text style={styles.xp}>
          {currentXp}/{targetXp} XP
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.bonusRow}>
        <Ionicons name="star" size={14} color={colors.tertiary} />
        <Text style={styles.bonusText}>+{xpPerLesson} XP after next lesson</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: colors.white,
  },
  center: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  level: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
  },
  xp: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bonusText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
  },
});
