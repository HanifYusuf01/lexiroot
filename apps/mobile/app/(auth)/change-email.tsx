import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TextField } from '../../src/components/ui/TextField';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { pendingSignupStorage } from '../../src/services/secureStorage';
import { useChangePendingEmailMutation } from '../../src/services/authApi';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setPendingEmail } from '../../src/store/slices/authSlice';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function ChangeEmail() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  const [changePendingEmail, { isLoading }] = useChangePendingEmailMutation();
  const [email, setEmail] = useState(pendingEmail ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!pendingEmail) router.replace('/signup-email');
  }, [router, pendingEmail]);

  async function handleSubmit() {
    if (!pendingEmail) return;
    const next: FormErrors = {};
    const nextEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(nextEmail)) next.email = 'Please enter a valid email address';
    if (nextEmail === pendingEmail.toLowerCase()) next.email = 'New email must be different';
    if (password.length < 1) next.password = 'Enter your password to confirm';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      const result = await changePendingEmail({
        currentEmail: pendingEmail,
        newEmail: nextEmail,
        password,
      }).unwrap();
      await pendingSignupStorage.set(result.email);
      dispatch(setPendingEmail(result.email));
      router.replace({ pathname: '/check-email', params: { email: result.email } });
    } catch (err) {
      const e = err as { status?: number };
      if (e.status === 401) setErrors({ password: 'Incorrect password' });
      else if (e.status === 409) setErrors({ email: 'Email already in use' });
      else if (e.status === 400) setErrors({ general: 'Could not change email. Try again.' });
      else setErrors({ general: 'Something went wrong. Please try again.' });
    }
  }

  return (
    <ScreenContainer showBack>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.title}>Change email</Text>
          <Text style={styles.subtitle}>
            Enter the new email address and your password to confirm.
          </Text>
          <TextField
            placeholder="New Email Address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            isPassword
          />
          {errors.general ? <Text style={styles.errorText}>{errors.general}</Text> : null}
        </View>
        <View style={styles.footer}>
          <Button label="Send Verification Code" onPress={handleSubmit} loading={isLoading} />
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
    gap: spacing.lg,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
  },
});
