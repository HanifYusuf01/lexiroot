import { useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { planChangeDirection, planRank } from '@lexiroot/shared';
import type { PlanChangeDirection, SubscriptionPlan } from '@lexiroot/shared';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { usePlanChange } from '../../src/hooks/usePlanChange';
import { useFamilyOverviewQuery } from '../../src/services/familyApi';
import { useSubscriptionPlansQuery } from '../../src/services/subscriptionPlansApi';
import { useMySubscriptionQuery } from '../../src/services/subscriptionsApi';
import { formatDate, formatPrice } from '../../src/utils/format';

const DIRECTION_LABEL: Record<Exclude<PlanChangeDirection, 'same'>, string> = {
  upgrade: 'Upgrade',
  downgrade: 'Downgrade',
};

/**
 * Move between paid plans.
 *
 * Only reachable with a live subscription — somebody on the free tier is
 * buying, not switching, and belongs in `/upgrade`. The timing difference
 * between the two directions is the thing this screen exists to explain: an
 * upgrade starts now and is charged pro rata, a downgrade waits until the
 * period they have already paid for runs out.
 */
export default function ChangePlanScreen() {
  const { data: sub, isLoading: loadingSub } = useMySubscriptionQuery();
  const { data: plans, isLoading: loadingPlans } = useSubscriptionPlansQuery();
  // Only populated for a family-plan owner; everyone else gets `enabled: false`
  // and an empty seat list, which is exactly the "nobody to warn about" case.
  const { data: family } = useFamilyOverviewQuery();
  const { change, busy } = usePlanChange();

  const current = useMemo(
    () => plans?.find((p) => p.id === sub?.planId) ?? null,
    [plans, sub?.planId],
  );
  const pending = useMemo(
    () => plans?.find((p) => p.id === sub?.pendingPlanId) ?? null,
    [plans, sub?.pendingPlanId],
  );

  // Biggest first: the reason to open this screen is usually to move up, and it
  // puts the current plan's neighbours either side of it in a predictable order.
  const others = useMemo(() => {
    if (!current) return [];
    return (plans ?? [])
      .filter((p) => p.premium && p.id !== current.id)
      .slice()
      .sort((a, b) => planRank(b) - planRank(a));
  }, [plans, current]);

  /** When a downgrade would land, in the learner's own terms. */
  const switchDate = sub?.renewsOn ?? sub?.cancelsOn ?? null;

  /**
   * Everyone who loses access if the current plan stops sharing — accepted
   * members and outstanding invitations alike. The owner's own seat is excluded
   * because they are the one making the change.
   */
  const seatsAtRisk = useMemo(
    () => (family?.seats ?? []).filter((seat) => seat.status !== 'owner'),
    [family?.seats],
  );

  /** Names, not a count — "Tunde and Amina" is a decision; "2 people" is a number. */
  function describeSeats(): string {
    const names = seatsAtRisk.map((seat) => seat.displayName ?? seat.email);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    const rest = names.length - 2;
    return `${names[0]}, ${names[1]} and ${rest} other${rest === 1 ? '' : 's'}`;
  }

  function confirm(target: SubscriptionPlan) {
    if (!current) return;
    const direction = planChangeDirection(current, target);
    if (direction === 'same') return;

    const price = `${formatPrice(target.price, target.currency)}/${target.period.toLowerCase()}`;
    const body =
      direction === 'upgrade'
        ? `You'll move to ${target.name} straight away at ${price}, and pay only the difference for the rest of this period.`
        : switchDate
          ? `You'll stay on ${current.name} until ${formatDate(switchDate)}, then move to ${target.name} at ${price}. Nothing is charged today.`
          : `You'll keep ${current.name} until your current period ends, then move to ${target.name} at ${price}. Nothing is charged today.`;

    // Moving to a plan without family sharing ends other people's access. Say
    // whose, and when, before asking — the server refuses the change until this
    // has been confirmed, so this dialog is the only way through.
    const endsSeats =
      current.features.includes('family_sharing') &&
      !target.features.includes('family_sharing') &&
      seatsAtRisk.length > 0;

    if (endsSeats) {
      Alert.alert(
        `Switch to ${target.name}?`,
        `${body}\n\n${describeSeats()} will lose Premium ${
          switchDate ? `on ${formatDate(switchDate)}` : 'when the switch happens'
        }, because ${target.name} only covers your own account. Their accounts and progress stay exactly as they are.`,
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Manage people',
            onPress: () => router.push('/family' as never),
          },
          {
            text: 'Switch anyway',
            style: 'destructive',
            onPress: () => apply(target, true),
          },
        ],
      );
      return;
    }

    Alert.alert(`${DIRECTION_LABEL[direction]} to ${target.name}?`, body, [
      { text: 'Not now', style: 'cancel' },
      { text: DIRECTION_LABEL[direction], onPress: () => apply(target) },
    ]);
  }

  async function apply(target: SubscriptionPlan, confirmRemovesSeats = false) {
    const outcome = await change(target.id, confirmRemovesSeats);
    if (outcome.status === 'applied') {
      Alert.alert(`You're on ${target.name}`, 'Your new plan is active right away.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } else if (outcome.status === 'scheduled') {
      const when = outcome.effectiveAt ?? switchDate;
      Alert.alert(
        'Change scheduled',
        when
          ? `You'll move to ${target.name} on ${formatDate(when)}. Until then nothing changes.`
          : `You'll move to ${target.name} when your current period ends. Until then nothing changes.`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } else if (outcome.status === 'error') {
      Alert.alert('Could not change plan', outcome.message);
    }
    // 'cancelled' → they backed out of the App Store sheet; stay put.
  }

  const loading = loadingSub || loadingPlans;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Change plan" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.state} />
        ) : !sub?.entitled || !current ? (
          // No live plan to move between — this screen has nothing to offer.
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No plan to change</Text>
            <Text style={styles.body}>
              You're on the free plan. Pick a plan to unlock everything, then you can switch between
              plans from here.
            </Text>
            <Pressable style={styles.cta} onPress={() => router.push('/upgrade' as never)}>
              <Text style={styles.ctaText}>See plans</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>Your plan</Text>
              <Text style={styles.cardTitle}>{current.name}</Text>
              <Text style={styles.body}>
                {formatPrice(current.price, current.currency)} per {current.period.toLowerCase()}
                {sub.renewsOn ? ` · renews ${formatDate(sub.renewsOn)}` : ''}
              </Text>
              {pending ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>
                    Moving to {pending.name}
                    {sub.pendingPlanEffectiveAt
                      ? ` on ${formatDate(sub.pendingPlanEffectiveAt)}`
                      : ' at your next renewal'}
                    . Pick another plan below to change that.
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Switch to</Text>
            {others.length === 0 ? (
              <Text style={styles.body}>There are no other plans to switch to right now.</Text>
            ) : (
              <View style={styles.list}>
                {others.map((plan, i) => {
                  const direction = planChangeDirection(current, plan);
                  if (direction === 'same') return null;
                  const isUpgrade = direction === 'upgrade';
                  return (
                    <Pressable
                      key={plan.id}
                      disabled={busy}
                      onPress={() => confirm(plan)}
                      style={({ pressed }) => [
                        styles.planRow,
                        i > 0 && styles.planDivider,
                        pressed && !busy && styles.pressed,
                        busy && styles.disabled,
                      ]}
                    >
                      <View style={styles.planText}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planMeta}>
                          {formatPrice(plan.price, plan.currency)} per {plan.period.toLowerCase()}
                          {plan.scope === 'family' ? ' · up to 6 people' : ''}
                        </Text>
                      </View>
                      <View style={[styles.badge, isUpgrade ? styles.badgeUp : styles.badgeDown]}>
                        <Text
                          style={[
                            styles.badgeText,
                            isUpgrade ? styles.badgeTextUp : styles.badgeTextDown,
                          ]}
                        >
                          {DIRECTION_LABEL[direction]}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text style={styles.footnote}>
              Upgrades start immediately and you pay only the difference for the rest of this
              period. Downgrades take effect when your current period ends, so nothing you've paid
              for is lost.
            </Text>
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
  card: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.neutralVariant,
  },
  cardTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.neutral },
  body: { fontFamily: fonts.medium, fontSize: 13, color: colors.neutralVariant, lineHeight: 19 },
  notice: {
    marginTop: spacing.sm,
    backgroundColor: colors.primarySofter,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary, lineHeight: 18 },
  cta: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  ctaText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  sectionTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.neutral },
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  planDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.5 },
  planText: { flex: 1 },
  planName: { fontFamily: fonts.bold, fontSize: 15, color: colors.neutral },
  planMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    marginTop: 2,
  },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full },
  badgeUp: { backgroundColor: colors.primarySoft },
  badgeDown: { backgroundColor: colors.border },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  badgeTextUp: { color: colors.primary },
  badgeTextDown: { color: colors.neutralVariant },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    lineHeight: 18,
  },
});
