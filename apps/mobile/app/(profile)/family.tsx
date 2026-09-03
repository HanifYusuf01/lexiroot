import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { FamilySeat } from '@lexiroot/shared';
import { Button } from '../../src/components/ui/Button';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import {
  useFamilyOverviewQuery,
  useInviteFamilyMemberMutation,
  useLeaveFamilyPlanMutation,
  useRemoveFamilySeatMutation,
} from '../../src/services/familyApi';
import { refreshAuthUser } from '../../src/services/refreshAuthUser';
import { useAppDispatch } from '../../src/store/hooks';
import { apiErrorMessage } from '../../src/utils/apiError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Family plan seat management, for the plan owner.
 *
 * Everyone on the plan keeps a separate account — their own language, level,
 * streak and progress. Only the subscription is shared, which is why this
 * screen never shows anyone else's learning data.
 */
export default function FamilyScreen() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useFamilyOverviewQuery();
  const [invite, { isLoading: inviting }] = useInviteFamilyMemberMutation();
  const [removeSeat] = useRemoveFamilySeatMutation();
  const [leavePlan, { isLoading: leaving }] = useLeaveFamilyPlanMutation();
  const [email, setEmail] = useState('');

  const seatsLeft = data ? data.maxSeats - data.usedSeats : 0;

  async function handleInvite() {
    const value = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(value)) {
      Alert.alert('Check the email', 'Enter a valid email address to send an invitation.');
      return;
    }
    try {
      await invite({ email: value }).unwrap();
      setEmail('');
      Alert.alert('Invitation sent', `We've emailed ${value} an invitation to join your plan.`);
    } catch (err) {
      Alert.alert('Could not invite', apiErrorMessage(err));
    }
  }

  function handleLeave() {
    Alert.alert(
      'Leave this family plan?',
      'You keep your account, languages and progress, but Premium locks straight away. The plan owner can invite you again.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leavePlan().unwrap();
              // Leaving is an entitlement change, so the auth user has to be
              // re-read — gating reads `features` off the auth slice, which no
              // cache invalidation writes to.
              await refreshAuthUser(dispatch).catch(() => undefined);
            } catch (err) {
              Alert.alert('Could not leave', apiErrorMessage(err));
            }
          },
        },
      ],
    );
  }

  function handleRemove(seat: FamilySeat) {
    if (!seat.id) return;
    const who = seat.displayName ?? seat.email;
    Alert.alert(
      seat.status === 'pending' ? 'Cancel invitation?' : `Remove ${who}?`,
      seat.status === 'pending'
        ? `${seat.email} will no longer be able to join your plan.`
        : `${who} keeps their account and progress, but loses Premium access straight away.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: seat.status === 'pending' ? 'Cancel invite' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSeat({ id: seat.id as string }).unwrap();
            } catch (err) {
              Alert.alert('Could not remove', apiErrorMessage(err));
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScreenHeader title="Family plan" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.state} />
        ) : !data?.enabled ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Not on a family plan</Text>
            <Text style={styles.emptyBody}>
              Family sharing is part of the Family plan. Upgrade to share Premium with up to five
              other people — each with their own account, languages and progress.
            </Text>
          </View>
        ) : !data.isOwner ? (
          // A member, not the payer. They see whose plan they're on and how to
          // leave it — not the seat list, which is the owner's to manage.
          <>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {data.ownerName ? `You're on ${data.ownerName}'s family plan` : "You're on a family plan"}
              </Text>
              <Text style={styles.emptyBody}>
                Premium is unlocked on your account. Your languages, streak and progress are your
                own — only the plan is shared.
              </Text>
              <Text style={styles.hint}>
                {data.usedSeats} of {data.maxSeats} seats in use.
              </Text>
            </View>
            <Button
              label={leaving ? 'Leaving…' : 'Leave this plan'}
              variant="outline"
              disabled={leaving}
              onPress={handleLeave}
            />
          </>
        ) : (
          <>
            <Text style={styles.intro}>
              Everyone you add gets their own account. They pick their own languages and keep their
              own streak and progress — only the plan is shared.
            </Text>

            <View style={styles.seatsHeader}>
              <Text style={styles.sectionTitle}>People</Text>
              <Text style={styles.seatCount}>
                {data.usedSeats} of {data.maxSeats}
              </Text>
            </View>

            <View style={styles.card}>
              {data.seats.map((seat, i) => (
                <View key={seat.id ?? 'owner'} style={[styles.seatRow, i > 0 && styles.seatDivider]}>
                  <View style={styles.seatText}>
                    <Text style={styles.seatName} numberOfLines={1}>
                      {seat.displayName ?? seat.email}
                    </Text>
                    <Text style={styles.seatMeta} numberOfLines={1}>
                      {seat.status === 'owner'
                        ? 'You — plan owner'
                        : seat.status === 'pending'
                          ? `Invited · ${seat.email}`
                          : seat.email}
                    </Text>
                  </View>
                  {seat.status === 'owner' ? null : (
                    <Pressable onPress={() => handleRemove(seat)} hitSlop={10} style={styles.remove}>
                      <Ionicons name="close-circle-outline" size={20} color={colors.neutralVariant} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            {seatsLeft > 0 ? (
              <View style={styles.inviteBlock}>
                <Text style={styles.sectionTitle}>Invite someone</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="their@email.com"
                  placeholderTextColor={colors.neutralVariant}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={styles.input}
                />
                <Button
                  label={inviting ? 'Sending…' : 'Send invitation'}
                  disabled={inviting || email.trim().length === 0}
                  onPress={handleInvite}
                />
                <Text style={styles.hint}>
                  {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left. Invitations expire after 7
                  days.
                </Text>
              </View>
            ) : (
              <Text style={styles.hint}>
                Your plan is full. Remove someone to free up a seat.
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg },
  state: { marginTop: spacing.xl },
  intro: { fontFamily: fonts.regular, fontSize: 13, color: colors.neutralVariant, lineHeight: 19 },
  seatsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.neutral },
  seatCount: { fontFamily: fonts.bold, fontSize: 13, color: colors.neutralVariant },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  seatDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  seatText: { flex: 1 },
  seatName: { fontFamily: fonts.bold, fontSize: 14, color: colors.neutral },
  seatMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.neutralVariant, marginTop: 2 },
  remove: { padding: 2 },
  inviteBlock: { gap: spacing.sm },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.neutral,
  },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.neutralVariant },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.neutral },
  emptyBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.neutralVariant, lineHeight: 19 },
});
