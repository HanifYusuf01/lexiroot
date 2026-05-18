import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  ExerciseRow,
  LearningLevel,
  LessonEntryRow,
  ListenSelectPayload,
  CorrectMeaningPayload,
  RecognitionPayload,
  WordArrangePayload,
} from '@lexiroot/shared';
import { MascotIcon } from '../../../src/components/icons/MascotIcon';
import { LessonContentCard } from '../../../src/components/lesson/LessonContentCard';
import { LessonFullCenterScreen } from '../../../src/components/lesson/LessonFullCenterScreen';
import { LessonProgressHeader } from '../../../src/components/lesson/LessonProgressHeader';
import { Button } from '../../../src/components/ui/Button';
import { CheckButton } from '../../../src/components/exercise/CheckButton';
import { OptionCard } from '../../../src/components/exercise/OptionCard';
import { PlayButton } from '../../../src/components/exercise/PlayButton';
import { skillThemes, type SkillTheme } from '../../../src/constants/theme';
import { colors, fonts, radius, spacing } from '../../../src/constants/theme';
import { useAppSelector } from '../../../src/store/hooks';
import {
  useListEntriesQuery,
  useListExercisesQuery,
  useListLessonsQuery,
  type LessonRow,
} from '../../../src/services/lessonsApi';

type Step =
  | { kind: 'intro' }
  | { kind: 'content'; index: number }
  | { kind: 'practice-intro' }
  | { kind: 'exercise'; index: number }
  | { kind: 'almost-there' }
  | { kind: 'complete' }
  | { kind: 'next-unlocked' }
  | { kind: 'upgrade' };

const TIER_INTRO: Record<string, { title: string; body: string }> = {
  'letters-numbers': {
    title: 'Learn about letters and Numbers in this level.',
    body: 'Get familiar with letters and numbers through quick lessons and practical examples.',
  },
  vocabulary: {
    title: 'In this level, expand Your Vocabulary',
    body: 'Learn new words and their meanings with easy examples.',
  },
  sentence: {
    title: 'Build sentences in this level.',
    body: 'Put words together into useful, everyday sentences.',
  },
  recognition: {
    title: 'Recognize words by their images.',
    body: 'Match Yoruba words to the things they describe.',
  },
  exercise: {
    title: "Let's practice what you've learned.",
    body: 'A few quick questions to lock in what you covered.',
  },
};

// Free-tier limit: on the first beginner level (Letters & Numbers), allow only
// 4 content items and 4 exercise questions before the upgrade prompt.
const FREE_TIER_CONTENT_LIMIT = 4;
const FREE_TIER_EXERCISE_LIMIT = 4;

function isFreeTrialBoundary(tier: LearningLevel, level: number): boolean {
  return tier === 'beginner' && level === 1;
}

