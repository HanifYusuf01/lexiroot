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
import { CorrectMeaningExercise } from '../../../src/screens/practice/CorrectMeaningExercise';
import { ListenSelectExercise } from '../../../src/screens/practice/ListenSelectExercise';
import { NameFromImageExercise } from '../../../src/screens/practice/NameFromImageExercise';
import { RecognitionExercise } from '../../../src/screens/practice/RecognitionExercise';
import { WordArrangeExercise } from '../../../src/screens/practice/WordArrangeExercise';
import { LessonFailureScreen } from '../../../src/screens/practice/LessonFailureScreen';
import { LessonSuccessScreen } from '../../../src/screens/practice/LessonSuccessScreen';
import { XpTransitionScreen } from '../../../src/screens/practice/XpTransitionScreen';
import {
  colors,
  fonts,
  skillThemes,
  spacing,
  type SkillKey,
  type SkillTheme,
} from '../../../src/constants/theme';

type Phase = 'exercise' | 'xp-correct' | 'xp-incorrect' | 'success' | 'failure';

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
  const lessonQuery = useGetLessonQuery(lessonId ?? '', { skip: !lessonId });
  const exercisesQuery = useListExercisesQuery(lessonId ?? '', { skip: !lessonId });
  const [completeLesson] = useCompleteLessonMutation();
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('exercise');
  const [awardedXp, setAwardedXp] = useState(0);

  const exercises = exercisesQuery.data ?? [];
  const lesson = lessonQuery.data;
  const total = exercises.length;
  const current = exercises[index];
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

  if (total === 0) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Text style={styles.fallbackText}>No exercises in this lesson yet</Text>
      </SafeAreaView>
    );
  }

  async function finishLesson(finalCorrect: number) {
    const allCorrect = finalCorrect === total;
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

  function handleExerciseContinue(wasCorrect: boolean) {
    const nextCorrect = correctCount + (wasCorrect ? 1 : 0);
    setCorrectCount(nextCorrect);
    setPhase(wasCorrect ? 'xp-correct' : 'xp-incorrect');
    if (wasCorrect) {
      // hold corrected count for use in finishLesson if this is last exercise
    }
    return nextCorrect;
  }

  function handleXpContinue() {
    const isLast = index + 1 >= total;
    if (isLast) {
      finishLesson(correctCount);
    } else {
      setIndex(index + 1);
      setPhase('exercise');
    }
  }

  function handleClose() {
    router.back();
  }

  function handleTryAgain() {
    setIndex(0);
    setCorrectCount(0);
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
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <LessonFailureScreen
          skillTitle={skillTitle}
          level={level}
          userName={user?.displayName?.split(' ')[0] ?? 'there'}
          correctCount={correctCount}
          totalCount={total}
          xpEarned={correctCount * perExerciseXp}
          xpTarget={xpReward}
          progress={1}
          xpReward={xpReward}
          onTryAgain={handleTryAgain}
          onClose={handleClose}
        />
      </View>
    );
  }

  if (phase === 'xp-correct' || phase === 'xp-incorrect') {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <XpTransitionScreen
          xp={phase === 'xp-correct' ? perExerciseXp : 0}
          variant={phase === 'xp-correct' ? 'correct' : 'incorrect'}
          onContinue={handleXpContinue}
        />
      </View>
    );
  }

  if (!current) return null;
  const progress = (index + 1) / total;

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
