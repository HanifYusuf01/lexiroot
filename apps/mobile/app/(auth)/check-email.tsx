import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useResendVerificationMutation } from '../../src/services/authApi';
import { useAppSelector } from '../../src/store/hooks';

export default function CheckEmail() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const userEmail = useAppSelector((s) => s.auth.user?.email);
  const email = (emailParam || userEmail || '').trim().toLowerCase();
  const [resendVerification, { isLoading }] = useResendVerificationMutation();
  const [message, setMessage] = useState<string | undefined>(undefined);

  async function handleResend() {
    if (!email) {
      setMessage('Enter your email again to resend the link.');
      return;
    }
    try {
      await resendVerification({ email }).unwrap();
      setMessage('Verification email sent.');
    } catch {
      setMessage('Could not resend the email. Try again.');
    }
  }

  return (
    <ScreenContainer showBack>
      <View style={styles.body}>
        <View style={styles.copy}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a verification link to {email || 'your email'}.{'\n'}Open it to continue
          </Text>
        </View>
        <View style={styles.illustration} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Button label="Resend Email" onPress={handleResend} loading={isLoading} disabled={!email} />
        <Button label="Change Email" variant="outline" onPress={() => router.push('/change-email')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  copy: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.border,
    marginTop: spacing.md,
  },
  message: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
  },
});
