import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';

export default function PasswordSuccessScreen() {
  const router = useRouter();

  function handleContinue() {
    router.replace('/edit');
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={64} color={colors.white} />
        </View>
        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>Your password has been reset successfully</Text>
      </View>
      <View style={styles.footer}>
        <Button label="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.neutral,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
  },
  footer: {
    paddingBottom: spacing.lg,
  },
});
