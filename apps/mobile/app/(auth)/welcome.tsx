import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { MascotHeadIcon } from '../../src/components/icons/MascotHeadIcon';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, spacing } from '../../src/constants/theme';

export default function AuthWelcome() {
  const router = useRouter();
  return (
    <ScreenContainer>
      <View style={styles.body}>
        <View style={styles.hero}>
          <MascotHeadIcon size={180} />
        </View>
        <Text style={styles.title}>Find your way back to your language.</Text>
        <Text style={styles.subtitle}>
          Learn African languages through stories and real-life conversation.
        </Text>
      </View>
      <View style={styles.footer}>
        <Button label="GET STARTED" onPress={() => router.push('/signup')} />
        <Button
          label="I ALREADY HAVE AN ACCOUNT"
          variant="outline"
          onPress={() => router.push('/login')}
        />
        <Text style={styles.disclaimer}>Yoruba available now. More languages coming.</Text>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    lineHeight: 38,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.neutralVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  footer: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  disclaimer: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
