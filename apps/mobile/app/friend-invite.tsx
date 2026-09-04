import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { colors, fonts, spacing } from '../src/constants/theme';
import {
  useAcceptFriendInviteMutation,
  useFriendInvitePreviewQuery,
} from '../src/services/friendsApi';
import { apiErrorMessage } from '../src/utils/apiError';
import { useAppSelector } from '../src/store/hooks';

/**
 * Landing screen for a friend invitation deep link
 * (`lexiroot://friend-invite?token=…`).
 *
 * The preview is unauthenticated so the invitee sees who invited them before
 * signing in — they may not have an account yet. Accepting requires being
 * signed in as the invited address, which the server enforces, so a forwarded
 * link can't be redeemed by anyone else.
 */
export default function FriendInviteScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const signedIn = useAppSelector((s) => !!s.auth.token);
  const currentEmail = useAppSelector((s) => s.auth.user?.email ?? null);
  const { data, isLoading, error } = useFriendInvitePreviewQuery(
    { token: token ?? '' },
    { skip: !token },
  );
  const [accept] = useAcceptFriendInviteMutation();
  const [busy, setBusy] = useState(false);

  // Signed in as somebody else. The server refuses this, so saying so up front
  // beats letting them tap through to a 403 that explains nothing.
  const wrongAccount =
    signedIn && !!currentEmail && !!data && currentEmail.toLowerCase() !== data.email.toLowerCase();

  async function handleAccept() {
    if (!token) return;
    setBusy(true);
    try {
      await accept({ token }).unwrap();
      Alert.alert('You’re now friends', 'You’ll see each other on the weekly leaderboard.', [
        { text: 'View leaderboard', onPress: () => router.replace('/leaderboard') },
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
              It may have expired, been withdrawn, or already been used.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>
              {data.invitedByName ?? 'Someone'} wants to learn with you
            </Text>
            <Text style={styles.body_}>
              You’ll appear on each other’s weekly leaderboard. They see your display name, streak
              and Root Points — nothing else about your account.
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
                This invitation is for {data.email}, but you’re signed in as {currentEmail}.
              </Text>
              <Text style={styles.meta}>
                Sign out from Profile, sign in as {data.email}, then open this link again.
              </Text>
            </>
          ) : signedIn ? (
            <Button
              label={busy ? 'Accepting…' : 'Accept invitation'}
              disabled={busy}
              onPress={handleAccept}
            />
          ) : (
            <>
              <Button label="Sign in to accept" onPress={() => router.push('/login')} />
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
