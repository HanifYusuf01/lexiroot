import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { HeroCircle } from '../../src/components/ui/HeroCircle';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useUpdateMeMutation } from '../../src/services/authApi';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { completeOnboarding, toBackendLevel } from '../../src/store/slices/onboardingSlice';

export default function ReadyScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const onboarding = useAppSelector((s) => s.onboarding);
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  async function handleStart() {
    try {
      await updateMe({
        language: onboarding.language ?? undefined,
        level: onboarding.level ? toBackendLevel(onboarding.level) : undefined,
        reason: onboarding.reason ?? undefined,
      }).unwrap();
    } catch {
      /* don't block the user from starting if the save fails — they can resume later */
    }
    dispatch(completeOnboarding());
    router.replace('/home');
  }

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <View style={styles.hero}>
          <HeroCircle variant="primary" size={260} />
        </View>
        <Text style={styles.title}>You are ready!</Text>
        <Text style={styles.subtitle}>Start your first lesson and earn your first XP.</Text>
      </View>
      <Button label="Start Lesson" onPress={handleStart} loading={isLoading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 38,
    lineHeight: 36,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.neutralVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
});
