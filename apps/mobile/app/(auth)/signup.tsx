import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleIcon } from '../../src/components/icons/GoogleIcon';
import { MascotHeadIcon } from '../../src/components/icons/MascotHeadIcon';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { SocialButton } from '../../src/components/ui/SocialButton';
import { colors, fonts, spacing } from '../../src/constants/theme';

export default function SignupOptions() {
  const router = useRouter();

  return (
    <ScreenContainer showBack>
      <View style={styles.body}>
        <View style={styles.hero}>
          <MascotHeadIcon size={130} />
        </View>
        <Text style={styles.title}>Create your{'\n'}LexiRoot account</Text>
      </View>
      <View style={styles.options}>
        <SocialButton label="Continue with Google" icon={<GoogleIcon size={20} />} onPress={() => {}} />
        <SocialButton label="Continue with Apple" iconName="logo-apple" onPress={() => {}} />
        <SocialButton
          label="Sign up with Email"
          iconName="mail-outline"
          onPress={() => router.push('/intro')}
        />
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <Pressable onPress={() => router.push('/login')} hitSlop={6}>
            <Text style={styles.loginLink}>Log in</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  options: {
    gap: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.neutralVariant,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  loginText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutralVariant,
  },
  loginLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
});
