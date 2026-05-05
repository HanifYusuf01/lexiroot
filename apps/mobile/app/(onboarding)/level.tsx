import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { OptionCard } from '../../src/components/ui/OptionCard';
import { QuestionBubble } from '../../src/components/ui/QuestionBubble';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { spacing } from '../../src/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { LearningLevel, setLevel } from '../../src/store/slices/onboardingSlice';

const OPTIONS: { value: LearningLevel; label: string }[] = [
  { value: 'starting', label: "I'm just starting" },
  { value: 'a-little', label: 'I know a little' },
  { value: 'basic', label: 'I can hold basic conversations' },
  { value: 'advanced', label: "I'm advanced" },
];

export default function LevelScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const level = useAppSelector((s) => s.onboarding.level);

  return (
    <ScreenContainer showBack>
      <View style={styles.body}>
        <QuestionBubble question="What's your current level?" />
        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              selected={level === option.value}
              onPress={() => dispatch(setLevel(option.value))}
            />
          ))}
        </View>
      </View>
      <Button label="Continue" disabled={!level} onPress={() => router.push('/language')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  options: {
    gap: spacing.sm,
  },
});
