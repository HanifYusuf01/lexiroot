import { StyleSheet, Text, View } from 'react-native';
import { LexiRootLogo } from '../icons/LexiRootLogo';
import { colors, fonts, spacing } from '../../constants/theme';

// First-paint splash shown while the auth store hydrates. Matches the static
// Expo splash (white "L" on the brand orange) so the transition into the app is
// seamless, then adds the wordmark + tagline.
export function SplashScreenView() {
  return (
    <View style={styles.root}>
      <LexiRootLogo size={92} color={colors.white} />
      <Text style={styles.title}>LexiRoot</Text>
      <Text style={styles.tagline}>LANGUAGE. LEARNING. ROOTED IN YOU.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 44,
    color: colors.white,
    marginTop: spacing.lg,
  },
  tagline: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.xs,
  },
});
