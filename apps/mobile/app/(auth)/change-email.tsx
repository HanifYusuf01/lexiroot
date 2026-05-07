import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { TextField } from '../../src/components/ui/TextField';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { authStorage } from '../../src/services/secureStorage';
import { useUpdateMeMutation } from '../../src/services/authApi';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setUser } from '../../src/store/slices/authSlice';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ChangeEmail() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const user = useAppSelector((s) => s.auth.user);
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!token) router.replace('/signup-email');
  }, [router, token]);

  async function handleSubmit() {
    const nextEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(nextEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    setError(undefined);
    try {
      const result = await updateMe({ email: nextEmail }).unwrap();
      const storedUser = {
        ...result,
        emailVerifiedAt: result.emailVerifiedAt ?? null,
        country: result.country ?? null,
        avatarUrl: result.avatarUrl ?? null,
      };
      if (token) await authStorage.set({ token, user: storedUser });
      dispatch(setUser(storedUser));
      router.replace({ pathname: '/check-email', params: { email: nextEmail } });
    } catch (err) {
      const e = err as { status?: number };
      setError(e.status === 409 ? 'Email already in use' : 'Something went wrong. Please try again.');
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
          <TextField
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            error={error}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.footer}>
          <Button label="Send Verification Link" onPress={handleSubmit} loading={isLoading} />
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
  footer: {
    gap: spacing.sm,
  },
});
