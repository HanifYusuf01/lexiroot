import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  CorrectMeaningPayload,
  ExerciseRow,
  ListenSelectPayload,
  NameFromImagePayload,
  RecognitionPayload,
  WordArrangePayload,
} from '@lexiroot/shared';
import { useGetLessonQuery, useListExercisesQuery } from '../../../src/services/lessonsApi';
import { useCompleteLessonMutation } from '../../../src/services/progressApi';
import { useAppSelector } from '../../../src/store/hooks';
import { useHasFeature } from '../../../src/hooks/useEntitlements';
import { FREE_ACCESS_LEVEL } from '../../../src/constants/entitlements';
import { UpgradeGateScreen } from '../../../src/components/lesson/UpgradeGateScreen';
import { CorrectMeaningExercise } from '../../../src/screens/practice/CorrectMeaningExercise';
import { ListenSelectExercise } from '../../../src/screens/practice/ListenSelectExercise';
import { NameFromImageExercise } from '../../../src/screens/practice/NameFromImageExercise';
import { RecognitionExercise } from '../../../src/screens/practice/RecognitionExercise';
import { WordArrangeExercise } from '../../../src/screens/practice/WordArrangeExercise';
import { LessonFailureScreen } from '../../../src/screens/practice/LessonFailureScreen';
import { LessonSuccessScreen } from '../../../src/screens/practice/LessonSuccessScreen';
import {
  colors,
  fonts,
  skillThemes,
  spacing,
  type SkillKey,
  type SkillTheme,
} from '../../../src/constants/theme';

type Phase = 'exercise' | 'success' | 'failure';

function pickTheme(lessonType: string | undefined): SkillTheme {
  if (lessonType === 'sentence') return skillThemes.sentence;
  if (lessonType === 'recognition') return skillThemes.recognition;
  if (lessonType === 'vocabulary') return skillThemes.vocabulary;
  return skillThemes['listen-select' as SkillKey];
}

function skillTitleFor(lessonType: string | undefined): string {
  if (lessonType === 'sentence') return 'Sentence';
  if (lessonType === 'recognition') return 'Recognition';
  if (lessonType === 'vocabulary') return 'Vocabulary';
  return 'Letters & Numbers';
}

function findCorrectId<T extends { id: string; isCorrect: boolean }>(items: T[]): string {
  return items.find((o) => o.isCorrect)?.id ?? items[0]?.id ?? '';
}

export default function LessonPracticeScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const user = useAppSelector((s) => s.auth.user);
  const hasUnlimited = useHasFeature('unlimited_lessons');
  const lessonQuery = useGetLessonQuery(lessonId ?? '', { skip: !lessonId });
  const exercisesQuery = useListExercisesQuery(lessonId ?? '', { skip: !lessonId });
  const [completeLesson] = useCompleteLessonMutation();
  // `roundQueue` is the list of exercise indices to present in the current
  // round. null on the first pass means "play them all"; a retry sets it to
  // just the indices the learner missed. `missed` accumulates the indices
  // answered wrong in the round currently in progress.
  const [roundQueue, setRoundQueue] = useState<number[] | null>(null);
  const [pos, setPos] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('exercise');
  const [awardedXp, setAwardedXp] = useState(0);

  const exercises = useMemo(() => exercisesQuery.data ?? [], [exercisesQuery.data]);
  const lesson = lessonQuery.data;
  const total = exercises.length;
  const queue = useMemo(
    () => roundQueue ?? exercises.map((_, i) => i),
    [roundQueue, exercises],
  );
  const roundLen = queue.length;
  const currentExerciseIndex = queue[pos];
  const current = exercises[currentExerciseIndex];
  const theme = useMemo(() => pickTheme(lesson?.type), [lesson]);
  const skillTitle = useMemo(() => skillTitleFor(lesson?.type), [lesson]);
  const level = lesson?.level ?? 1;
  const xpReward = lesson?.xpReward ?? 0;
  const perExerciseXp = total > 0 ? Math.max(1, Math.floor(xpReward / total)) : 0;

  if (!lessonId) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Text style={styles.fallbackText}>Lesson not found</Text>
      </SafeAreaView>
    );
  }

  if (lessonQuery.isLoading || exercisesQuery.isLoading) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Text style={styles.fallbackText}>Couldn&apos;t load lesson</Text>
      </SafeAreaView>
    );
  }

  // Free learners only get the free access level of practice — later levels gate.
  if (!hasUnlimited && level > FREE_ACCESS_LEVEL) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <UpgradeGateScreen onClose={() => router.back()} />
      </View>
    );
  }

  if (total === 0) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Text style={styles.fallbackText}>No exercises in this lesson yet</Text>
      </SafeAreaView>
    );
  }

  // Records the completion on the learner's first full pass through the lesson
  // (the backend awards the lesson XP exactly once, on this first call).
  async function finishLesson(missedThisRound: number[]) {
    const allCorrect = missedThisRound.length === 0;
    const finalCorrect = total - missedThisRound.length;
    try {
      const result = await completeLesson({
        lessonId: lessonId!,
        correctCount: finalCorrect,
        totalCount: total,
      }).unwrap();
      setAwardedXp(result.xpAwarded);
    } catch {
      setAwardedXp(allCorrect ? xpReward : 0);
    }
    setPhase(allCorrect ? 'success' : 'failure');
  }

  function finishRound(finalMissed: number[]) {
    // First pass through the whole lesson — record it (XP, streak, etc.).
    if (roundQueue === null) {
      finishLesson(finalMissed);
      return;
    }
    // Retry round: the learner only replayed the questions they had missed.
    if (finalMissed.length === 0) {
      // Caught up on every outstanding question. Re-send the completion as a
      // perfect score so the stored record reflects it — this is idempotent
      // and awards no extra XP, so keep the XP captured on the first pass.
      completeLesson({ lessonId: lessonId!, correctCount: total, totalCount: total });
      setPhase('success');
      return;
    }
    // Still missed some — back to the failure screen. Try again will replay
    // the now-smaller set.
    setPhase('failure');
  }

  // Answering a question moves straight to the next one (or the result screen).
  // There's no per-question XP interstitial — XP is only shown cumulatively on
  // the success screen once the practice is finished.
  function handleExerciseContinue(wasCorrect: boolean) {
    const nextMissed =
      wasCorrect || missed.includes(currentExerciseIndex)
        ? missed
        : [...missed, currentExerciseIndex];
    if (!wasCorrect) setMissed(nextMissed);

    const isLast = pos + 1 >= roundLen;
    if (isLast) finishRound(nextMissed);
    else setPos(pos + 1);
  }

  function handleClose() {
    router.back();
  }

  function handleTryAgain() {
    // Replay only the questions missed in the round just finished.
    setRoundQueue(missed);
    setPos(0);
    setMissed([]);
    setPhase('exercise');
  }

  if (phase === 'success') {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <LessonSuccessScreen
          xpEarned={awardedXp}
          onContinue={handleClose}
          onClose={handleClose}
        />
      </View>
    );
  }

  if (phase === 'failure') {
    // Cumulative across rounds: everything except the questions still outstanding.
    const cumulativeCorrect = total - missed.length;
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <LessonFailureScreen
          skillTitle={skillTitle}
          level={level}
          userName={user?.displayName?.split(' ')[0] ?? 'there'}
          correctCount={cumulativeCorrect}
          totalCount={total}
          xpEarned={cumulativeCorrect * perExerciseXp}
          xpTarget={xpReward}
          progress={1}
          xpReward={xpReward}
          onTryAgain={handleTryAgain}
          onClose={handleClose}
        />
      </View>
    );
  }

  if (!current) return null;
  const progress = roundLen > 0 ? (pos + 1) / roundLen : 0;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      {renderExercise(
        current,
        theme,
        skillTitle,
        level,
        progress,
        xpReward,
        handleExerciseContinue,
        handleClose,
      )}
    </View>
  );
}

