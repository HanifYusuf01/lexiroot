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

  async function handleSubmit() {
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      setError('Please enter a valid email address');
      return;
    }
    setError(undefined);
    try {
      await requestReset({ email: normalized }).unwrap();
      router.push({ pathname: '/reset-password', params: { email: normalized } });
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
            Enter your email and we&apos;ll send you a 6-digit reset code.
          </Text>
          <View style={styles.field}>
            <TextField
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              error={error}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>
        <View style={styles.footer}>
          <Button label="Send Reset Code" onPress={handleSubmit} loading={isLoading} />
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
