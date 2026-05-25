import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { LearningLevel, LessonType } from '@lexiroot/shared';
import { LessonCardActive } from '../../src/components/dashboard/LessonCardActive';
import { StreakBadge } from '../../src/components/dashboard/StreakBadge';
import { UpgradePromoCard } from '../../src/components/dashboard/UpgradePromoCard';
import { WeekDots } from '../../src/components/dashboard/WeekDots';
import { RootNuggetCard } from '../../src/components/culture/RootNuggetCard';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useListLessonsQuery, type LessonRow } from '../../src/services/lessonsApi';
import { useListCulturalContentQuery } from '../../src/services/culturalContentApi';
import { useGetLessonProgressQuery, useGetProgressQuery } from '../../src/services/progressApi';
import { useAppSelector } from '../../src/store/hooks';

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

function todayWeekdayIndex(): number {
  // Monday=1, Sunday=7 — matches the WeekDots dayNum scheme.
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

export default function Home() {
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
  const tier: LearningLevel = user?.level ?? 'beginner';

  // refetchOnMountOrArgChange keeps the streak fresh: each time the user
  // returns to Home (e.g. after touchActivity has bumped the streak on the
  // first request of the day), RTK Query re-fetches /me/progress.
  const { data: progress } = useGetProgressQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: savedProgress } = useGetLessonProgressQuery();
  const { data: lessonsPage } = useListLessonsQuery({ tier, limit: 100 });
  const { data: nuggetPage } = useListCulturalContentQuery({
    type: 'proverb',
    tier,
    limit: 10,
  });

  const completedIds = useMemo(
    () => new Set(progress?.completedLessonIds ?? []),
    [progress?.completedLessonIds],
  );

  // Group lessons by level → priority-sorted subs per level.
  const levelsMap = useMemo(() => {
    const map = new Map<number, LessonRow[]>();
    for (const lesson of lessonsPage?.items ?? []) {
      if (!TYPE_PRIORITY.includes(lesson.type)) continue;
      const list = map.get(lesson.level) ?? [];
      list.push(lesson);
      map.set(lesson.level, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => typeRank(a.type) - typeRank(b.type));
    }
    return map;
  }, [lessonsPage]);

  // Pick the active level: saved resume target if it still exists AND isn't
  // already fully completed (a learner re-entering a finished level can leave
  // a stale resume row pointing back at it — ignore that so the dashboard
  // advances to the next un-finished level), otherwise the lowest level
  // number that isn't fully completed.
  const activeLevel = useMemo(() => {
    if (savedProgress && savedProgress.tier === tier && levelsMap.has(savedProgress.level)) {
      const savedSubs = levelsMap.get(savedProgress.level) ?? [];
      const savedDone = savedSubs.length > 0 && savedSubs.every((s) => completedIds.has(s.id));
      if (!savedDone) return savedProgress.level;
    }
    const sortedLevels = Array.from(levelsMap.keys()).sort((a, b) => a - b);
    for (const lvl of sortedLevels) {
      const subs = levelsMap.get(lvl) ?? [];
      const allDone = subs.length > 0 && subs.every((s) => completedIds.has(s.id));
      if (!allDone) return lvl;
    }
    return sortedLevels[0] ?? 1;
  }, [savedProgress, tier, levelsMap, completedIds]);

  const activeSubs = levelsMap.get(activeLevel) ?? [];
  const activeTitle = activeSubs[0]?.title ?? `Level ${activeLevel}`;
  const targetXp = activeSubs.reduce((sum, s) => sum + (s.xpReward ?? 0), 0);
  const currentXp =
    savedProgress && savedProgress.tier === tier && savedProgress.level === activeLevel
      ? savedProgress.xp
      : activeSubs
          .filter((s) => completedIds.has(s.id))
          .reduce((sum, s) => sum + (s.xpReward ?? 0), 0);
  const xpPerLesson = activeSubs[0]?.xpReward ?? 0;

  const activeSubsDone = activeSubs.filter((s) => completedIds.has(s.id)).length;

  const latestNugget = useMemo(() => {
    const items = [...(nuggetPage?.items ?? [])].sort((a, b) => {
      const aT = a.publishedAt ?? a.createdAt;
      const bT = b.publishedAt ?? b.createdAt;
      return bT.localeCompare(aT);
    });
    return items.find((c) => !!c.audioUrl) ?? items[0] ?? null;
  }, [nuggetPage]);

  const streak = progress?.streak ?? 0;
  const weekday = todayWeekdayIndex();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Ẹ káàbọ̀, {firstName}</Text>
            <Text style={styles.subtitle}>
              {streak > 0 ? "You're on a roll!" : 'Start a streak today!'}
            </Text>
          </View>
          <StreakBadge days={streak} />
        </View>

        <View style={styles.weekWrap}>
          <WeekDots currentDay={weekday} />
        </View>

        <Text style={styles.sectionTitle}>Jump back in</Text>

        <View style={styles.lessons}>
          {activeSubs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No lessons available yet.</Text>
            </View>
          ) : (
            <LessonCardActive
              level={activeLevel}
              title={activeTitle}
              currentXp={currentXp}
              targetXp={targetXp || xpPerLesson || 1}
              xpPerLesson={xpPerLesson}
              lessonsCompleted={activeSubsDone}
              lessonsTotal={activeSubs.length}
              onPress={() => router.push(`/levels/${tier}/${activeLevel}` as never)}
            />
          )}
        </View>

        <Pressable
          style={styles.viewAll}
          hitSlop={8}
          onPress={() => router.push('/levels' as never)}
        >
          <Text style={styles.viewAllText}>View all levels</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.neutral} />
        </Pressable>

        {latestNugget ? (
          <RootNuggetCard
            proverb={latestNugget.titleTranslated || latestNugget.titleEnglish}
            translation={latestNugget.shortDescription}
            audioUrl={latestNugget.audioUrl}
            onViewAllPress={() => router.push('/(tabs)/culture' as never)}
          />
        ) : null}

        <UpgradePromoCard onPress={() => router.push('/upgrade' as never)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.neutral,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    marginTop: 2,
  },
  weekWrap: {
    paddingVertical: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.neutral,
    marginTop: spacing.xs,
  },
  lessons: {
    gap: spacing.sm,
  },
  empty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  viewAllText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
});
