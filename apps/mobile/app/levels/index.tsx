import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StreakBadge } from '../../src/components/dashboard/StreakBadge';
import { DownloadLevelButton } from '../../src/components/features/DownloadLevelButton';
import { Button } from '../../src/components/ui/Button';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { useAppSelector } from '../../src/store/hooks';
import type { LearningLevel, LessonType } from '@lexiroot/shared';
import { useListLessonsQuery, type LessonRow } from '../../src/services/lessonsApi';
import { useGetLessonProgressQuery, useGetProgressQuery } from '../../src/services/progressApi';

const PRIMARY_TIER = 'beginner' as const;

// Curriculum order — matches the level player's sub-lesson sequence.
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

export default function LevelsIndex() {
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';
  const tier: LearningLevel = user?.level ?? PRIMARY_TIER;

  const { data, isLoading } = useListLessonsQuery({ tier, limit: 100 });
  const { data: progress } = useGetProgressQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: savedProgress } = useGetLessonProgressQuery();
  const completedIds = useMemo(
    () => new Set(progress?.completedLessonIds ?? []),
    [progress?.completedLessonIds],
  );

  // Group lessons by level number — pick the priority-ranked first content
  // lesson (letters-numbers → vocabulary → recognition → sentence) as the
  // level's representative title row.
  const levels = useMemo(() => {
    const lessons = data?.items ?? [];
    const byLevel = new Map<number, LessonRow[]>();
    for (const lesson of lessons) {
      const list = byLevel.get(lesson.level) ?? [];
      list.push(lesson);
      byLevel.set(lesson.level, list);
    }
    const entries = Array.from(byLevel.entries())
      .map(([level, list]) => {
        const ranked = list
          .filter((l) => TYPE_PRIORITY.includes(l.type))
          .slice()
          .sort((a, b) => typeRank(a.type) - typeRank(b.type));
        const subs = ranked.length > 0 ? ranked : list;
        const content = subs[0];
        return { level, title: content?.title ?? `Level ${level}`, subs };
      })
      .sort((a, b) => a.level - b.level);
    return entries;
  }, [data]);

  const activeLevel = useMemo(() => {
    const levelNumbers = levels.map((l) => l.level);
    if (
      savedProgress &&
      savedProgress.tier === tier &&
      levelNumbers.includes(savedProgress.level)
    ) {
      const savedLevel = levels.find((l) => l.level === savedProgress.level);
      const savedDone =
        !!savedLevel &&
        savedLevel.subs.length > 0 &&
        savedLevel.subs.every((s) => completedIds.has(s.id));
      if (!savedDone) return savedProgress.level;
    }

    for (const lvl of levels) {
      const allDone = lvl.subs.length > 0 && lvl.subs.every((s) => completedIds.has(s.id));
      if (!allDone) return lvl.level;
    }
    return levels.at(-1)?.level ?? 1;
  }, [levels, savedProgress, tier, completedIds]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.neutral} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Ẹ káàbọ̀, {firstName}</Text>
            <Text style={styles.subtitle}>You&apos;re on a roll!</Text>
          </View>
          <StreakBadge days={progress?.streak ?? 0} />
        </View>

        <View style={styles.dailyCard}>
          <View style={styles.dailyIcon}>
            <Ionicons name="trophy" size={20} color={colors.white} />
          </View>
          <View style={styles.dailyBody}>
            <Text style={styles.dailyTitle}>Daily Challenge</Text>
            <Text style={styles.dailySub}>3/5 exercises done</Text>
          </View>
          <View style={styles.dailyXp}>
            <Text style={styles.dailyXpText}>+50XP</Text>
          </View>
        </View>

        {isLoading ? (
          <Text style={styles.placeholder}>Loading levels…</Text>
        ) : levels.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.placeholder}>No levels available yet.</Text>
            <Button label="Back" variant="outline" onPress={() => router.back()} />
          </View>
        ) : (
          <View style={styles.levelList}>
            {levels.map((lvl) => {
              const lessonsDone = lvl.subs.filter((s) => completedIds.has(s.id)).length;
              const completed = lvl.subs.length > 0 && lessonsDone === lvl.subs.length;
              const active = lvl.level === activeLevel && !completed;
              const targetXp = lvl.subs.reduce((sum, s) => sum + (s.xpReward ?? 0), 0);
              const currentXp =
                savedProgress && savedProgress.tier === tier && savedProgress.level === lvl.level
                  ? savedProgress.xp
                  : lvl.subs
                      .filter((s) => completedIds.has(s.id))
                      .reduce((sum, s) => sum + (s.xpReward ?? 0), 0);
              const xpToUnlock = levels
                .filter((entry) => entry.level < lvl.level)
                .reduce(
                  (sum, entry) =>
                    sum + entry.subs.reduce((entrySum, s) => entrySum + (s.xpReward ?? 0), 0),
                  0,
                );
              const unlocked = completed || active;
              return (
                <LevelRow
                  key={lvl.level}
                  tier={tier}
                  level={lvl.level}
                  title={lvl.title}
                  unlocked={unlocked}
                  completed={completed}
                  active={active}
                  currentXp={currentXp}
                  targetXp={targetXp || 1}
                  xpToUnlock={xpToUnlock}
                  lessonsDone={lessonsDone}
                  lessonsTotal={lvl.subs.length}
                  downloadableIds={lvl.subs
                    .filter((s) => s.offlineAvailable)
                    .map((s) => s.id)}
                  onPress={() => {
                    if (!unlocked) return;
                    router.push(`/levels/${tier}/${lvl.level}` as never);
                  }}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface LevelRowProps {
  tier: LearningLevel;
  level: number;
  title: string;
  unlocked: boolean;
  completed: boolean;
  active: boolean;
  currentXp: number;
  targetXp: number;
  xpToUnlock: number;
  lessonsDone: number;
  lessonsTotal: number;
  downloadableIds: string[];
  onPress: () => void;
}

function LevelRow({
  tier,
  level,
  title,
  unlocked,
  completed,
  active,
  currentXp,
  targetXp,
  xpToUnlock,
  lessonsDone,
  lessonsTotal,
  downloadableIds,
  onPress,
}: LevelRowProps) {
  if (completed) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.completedCard, pressed && styles.pressed]}
      >
        <View style={styles.completedBadge}>
          <Text style={styles.activeBadgeText}>Lvl {level}</Text>
        </View>
        <View style={styles.lockedBody}>
          <Text style={styles.activeTitle}>{title}</Text>
          <View style={styles.completedMetaRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.completedMeta}>Completed · +{targetXp} XP</Text>
          </View>
        </View>
        <DownloadLevelButton tier={tier} level={level} lessonIds={downloadableIds} />
        <Ionicons name="chevron-forward" size={18} color={colors.neutralVariant} />
      </Pressable>
    );
  }

  if (active) {
    const progress = Math.min(1, currentXp / targetXp);
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.activeCard, pressed && styles.pressed]}
      >
        <View style={styles.activeRow}>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Lvl {level}</Text>
          </View>
          <View style={styles.activeBody}>
            <Text style={styles.activeTitle}>{title}</Text>
            <Text style={styles.activeMeta}>Level {level}</Text>
          </View>
          <Text style={styles.activeXp}>
            {currentXp}/{targetXp} XP
          </Text>
          <DownloadLevelButton tier={tier} level={level} lessonIds={downloadableIds} />
        </View>
        <View style={styles.activeTrack}>
          <View style={[styles.activeFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.activeBonus}>
          <Text style={styles.activeLessons}>
            {lessonsDone}/{lessonsTotal} Lessons
          </Text>
          <View style={styles.activeBonusRight}>
            <Ionicons name="star" size={12} color={colors.tertiary} />
            <Text style={styles.activeBonusText}>+{targetXp - currentXp} XP left</Text>
          </View>
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable disabled={!unlocked} onPress={onPress} style={styles.lockedCard}>
      <View style={styles.lockedBadge}>
        <Ionicons name="lock-closed" size={16} color={colors.neutralVariant} />
      </View>
      <View style={styles.lockedBody}>
        <Text style={styles.lockedTitle}>Lvl {level}</Text>
        <Text style={styles.lockedMeta}>Unlocks at {xpToUnlock} XP</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  headerText: { flex: 1 },
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
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dailyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyBody: { flex: 1 },
  dailyTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: colors.white,
  },
  dailySub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  dailyXp: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  dailyXpText: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    color: colors.primary,
  },
  placeholder: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  levelList: {
    gap: spacing.sm,
  },
  completedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  completedBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  completedMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.success,
  },
  activeCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activeBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.white,
  },
  activeBody: { flex: 1 },
  activeTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  activeMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
  },
  activeXp: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  activeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  activeFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  activeBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  activeLessons: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.neutral,
  },
  activeBonusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeBonusText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.neutralVariant,
  },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  lockedBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedBody: { flex: 1 },
  lockedTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
  lockedMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
    marginTop: 2,
  },
});
