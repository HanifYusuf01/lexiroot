import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';

type Audience = 'individual' | 'family';
type PlanKey = 'monthly' | 'quarterly' | 'yearly';

const PLANS: Array<{ key: PlanKey; price: string; title: string; sub: string }> = [
  { key: 'monthly', price: '$20', title: 'Monthly Plan', sub: 'Flexible, cancel anytime' },
  {
    key: 'quarterly',
    price: '$55',
    title: 'Quarterly Plan',
    sub: 'Commit quarterly, save over monthly',
  },
  {
    key: 'yearly',
    price: '$220',
    title: 'Yearly Plan',
    sub: 'Best Value for long-term learning',
  },
];

export default function UpgradePricing() {
  const [audience, setAudience] = useState<Audience>('individual');
  const [selected, setSelected] = useState<PlanKey>('quarterly');

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

        <View style={styles.plans}>
          {PLANS.map((p) => (
            <PlanCard
              key={p.key}
              price={p.price}
              title={p.title}
              sub={p.sub}
              selected={selected === p.key}
              onPress={() => setSelected(p.key)}
            />
          ))}
        </View>

        <View style={styles.cta}>
          <Button
            label="Start 7-day free trial"
            onPress={() => {
              // TODO: hand off to billing flow
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
    <Pressable
      onPress={onPress}
      style={[styles.audienceChip, active && styles.audienceChipActive]}
    >
      <Text style={[styles.audienceChipText, active && styles.audienceChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function PlanCard({
  price,
  title,
  sub,
  selected,
  onPress,
}: {
  price: string;
  title: string;
  sub: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.planCard, selected ? styles.planCardSelected : styles.planCardIdle]}
    >
      <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>{price}</Text>
      <Text style={[styles.planTitle, selected && styles.planTitleSelected]}>{title}</Text>
      <Text style={[styles.planSub, selected && styles.planSubSelected]}>{sub}</Text>
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
    fontSize: 26,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  audienceWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    padding: 4,
    alignSelf: 'flex-start',
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
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  planPrice: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.neutral,
  },
  planPriceSelected: {
    color: colors.white,
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
