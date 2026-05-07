import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TextField } from '../../src/components/ui/TextField';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useLoginMutation } from '../../src/services/authApi';
import { authStorage } from '../../src/services/secureStorage';
import { useAppDispatch } from '../../src/store/hooks';
import { setCredentials } from '../../src/store/slices/authSlice';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit() {
    const next: FormErrors = {};
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Please enter a valid email address';
    if (!password) next.password = 'Please enter your password';
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      const result = await login({
        email: email.trim().toLowerCase(),
        password,
      }).unwrap();
      const stored = {
        token: result.token,
        user: {
          ...result.user,
          emailVerifiedAt: result.user.emailVerifiedAt ?? null,
          country: result.user.country ?? null,
          avatarUrl: result.user.avatarUrl ?? null,
        },
      };
      await authStorage.set(stored);
      dispatch(setCredentials(stored));
      router.replace('/home');
    } catch (err) {
      const e = err as { status?: number };
      if (e.status === 401) {
        setErrors({ password: 'Invalid email or password' });
      } else if (e.status === 403) {
        router.replace({ pathname: '/check-email', params: { email: email.trim().toLowerCase() } });
      } else {
        setErrors({ password: 'Something went wrong. Please try again.' });
      }
    }
  }

  return (
    <ScreenContainer showBack>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Continue your learning journey.</Text>

          <View style={styles.fields}>
            <TextField
              placeholder="Email Address"
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
          </View>

          <Pressable onPress={() => router.push('/forgot-password')} hitSlop={6}>
            <Text style={styles.forgot}>Forgot Password?</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Button label="Log in" onPress={handleSubmit} loading={isLoading} />
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don&apos;t have an account?</Text>
            <Pressable onPress={() => router.push('/signup')} hitSlop={6}>
              <Text style={styles.signupLink}>Sign up</Text>
            </Pressable>
          </View>
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
    fontSize: 30,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  fields: {
    gap: spacing.md,
  },
  forgot: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  footer: {
    gap: spacing.md,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  signupText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutralVariant,
  },
  signupLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
  },
});
