import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  LANGUAGE_LABELS,
  LEARNING_LEVEL_LABELS,
} from '@lexiroot/shared';
import { Button } from '../../src/components/ui/Button';
import { HeroCircle } from '../../src/components/ui/HeroCircle';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, spacing } from '../../src/constants/theme';
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
  const { reason, level, language } = useAppSelector((s) => s.onboarding);

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <View style={styles.hero}>
          <HeroCircle variant="soft" size={220} />
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
              Learning <Text style={styles.pick}>{LANGUAGE_LABELS[language]}</Text>
            </Text>
          ) : null}
        </View>
      </View>
      <Button label="Continue" onPress={() => router.push('/creating-path')} />
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
    fontSize: 38,
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