function renderExercise(
  ex: ExerciseRow,
  theme: SkillTheme,
  skillTitle: string,
  level: number,
  progress: number,
  xpReward: number,
  onContinue: (wasCorrect: boolean) => void,
  onClose: () => void,
) {
  if (ex.subType === 'listen-select') {
    const p = ex.payload as ListenSelectPayload;
    return (
      <ListenSelectExercise
        key={ex.id}
        theme={theme}
        skillTitle={skillTitle}
        level={level}
        instruction={p.instruction}
        audioUrl={p.audioUrl}
        options={p.options.map((o) => ({ id: o.id, label: o.label }))}
        correctId={findCorrectId(p.options)}
        progress={progress}
        xpReward={xpReward}
        onContinue={onContinue}
        onClose={onClose}
      />
    );
  }
  if (ex.subType === 'correct-meaning') {
    const p = ex.payload as CorrectMeaningPayload;
    return (
      <CorrectMeaningExercise
        key={ex.id}
        theme={theme}
        skillTitle={skillTitle}
        level={level}
        word={p.prompt}
        instruction={p.instruction}
        options={p.options.map((o) => ({ id: o.id, label: o.label }))}
        correctId={findCorrectId(p.options)}
        progress={progress}
        xpReward={xpReward}
        onContinue={onContinue}
        onClose={onClose}
      />
    );
  }
  if (ex.subType === 'word-arrange') {
    const p = ex.payload as WordArrangePayload;
    const pool = p.tiles.map((t) => t.label);
    const correctOrder = p.correctAnswer.split(/\s+/).filter(Boolean);
    return (
      <WordArrangeExercise
        key={ex.id}
        theme={theme}
        skillTitle={skillTitle}
        level={level}
        prompt={p.sentence}
        instruction={p.instruction}
        pool={pool}
        correctOrder={correctOrder}
        progress={progress}
        xpReward={xpReward}
        onContinue={onContinue}
        onClose={onClose}
      />
    );
  }
  if (ex.subType === 'recognition') {
    const p = ex.payload as RecognitionPayload;
    return (
      <RecognitionExercise
        key={ex.id}
        theme={theme}
        skillTitle={skillTitle}
        level={level}
        word={p.word}
        instruction={p.instruction}
        options={p.options.map((o) => ({ id: o.id, imageUrl: o.imageUrl }))}
        correctId={findCorrectId(p.options)}
        progress={progress}
        xpReward={xpReward}
        onContinue={onContinue}
        onClose={onClose}
      />
    );
  }
  if (ex.subType === 'name-from-image') {
    const p = ex.payload as NameFromImagePayload;
    return (
      <NameFromImageExercise
        key={ex.id}
        theme={theme}
        skillTitle={skillTitle}
        level={level}
        imageUrl={p.imageUrl}
        instruction={p.instruction}
        options={p.options.map((o) => ({ id: o.id, label: o.label }))}
        correctId={findCorrectId(p.options)}
        progress={progress}
        xpReward={xpReward}
        onContinue={onContinue}
        onClose={onClose}
      />
    );
  }
  return null;
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
});
