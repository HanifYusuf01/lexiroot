import { useCallback, useState } from 'react';
import { useGoogleAuthMutation } from '../services/authApi';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';

// Load the native Google module defensively. It is only present in a custom dev
// build — in Expo Go (or before `expo prebuild`) accessing it throws during
// import, which would otherwise crash the whole route. When unavailable we
// degrade to a disabled state instead.
type GoogleModule = typeof import('@react-native-google-signin/google-signin');

let google: GoogleModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-google-signin/google-signin') as GoogleModule;
  // webClientId is what makes signIn() return an idToken whose audience the
  // backend (/auth/google) verifies. Values come from EXPO_PUBLIC_GOOGLE_* env.
  mod.GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    offlineAccess: false,
  });
  google = mod;
} catch {
  google = null;
}

/** False in Expo Go / before a dev build — the native module isn't linked. */
export const isGoogleSignInAvailable = google != null;

interface GoogleSignInResult {
  isNewUser: boolean;
}

/**
 * Drives the native Google sign-in, exchanges the ID token for our JWT session
 * via /auth/google, and stores the credentials. Returns `{ isNewUser }` so the
 * caller can route new accounts through onboarding; returns null when the user
 * cancels or the native module is unavailable.
 */
export function useGoogleSignIn() {
  const dispatch = useAppDispatch();
  const [googleAuth] = useGoogleAuthMutation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<GoogleSignInResult | null> => {
    if (!google) {
      setError('Google sign-in requires a development build (not Expo Go).');
      return null;
    }
    const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = google;
    setError(null);
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        return null; // user dismissed the account chooser
      }
      const { idToken } = response.data;
      if (!idToken) {
        throw new Error('No ID token returned from Google');
      }
      const result = await googleAuth({ idToken }).unwrap();
      dispatch(setCredentials({ token: result.token, user: result.user }));
      return { isNewUser: result.isNewUser };
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
        return null; // cancelled — stay silent
      }
      setError('Google sign-in failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [dispatch, googleAuth]);

  return { signIn, loading, error, available: isGoogleSignInAvailable };
}