export default function LevelPlayer() {
  const { tier, level: levelStr } = useLocalSearchParams<{
    tier: LearningLevel;
    level: string;
  }>();
  const level = Number(levelStr);

  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.displayName?.split(' ')[0] ?? 'friend';

  const { data: lessonsPage, isLoading: loadingList } = useListLessonsQuery({
    tier,
    level,
    limit: 20,
  });

  const lessons = lessonsPage?.items ?? [];
  const contentLesson = lessons.find((l) => l.type !== 'exercise');
  const exerciseLesson = lessons.find((l) => l.type === 'exercise');
  const primaryLesson = contentLesson ?? exerciseLesson;

  const { data: entries = [] } = useListEntriesQuery(contentLesson?.id ?? '', {
    skip: !contentLesson,
  });
  const { data: exercises = [] } = useListExercisesQuery(exerciseLesson?.id ?? '', {
    skip: !exerciseLesson,
  });

  const cappedEntries = useMemo(() => {
    if (!isFreeTrialBoundary(tier, level)) return entries;
    return entries.slice(0, FREE_TIER_CONTENT_LIMIT);
  }, [entries, tier, level]);

  const cappedExercises = useMemo(() => {
    if (!isFreeTrialBoundary(tier, level)) return exercises;
    return exercises.slice(0, FREE_TIER_EXERCISE_LIMIT);
  }, [exercises, tier, level]);

  const [step, setStep] = useState<Step>({ kind: 'intro' });
  const [xp, setXp] = useState(0);
  const [correct, setCorrect] = useState(0);

  const totalSteps = cappedEntries.length + cappedExercises.length;
  const stepProgress = useMemo(() => {
    if (totalSteps === 0) return 0;
    if (step.kind === 'content') return (step.index + 1) / (totalSteps + 1);
    if (step.kind === 'exercise')
      return (cappedEntries.length + step.index + 1) / (totalSteps + 1);
    if (step.kind === 'almost-there' || step.kind === 'complete') return 1;
    return 0;
  }, [step, totalSteps, cappedEntries.length]);

  const close = () => router.back();

  function advanceFromIntro() {
    if (cappedEntries.length > 0) setStep({ kind: 'content', index: 0 });
    else if (cappedExercises.length > 0) setStep({ kind: 'practice-intro' });
    else setStep({ kind: 'complete' });
  }

  function advanceFromContent(index: number) {
    if (index + 1 < cappedEntries.length) {
      setStep({ kind: 'content', index: index + 1 });
    } else if (cappedExercises.length > 0) {
      setStep({ kind: 'practice-intro' });
    } else {
      setStep({ kind: 'complete' });
    }
  }

  function advanceFromExercise(index: number, wasCorrect: boolean) {
    const nextCorrect = correct + (wasCorrect ? 1 : 0);
    if (wasCorrect) {
      setXp((v) => v + 6);
      setCorrect(nextCorrect);
    }
    if (index + 1 < cappedExercises.length) {
      setStep({ kind: 'exercise', index: index + 1 });
    } else if (nextCorrect >= cappedExercises.length) {
      setStep({ kind: 'complete' });
    } else {
      setStep({ kind: 'almost-there' });
    }
  }

  function retryLevel() {
    setXp(0);
    setCorrect(0);
    if (cappedExercises.length > 0) setStep({ kind: 'exercise', index: 0 });
    else setStep({ kind: 'complete' });
  }

  function finishLevel() {
    if (isFreeTrialBoundary(tier, level)) {
      setStep({ kind: 'upgrade' });
    } else {
      setStep({ kind: 'next-unlocked' });
    }
  }

  if (loadingList || !primaryLesson) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>
            {loadingList ? 'Loading level…' : 'No lesson found for this level.'}
          </Text>
          <Pressable onPress={close} style={styles.loadingBack}>
            <Text style={styles.loadingBackText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step.kind === 'intro') {
    const copy = TIER_INTRO[primaryLesson.type];
    return (
      <LessonFullCenterScreen
        onClose={close}
        footer={<Button label="Continue" onPress={advanceFromIntro} />}
      >
        <Text style={styles.heroTitle}>{copy.title}</Text>
        <Text style={styles.heroBody}>{copy.body}</Text>
      </LessonFullCenterScreen>
    );
  }

  if (step.kind === 'content') {
    const entry = cappedEntries[step.index];
    if (!entry) {
      advanceFromContent(step.index);
      return null;
    }
    return (
      <ContentStep
        entry={entry}
        step={step.index + 1}
        progress={stepProgress}
        xp={xp}
        onClose={close}
        onContinue={() => advanceFromContent(step.index)}
        levelNumber={level}
      />
    );
  }

  if (step.kind === 'practice-intro') {
    return (
      <LessonFullCenterScreen
        onClose={close}
        footer={
          <Button
            label="Lets go!"
            onPress={() =>
              cappedExercises.length > 0
                ? setStep({ kind: 'exercise', index: 0 })
                : setStep({ kind: 'complete' })
            }
          />
        }
      >
        <View style={styles.practiceBlob} />
        <Text style={styles.heroTitle}>Let&apos;s Practice What You&apos;ve Learned</Text>
        <Text style={styles.heroBody}>
          You&apos;ll listen, match, and answer a few quick questions.
        </Text>
      </LessonFullCenterScreen>
    );
  }

  if (step.kind === 'exercise') {
    const ex = cappedExercises[step.index];
    if (!ex) {
      advanceFromExercise(step.index, true);
      return null;
    }
    return (
      <ExerciseStep
        key={step.index}
        exercise={ex}
        progress={stepProgress}
        xp={xp}
        onClose={close}
        onResult={(ok) => advanceFromExercise(step.index, ok)}
      />
    );
  }

  if (step.kind === 'almost-there') {
    return (
      <AlmostThereScreen
        firstName={firstName}
        correct={correct}
        total={cappedExercises.length}
        xpEarned={xp}
        nextLevel={level + 1}
        onClose={close}
        onRetry={retryLevel}
      />
    );
  }

  if (step.kind === 'complete') {
    return (
      <LessonFullCenterScreen
        onClose={close}
        footer={<Button label="Continue" onPress={finishLevel} />}
      >
        <Text style={styles.xpHero}>+{xp || 6} XP</Text>
      </LessonFullCenterScreen>
    );
  }

  if (step.kind === 'next-unlocked') {
    return (
      <LessonFullCenterScreen
        onClose={close}
        footer={
          <Button
            label="Continue"
            onPress={() => {
              router.replace(`/levels/${tier}/${level + 1}` as never);
            }}
          />
        }
      >
        <Text style={styles.unlockTagline}>You just Unlocked a new Level!</Text>
        <Ionicons name="lock-open" size={64} color={colors.primary} />
        <Text style={styles.heroTitle}>In this level, expand Your Vocabulary</Text>
        <Text style={styles.heroBody}>
          Learn new words and their meanings with easy examples.
        </Text>
      </LessonFullCenterScreen>
    );
  }

  // upgrade
  return (
    <LessonFullCenterScreen
      onClose={close}
      footer={
        <Button label="Upgrade" onPress={() => router.push('/upgrade' as never)} />
      }
    >
      <Text style={styles.unlockTagline}>You&apos;ve unlocked a new level! 🎉</Text>
      <Text style={styles.heroTitle}>Upgrade to Premium to continue learning.</Text>
    </LessonFullCenterScreen>
  );
}

