import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { MascotHeadIcon } from '../../src/components/icons/MascotHeadIcon';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useAppDispatch } from '../../src/store/hooks';
import { completeOnboarding } from '../../src/store/slices/onboardingSlice';

export default function ReadyScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  function handleStart() {
    // Onboarding details were already persisted with the account at signup,
    // so there is nothing to save here — just enter the app.
    dispatch(completeOnboarding());
    router.replace('/home');
  }

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <View style={styles.hero}>
          <MascotHeadIcon size={200} />
        </View>
        <Text style={styles.title}>You are ready!</Text>
        <Text style={styles.subtitle}>Start your first lesson and earn your first XP.</Text>
      </View>
      <Button label="Start Lesson" onPress={handleStart} />
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
    fontSize: 32,
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
