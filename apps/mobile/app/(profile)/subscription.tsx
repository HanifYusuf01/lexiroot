import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { useSubscriptionPlansQuery } from '../../src/services/subscriptionPlansApi';
import {
  useCancelSubscriptionMutation,
  useMySubscriptionQuery,
} from '../../src/services/subscriptionsApi';
import { formatDate } from '../../src/utils/format';

export default function SubscriptionScreen() {
  const { data: sub, isLoading, refetch } = useMySubscriptionQuery();
  const { data: plans } = useSubscriptionPlansQuery();
  const [cancel, { isLoading: cancelling }] = useCancelSubscriptionMutation();

  const planName = useMemo(
    () => plans?.find((p) => p.id === sub?.planId)?.name ?? null,
    [plans, sub?.planId],
  );

  const onFreePlan = !sub || !sub.entitled;
  const isCancelling = sub?.status === 'CANCELED' || !!sub?.cancelsOn;
  const isPastDue = sub?.status === 'PAST_DUE';

  const handleCancel = () => {
    Alert.alert(
      'Cancel subscription?',
      "You'll keep access until the end of your current period.",
      [
        { text: 'Keep plan', style: 'cancel' },
        {
          text: 'Cancel plan',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancel().unwrap();
              refetch();
            } catch {
              Alert.alert('Could not cancel', 'Please try again in a moment.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Subscription" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.state} />
        ) : onFreePlan ? (
          <View style={styles.card}>
            <Text style={styles.planName}>Free plan</Text>
            <Text style={styles.body}>
              Upgrade to unlock all levels, richer cultural stories, and offline downloads.
            </Text>
            <Button label="See plans" onPress={() => router.push('/upgrade')} />
          </View>
        ) : (
          <View style={styles.card}>
            {isPastDue ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>
                  Your last payment failed. Update your payment method to keep your access.
                </Text>
              </View>
            ) : null}

            <Text style={styles.planName}>{planName ?? 'Premium'}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={styles.statusValue}>{sub?.statusText}</Text>
            </View>

            {isCancelling && sub?.cancelsOn ? (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Access until</Text>
                <Text style={styles.statusValue}>{formatDate(sub.cancelsOn)}</Text>
              </View>
            ) : sub?.renewsOn ? (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Renews on</Text>
                <Text style={styles.statusValue}>{formatDate(sub.renewsOn)}</Text>
              </View>
            ) : null}

            {isCancelling ? (
              <Text style={styles.note}>
                Your plan is set to cancel. You can keep learning until access ends.
              </Text>
            ) : (
              <Button
                label={cancelling ? 'Cancelling…' : 'Cancel subscription'}
                variant="outline"
                disabled={cancelling}
                onPress={handleCancel}
              />
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
  },
  state: {
    marginTop: spacing.xl,
  },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  planName: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.neutral,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
  },
  statusValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
  note: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
  },
  banner: {
    backgroundColor: colors.errorSurface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bannerText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.errorStrong,
  },
});