// -- Content step ------------------------------------------------------------

interface ContentStepProps {
  entry: LessonEntryRow;
  step: number;
  progress: number;
  xp: number;
  levelNumber: number;
  onClose: () => void;
  onContinue: () => void;
}

function ContentStep({ entry, progress, xp, levelNumber, onClose, onContinue }: ContentStepProps) {
  const card = useMemo(() => {
    const p = entry.payload as unknown as Record<string, unknown>;
    if (entry.kind === 'letter') {
      return (
        <LessonContentCard variant="letter" glyph={String(p.letter ?? '')} />
      );
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
  }, [entry]);

  const title =
    entry.kind === 'letter'
      ? 'Listen carefully to how this letter sounds'
      : entry.kind === 'number'
        ? 'Listen carefully to how this number sounds'
        : entry.kind === 'vocabulary'
          ? 'Listen carefully to how this word sounds'
          : entry.kind === 'sentence'
            ? 'Listen carefully to how this sentence sounds'
            : 'Recognize the image for this word';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LessonProgressHeader progress={progress} xp={xp} onClose={onClose} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lvlLabel}>Lvl {levelNumber}</Text>
        <Text style={styles.contentPrompt}>{title}</Text>
        <Text style={styles.contentSub}>Tap the play button to hear the pronunciation</Text>
        <View style={styles.playRow}>
          <PlayButton theme={skillThemes['listen-select']} />
        </View>
        {card}
      </ScrollView>
      <View style={styles.bottomCta}>
        <Button label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

// -- Exercise step -----------------------------------------------------------

interface ExerciseStepProps {
  exercise: ExerciseRow;
  progress: number;
  xp: number;
  onClose: () => void;
  onResult: (correct: boolean) => void;
}

type Phase = 'answering' | 'correct' | 'incorrect';

function ExerciseStep({ exercise, progress, xp, onClose, onResult }: ExerciseStepProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('answering');

  const theme: SkillTheme = skillThemes['listen-select'];

  useEffect(() => {
    setSelectedId(null);
    setPhase('answering');
  }, [exercise.id]);

  if (exercise.subType === 'listen-select' || exercise.subType === 'correct-meaning') {
    const payload =
      exercise.subType === 'listen-select'
        ? (exercise.payload as ListenSelectPayload)
        : (exercise.payload as CorrectMeaningPayload);
    const options = payload.options ?? [];
    const correctId = options.find((o) => o.isCorrect)?.id ?? '';
    const instruction =
      payload.instruction ||
      (exercise.subType === 'listen-select'
        ? 'Tap play then select the alphabet you hear'
        : 'Select the correct answer');

    const optionState = (id: string) => {
      if (phase === 'correct' && id === correctId) return 'correct' as const;
      if (phase === 'incorrect' && id === selectedId) return 'incorrect' as const;
      if (id === selectedId) return 'selected' as const;
      return 'idle' as const;
    };

    const checkState =
      phase === 'correct'
        ? 'correct'
        : phase === 'incorrect'
          ? 'incorrect'
          : selectedId
            ? 'active'
            : 'disabled';

    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <LessonProgressHeader progress={progress} xp={xp} onClose={onClose} />
        <ScrollView contentContainerStyle={styles.scroll}>
          {exercise.subType === 'listen-select' ? (
            <View style={styles.playRow}>
              <PlayButton theme={theme} />
            </View>
          ) : (
            <View style={styles.promptCard}>
              <Text style={styles.promptText}>
                {(exercise.payload as CorrectMeaningPayload).prompt}
              </Text>
            </View>
          )}
          <Text style={styles.contentPrompt}>{instruction}</Text>
          <Text style={styles.contentSub}>Select the correct answer</Text>
          <View style={styles.grid}>
            {options.map((opt) => (
              <OptionCard
                key={opt.id}
                label={opt.label}
                state={optionState(opt.id)}
                theme={theme}
                disabled={phase !== 'answering'}
                onPress={() => setSelectedId(opt.id)}
              />
            ))}
          </View>
        </ScrollView>
        <View style={styles.bottomCta}>
          <CheckButton
            theme={theme}
            state={checkState}
            onPress={() => {
              if (phase === 'answering') {
                if (!selectedId) return;
                const ok = selectedId === correctId;
                setPhase(ok ? 'correct' : 'incorrect');
              } else if (phase === 'correct') {
                onResult(true);
              } else {
                onResult(false);
              }
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // word-arrange / recognition fall back to a "Coming soon" until we wire them.
  const fallbackLabel =
    exercise.subType === 'word-arrange'
      ? 'Word arrange'
      : exercise.subType === 'recognition'
        ? 'Image recognition'
        : 'Exercise';
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LessonProgressHeader progress={progress} xp={xp} onClose={onClose} />
      <View style={styles.fallbackBody}>
        <Text style={styles.contentPrompt}>{fallbackLabel} coming soon</Text>
        <Text style={styles.contentSub}>Skip this question for now.</Text>
      </View>
      <View style={styles.bottomCta}>
        <Button label="Skip" onPress={() => onResult(true)} />
      </View>
    </SafeAreaView>
  );
}

// -- Almost there (failed practice) screen ----------------------------------

interface AlmostThereScreenProps {
  firstName: string;
  correct: number;
  total: number;
  xpEarned: number;
  nextLevel: number;
  onClose: () => void;
  onRetry: () => void;
}

function AlmostThereScreen({
  firstName,
  correct,
  total,
  xpEarned,
  nextLevel,
  onClose,
  onRetry,
}: AlmostThereScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LessonProgressHeader progress={1} xp={xpEarned} onClose={onClose} />

      <View style={styles.almostBody}>
        <View style={styles.almostBubbleRow}>
          <MascotIcon size={104} />
          <View style={styles.bubbleWrap}>
            <View style={styles.bubblePointer} />
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>
                Almost there {firstName}!{'\n'}You need to complete this lesson before unlocking the{' '}
                <Text style={styles.bubbleHighlight}>next level.</Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsBlock}>
          <Text style={styles.statsCorrect}>
            Questions Correct: {correct}/{total}
          </Text>
          <View style={styles.xpRow}>
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>XP</Text>
            </View>
            <Text style={styles.xpValue}>: 0</Text>
          </View>
          <View style={styles.nextLevelRow}>
            <Text style={styles.nextLevelText}>Next Level: {nextLevel}</Text>
            <Ionicons name="lock-closed" size={16} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.bottomCta}>
        <Button label="Try again!" onPress={onRetry} />
      </View>
    </SafeAreaView>
  );
}

// Unused — re-export needed for type checks when not directly referenced in JSX above.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Refs = LessonRow | WordArrangePayload | RecognitionPayload;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  loadingBack: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadingBackText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 14,
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
  bottomCta: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
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
  practiceBlob: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  almostBody: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  almostBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bubbleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubblePointer: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.primary,
  },
  bubble: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bubbleText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutral,
    lineHeight: 18,
  },
  bubbleHighlight: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  statsBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  statsCorrect: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.primary,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  xpBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.warning,
    transform: [{ rotate: '-6deg' }],
  },
  xpBadgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.primary,
  },
  xpValue: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.tertiary,
  },
  nextLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nextLevelText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutralVariant,
  },
  xpHero: {
    fontFamily: fonts.extrabold,
    fontSize: 40,
    color: colors.primary,
  },
  unlockTagline: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  promptCard: {
    backgroundColor: colors.primarySofter,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  promptText: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  fallbackBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
