import { Stack, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { MascotPadlockIcon } from '../../src/components/icons/MascotPadlockIcon';
import { LessonFullCenterScreen } from '../../src/components/lesson/LessonFullCenterScreen';
import { Button } from '../../src/components/ui/Button';
import { colors, fonts, spacing } from '../../src/constants/theme';

export default function UpgradeHero() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LessonFullCenterScreen
        onClose={() => router.back()}
        footer={
          <View style={styles.footerStack}>
            <Button
              label="Continue with free plan"
              variant="outline"
              onPress={() => router.back()}
            />
            <Button
              label="Start Free Trial"
              onPress={() => router.push('/upgrade/pricing' as never)}
            />
            <Text style={styles.fineprint}>7-day free trial · Cancel anytime</Text>
          </View>
        }
      >
        <View style={styles.mascotWrap}>
          <MascotPadlockIcon size={170} />
        </View>
        <Text style={styles.title}>Go deeper with{'\n'}your roots</Text>
        <Text style={styles.body}>
          Unlock full lessons, better pronunciation feedback, and richer cultural stories.
        </Text>
      </LessonFullCenterScreen>
    </>
  );
}

const styles = StyleSheet.create({
  mascotWrap: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    color: colors.primary,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footerStack: {
    gap: spacing.sm,
  },
  fineprint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
});
