import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LessonType } from '@lexiroot/shared';
import { LESSON_TYPE_LABELS } from '@lexiroot/shared';
import { colors, fonts, radius, skillThemes, spacing, type SkillKey } from '../../constants/theme';
import { SkillIcon } from '../icons/SkillIcon';

// Lesson types map onto the four practice skills for icon + colour. 'exercise'
// lessons carry no teaching content of their own, so they fall back to the
// listen-select palette.
const LESSON_TYPE_TO_SKILL: Record<LessonType, SkillKey> = {
  'letters-numbers': 'listen-select',
  vocabulary: 'vocabulary',
  sentence: 'sentence',
  recognition: 'recognition',
  exercise: 'listen-select',
};

interface LessonHistoryCardProps {
  title: string;
  type: LessonType;
  level: number;
  xp: number;
  onPress?: () => void;
}

export function LessonHistoryCard({ title, type, level, xp, onPress }: LessonHistoryCardProps) {
  const theme = skillThemes[LESSON_TYPE_TO_SKILL[type]];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.main }]}>
        <SkillIcon skill={theme.key} color={theme.on} size={20} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {LESSON_TYPE_LABELS[type]} · Lvl {level}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.xp}>+{xp} XP</Text>
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutralSoft,
    shadowColor: colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.neutral,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  xp: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.primary,
  },
});
