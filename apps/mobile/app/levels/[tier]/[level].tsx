import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  ExerciseRow,
  LearningLevel,
  LessonEntryRow,
  LessonType,
  ListenSelectPayload,
  CorrectMeaningPayload,
  NameFromImagePayload,
  RecognitionPayload,
  WordArrangePayload,
} from '@lexiroot/shared';
import { MascotIcon } from '../../../src/components/icons/MascotIcon';
import { PadlockUnlockedIcon } from '../../../src/components/icons/PadlockUnlockedIcon';
import { LessonContentCard } from '../../../src/components/lesson/LessonContentCard';
import { LessonFullCenterScreen } from '../../../src/components/lesson/LessonFullCenterScreen';
import { LessonProgressHeader } from '../../../src/components/lesson/LessonProgressHeader';
import { Button } from '../../../src/components/ui/Button';
import { PlayButton } from '../../../src/components/exercise/PlayButton';
import { CorrectMeaningExercise } from '../../../src/screens/practice/CorrectMeaningExercise';
import { ListenSelectExercise } from '../../../src/screens/practice/ListenSelectExercise';
import { NameFromImageExercise } from '../../../src/screens/practice/NameFromImageExercise';
import { RecognitionExercise } from '../../../src/screens/practice/RecognitionExercise';
import { WordArrangeExercise } from '../../../src/screens/practice/WordArrangeExercise';
import { neutralExerciseTheme, type SkillTheme } from '../../../src/constants/theme';
import { colors, fonts, radius, spacing } from '../../../src/constants/theme';
import { useAudioPlayback } from '../../../src/hooks/useAudioPlayback';
import { useAppSelector } from '../../../src/store/hooks';
import {
  useListEntriesQuery,
  useListExercisesQuery,
  useListLessonsQuery,
  type LessonRow,
} from '../../../src/services/lessonsApi';
import {
  useClearLessonProgressMutation,
  useCompleteLessonMutation,
  useGetLessonProgressQuery,
  useUpsertLessonProgressMutation,
} from '../../../src/services/progressApi';

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

function isFreeTrialBoundary(_tier: LearningLevel, _level: number): boolean {
  // Subscription/paywall is bypassed during development — payments aren't wired up yet.
  // Re-enable: return tier === 'beginner' && level === 1;
  // When restoring, also re-apply FREE_TIER_CONTENT_LIMIT / FREE_TIER_EXERCISE_LIMIT
  // (will need a redesign for the multi-sub-lesson flow).
  void FREE_TIER_CONTENT_LIMIT;
  void FREE_TIER_EXERCISE_LIMIT;
  return false;
}

