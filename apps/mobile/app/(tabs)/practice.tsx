import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LearningLevel, LessonType } from '@lexiroot/shared';
import { SkillCard } from '../../src/components/practice/SkillCard';
import { RootNuggetCard } from '../../src/components/culture/RootNuggetCard';
import { useListLessonsQuery } from '../../src/services/lessonsApi';
import { useGetProgressQuery } from '../../src/services/progressApi';
import { useListCulturalContentQuery } from '../../src/services/culturalContentApi';
import { useAppSelector } from '../../src/store/hooks';
import {
  colors,
  fonts,
  radius,
  skillThemes,
  spacing,
  type SkillKey,
} from '../../src/constants/theme';

const SKILL_ORDER: SkillKey[] = ['listen-select', 'vocabulary', 'sentence', 'recognition'];

const SKILL_TO_LESSON_TYPE: Record<SkillKey, LessonType> = {
  'listen-select': 'letters-numbers',
  vocabulary: 'vocabulary',
  sentence: 'sentence',
  recognition: 'recognition',
};

export default function PracticeTab() {
  const user = useAppSelector((s) => s.auth.user);
  const tier: LearningLevel = user?.level ?? 'beginner';
  const lessonsQuery = useListLessonsQuery({ limit: 100 });
  const progressQuery = useGetProgressQuery();
  const nuggetQuery = useListCulturalContentQuery({ tier, limit: 10 });

  const completedIds = progressQuery.data?.completedLessonIds ?? [];
  const streak = progressQuery.data?.streak ?? 0;

  const latestNugget = useMemo(() => {
    const items = [...(nuggetQuery.data?.items ?? [])].sort((a, b) => {
      const aT = a.publishedAt ?? a.createdAt;
      const bT = b.publishedAt ?? b.createdAt;
      return bT.localeCompare(aT);
    });
    return items.find((c) => !!c.audioUrl) ?? items[0] ?? null;
  }, [nuggetQuery.data]);

  const progressBySkill = useMemo(() => {
    const items = lessonsQuery.data?.items ?? [];
    const map: Record<SkillKey, number> = {
      'listen-select': 0,
      vocabulary: 0,
      sentence: 0,
      recognition: 0,
    };
    for (const key of SKILL_ORDER) {
      const skillLessons = items.filter((l) => l.type === SKILL_TO_LESSON_TYPE[key]);
      const done = skillLessons.filter((l) => completedIds.includes(l.id)).length;
      map[key] = skillLessons.length === 0 ? 0 : done / skillLessons.length;
    }
    return map;
  }, [lessonsQuery.data, completedIds]);

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
        <Text style={styles.title}>Start your practice journey</Text>
        <Text style={styles.subtitle}>
          Select a focused practice to push your abilities further
        </Text>

        <View style={styles.grid}>
          {SKILL_ORDER.map((key) => (
            <SkillCard
              key={key}
              theme={skillThemes[key]}
              progress={progressBySkill[key]}
              onPress={() => router.push(`/practice/${key}` as never)}
            />
          ))}
        </View>

        {latestNugget ? (
          <RootNuggetCard
            proverb={latestNugget.titleTranslated || latestNugget.titleEnglish}
            translation={latestNugget.shortDescription}
            audioUrl={latestNugget.audioUrl}
            onViewAllPress={() => router.push('/(tabs)/culture' as never)}
          />
        ) : null}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
