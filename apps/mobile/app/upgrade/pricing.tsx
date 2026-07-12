import type { SubscriptionPlan } from '@lexiroot/shared';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { useCheckout } from '../../src/hooks/useCheckout';
import { useSubscriptionPlansQuery } from '../../src/services/subscriptionPlansApi';
import { formatPrice } from '../../src/utils/format';

type Audience = 'individual' | 'family';

// Headline-price colour by position when the card is unfilled: orange, golden, chocolate.
const PRICE_COLORS = [colors.primary, colors.tertiary, colors.secondary];

// Family shows a fixed tier treatment for every card at once (see design):
// Monthly = white/outlined, Quarterly = orange, Yearly = chocolate.
const FAMILY_FILLS = [colors.white, colors.primary, colors.secondary];

interface CardVisual {
  bg: string;
  /** Whether the card is colour-filled (light text + golden price). */
  onFill: boolean;
  priceColor: string;
}

function cardVisual(audience: Audience, index: number, selected: boolean): CardVisual {
  const priceByPosition = PRICE_COLORS[Math.min(index, PRICE_COLORS.length - 1)];
  if (audience === 'family') {
    const bg = FAMILY_FILLS[Math.min(index, FAMILY_FILLS.length - 1)];
    const onFill = bg !== colors.white;
    return { bg, onFill, priceColor: onFill ? colors.tertiary : priceByPosition };
  }
  // Individual: only the selected card fills (orange), the rest stay outlined.
  return {
    bg: selected ? colors.primary : colors.white,
    onFill: selected,
    priceColor: selected ? colors.tertiary : priceByPosition,
  };
}

export default function UpgradePricing() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [audience, setAudience] = useState<Audience>('individual');
  const { data: plans, isLoading } = useSubscriptionPlansQuery();
  const { start: startCheckout, busy: checkoutBusy } = useCheckout();

  // Free is the default entitlement, not a purchasable card — show paid plans only.
  const visible = useMemo(
    () =>
      (plans ?? [])
        .filter((p) => p.scope === audience && p.premium)
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [plans, audience],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default to the middle (recommended) plan whenever the visible set changes,
  // e.g. on first load or when toggling Individual/Family.
  useEffect(() => {
    if (visible.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!visible.some((p) => p.id === selectedId)) {
      setSelectedId(visible[Math.min(1, visible.length - 1)].id);
    }
  }, [visible, selectedId]);

  // Drop the learner into the lesson/level they were gated from. When there's no
  // such destination — they upgraded without a lesson in progress (home promo,
  // profile, onboarding) — land them on the home tab instead of unwinding to
  // wherever the stack happened to start.
  const leaveToDestination = () => {
    router.replace((next ?? '/home') as never);
  };

  const handleSubscribe = async () => {
    if (!selectedId) return;
    const outcome = await startCheckout(selectedId);
    if (outcome === 'success') {
      leaveToDestination();
    } else if (outcome === 'already_subscribed') {
      // Not an error — they've already paid. useCheckout has resynced the user.
      Alert.alert(
        "You're already subscribed",
        'Your plan is active, so there was nothing to pay for.',
        [{ text: 'OK', onPress: leaveToDestination }],
      );
    } else if (outcome === 'pending') {
      Alert.alert(
        'Payment processing',
        "We're confirming your payment — your access will unlock in a moment.",
      );
    } else if (outcome === 'error') {
      Alert.alert('Checkout failed', 'We couldn’t start your subscription. Please try again.');
    }
    // 'cancelled' → the learner backed out; stay on the screen.
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.closeRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.neutral} />
          </Pressable>
        </View>

        <Text style={styles.heading}>Start your{'\n'}journey</Text>

        <View style={styles.audienceWrap}>
          <AudienceChip
            label="Individual"
            active={audience === 'individual'}
            onPress={() => setAudience('individual')}
          />
          <AudienceChip
            label="Family"
            active={audience === 'family'}
            onPress={() => setAudience('family')}
          />
        </View>
        {audience === 'family' ? (
          <Text style={styles.audienceHint}>· Allows up to 3 users</Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.state} />
        ) : visible.length === 0 ? (
          <Text style={styles.stateText}>No plans available yet.</Text>
        ) : (
          <View style={styles.plans}>
            {visible.map((plan, index) => {
              const selected = selectedId === plan.id;
              const visual = cardVisual(audience, index, selected);
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  visual={visual}
                  onPress={() => setSelectedId(plan.id)}
                />
              );
            })}
          </View>
        )}

        <View style={styles.cta}>
          <Button
            label={checkoutBusy ? 'Processing…' : 'Subscribe'}
            disabled={selectedId === null || checkoutBusy}
            onPress={handleSubscribe}
          />
          <Text style={styles.fineprint}>Cancel anytime.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AudienceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.audienceChip, active && styles.audienceChipActive]}>
      <Text style={[styles.audienceChipText, active && styles.audienceChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function PlanCard({
  plan,
  visual,
  onPress,
}: {
  plan: SubscriptionPlan;
  visual: CardVisual;
  onPress: () => void;
}) {
  const { bg, onFill, priceColor } = visual;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.planCard,
        { backgroundColor: bg, borderColor: onFill ? bg : colors.primaryBorder },
      ]}
    >
      <Text style={[styles.planPrice, { color: priceColor }]}>
        {formatPrice(plan.price, plan.currency)}
      </Text>
      <Text style={[styles.planTitle, onFill && styles.planTitleSelected]}>{plan.name}</Text>
      <Text style={[styles.planSub, onFill && styles.planSubSelected]}>
        Billed per {plan.period.toLowerCase()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  closeRow: { paddingTop: spacing.sm },
  close: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 32,
    color: colors.primary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  audienceWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    padding: 4,
    alignSelf: 'center',
  },
  audienceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  audienceChipActive: {
    backgroundColor: colors.primary,
  },
  audienceChipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  audienceChipTextActive: {
    color: colors.white,
  },
  audienceHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  state: { marginTop: spacing.lg },
  stateText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  plans: {
    gap: spacing.sm,
  },
  planCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    gap: 2,
    alignItems: 'center',
  },
  planPrice: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
  },
  planTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.neutral,
  },
  planTitleSelected: {
    color: colors.white,
  },
  planSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  planSubSelected: {
    color: 'rgba(255,255,255,0.85)',
  },
  cta: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  fineprint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
});
