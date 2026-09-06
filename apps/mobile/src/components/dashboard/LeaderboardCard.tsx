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
      {/* A soft corner wash so the card reads as a feature rather than a row. */}
      <View style={styles.corner} />

      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="trophy" size={14} color={colors.tertiary} />
          <Text style={styles.badgeText}>{LEAGUE_LABELS[me.league].toUpperCase()}</Text>
        </View>
        {data?.period ? (
          <Text style={styles.countdown}>{shortCountdown(data.period.resetsInMs)}</Text>
        ) : null}
      </View>

      <View style={styles.main}>
        <View style={styles.rankBlock}>
          <Text style={styles.rankValue}>{hasRank ? `#${me.rank}` : '—'}</Text>
          <Text style={styles.rankLabel}>this week</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.pointsBlock}>
          <Text style={styles.pointsValue}>{me.rootPoints.toLocaleString('en-US')}</Text>
          <Text style={styles.pointsLabel}>Root Points</Text>
        </View>

        {me.rankDelta ? (
          <View
            style={[styles.deltaPill, me.rankDelta > 0 ? styles.deltaPillUp : styles.deltaPillDown]}
          >
            <Ionicons
              name={me.rankDelta > 0 ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={me.rankDelta > 0 ? colors.success : colors.error}
            />
            <Text style={[styles.deltaText, me.rankDelta > 0 ? styles.up : styles.down]}>
              {Math.abs(me.rankDelta)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Progress to the next milestone — the reason to come back today. */}
      {me.nextMilestone !== null && me.rpToNextMilestone !== null ? (
        <View style={styles.progressWrap}>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.min(
                    100,
                    Math.max(4, Math.round((me.rootPoints / me.nextMilestone) * 100)),
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {hasRank
              ? `${me.rpToNextMilestone} RP to ${me.nextMilestone.toLocaleString('en-US')}`
              : 'Finish a lesson to get on the board'}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerLink}>View leaderboard</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  pressed: { opacity: 0.9 },
  corner: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.primarySofter,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
  },
  badgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: colors.primary,
  },
  countdown: { fontFamily: fonts.semibold, fontSize: 11, color: colors.neutralVariant },
  main: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rankBlock: { alignItems: 'flex-start' },
  rankValue: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.primary, lineHeight: 34 },
  rankLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.neutralVariant },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginVertical: 4 },
  pointsBlock: { flex: 1 },
  pointsValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.success },
  pointsLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.neutralVariant },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  deltaPillUp: { backgroundColor: colors.successSurface },
  deltaPillDown: { backgroundColor: colors.errorSurface },
  deltaText: { fontFamily: fonts.extrabold, fontSize: 12 },
  up: { color: colors.success },
  down: { color: colors.error },
  progressWrap: { gap: 4 },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: radius.full, backgroundColor: colors.primary },
  progressLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.neutralVariant },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  footerLink: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
});
