import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckButton } from '../../components/exercise/CheckButton';
import { ExerciseLessonHeader } from '../../components/exercise/ExerciseLessonHeader';
import { ExerciseTopBar } from '../../components/exercise/ExerciseTopBar';
import { OptionCard } from '../../components/exercise/OptionCard';
import { colors, fonts, radius, spacing, type SkillTheme } from '../../constants/theme';
import { useOfflineMediaUri } from '../../hooks/useOfflineMediaUri';

interface NameOption {
  id: string;
  label: string;
}

interface NameFromImageExerciseProps {
  theme: SkillTheme;
  skillTitle: string;
  level: number;
  imageUrl: string;
  instruction?: string;
  options: NameOption[];
  correctId: string;
  progress: number;
  xpReward: number;
  onContinue?: (wasCorrect: boolean) => void;
  onClose?: () => void;
}

type Phase = 'answering' | 'correct' | 'incorrect';

export function NameFromImageExercise({
  theme,
  skillTitle,
  level,
  imageUrl,
  instruction = 'Select the correct answer',
  options,
  correctId,
  progress,
  xpReward,
  onContinue,
  onClose,
}: NameFromImageExerciseProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('answering');
  const resolvedImageUri = useOfflineMediaUri(imageUrl);

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
        <View style={styles.imageCard}>
          <Image source={{ uri: resolvedImageUri ?? imageUrl }} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.prompt}>
          <Text style={styles.promptTitle}>What is the name of the object in the picture?</Text>
          <Text style={styles.promptSubtitle}>{instruction}</Text>
        </View>

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
    gap: spacing.md,
  },
  imageCard: {
    height: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '70%',
    height: '85%',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
