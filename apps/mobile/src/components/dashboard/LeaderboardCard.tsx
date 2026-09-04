import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LEAGUE_LABELS } from '@lexiroot/shared';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useLeaderboardQuery } from '../../services/leaderboardApi';

/** "4d left" / "12h left" — coarse on purpose; the screen itself is precise. */
function shortCountdown(ms: number): string {
  if (ms <= 0) return 'resetting';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d left`;
  if (hours >= 1) return `${hours}h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
}

/**
 * The learner's weekly standing, on Home.
 *
 * The leaderboard sits here rather than in the tab bar: it is somewhere you
 * look once a day, not a place you navigate between constantly, and a sixth tab
 * in a five-tab pill made every destination harder to hit. A card can also show
 * the thing a tab icon can't — where you actually stand right now, which is the
 * only reason to open it.
 */
export function LeaderboardCard() {
  // One row is all this needs; the full board is fetched by the screen itself.
  const { data, isLoading } = useLeaderboardQuery({ limit: 1 });
  const me = data?.me;

  if (isLoading || !me) return null;

  const hasRank = me.rank !== null;

  return (
    <Pressable
      onPress={() => router.push('/leaderboard')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Ionicons name="trophy" size={22} color={colors.tertiary} />
      </View>

      <View style={styles.text}>
        <Text style={styles.title}>
          {hasRank ? `You're #${me.rank} this week` : 'Join this week’s leaderboard'}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {hasRank
            ? `${me.rootPoints.toLocaleString('en-US')} RP · ${LEAGUE_LABELS[me.league]}`
            : 'Finish a lesson to earn your first Root Points'}
        </Text>
      </View>

      <View style={styles.right}>
        {data?.period ? (
          <Text style={styles.countdown}>{shortCountdown(data.period.resetsInMs)}</Text>
        ) : null}
        {me.rankDelta ? (
          <Text style={[styles.delta, me.rankDelta > 0 ? styles.up : styles.down]}>
            {me.rankDelta > 0 ? `↑ ${me.rankDelta}` : `↓ ${Math.abs(me.rankDelta)}`}
          </Text>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.neutralVariant} />
        )}
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
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySofter,
  },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.neutral },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    marginTop: 2,
  },
  right: { alignItems: 'flex-end', gap: 2 },
  countdown: { fontFamily: fonts.semibold, fontSize: 11, color: colors.neutralVariant },
  delta: { fontFamily: fonts.bold, fontSize: 12 },
  up: { color: colors.success },
  down: { color: colors.error },
});