// Each (tier, level) plays through these content types in fixed order.
// Stable categorical sort by enum-rank — missing types skip naturally,
// preserving the order of whatever IS present.
const TYPE_PRIORITY: readonly LessonType[] = [
  'letters-numbers',
  'vocabulary',
  'recognition',
  'sentence',
];
function typeRank(t: LessonType): number {
  const i = TYPE_PRIORITY.indexOf(t);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
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

  // All sub-lessons at this (tier, level), in curriculum order:
  // letters-numbers → vocabulary → recognition → sentence. Missing types skip.
  const subLessons = useMemo(() => {
    const items = lessonsPage?.items ?? [];
    return items
      .filter((l) => TYPE_PRIORITY.includes(l.type))
      .slice()
      .sort((a, b) => typeRank(a.type) - typeRank(b.type));
  }, [lessonsPage]);

  const [subIdx, setSubIdx] = useState(0);
  const [step, setStep] = useState<Step>({ kind: 'intro' });
  const [xp, setXp] = useState(0);
  const [correct, setCorrect] = useState(0);
  // Running totals across every sub-lesson the user reaches in this level
  // run. Used by the end-of-level Almost There screen to show aggregated
  // correct/total — per-sub Almost There is suppressed.
  const [levelCorrect, setLevelCorrect] = useState(0);
  const [levelTotal, setLevelTotal] = useState(0);
  // When true, advancing between sub-lessons skips intro + content and goes
  // straight to the practice-intro/exercises. Set by retryLevel.
  const [retryMode, setRetryMode] = useState(false);

  const currentSub = subLessons[subIdx];

  const { data: entries = [], isFetching: loadingEntries } = useListEntriesQuery(
    currentSub?.id ?? '',
    { skip: !currentSub },
  );
  const { data: exercises = [], isFetching: loadingExercises } = useListExercisesQuery(
    currentSub?.id ?? '',
    { skip: !currentSub },
  );

  // Resume state: fetch once on mount; restore when both lessons + saved state are ready.
  const { data: savedProgress, isLoading: loadingSaved } = useGetLessonProgressQuery();
  const [upsertProgress] = useUpsertLessonProgressMutation();
  const [clearProgress] = useClearLessonProgressMutation();
  const [completeLesson] = useCompleteLessonMutation();
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    if (loadingList || loadingSaved) return;
    if (subLessons.length === 0) {
      restoredRef.current = true;
      return;
    }
    if (
      savedProgress &&
      savedProgress.tier === tier &&
      savedProgress.level === level &&
      savedProgress.subIdx >= 0 &&
      savedProgress.subIdx < subLessons.length
    ) {
      setSubIdx(savedProgress.subIdx);
      setXp(savedProgress.xp);
      setCorrect(savedProgress.correctCount);
      const restoredStep: Step =
        savedProgress.stepKind === 'content' || savedProgress.stepKind === 'exercise'
          ? { kind: savedProgress.stepKind, index: savedProgress.stepIndex }
          : { kind: savedProgress.stepKind };
      setStep(restoredStep);
    }
    restoredRef.current = true;
  }, [loadingList, loadingSaved, savedProgress, subLessons.length, tier, level]);

  // Persist state on every meaningful change. Skip terminal states (complete/next-unlocked/upgrade).
  useEffect(() => {
    if (!restoredRef.current) return;
    if (!currentSub) return;
    if (step.kind === 'complete' || step.kind === 'next-unlocked' || step.kind === 'upgrade') return;
    const stepIndex = step.kind === 'content' || step.kind === 'exercise' ? step.index : 0;
    upsertProgress({
      tier,
      level,
      subIdx,
      subLessonId: currentSub.id,
      stepKind: step.kind,
      stepIndex,
      correctCount: correct,
      xp,
    });
  }, [step, subIdx, correct, xp, currentSub, tier, level, upsertProgress]);

  // Per-exercise XP, derived from the admin-assigned lesson.xpReward.
  // 20 XP / 5 exercises = 4 XP each. Minimum 1 so something always shows.
  const xpPerCorrect = useMemo(() => {
    if (!currentSub) return 0;
    return Math.max(1, Math.floor((currentSub.xpReward ?? 0) / Math.max(exercises.length, 1)));
  }, [currentSub, exercises.length]);

  const totalSteps = entries.length + exercises.length;
  const stepProgress = useMemo(() => {
    if (totalSteps === 0) return 0;
    if (step.kind === 'content') return (step.index + 1) / (totalSteps + 1);
    if (step.kind === 'exercise')
      return (entries.length + step.index + 1) / (totalSteps + 1);
    if (step.kind === 'almost-there' || step.kind === 'complete') return 1;
    return 0;
  }, [step, totalSteps, entries.length]);

  const close = () => router.back();

  function advanceFromIntro() {
    if (loadingEntries || loadingExercises) return;
    if (entries.length > 0) setStep({ kind: 'content', index: 0 });
    else if (exercises.length > 0) setStep({ kind: 'practice-intro' });
    else setStep({ kind: 'complete' });
  }

  function advanceFromContent(index: number) {
    if (index + 1 < entries.length) {
      setStep({ kind: 'content', index: index + 1 });
    } else if (exercises.length > 0) {
      setStep({ kind: 'practice-intro' });
    } else {
      setStep({ kind: 'complete' });
    }
  }

  function advanceFromExercise(index: number, wasCorrect: boolean) {
    const nextCorrect = correct + (wasCorrect ? 1 : 0);
    if (wasCorrect) {
      setXp((v) => v + xpPerCorrect);
      setCorrect(nextCorrect);
    }
    if (index + 1 < exercises.length) {
      setStep({ kind: 'exercise', index: index + 1 });
      return;
    }
    // Sub's exercises done. Persist completion only if every exercise was
    // correct — partial runs don't bank the lesson's xpReward. Always continue
    // to 'complete'; per-sub Almost There is gone, we only show it at the end
    // of the level after aggregating across sub-lessons.
    if (currentSub && nextCorrect >= exercises.length) {
      completeLesson({
        lessonId: currentSub.id,
        correctCount: nextCorrect,
        totalCount: exercises.length,
      });
    }
    setStep({ kind: 'complete' });
  }

  function retryLevel() {
    // Restart the level — exercises only. Content stays skipped because the
    // user already worked through it on the first pass.
    setRetryMode(true);
    setSubIdx(0);
    setCorrect(0);
    setLevelCorrect(0);
    setLevelTotal(0);
    setXp(0);
    setStep({ kind: 'practice-intro' });
  }

  function advanceAfterComplete() {
    const nextLevelCorrect = levelCorrect + correct;
    const nextLevelTotal = levelTotal + exercises.length;
    setLevelCorrect(nextLevelCorrect);
    setLevelTotal(nextLevelTotal);

    if (subIdx + 1 < subLessons.length) {
      // More sub-lessons in this level → reset per-sub correct count and
      // step into the next one. Retry mode skips back to practice-intro so
      // we don't repeat content the user has already covered.
      setSubIdx((i) => i + 1);
      setCorrect(0);
      setStep(retryMode ? { kind: 'practice-intro' } : { kind: 'intro' });
      return;
    }

    if (isFreeTrialBoundary(tier, level)) {
      setStep({ kind: 'upgrade' });
      return;
    }

    if (nextLevelTotal > 0 && nextLevelCorrect < nextLevelTotal) {
      // Finished the last sub but missed at least one exercise — surface
      // the aggregated Almost There so the user can retry the whole level.
      setStep({ kind: 'almost-there' });
      return;
    }

    // Perfect run (or level had no exercises) → drop the resume row and
    // route to the next-unlocked celebration.
    clearProgress({ tier, level });
    setStep({ kind: 'next-unlocked' });
  }

  if (loadingList) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading level…</Text>
          <Pressable onPress={close} style={styles.loadingBack}>
            <Text style={styles.loadingBackText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentSub) {
    return (
      <LessonFullCenterScreen
        onClose={close}
        footer={<Button label="Back" variant="outline" onPress={close} />}
      >
        <Text style={styles.heroTitle}>More levels coming soon</Text>
        <Text style={styles.heroBody}>
          You&apos;ve reached the end of available levels for now. Check back as we add more!
        </Text>
      </LessonFullCenterScreen>
    );
  }

  if (step.kind === 'intro') {
    const copy = TIER_INTRO[currentSub.type];
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
    const entry = entries[step.index];
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
              exercises.length > 0
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
    const ex = exercises[step.index];
    if (!ex) {
      advanceFromExercise(step.index, true);
      return null;
    }
    return (
      <ExerciseStep
        key={`${currentSub.id}-${step.index}`}
        exercise={ex}
        lessonType={currentSub.type}
        levelNumber={level}
        xpReward={currentSub.xpReward ?? 0}
        progress={stepProgress}
        onClose={close}
        onResult={(ok) => advanceFromExercise(step.index, ok)}
      />
    );
  }

  if (step.kind === 'almost-there') {
    return (
      <AlmostThereScreen
        firstName={firstName}
        correct={levelCorrect}
        total={levelTotal}
        xpEarned={xp}
        nextLevel={level + 1}
        onClose={close}
        onRetry={retryLevel}
      />
    );
  }

  if (step.kind === 'complete') {
    const displayXp = xp || currentSub?.xpReward || 0;
    return (
      <LessonFullCenterScreen
        onClose={close}
        footer={<Button label="Continue" onPress={advanceAfterComplete} />}
      >
        <Ionicons name="flash" size={92} color={colors.primary} />
        <Text style={styles.completeTitle}>Lesson completed!</Text>
        <Text style={styles.xpHero}>+{displayXp} XP</Text>
        <Text style={styles.completeBody}>Well done! You are making progress</Text>
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
        <PadlockUnlockedIcon width={64} height={90} />
        <Text style={styles.heroTitle}>Level {level + 1} awaits</Text>
        <Text style={styles.heroBody}>Keep going to expand your skills.</Text>
      </LessonFullCenterScreen>
    );
  }

  // upgrade — kept for when payments integrate. Currently unreachable
  // because isFreeTrialBoundary always returns false.
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
  const entryAudioUrl =
    (entry.payload as unknown as { audioUrl?: string } | undefined)?.audioUrl ?? null;
  const audio = useAudioPlayback(entryAudioUrl);
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
          <PlayButton
            theme={neutralExerciseTheme}
            onPress={audio.play}
            isPlaying={audio.isPlaying}
          />
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
  lessonType: LessonType;
  levelNumber: number;
  xpReward: number;
  progress: number;
  onClose: () => void;
  onResult: (correct: boolean) => void;
}

