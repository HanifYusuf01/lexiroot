import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckButton } from '../../components/exercise/CheckButton';
import { ExerciseLessonHeader } from '../../components/exercise/ExerciseLessonHeader';
import { ExerciseTopBar } from '../../components/exercise/ExerciseTopBar';
import { colors, fonts, radius, spacing, type SkillTheme } from '../../constants/theme';

interface WordArrangeExerciseProps {
  theme: SkillTheme;
  skillTitle: string;
  level: number;
  prompt: string;
  instruction?: string;
  pool: string[];
  correctOrder: string[];
  progress: number;
  xpReward: number;
  onContinue?: (wasCorrect: boolean) => void;
  onClose?: () => void;
}

type Phase = 'answering' | 'correct' | 'incorrect';

export function WordArrangeExercise({
  theme,
  skillTitle,
  level,
  prompt,
  instruction = 'Select the correct answer',
  pool,
  correctOrder,
  progress,
  xpReward,
  onContinue,
  onClose,
}: WordArrangeExerciseProps) {
  const [placedIndexes, setPlacedIndexes] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('answering');

  const placedWords = useMemo(() => placedIndexes.map((i) => pool[i]), [placedIndexes, pool]);
  const allPlaced = placedWords.length === correctOrder.length;

  const handleTapPool = (idx: number) => {
    if (phase !== 'answering') return;
    if (placedIndexes.includes(idx)) return;
    if (placedIndexes.length >= correctOrder.length) return;
    setPlacedIndexes((prev) => [...prev, idx]);
  };

  const handleTapPlaced = (slot: number) => {
    if (phase !== 'answering') return;
    setPlacedIndexes((prev) => prev.filter((_, i) => i !== slot));
  };

  const handleCheck = () => {
    if (!allPlaced) return;
    const isCorrect = placedWords.every((w, i) => w === correctOrder[i]);
    setPhase(isCorrect ? 'correct' : 'incorrect');
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue(phase === 'correct');
      return;
    }
    if (phase === 'correct') {
      router.back();
    } else {
      setPhase('answering');
      setPlacedIndexes([]);
    }
  };

  const checkState =
    phase === 'correct'
      ? 'correct'
      : phase === 'incorrect'
        ? 'incorrect'
        : allPlaced
          ? 'active'
          : 'disabled';

  const answerColor =
    phase === 'correct'
      ? colors.success
      : phase === 'incorrect'
        ? colors.error
        : colors.primary;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topBarWrap}>
        <ExerciseTopBar
          progress={progress}
          xpReward={xpReward}
          onClose={onClose ?? (() => router.back())}
        />
        <ExerciseLessonHeader title={skillTitle} level={level} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.prompt}>{prompt}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arrange the words to translate the sentence.</Text>
          <Text style={styles.sectionSubtitle}>{instruction}</Text>
        </View>

        <View style={styles.answerRow}>
          <View style={styles.answerWords}>
            {placedWords.length === 0 ? (
              <Text style={styles.answerPlaceholder}> </Text>
            ) : (
              placedWords.map((w, i) => (
                <Pressable
                  key={`placed-${i}-${w}`}
                  onPress={() => handleTapPlaced(i)}
                  disabled={phase !== 'answering'}
                >
                  <Text style={[styles.answerWord, { color: answerColor }]}>{w}</Text>
                </Pressable>
              ))
            )}
          </View>
          {phase === 'correct' ? (
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          ) : phase === 'incorrect' ? (
            <Ionicons name="close-circle" size={18} color={colors.error} />
          ) : null}
        </View>
        <View style={styles.dashedLine} />

        <View style={styles.poolWrap}>
          {pool.map((word, idx) => {
            const isPlaced = placedIndexes.includes(idx);
            return (
              <Pressable
                key={`pool-${idx}-${word}`}
                onPress={() => handleTapPool(idx)}
                disabled={isPlaced || phase !== 'answering'}
                style={({ pressed }) => [
                  styles.poolTile,
                  isPlaced
                    ? { borderColor: colors.border, backgroundColor: colors.neutralSoft }
                    : { borderColor: theme.border, backgroundColor: theme.softer },
                  pressed && !isPlaced && phase === 'answering' && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.poolLabel,
                    { color: isPlaced ? colors.neutralVariant : theme.main },
                  ]}
                >
                  {word}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <CheckButton
            theme={theme}
            state={checkState}
            onPress={phase === 'answering' ? handleCheck : handleContinue}
          />
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
  topBarWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  prompt: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  sectionSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
    marginTop: spacing.md,
  },
  answerWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    flex: 1,
  },
  answerWord: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  answerPlaceholder: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'transparent',
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
    borderStyle: 'dashed',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  poolWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  poolTile: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  poolLabel: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
