import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TextField } from '../../src/components/ui/TextField';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useRequestPasswordResetMutation } from '../../src/services/authApi';

export default function ForgotPassword() {
  const router = useRouter();
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    setError(undefined);
    try {
      await requestReset({ email: email.trim().toLowerCase() }).unwrap();
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <ScreenContainer showBack>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.title}>Reset your{'\n'}password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we&apos;ll send you a reset link.
          </Text>
          <View style={styles.field}>
            <TextField
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              error={error}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!sent}
            />
          </View>
          {sent ? (
            <Text style={styles.success}>
              If an account exists for that email, a reset link is on its way.
            </Text>
          ) : null}
        </View>
        <View style={styles.footer}>
          <Button
            label={sent ? 'Back to Log in' : 'Send Reset Link'}
            onPress={sent ? () => router.replace('/login') : handleSubmit}
            loading={isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  success: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.success,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
  },
});
