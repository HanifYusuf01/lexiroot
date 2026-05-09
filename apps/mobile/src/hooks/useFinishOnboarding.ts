import { useRouter } from 'expo-router';
import { useUpdateMeMutation } from '../services/authApi';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { completeOnboarding, toBackendLevel } from '../store/slices/onboardingSlice';

export function useFinishOnboarding() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const onboarding = useAppSelector((s) => s.onboarding);
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  async function finish() {
    try {
      await updateMe({
        language: onboarding.language ?? undefined,
        level: onboarding.level ? toBackendLevel(onboarding.level) : undefined,
        reason: onboarding.reason ?? undefined,
        country: onboarding.country ?? undefined,
      }).unwrap();
    } catch {
      /* don't block the user — they can resume personalization later */
    }
    dispatch(completeOnboarding());
    router.replace('/home');
  }

  return { finish, isLoading };
}
