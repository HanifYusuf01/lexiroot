import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckButton } from '../../components/exercise/CheckButton';
import { ExerciseLessonHeader } from '../../components/exercise/ExerciseLessonHeader';
import { ExerciseTopBar } from '../../components/exercise/ExerciseTopBar';
import { OptionCard } from '../../components/exercise/OptionCard';
import { colors, fonts, spacing, type SkillTheme } from '../../constants/theme';

interface MeaningOption {
  id: string;
  label: string;
}

interface CorrectMeaningExerciseProps {
  theme: SkillTheme;
  skillTitle: string;
  level: number;
  word: string;
  instruction?: string;
  promptTitle?: string;
  options: MeaningOption[];
  correctId: string;
  progress: number;
  xpReward: number;
  onContinue?: (wasCorrect: boolean) => void;
  onClose?: () => void;
}

type Phase = 'answering' | 'correct' | 'incorrect';

export function CorrectMeaningExercise({
  theme,
  skillTitle,
  level,
  word,
  instruction = 'Select the correct answer',
  promptTitle = 'What does this sentence mean?',
  options,
  correctId,
  progress,
  xpReward,
  onContinue,
  onClose,
}: CorrectMeaningExerciseProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('answering');

  const handleCheck = () => {
    if (!selectedId) return;
    setPhase(selectedId === correctId ? 'correct' : 'incorrect');
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
      setSelectedId(null);
    }
  };

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
        <Text style={styles.word}>{word}</Text>

        <View style={styles.prompt}>
          <Text style={styles.promptTitle}>{promptTitle}</Text>
          <Text style={styles.promptSubtitle}>{instruction}</Text>
        </View>

        <View style={styles.list}>
          {options.map((opt) => (
            <OptionCard
              key={opt.id}
              label={opt.label}
              state={optionState(opt.id)}
              theme={theme}
              fullWidth
              disabled={phase !== 'answering'}
              onPress={() => setSelectedId(opt.id)}
            />
          ))}
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
  word: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  prompt: {
    gap: 4,
    marginBottom: spacing.xs,
  },
  promptTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  promptSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
  },
  list: {
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
