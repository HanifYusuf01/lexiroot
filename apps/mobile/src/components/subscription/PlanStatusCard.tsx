import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CrownIcon } from '../icons/CrownIcon';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useSubscriptionPlansQuery } from '../../services/subscriptionPlansApi';
import { useMySubscriptionQuery } from '../../services/subscriptionsApi';
import { formatDate, formatPrice } from '../../utils/format';

/**
 * What the learner is actually on, with the one action that follows from it.
 *
 * The old promo card only knew two states — sold or not — so it either pitched
 * an upgrade to someone already paying for the top plan or vanished entirely,
 * leaving no way to move between paid plans. This reads the subscription first:
 * free tier gets the pitch, a subscriber gets their plan, their renewal date,
 * any scheduled change, and a route into `/change-plan`.
 */
export function PlanStatusCard() {
  const { data: sub, isLoading } = useMySubscriptionQuery();
  const { data: plans } = useSubscriptionPlansQuery();

  // Render nothing rather than a flash of "Free plan" that turns out to be
  // wrong a moment later — this card is a statement about what they've paid for.
  if (isLoading) return null;

  const plan = plans?.find((p) => p.id === sub?.planId) ?? null;
  const pending = plans?.find((p) => p.id === sub?.pendingPlanId) ?? null;
  const onFreePlan = !sub || !sub.entitled;

  if (onFreePlan) {
    return (
      <Pressable
        onPress={() => router.push('/upgrade' as never)}
        style={({ pressed }) => [styles.card, styles.cardFree, pressed && styles.pressed]}
      >
        <View style={styles.icon}>
          <CrownIcon size={40} />
        </View>
        <View style={styles.text}>
          <Text style={styles.titleOnFill}>You're on the free plan</Text>
          <Text style={styles.metaOnFill}>Unlock every level, story and download</Text>
        </View>
        <View style={styles.pillOnFill}>
          <Text style={styles.pillOnFillText}>Upgrade</Text>
        </View>
      </Pressable>
    );
  }

  const price = plan ? `${formatPrice(plan.price, plan.currency)} / ${plan.period.toLowerCase()}` : null;
  const meta = pending
    ? `Moving to ${pending.name}${
        sub.pendingPlanEffectiveAt ? ` on ${formatDate(sub.pendingPlanEffectiveAt)}` : ''
      }`
    : sub.cancelsOn
      ? `Access until ${formatDate(sub.cancelsOn)}`
      : sub.renewsOn
        ? `${price ? `${price} · ` : ''}renews ${formatDate(sub.renewsOn)}`
        : (price ?? sub.statusText);

  return (
    <Pressable
      onPress={() => router.push('/change-plan' as never)}
      style={({ pressed }) => [styles.card, styles.cardPaid, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <CrownIcon size={40} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{plan?.name ?? 'Premium'}</Text>
        <Text style={styles.meta} numberOfLines={2}>
          {meta}
        </Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText}>Change</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  cardFree: { backgroundColor: colors.primary },
  cardPaid: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  pressed: { opacity: 0.85 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.neutral },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    marginTop: 2,
    lineHeight: 17,
  },
  titleOnFill: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.white },
  metaOnFill: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  pillText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
  pillOnFill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primarySofter,
  },
  pillOnFillText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary },
});
