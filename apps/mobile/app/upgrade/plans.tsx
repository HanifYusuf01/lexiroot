import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';

type PlanChoice = 'free' | 'premium';

const FREE_FEATURES = [
  'Limited daily lessons',
  'Basic pronunciation practice',
  'Access to selected stories',
];

const PREMIUM_FEATURES = [
  'Unlimited lessons',
  'Advanced speech & tone feedback',
  'Full cultural library (stories, proverbs, traditions)',
  'Faster progress tracking',
];

export default function UpgradePlans() {
  const [selected, setSelected] = useState<PlanChoice | null>(null);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.closeRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.neutral} />
          </Pressable>
        </View>
        <Text style={styles.heading}>Choose how you{'\n'}want to learn</Text>

        <Pressable
          onPress={() => setSelected('free')}
          style={[
            styles.planCard,
            styles.planCardFree,
            selected === 'free' && styles.planCardSelected,
          ]}
        >
          <Text style={styles.planTitle}>Free Plan</Text>
          {FREE_FEATURES.map((feature) => (
            <FeatureRow key={feature} label={feature} accent={colors.primary} />
          ))}
        </Pressable>

        <Pressable
          onPress={() => setSelected('premium')}
          style={[
            styles.planCard,
            styles.planCardPremium,
            selected === 'premium' && styles.planCardSelected,
          ]}
        >
          <Text style={styles.planTitle}>Premium Plan</Text>
          {PREMIUM_FEATURES.map((feature) => (
            <FeatureRow key={feature} label={feature} emoji="👑" />
          ))}
        </Pressable>

        <View style={styles.cta}>
          <Button
            label="Start Free Trial"
            disabled={selected === null}
            onPress={() => router.push('/upgrade/pricing' as never)}
          />
          <Text style={styles.fineprint}>Most learners choose Premium for faster progress</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({
  label,
  accent,
  emoji,
}: {
  label: string;
  accent?: string;
  emoji?: string;
}) {
  return (
    <View style={styles.featureRow}>
      {emoji ? (
        <Text style={styles.featureEmoji}>{emoji}</Text>
      ) : (
        <View style={[styles.featureDot, { backgroundColor: accent }]} />
      )}
      <Text style={styles.featureText}>{label}</Text>
    </View>
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
    marginTop: spacing.md,
  },
  planCard: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm,
  },
  planCardFree: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.white,
  },
  planCardPremium: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  planCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2.5,
  },
  planTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureEmoji: {
    fontSize: 14,
  },
  featureText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutral,
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
