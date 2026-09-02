import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
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
  // A downgrade already agreed but not yet in force. Named here so the screen
  // says what will happen rather than leaving the learner to wonder whether
  // their request took.
  const pendingPlanName = useMemo(
    () => plans?.find((p) => p.id === sub?.pendingPlanId)?.name ?? null,
    [plans, sub?.pendingPlanId],
  );

  const onFreePlan = !sub || !sub.entitled;
  const isCancelling = sub?.status === 'CANCELED' || !!sub?.cancelsOn;
  const isPastDue = sub?.status === 'PAST_DUE';
  const isAppleIap = sub?.provider === 'apple_iap';

  // Apple gives no server-side cancel API — only the subscriber can cancel,
  // via their device's Settings > [name] > Subscriptions. Deep link there
  // instead of calling an endpoint that would just reject the request.
  const handleManageOnApple = () => {
    Linking.openURL('itms-apps://apps.apple.com/account/subscriptions').catch(() => {
      Alert.alert('Could not open Subscriptions', 'Open Settings > [your name] > Subscriptions to manage this plan.');
    });
  };

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

            {pendingPlanName ? (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Switching to</Text>
                <Text style={styles.statusValue}>
                  {pendingPlanName}
                  {sub?.pendingPlanEffectiveAt
                    ? ` · ${formatDate(sub.pendingPlanEffectiveAt)}`
                    : ''}
                </Text>
              </View>
            ) : null}

            {/* Offered before cancelling: someone whose plan is too big or too
                small is better served by switching than by leaving, and this is
                the screen they arrive at to do something about it. */}
            {!isCancelling ? (
              <Button
                label={pendingPlanName ? 'Change scheduled plan' : 'Change plan'}
                variant="outline"
                onPress={() => router.push('/change-plan' as never)}
              />
            ) : null}

            {isCancelling ? (
              <Text style={styles.note}>
                Your plan is set to cancel. You can keep learning until access ends.
              </Text>
            ) : isAppleIap ? (
              <Button label="Manage in Subscriptions" variant="outline" onPress={handleManageOnApple} />
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
