import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TextField } from '../../src/components/ui/TextField';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useResetPasswordMutation } from '../../src/services/authApi';

const PASSWORD_HELPER =
  'Password must be at least 8 characters long and include 1 capital letter and one symbol.';

interface FormErrors {
  password?: string;
  confirm?: string;
  token?: string;
}

function validatePassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/`~;']/.test(password)
  );
}

export default function ResetPassword() {
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit() {
    const next: FormErrors = {};
    if (!tokenParam) next.token = 'Reset link is missing or invalid. Request a new one.';
    if (!validatePassword(password)) next.password = PASSWORD_HELPER;
    if (confirm !== password) next.confirm = 'Passwords do not match';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      await resetPassword({ token: tokenParam!, newPassword: password }).unwrap();
      router.replace('/login');
    } catch {
      setErrors({ token: 'This reset link is invalid or has expired. Request a new one.' });
    }
  }

  return (
    <ScreenContainer showBack>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.title}>Create a new{'\n'}Password</Text>
          <View style={styles.fields}>
            <TextField
              placeholder="New password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              isPassword
            />
            <TextField
              placeholder="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              error={errors.confirm}
              isPassword
            />
          </View>
          {errors.token ? <Text style={styles.tokenError}>{errors.token}</Text> : null}
        </View>
        <View style={styles.footer}>
          <Button label="Update Password" onPress={handleSubmit} loading={isLoading} />
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
    marginBottom: spacing.xl,
  },
  fields: {
    gap: spacing.md,
  },
  tokenError: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: {
    gap: spacing.sm,
  },
});
