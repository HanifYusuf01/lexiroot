import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { MascotHeadIcon } from '../../src/components/icons/MascotHeadIcon';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { SkipConfirmModal } from '../../src/components/ui/SkipConfirmModal';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useFinishOnboarding } from '../../src/hooks/useFinishOnboarding';

export default function OnboardingIntro() {
  const router = useRouter();
  const [skipOpen, setSkipOpen] = useState(false);
  const { finish, isLoading } = useFinishOnboarding();

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <View style={styles.hero}>
          <MascotHeadIcon size={180} />
        </View>
        <Text style={styles.title}>This is more than learning a language.</Text>
        <Text style={styles.subtitle}>
          It&apos;s about reconnecting with values, identity, and home.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button label="Continue" onPress={() => router.push('/country')} />
        <Pressable onPress={() => setSkipOpen(true)} hitSlop={8} style={styles.skipPress}>
          <Text style={styles.skipText}>Skip »</Text>
        </Pressable>
      </View>

      <SkipConfirmModal
        visible={skipOpen}
        onClose={() => setSkipOpen(false)}
        onConfirm={finish}
        loading={isLoading}
      />
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
    fontSize: 28,
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
  footer: {
    gap: spacing.sm,
  },
  skipPress: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  skipText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
});
