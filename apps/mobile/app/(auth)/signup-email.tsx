import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TextField } from '../../src/components/ui/TextField';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useSignupMutation } from '../../src/services/authApi';
import { pendingSignupStorage } from '../../src/services/secureStorage';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setPendingEmail } from '../../src/store/slices/authSlice';
import { toBackendLevel } from '../../src/store/slices/onboardingSlice';

const PASSWORD_HELPER =
  'Password must be at least 8 characters long and include 1 capital letter and one symbol.';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

function validate(name: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    errors.name = 'Please enter your full name';
  } else if (/\d/.test(trimmedName)) {
    errors.name = 'Full name cannot contain numbers';
  }
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Please enter a valid email address';
  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/`~;']/.test(password);
  if (!passwordValid) errors.password = PASSWORD_HELPER;
  return errors;
}

export default function EmailSignup() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [signup, { isLoading }] = useSignupMutation();
  const onboarding = useAppSelector((s) => s.onboarding);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit() {
    const v = validate(name, email, password);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    try {
      const result = await signup({
        email: email.trim().toLowerCase(),
        displayName: name.trim(),
        password,
        language: onboarding.language ?? undefined,
        level: onboarding.level ? toBackendLevel(onboarding.level) : undefined,
        reason: onboarding.reason ?? undefined,
        country: onboarding.country ?? undefined,
      }).unwrap();
      await pendingSignupStorage.set(result.email);
      dispatch(setPendingEmail(result.email));
      router.replace({ pathname: '/check-email', params: { email: result.email } });
    } catch (err) {
      const e = err as { status?: number; data?: { message?: string | string[] } };
      if (e.status === 409) {
        setErrors({ email: 'Email already in use' });
        return;
      }
      const msg = e.data?.message;
      if (Array.isArray(msg)) {
        const next: FormErrors = {};
        msg.forEach((m) => {
          const lower = m.toLowerCase();
          if (lower.includes('email')) next.email = m;
          else if (lower.includes('password')) next.password = m;
          else if (lower.includes('displayname') || lower.includes('full name')) next.name = m;
        });
        setErrors(next);
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fields}>
            <TextField
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />
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
              helper={errors.password ? undefined : PASSWORD_HELPER}
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Create Account" onPress={handleSubmit} loading={isLoading} />
          <Text style={styles.disclaimer}>
            By continuing, you agree to our Terms & Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  fields: {
    gap: spacing.md,
  },
  footer: {
    gap: spacing.sm,
  },
  disclaimer: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
});
