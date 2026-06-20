import { useRouter } from 'expo-router';

/**
 * Skip path from the onboarding intro. Onboarding now runs before account
 * creation, so there is no authenticated user to personalize yet — skipping
 * simply proceeds to account creation with whatever (if anything) was collected
 * so far. The chosen details are persisted with the account at /auth/signup.
 */
export function useFinishOnboarding() {
  const router = useRouter();

  function finish() {
    router.push('/signup-email');
  }

  return { finish, isLoading: false };
}
