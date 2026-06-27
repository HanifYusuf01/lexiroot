import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LessonType } from '@lexiroot/shared';
import {
  LessonLevelSection,
  type LevelLesson,
} from '../../src/components/lesson/LessonLevelSection';
import { useListLessonsQuery } from '../../src/services/lessonsApi';
import { useGetProgressQuery } from '../../src/services/progressApi';
import { useAppSelector } from '../../src/store/hooks';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';

// How many level sections to show before the "Show more levels" control.
const INITIAL_LEVELS = 6;

// Stable order of lesson types within a level.
const TYPE_PRIORITY: readonly LessonType[] = [
  'letters-numbers',
  'vocabulary',
  'recognition',
  'sentence',
];
const typeRank = (t: LessonType) => {
  const i = TYPE_PRIORITY.indexOf(t);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

interface LevelGroup {
  level: number;
  lessons: LevelLesson[];
}

export default function LessonsTab() {
  const user = useAppSelector((s) => s.auth.user);
  const lessonsQuery = useListLessonsQuery(
    { limit: 100 },
    { refetchOnMountOrArgChange: true },
  );
  const progressQuery = useGetProgressQuery();

  const completedIds = useMemo(
    () => new Set(progressQuery.data?.completedLessonIds ?? []),
    [progressQuery.data?.completedLessonIds],
  );
  const streak = progressQuery.data?.streak ?? 0;

  // Completed lessons grouped by level, newest level first; within a level the
  // lessons follow curriculum (type) order.
  const levelGroups = useMemo<LevelGroup[]>(() => {
    const completed = (lessonsQuery.data?.items ?? [])
      .filter((l) => completedIds.has(l.id))
      .sort((a, b) => b.level - a.level || typeRank(a.type) - typeRank(b.type));
    const map = new Map<number, LevelLesson[]>();
    for (const l of completed) {
      const list = map.get(l.level) ?? [];
      list.push({ id: l.id, title: l.title, type: l.type, level: l.level, xp: l.xpReward });
      map.set(l.level, list);
    }
    return Array.from(map.entries()).map(([level, lessons]) => ({ level, lessons }));
  }, [lessonsQuery.data, completedIds]);

  // Newest level starts expanded; the learner controls the rest from there.
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set());
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && levelGroups.length > 0) {
      initializedRef.current = true;
      setExpandedLevels(new Set([levelGroups[0].level]));
    }
  }, [levelGroups]);

  const [showAll, setShowAll] = useState(false);
  const visibleGroups = showAll ? levelGroups : levelGroups.slice(0, INITIAL_LEVELS);
  const hiddenCount = levelGroups.length - visibleGroups.length;

  const toggleLevel = (level: number) =>
    setExpandedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });

  const isLoading = lessonsQuery.isLoading || progressQuery.isLoading;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.heroBanner}>
        <Text style={styles.heroGreeting}>
          Ẹ káàbọ̀, {user?.displayName?.split(' ')[0] ?? 'friend'}
        </Text>
        <View style={styles.heroStreak}>
          <Ionicons name="flame" size={14} color={colors.white} />
          <Text style={styles.heroStreakText}>{streak}-day streak</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Your Lessons</Text>
        <Text style={styles.subtitle}>Revisit the lessons you&apos;ve completed</Text>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : levelGroups.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={40} color={colors.neutralVariant} />
            <Text style={styles.emptyText}>You haven&apos;t completed any lessons yet.</Text>
            <Text style={styles.emptyHint}>
              Finish a lesson and it&apos;ll show up here to revisit.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleGroups.map((group) => (
              <LessonLevelSection
                key={group.level}
                level={group.level}
                lessons={group.lessons}
                expanded={expandedLevels.has(group.level)}
                onToggle={() => toggleLevel(group.level)}
                onPressLesson={(id) => router.push(`/lessons/review/${id}` as never)}
              />
            ))}

            {hiddenCount > 0 ? (
              <Pressable
                onPress={() => setShowAll(true)}
                style={({ pressed }) => [styles.showMore, pressed && styles.showMorePressed]}
              >
                <Text style={styles.showMoreText}>Show {hiddenCount} more levels</Text>
                <Ionicons name="chevron-down" size={16} color={colors.primary} />
              </Pressable>
            ) : showAll && levelGroups.length > INITIAL_LEVELS ? (
              <Pressable
                onPress={() => setShowAll(false)}
                style={({ pressed }) => [styles.showMore, pressed && styles.showMorePressed]}
              >
                <Text style={styles.showMoreText}>Show less</Text>
                <Ionicons name="chevron-up" size={16} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroBanner: {
    height: 130,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroGreeting: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.white,
  },
  heroStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
  },
  heroStreakText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.neutral,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  showMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  showMorePressed: {
    opacity: 0.7,
  },
  showMoreText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.neutral,
    textAlign: 'center',
  },
  emptyHint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
});
