import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { authStorage, pendingSignupStorage } from '../../src/services/secureStorage';
import {
  useResendVerificationMutation,
  useVerifyEmailMutation,
} from '../../src/services/authApi';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { clearCredentials, setCredentials } from '../../src/store/slices/authSlice';

const CODE_LENGTH = 6;

export default function CheckEmail() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const inputRef = useRef<TextInput>(null);
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const pendingEmail = useAppSelector((s) => s.auth.pendingEmail);
  const userEmail = useAppSelector((s) => s.auth.user?.email);
  const email = (emailParam || pendingEmail || userEmail || '').trim().toLowerCase();

  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [info, setInfo] = useState<string | undefined>(undefined);

  function handleCodeChange(next: string) {
    const digits = next.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(undefined);
  }

  async function handleVerify() {
    if (code.length !== CODE_LENGTH) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (!email) {
      setError('Missing email. Please start signup again.');
      return;
    }
    setError(undefined);
    setInfo(undefined);
    try {
      const result = await verifyEmail({ email, code }).unwrap();
      const stored = {
        token: result.token,
        user: {
          ...result.user,
          emailVerifiedAt: result.user.emailVerifiedAt ?? new Date().toISOString(),
          country: result.user.country ?? null,
          avatarUrl: result.user.avatarUrl ?? null,
        },
      };
      await pendingSignupStorage.clear();
      await authStorage.set(stored);
      dispatch(setCredentials(stored));
      // Onboarding details were collected before signup and saved with the
      // account, so go straight to the celebration — no personalization step.
      router.replace('/creating-path');
    } catch {
      setError('That code is invalid or expired.');
    }
  }

  async function handleResend() {
    if (!email) {
      setError('Enter your email again to resend the code.');
      return;
    }
    setError(undefined);
    setInfo(undefined);
    try {
      await resendVerification({ email }).unwrap();
      setInfo('A new code has been sent to your email.');
    } catch {
      setError('Could not resend the code. Try again.');
    }
  }

  async function handleStartOver() {
    await Promise.all([authStorage.clear(), pendingSignupStorage.clear()]);
    dispatch(clearCredentials());
    router.replace('/welcome');
  }

  const boxes = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '');

  return (
    <ScreenContainer showBack>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <View style={styles.copy}>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to {email || 'your email'}.{'\n'}Enter it below to continue.
            </Text>
          </View>

          <Pressable onPress={() => inputRef.current?.focus()} style={styles.codeRow}>
            {boxes.map((digit, i) => (
              <View
                key={i}
                style={[
                  styles.codeBox,
                  digit ? styles.codeBoxFilled : null,
                  error ? styles.codeBoxError : null,
                ]}
              >
                <Text style={styles.codeDigit}>{digit}</Text>
              </View>
            ))}
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
              autoFocus
              style={styles.hiddenInput}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
            />
          </Pressable>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {info ? <Text style={styles.infoText}>{info}</Text> : null}
        </View>

        <View style={styles.footer}>
          <Button
            label="Verify Email"
            onPress={handleVerify}
            loading={isVerifying}
            disabled={code.length !== CODE_LENGTH}
          />
          <Button
            label="Resend Code"
            variant="outline"
            onPress={handleResend}
            loading={isResending}
            disabled={!email}
          />
          <Pressable
            onPress={() => router.push('/change-email')}
            hitSlop={8}
            style={styles.linkPress}
          >
            <Text style={styles.linkText}>Change Email</Text>
          </Pressable>
          <Pressable onPress={handleStartOver} hitSlop={8} style={styles.linkPress}>
            <Text style={styles.linkText}>Cancel and start over</Text>
          </Pressable>
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
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  copy: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    fontSize: 13,
    lineHeight: 18,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
    position: 'relative',
  },
  codeBox: {
    width: 44,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxFilled: {
    borderColor: colors.primary,
  },
  codeBoxError: {
    borderColor: colors.error,
  },
  codeDigit: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.neutral,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  errorText: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  infoText: {
    marginTop: spacing.md,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
  },
  linkPress: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  linkText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.neutralVariant,
    textDecorationLine: 'underline',
  },
});
