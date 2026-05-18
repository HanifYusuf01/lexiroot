import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckButton } from '../../components/exercise/CheckButton';
import { ExerciseLessonHeader } from '../../components/exercise/ExerciseLessonHeader';
import { ExerciseTopBar } from '../../components/exercise/ExerciseTopBar';
import { OptionCard } from '../../components/exercise/OptionCard';
import { PlayButton } from '../../components/exercise/PlayButton';
import { colors, fonts, spacing, type SkillTheme } from '../../constants/theme';

interface ListenSelectOption {
  id: string;
  label: string;
}

interface ListenSelectExerciseProps {
  theme: SkillTheme;
  skillTitle: string;
  level: number;
  options: ListenSelectOption[];
  correctId: string;
  progress: number;
  xpReward: number;
  instruction?: string;
  onPlay?: () => void;
  onContinue?: (wasCorrect: boolean) => void;
  onClose?: () => void;
}

type Phase = 'answering' | 'correct' | 'incorrect';

export function ListenSelectExercise({
  theme,
  skillTitle,
  level,
  options,
  correctId,
  progress,
  xpReward,
  instruction,
  onPlay,
  onContinue,
  onClose,
}: ListenSelectExerciseProps) {
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
        <ExerciseLessonHeader
          title={skillTitle}
          level={level}
          speedBadge="1x"
          theme={theme}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.playRow}>
          <PlayButton theme={theme} onPress={onPlay} />
        </View>

        {instruction ? (
          <View style={styles.promptWrap}>
            <Text style={styles.promptTitle}>{instruction}</Text>
            <Text style={styles.promptSubtitle}>Select the correct answer</Text>
          </View>
        ) : null}

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
    gap: spacing.lg,
  },
  promptWrap: {
    gap: 4,
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
  playRow: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  footer: {
    marginTop: spacing.md,
  },
});
