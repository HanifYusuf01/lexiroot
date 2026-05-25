import { StyleSheet, Text, View } from 'react-native';
import { MascotHeadIcon } from '../icons/MascotHeadIcon';
import { colors, fonts, spacing } from '../../constants/theme';

// First-paint splash shown while the auth store hydrates. Matches the static
// Expo splash so the transition into the app is seamless.
export function SplashScreenView() {
  return (
    <View style={styles.root}>
      <View style={styles.mascot}>
        <MascotHeadIcon size={150} />
      </View>
      <Text style={styles.title}>Lexiroot</Text>
      <Text style={styles.subtitle}>Your language. Your roots.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl * 2,
  },
  mascot: {
    marginBottom: spacing.xxl * 2,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 42,
    color: colors.white,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.xs,
  },
});
