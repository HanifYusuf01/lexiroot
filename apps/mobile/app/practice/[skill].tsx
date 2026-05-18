import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LessonType } from '@lexiroot/shared';
import { DailyChallengeCard } from '../../src/components/practice/DailyChallengeCard';
import { SkillPath, type PathStep } from '../../src/components/practice/SkillPath';
import { useListLessonsQuery } from '../../src/services/lessonsApi';
import { useGetProgressQuery } from '../../src/services/progressApi';
import { useAppSelector } from '../../src/store/hooks';
import {
  colors,
  fonts,
  radius,
  skillThemes,
  spacing,
  type SkillKey,
} from '../../src/constants/theme';

const SKILL_TO_LESSON_TYPE: Record<SkillKey, LessonType> = {
  'listen-select': 'letters-numbers',
  vocabulary: 'vocabulary',
  sentence: 'sentence',
  recognition: 'recognition',
};

export default function SkillPathScreen() {
  const { skill } = useLocalSearchParams<{ skill: SkillKey }>();
  const theme = skill && skillThemes[skill];
  const user = useAppSelector((s) => s.auth.user);
  const lessonsQuery = useListLessonsQuery(
    { language: user?.country ? undefined : undefined, limit: 100 },
    { skip: !skill },
  );
  const progressQuery = useGetProgressQuery(undefined, { skip: !skill });

  const lessonType = skill ? SKILL_TO_LESSON_TYPE[skill] : undefined;
  const lessons = useMemo(() => {
    const items = (lessonsQuery.data?.items ?? []).filter((l) => l.type === lessonType);
    return [...items].sort((a, b) => a.level - b.level || a.orderInUnit - b.orderInUnit);
  }, [lessonsQuery.data, lessonType]);

  const completedIds = progressQuery.data?.completedLessonIds ?? [];
  const streak = progressQuery.data?.streak ?? 0;
  const totalLessons = lessons.length;
  const completedCount = lessons.filter((l) => completedIds.includes(l.id)).length;
  const overallProgress = totalLessons > 0 ? completedCount / totalLessons : 0;

  // Determine current lesson: first not-completed in order
  const currentIndex = lessons.findIndex((l) => !completedIds.includes(l.id));

  const steps = useMemo<PathStep[]>(() => {
    return lessons
      .map((l, idx) => {
        const completed = completedIds.includes(l.id);
        const state: PathStep['state'] = completed
          ? 'unlocked'
          : idx === currentIndex
            ? 'current'
            : 'locked';
        // alternate x position so the path zig-zags
        const x = idx % 4 === 0 ? 0.05 : idx % 4 === 1 ? 0.35 : idx % 4 === 2 ? 0.7 : 0.4;
        return { id: l.id, state, level: l.level, x };
      })
      .reverse();
  }, [lessons, completedIds, currentIndex]);

  if (!theme) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Text style={styles.title}>Skill not found</Text>
      </SafeAreaView>
    );
  }

  function handleNodePress(step: PathStep) {
    if (step.state === 'locked') return;
    router.push(`/practice/lesson/${step.id}` as never);
  }

  const isLoading = lessonsQuery.isLoading || progressQuery.isLoading;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.neutral} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ẹ káàbọ̀, {user?.displayName?.split(' ')[0] ?? 'friend'}</Text>
            <Text style={styles.subtitle}>You&apos;re on a roll!</Text>
          </View>
          <View style={[styles.streakChip, { backgroundColor: theme.softer }]}>
            <Ionicons name="flame" size={14} color={theme.main} />
            <Text style={[styles.streakText, { color: theme.main }]}>
              {streak}-day streak
            </Text>
          </View>
        </View>

        <DailyChallengeCard theme={theme} done={completedCount} total={totalLessons || 5} xpReward={50} />

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.main} />
          </View>
        ) : steps.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No lessons available yet for this skill.</Text>
          </View>
        ) : (
          <View style={styles.pathWrap}>
            <SkillPath steps={steps} theme={theme} onPressNode={handleNodePress} />
          </View>
        )}

        <View style={[styles.progressCard, { backgroundColor: theme.softer, borderColor: theme.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressLabel}>Overall Progress</Text>
            <Text style={[styles.progressPercent, { color: theme.main }]}>
              {Math.round(overallProgress * 100)}%
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: theme.soft }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: theme.main, width: `${overallProgress * 100}%` },
                ]}
              />
            </View>
          </View>
          <Ionicons name="gift" size={36} color={theme.main} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    color: colors.neutral,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    marginTop: 2,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  streakText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
  },
  pathWrap: {
    marginTop: spacing.sm,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  progressLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
  progressPercent: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
