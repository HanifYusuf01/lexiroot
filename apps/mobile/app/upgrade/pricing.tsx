import type { SubscriptionPlan } from '@lexiroot/shared';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { useSubscriptionPlansQuery } from '../../src/services/subscriptionPlansApi';
import { formatPrice } from '../../src/utils/format';

type Audience = 'individual' | 'family';

// Idle headline-price colour by position: orange, golden, chocolate.
const PRICE_COLORS = [colors.primary, colors.tertiary, colors.secondary];

export default function UpgradePricing() {
  const [audience, setAudience] = useState<Audience>('individual');
  const { data: plans, isLoading } = useSubscriptionPlansQuery();

  const visible = useMemo(
    () =>
      (plans ?? [])
        .filter((p) => p.scope === audience)
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

  // Selected card tint follows the audience: orange for Individual, brown for Family.
  const selectedTint = audience === 'family' ? colors.secondary : colors.primary;

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
            {visible.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedId === plan.id}
                tint={selectedTint}
                priceColor={PRICE_COLORS[Math.min(index, PRICE_COLORS.length - 1)]}
                onPress={() => setSelectedId(plan.id)}
              />
            ))}
          </View>
        )}

        <View style={styles.cta}>
          <Button
            label="Start 7-day free trial"
            disabled={selectedId === null}
            onPress={() => {
              // TODO: hand off to billing flow with the selected plan id.
              router.dismissAll();
            }}
          />
          <Text style={styles.fineprint}>You won&apos;t be charged until your trial ends.</Text>
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
  selected,
  tint,
  priceColor,
  onPress,
}: {
  plan: SubscriptionPlan;
  selected: boolean;
  tint: string;
  priceColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.planCard,
        selected
          ? [styles.planCardSelected, { backgroundColor: tint, borderColor: tint }]
          : styles.planCardIdle,
      ]}
    >
      <Text style={[styles.planPrice, { color: selected ? colors.tertiary : priceColor }]}>
        {formatPrice(plan.price)}
      </Text>
      <Text style={[styles.planTitle, selected && styles.planTitleSelected]}>{plan.name}</Text>
      <Text style={[styles.planSub, selected && styles.planSubSelected]}>
        {plan.total != null
          ? `${formatPrice(plan.total)} billed per ${plan.period.toLowerCase()}`
          : `Billed per ${plan.period.toLowerCase()}`}
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
  planCardIdle: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.white,
  },
  planCardSelected: {
    // backgroundColor / borderColor supplied inline via the audience tint.
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
