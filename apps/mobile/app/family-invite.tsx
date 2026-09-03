import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { colors, fonts, spacing } from '../src/constants/theme';
import {
  useAcceptFamilyInviteMutation,
  useFamilyInvitePreviewQuery,
} from '../src/services/familyApi';
import { apiErrorMessage } from '../src/utils/apiError';
import { refreshAuthUser } from '../src/services/refreshAuthUser';
import { useAppDispatch, useAppSelector } from '../src/store/hooks';

/**
 * Landing screen for a family invitation deep link
 * (`lexiroot://family-invite?token=…`).
 *
 * The preview is unauthenticated so the invitee sees who invited them before
 * signing in. Accepting requires being signed in as the invited address — the
 * server enforces that, so a forwarded link can't be redeemed by someone else.
 */
export default function FamilyInviteScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const dispatch = useAppDispatch();
  const signedIn = useAppSelector((s) => !!s.auth.token);
  const currentEmail = useAppSelector((s) => s.auth.user?.email ?? null);
  const { data, isLoading, error } = useFamilyInvitePreviewQuery(
    { token: token ?? '' },
    { skip: !token },
  );
  const [accept] = useAcceptFamilyInviteMutation();
  const [busy, setBusy] = useState(false);

  /**
   * Signed in, but as somebody else. The server refuses this (the invite is
   * addressed to an email, not to whoever holds the link), so offering the
   * button and letting it 403 tells the person nothing about what to do —
   * least of all which account they are actually in.
   */
  const wrongAccount =
    signedIn &&
    !!currentEmail &&
    !!data &&
    currentEmail.toLowerCase() !== data.email.toLowerCase();

  async function handleAccept() {
    if (!token) return;
    setBusy(true);
    try {
      const result = await accept({ token }).unwrap();

      // Accepting a seat *is* an entitlement change, so the auth user has to be
      // re-read the way checkout does it. Invalidating the `User` cache tag is
      // not enough: gating reads `features` off the auth slice, which only
      // `setUser` writes — so without this the new member stays gated behind the
      // upgrade wall until they sign out and back in.
      await refreshAuthUser(dispatch).catch(() => undefined);
      if (result.hadOwnSubscription) {
        // They now have two entitlement sources. Harmless functionally, but
        // they're paying twice — say so rather than let it go unnoticed.
        Alert.alert(
          "You're on the family plan",
          'You also still have your own subscription, which will keep billing. Cancel it from Subscription settings if you no longer need it.',
          [{ text: 'OK', onPress: () => router.replace('/home') }],
        );
        return;
      }
      Alert.alert('Welcome to the family plan', 'Premium is unlocked on your account.', [
        { text: 'Start learning', onPress: () => router.replace('/home') },
      ]);
    } catch (err) {
      Alert.alert('Could not accept', apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.body}>
        {!token ? (
          <Text style={styles.title}>This invitation link is incomplete.</Text>
        ) : isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : error || !data ? (
          <>
            <Text style={styles.title}>Invitation unavailable</Text>
            <Text style={styles.body_}>
              It may have expired, been cancelled, or already been used.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              {data.invitedByName ?? 'Someone'} invited you to their family plan
            </Text>
            <Text style={styles.body_}>
              Accept to unlock Premium on your own account. You choose your own languages and keep
              your own streak and progress — only the plan is shared.
            </Text>
            <Text style={styles.meta}>Invitation sent to {data.email}</Text>
          </>
        )}
      </View>

      {token && data ? (
        <View style={styles.footer}>
          {wrongAccount ? (
            <>
              <Text style={styles.body_}>
                This invitation is for {data.email}, but you're signed in as {currentEmail}.
              </Text>
              <Text style={styles.meta}>
                Sign out from Profile, sign in as {data.email}, then open this link again. Each seat
                is its own account — the person joining keeps their own languages and progress.
              </Text>
            </>
          ) : signedIn ? (
            <Button
              label={busy ? 'Joining…' : 'Accept invitation'}
              disabled={busy}
              onPress={handleAccept}
            />
          ) : (
            <>
              <Button
                label="Sign in to accept"
                onPress={() => router.push('/login')}
              />
              <Text style={styles.meta}>
                Sign in (or create an account) with {data.email}, then open this link again.
              </Text>
            </>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.neutral,
    textAlign: 'center',
  },
  body_: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
});
