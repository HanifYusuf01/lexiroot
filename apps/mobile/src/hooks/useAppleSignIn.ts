import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAppleAuthMutation } from '../services/authApi';
import { authStorage } from '../services/secureStorage';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { onboardingSignupFields } from '../store/slices/onboardingSlice';
import { setCredentials } from '../store/slices/authSlice';

/** Sign in with Apple is iOS-only — no Android/web equivalent exists. */
export const isAppleSignInAvailable = Platform.OS === 'ios';

interface AppleSignInResult {
  isNewUser: boolean;
}

/**
 * Drives the native Apple sign-in, exchanges the identity token for our JWT
 * session via /auth/apple, and stores the credentials. Returns `{ isNewUser }`
 * so the caller can route new accounts through onboarding; returns null when
 * the user cancels or the platform doesn't support it.
 */
export function useAppleSignIn() {
  const dispatch = useAppDispatch();
  const [appleAuth] = useAppleAuthMutation();
  // See useGoogleSignIn — the onboarding answers only reach the account through
  // the sign-in that creates it.
  const onboarding = useAppSelector((s) => s.onboarding);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<AppleSignInResult | null> => {
    if (!isAppleSignInAvailable) {
      setError('Apple sign-in is only available on iOS.');
      return null;
    }
    setError(null);
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple');
      }
      // Apple only returns the name on the very first authorization — omitted
      // (undefined) on every later sign-in, which the backend falls back from.
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const result = await appleAuth({
        identityToken: credential.identityToken,
        fullName: fullName || undefined,
        ...onboardingSignupFields(onboarding),
      }).unwrap();
      const stored = { token: result.token, user: result.user };
      await authStorage.set(stored);
      dispatch(setCredentials(stored));
      return { isNewUser: result.isNewUser };
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'ERR_REQUEST_CANCELED') {
        return null; // user cancelled — stay silent
      }
      setError('Apple sign-in failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [appleAuth, dispatch, onboarding]);

  return { signIn, loading, error, available: isAppleSignInAvailable };
}
