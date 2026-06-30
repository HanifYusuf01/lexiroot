import { useCallback, useState } from 'react';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useGoogleAuthMutation } from '../services/authApi';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';

// Configure the native SDK once. webClientId is what makes signIn() return an
// idToken whose audience the backend (/auth/google) verifies. Fill the values
// via EXPO_PUBLIC_GOOGLE_* env vars (see .env.example).
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: false,
});

interface GoogleSignInResult {
  isNewUser: boolean;
}

/**
 * Drives the native Google sign-in, exchanges the ID token for our JWT session
 * via /auth/google, and stores the credentials. Returns `{ isNewUser }` so the
 * caller can route new accounts through onboarding; returns null when the user
 * cancels.
 */
export function useGoogleSignIn() {
  const dispatch = useAppDispatch();
  const [googleAuth] = useGoogleAuthMutation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (): Promise<GoogleSignInResult | null> => {
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

  return { signIn, loading, error };
}
