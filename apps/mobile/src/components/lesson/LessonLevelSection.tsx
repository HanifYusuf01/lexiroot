import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LessonType } from '@lexiroot/shared';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { LessonHistoryCard } from './LessonHistoryCard';

export interface LevelLesson {
  id: string;
  title: string;
  type: LessonType;
  level: number;
  xp: number;
}

interface LessonLevelSectionProps {
  level: number;
  lessons: LevelLesson[];
  expanded: boolean;
  onToggle: () => void;
  onPressLesson: (id: string) => void;
}

/**
 * Collapsible group of completed lessons for a single level. Collapsed it's a
 * one-row header (level + count); expanded it lists the level's lesson cards.
 * Keeps the Lessons tab short and scannable instead of one endless list.
 */
export function LessonLevelSection({
  level,
  lessons,
  expanded,
  onToggle,
  onPressLesson,
}: LessonLevelSectionProps) {
  return (
    <View style={styles.section}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{level}</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Level {level}</Text>
            <Text style={styles.headerCount}>
              {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} completed
            </Text>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.neutralVariant}
        />
      </Pressable>
      {expanded ? (
        <View style={styles.body}>
          {lessons.map((lesson) => (
            <LessonHistoryCard
              key={lesson.id}
              title={lesson.title}
              type={lesson.type}
              level={lesson.level}
              xp={lesson.xp}
              onPress={() => onPressLesson(lesson.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  pressed: {
    opacity: 0.9,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.white,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.neutral,
  },
  headerCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
  },
  body: {
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
});
