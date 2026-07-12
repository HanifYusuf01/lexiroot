import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { MascotHeadIcon } from '../../src/components/icons/MascotHeadIcon';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, spacing } from '../../src/constants/theme';

export default function OnboardingIntro() {
  const router = useRouter();

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
      </View>
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
});
