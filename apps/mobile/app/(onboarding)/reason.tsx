import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { OptionCard } from '../../src/components/ui/OptionCard';
import { QuestionBubble } from '../../src/components/ui/QuestionBubble';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { spacing } from '../../src/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { LearningReason, setReason } from '../../src/store/slices/onboardingSlice';

const OPTIONS: { value: LearningReason; label: string }[] = [
  { value: 'family', label: 'Talk with family' },
  { value: 'culture', label: 'Understand my culture better' },
  { value: 'teach-child', label: 'Teach my child' },
  { value: 'growth', label: 'Personal growth' },
  { value: 'curious', label: 'Just curious' },
];

export default function ReasonScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const reason = useAppSelector((s) => s.onboarding.reason);

  return (
    <ScreenContainer showBack>
      <View style={styles.body}>
        <QuestionBubble question="Why are you learning?" />
        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              selected={reason === option.value}
              onPress={() => dispatch(setReason(option.value))}
            />
          ))}
        </View>
      </View>
      <Button label="Continue" disabled={!reason} onPress={() => router.push('/level')} />
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
