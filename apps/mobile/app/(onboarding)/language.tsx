import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { OptionCard } from '../../src/components/ui/OptionCard';
import { QuestionBubble } from '../../src/components/ui/QuestionBubble';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, spacing } from '../../src/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setLanguage } from '../../src/store/slices/onboardingSlice';
import { useLanguagesQuery } from '../../src/services/languagesApi';

export default function LanguageScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const language = useAppSelector((s) => s.onboarding.language);
  const { data: languages = [], isLoading } = useLanguagesQuery();

  return (
    <ScreenContainer showBack>
      <View style={styles.body}>
        <QuestionBubble question="What would you like to learn?" />
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={styles.options}>
            {languages.map((option) => {
              const comingSoon = option.status !== 'connected';
              return (
                <OptionCard
                  key={option.code}
                  label={option.name}
                  selected={language === option.code}
                  disabled={comingSoon}
                  hint={comingSoon ? 'coming soon' : undefined}
                  onPress={() => dispatch(setLanguage(option.code))}
                />
              );
            })}
          </View>
        )}
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
  loading: {
    paddingTop: spacing.xl,
  },
});