// Inside the level flow we deliberately use the neutral palette so exercises
// don't switch colors per sub-lesson type — the level run feels like one
// continuous experience. The practice tab still uses skill-specific themes.
function pickTheme(_lessonType: LessonType): SkillTheme {
  return neutralExerciseTheme;
}
function skillTitleFor(lessonType: LessonType): string {
  if (lessonType === 'sentence') return 'Sentence';
  if (lessonType === 'recognition') return 'Recognition';
  if (lessonType === 'vocabulary') return 'Vocabulary';
  return 'Letters & Numbers';
}
function findCorrectId<T extends { id: string; isCorrect: boolean }>(items: T[]): string {
  return items.find((o) => o.isCorrect)?.id ?? items[0]?.id ?? '';
}

// Dispatches to the corresponding full-screen practice exercise component
// based on the exercise's subType. Covers all 5 admin-creatable subtypes:
// listen-select, correct-meaning, word-arrange, recognition, name-from-image.
function ExerciseStep({
  exercise,
  lessonType,
  levelNumber,
  xpReward,
  progress,
  onClose,
  onResult,
}: ExerciseStepProps) {
  const theme = pickTheme(lessonType);
  const skillTitle = skillTitleFor(lessonType);

  if (exercise.subType === 'listen-select') {
    const p = exercise.payload as ListenSelectPayload;
    return (
      <ListenSelectExercise
        key={exercise.id}
        theme={theme}
        skillTitle={skillTitle}
        level={levelNumber}
        instruction={p.instruction}
        audioUrl={p.audioUrl}
        options={p.options.map((o) => ({ id: o.id, label: o.label }))}
        correctId={findCorrectId(p.options)}
        progress={progress}
        xpReward={xpReward}
        onContinue={onResult}
        onClose={onClose}
      />
    );
  }

  if (exercise.subType === 'correct-meaning') {
    const p = exercise.payload as CorrectMeaningPayload;
    return (
      <CorrectMeaningExercise
        key={exercise.id}
        theme={theme}
        skillTitle={skillTitle}
        level={levelNumber}
        word={p.prompt}
        instruction={p.instruction}
        options={p.options.map((o) => ({ id: o.id, label: o.label }))}
        correctId={findCorrectId(p.options)}
        progress={progress}
        xpReward={xpReward}
        onContinue={onResult}
        onClose={onClose}
      />
    );
  }

  if (exercise.subType === 'word-arrange') {
    const p = exercise.payload as WordArrangePayload;
    const pool = p.tiles.map((t) => t.label);
    const correctOrder = p.correctAnswer.split(/\s+/).filter(Boolean);
    return (
      <WordArrangeExercise
        key={exercise.id}
        theme={theme}
        skillTitle={skillTitle}
        level={levelNumber}
        prompt={p.sentence}
        instruction={p.instruction}
        pool={pool}
        correctOrder={correctOrder}
        progress={progress}
        xpReward={xpReward}
        onContinue={onResult}
        onClose={onClose}
      />
    );
  }

  if (exercise.subType === 'recognition') {
    const p = exercise.payload as RecognitionPayload;
    return (
      <RecognitionExercise
        key={exercise.id}
        theme={theme}
        skillTitle={skillTitle}
        level={levelNumber}
        word={p.word}
        instruction={p.instruction}
        options={p.options.map((o) => ({ id: o.id, imageUrl: o.imageUrl }))}
        correctId={findCorrectId(p.options)}
        progress={progress}
        xpReward={xpReward}
        onContinue={onResult}
        onClose={onClose}
      />
    );
  }

  if (exercise.subType === 'name-from-image') {
    const p = exercise.payload as NameFromImagePayload;
    return (
      <NameFromImageExercise
        key={exercise.id}
        theme={theme}
        skillTitle={skillTitle}
        level={levelNumber}
        imageUrl={p.imageUrl}
        instruction={p.instruction}
        options={p.options.map((o) => ({ id: o.id, label: o.label }))}
        correctId={findCorrectId(p.options)}
        progress={progress}
        xpReward={xpReward}
        onContinue={onResult}
        onClose={onClose}
      />
    );
  }

  // Unknown subType — skip gracefully rather than blocking the user.
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LessonProgressHeader progress={progress} xp={0} onClose={onClose} />
      <View style={styles.fallbackBody}>
        <Text style={styles.contentPrompt}>Unsupported exercise type</Text>
        <Text style={styles.contentSub}>Skipping this question.</Text>
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
            <Text style={styles.xpValue}>: {xpEarned}</Text>
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
  completeTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  completeBody: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
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
