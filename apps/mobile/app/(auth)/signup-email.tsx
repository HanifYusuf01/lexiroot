import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { COUNTRIES, type CountryCode } from '@lexiroot/shared';
import { Button } from '../../src/components/ui/Button';
import { PhoneField } from '../../src/components/ui/PhoneField';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TextField } from '../../src/components/ui/TextField';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useSignupMutation } from '../../src/services/authApi';
import { authStorage } from '../../src/services/secureStorage';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setCredentials } from '../../src/store/slices/authSlice';
import { toBackendLevel } from '../../src/store/slices/onboardingSlice';

const PASSWORD_HELPER =
  'Password must be at least 8 characters long and include 1 capital letter and one symbol.';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
}

function validate(name: string, email: string, password: string, digits: string): FormErrors {
  const errors: FormErrors = {};
  if (name.trim().length < 2) errors.name = 'Please enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = 'Please enter a valid email address';
  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/`~;']/.test(password);
  if (!passwordValid) errors.password = PASSWORD_HELPER;
  if (digits.length < 6) errors.phone = 'Please enter a valid phone number';
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
  const [country, setCountry] = useState<CountryCode>('NG');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  async function handleSubmit() {
    const v = validate(name, email, password, phoneDigits);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    const phone = `${COUNTRIES[country].dialCode}${phoneDigits}`;
    try {
      const result = await signup({
        email: email.trim().toLowerCase(),
        displayName: name.trim(),
        password,
        language: onboarding.language ?? undefined,
        level: onboarding.level ? toBackendLevel(onboarding.level) : undefined,
        reason: onboarding.reason ?? undefined,
        country,
        phone,
      }).unwrap();
      const stored = {
        token: result.token,
        user: {
          ...result.user,
          emailVerifiedAt: result.user.emailVerifiedAt ?? null,
          country: result.user.country ?? null,
          phone: result.user.phone ?? null,
          avatarUrl: result.user.avatarUrl ?? null,
        },
      };
      await authStorage.set(stored);
      dispatch(setCredentials(stored));
      router.replace('/intro');
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
          else if (lower.includes('displayname')) next.name = m;
          else if (lower.includes('phone')) next.phone = m;
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
            <PhoneField
              country={country}
              digits={phoneDigits}
              onChangeCountry={setCountry}
              onChangeDigits={setPhoneDigits}
              error={errors.phone}
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
