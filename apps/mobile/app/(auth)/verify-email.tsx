import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { authStorage } from '../../src/services/secureStorage';
import { useVerifyEmailMutation } from '../../src/services/authApi';
import { useAppDispatch } from '../../src/store/hooks';
import { setCredentials } from '../../src/store/slices/authSlice';

export default function VerifyEmail() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [verifyEmail] = useVerifyEmailMutation();
  const [error, setError] = useState<string | undefined>(undefined);
  const consumed = useRef(false);

  useEffect(() => {
    if (consumed.current) return;
    consumed.current = true;

    async function run() {
      if (!token) {
        setError('Verification link is missing or invalid.');
        return;
      }
      try {
        const result = await verifyEmail({ token }).unwrap();
        const stored = {
          token: result.token,
          user: {
            ...result.user,
            emailVerifiedAt: result.user.emailVerifiedAt ?? new Date().toISOString(),
            country: result.user.country ?? null,
            avatarUrl: result.user.avatarUrl ?? null,
          },
        };
        await authStorage.set(stored);
        dispatch(setCredentials(stored));
        router.replace('/intro');
      } catch {
        setError('This verification link is invalid or has expired.');
      }
    }

    run();
  }, [dispatch, router, token, verifyEmail]);

  return (
    <ScreenContainer>
      <View style={styles.body}>
        {error ? (
          <>
            <Text style={styles.title}>Link expired</Text>
            <Text style={styles.subtitle}>{error}</Text>
            <Button label="Back to Email Check" onPress={() => router.replace('/check-email')} />
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.subtitle}>Confirming your email...</Text>
          </>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
});
