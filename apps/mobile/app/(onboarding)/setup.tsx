import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { languageLabel, LEARNING_LEVEL_LABELS } from '@lexiroot/shared';
import { Button } from '../../src/components/ui/Button';
import { MascotIcon } from '../../src/components/icons/MascotIcon';
import { AnimatedMascot } from '../../src/components/mascot/AnimatedMascot';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useUpdateMeMutation } from '../../src/services/authApi';
import { useAppSelector } from '../../src/store/hooks';
import {
  LearningReason,
  toBackendLevel,
} from '../../src/store/slices/onboardingSlice';

const REASON_LABEL: Record<LearningReason, string> = {
  family: 'talk with family',
  culture: 'understand your culture better',
  'teach-child': 'teach your child',
  growth: 'grow personally',
  curious: 'explore out of curiosity',
};

export default function SetupScreen() {
  const router = useRouter();
  const { reason, level, language, country } = useAppSelector((s) => s.onboarding);
  const token = useAppSelector((s) => s.auth.token);
  const [updateMe, { isLoading: saving }] = useUpdateMeMutation();

  async function handleContinue() {
    // Email signup hasn't created an account yet — collect credentials next.
    if (!token) {
      router.push('/signup-email');
      return;
    }
    // Google users already have an account; persist their onboarding picks.
    try {
      await updateMe({
        country: country ?? undefined,
        reason: reason ?? undefined,
        level: level ? toBackendLevel(level) : undefined,
        language: language ?? undefined,
      }).unwrap();
      router.replace('/creating-path');
    } catch {
      // Stay on the screen so the user can retry, and tell them why we didn't
      // advance — otherwise a failed save looks like an unresponsive button.
      Alert.alert('Could not save', 'Please check your connection and try again.');
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <View style={styles.hero}>
          <AnimatedMascot mood="idle">
            <MascotIcon size={170} />
          </AnimatedMascot>
        </View>
        <Text style={styles.title}>We&apos;re setting things up for you...</Text>
        <View style={styles.summary}>
          {reason ? (
            <Text style={styles.summaryLine}>
              You want to <Text style={styles.pick}>{REASON_LABEL[reason]}</Text>
            </Text>
          ) : null}
          {level ? (
            <Text style={styles.summaryLine}>
              Starting at{' '}
              <Text style={styles.pick}>
                {LEARNING_LEVEL_LABELS[toBackendLevel(level)].toLowerCase()} level
              </Text>
            </Text>
          ) : null}
          {language ? (
            <Text style={styles.summaryLine}>
              Learning <Text style={styles.pick}>{language ? languageLabel(language) : ''}</Text>
            </Text>
          ) : null}
        </View>
      </View>
      <Button label={saving ? 'Saving…' : 'Continue'} onPress={handleContinue} disabled={saving} />
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
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 32,
    lineHeight: 32,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  summary: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryLine: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.neutral,
    textAlign: 'center',
    lineHeight: 22,
  },
  pick: {
    fontFamily: fonts.semiboldItalic,
    color: colors.primary,
  },
});
