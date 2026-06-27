import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LessonEntryRow } from '@lexiroot/shared';
import { LessonContentCard } from '../../../src/components/lesson/LessonContentCard';
import { LessonFullCenterScreen } from '../../../src/components/lesson/LessonFullCenterScreen';
import { Button } from '../../../src/components/ui/Button';
import { PlayButton } from '../../../src/components/exercise/PlayButton';
import { useAudioPlayback } from '../../../src/hooks/useAudioPlayback';
import { useGetLessonQuery, useListEntriesQuery } from '../../../src/services/lessonsApi';
import { colors, fonts, neutralExerciseTheme, spacing } from '../../../src/constants/theme';

// Read-only review of a lesson the learner has already completed: it replays
// the teaching content (the letter/word/sentence cards with audio) only — no
// exercises, no XP, no completion side-effects. Reached from the Lessons tab.

function entryTitle(kind: LessonEntryRow['kind']): string {
  if (kind === 'letter') return 'Listen carefully to how this letter sounds';
  if (kind === 'number') return 'Listen carefully to how this number sounds';
  if (kind === 'vocabulary') return 'Listen carefully to how this word sounds';
  if (kind === 'sentence') return 'Listen carefully to how this sentence sounds';
  return 'Recognize the image for this word';
}

function renderEntryCard(entry: LessonEntryRow) {
  const p = entry.payload as unknown as Record<string, unknown>;
  if (entry.kind === 'letter') {
    return <LessonContentCard variant="letter" glyph={String(p.letter ?? '')} />;
  }
  if (entry.kind === 'number') {
    return (
      <LessonContentCard
        variant="number"
        word={String(p.value ?? '')}
        numeral={String(p.translation ?? '')}
      />
    );
  }
  if (entry.kind === 'vocabulary') {
    return (
      <LessonContentCard
        variant="vocabulary"
        word={String(p.word ?? '')}
        meaning={String(p.meaning ?? '')}
        example={p.exampleSentence ? String(p.exampleSentence) : undefined}
      />
    );
  }
  if (entry.kind === 'sentence') {
    return (
      <LessonContentCard
        variant="sentence"
        sentence={String(p.sentence ?? '')}
        meaning={String(p.meaning ?? '')}
      />
    );
  }
  return (
    <LessonContentCard
      variant="recognition"
      word={String(p.word ?? '')}
      imageUrl={p.imageUrl ? String(p.imageUrl) : undefined}
    />
  );
}

export default function LessonReviewScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lessonQuery = useGetLessonQuery(lessonId ?? '', { skip: !lessonId });
  const entriesQuery = useListEntriesQuery(lessonId ?? '', { skip: !lessonId });
  const [index, setIndex] = useState(0);

  const lesson = lessonQuery.data;
  const entries = useMemo(
    () => [...(entriesQuery.data ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [entriesQuery.data],
  );
  const total = entries.length;
  const current = entries[index];
  const audioUrl =
    (current?.payload as unknown as { audioUrl?: string } | undefined)?.audioUrl ?? null;
  const audio = useAudioPlayback(audioUrl);

  const close = () => router.back();

  if (!lessonId) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.fallbackText}>Lesson not found</Text>
      </SafeAreaView>
    );
  }

  if (lessonQuery.isLoading || entriesQuery.isLoading) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <LessonFullCenterScreen
        onClose={close}
        footer={<Button label="Back" variant="outline" onPress={close} />}
      >
        <Text style={styles.heroTitle}>Couldn&apos;t load lesson</Text>
        <Text style={styles.heroBody}>Check your connection and try again.</Text>
      </LessonFullCenterScreen>
    );
  }

  if (total === 0 || !current) {
    return (
      <LessonFullCenterScreen
        onClose={close}
        footer={<Button label="Back" variant="outline" onPress={close} />}
      >
        <Text style={styles.heroTitle}>Nothing to review here</Text>
        <Text style={styles.heroBody}>This lesson doesn&apos;t have any content to revisit.</Text>
      </LessonFullCenterScreen>
    );
  }

  const isLast = index + 1 >= total;
  const progress = (index + 1) / total;

  function next() {
    if (isLast) close();
    else setIndex((i) => i + 1);
  }
  function prev() {
    if (index > 0) setIndex((i) => i - 1);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={close} hitSlop={12} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.neutral} />
        </Pressable>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.counter}>
          {index + 1}/{total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lvlLabel}>Lvl {lesson.level}</Text>
        <Text style={styles.contentPrompt}>{entryTitle(current.kind)}</Text>
        <Text style={styles.contentSub}>Tap the play button to hear the pronunciation</Text>
        <View style={styles.playRow}>
          <PlayButton theme={neutralExerciseTheme} onPress={audio.play} isPlaying={audio.isPlaying} />
        </View>
        {renderEntryCard(current)}
      </ScrollView>

      <View style={styles.footer}>
        {index > 0 ? (
          <View style={styles.footerRow}>
            <View style={styles.footerBtn}>
              <Button label="Back" variant="outline" onPress={prev} />
            </View>
            <View style={styles.footerBtn}>
              <Button label={isLast ? 'Done' : 'Continue'} onPress={next} />
            </View>
          </View>
        ) : (
          <Button label={isLast ? 'Done' : 'Continue'} onPress={next} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fallback: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  fallbackText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
  counter: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.primary,
    minWidth: 36,
    textAlign: 'right',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  lvlLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.neutral,
    textAlign: 'center',
  },
  contentPrompt: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
    textAlign: 'center',
  },
  contentSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  playRow: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerBtn: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
  },
  heroBody: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
});
