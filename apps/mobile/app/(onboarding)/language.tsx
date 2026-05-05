import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { OptionCard } from '../../src/components/ui/OptionCard';
import { QuestionBubble } from '../../src/components/ui/QuestionBubble';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { spacing } from '../../src/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { LearningLanguage, setLanguage } from '../../src/store/slices/onboardingSlice';

const OPTIONS: { value: LearningLanguage; label: string; comingSoon?: boolean }[] = [
  { value: 'yo', label: 'Yoruba' },
  { value: 'ig', label: 'Igbo', comingSoon: true },
  { value: 'ha', label: 'Hausa', comingSoon: true },
];

export default function LanguageScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const language = useAppSelector((s) => s.onboarding.language);

  return (
    <ScreenContainer showBack>
      <View style={styles.body}>
        <QuestionBubble question="What would you like to learn?" />
        <View style={styles.options}>
          {OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              label={option.label}
              selected={language === option.value}
              disabled={option.comingSoon}
              hint={option.comingSoon ? 'coming soon' : undefined}
              onPress={() => dispatch(setLanguage(option.value))}
            />
          ))}
        </View>
      </View>
      <Button label="Continue" disabled={!language} onPress={() => router.push('/setup')} />
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
