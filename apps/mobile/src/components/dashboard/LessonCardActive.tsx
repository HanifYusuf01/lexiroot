import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface LessonCardActiveProps {
  level: number;
  title: string;
  currentXp: number;
  targetXp: number;
  xpPerLesson: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  onPress?: () => void;
}

export function LessonCardActive({
  level,
  title,
  currentXp,
  targetXp,
  xpPerLesson,
  lessonsCompleted,
  lessonsTotal,
  onPress,
}: LessonCardActiveProps) {
  const progress = Math.min(1, targetXp > 0 ? currentXp / targetXp : 0);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Lvl {level}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.title} numberOfLines={1}>
            {title} <Text style={styles.titleDot}>· Level {level}</Text>
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
        <Text style={styles.xp}>
          {currentXp}/{targetXp} XP
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.lessonsCount}>
          {lessonsCompleted}/{lessonsTotal} Lessons
        </Text>
        <View style={styles.bonus}>
          <Ionicons name="star" size={13} color={colors.tertiary} />
          <Text style={styles.bonusText}>+{xpPerLesson} XP after next lesson</Text>
        </View>
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
    gap: 6,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
  titleDot: {
    fontFamily: fonts.medium,
    color: colors.neutralVariant,
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
  xp: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 56 + spacing.md,
    gap: spacing.sm,
  },
  lessonsCount: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.neutral,
  },
  bonus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bonusText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.neutralVariant,
  },
});
