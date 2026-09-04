import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  LANGUAGE_LABELS,
  LEAGUES,
  LEAGUE_LABELS,
  LEARNING_LEVELS,
  LEARNING_LEVEL_LABELS,
} from '@lexiroot/shared';
import type {
  LanguageCode,
  LeaderboardRow,
  League,
  LearningLevel,
} from '@lexiroot/shared';
import { UserAvatar } from '../src/components/ui/UserAvatar';
import { colors, fonts, radius, spacing } from '../src/constants/theme';
import {
  useFriendsLeaderboardQuery,
  useInviteFriendMutation,
} from '../src/services/friendsApi';
import {
  useFamilyLeaderboardQuery,
  useLeaderboardQuery,
} from '../src/services/leaderboardApi';
import { apiErrorMessage } from '../src/utils/apiError';
import { useAppSelector } from '../src/store/hooks';

type Board = 'weekly' | 'friends' | 'family';

/** Medal colour for the top three; everyone else gets a plain number. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MEDALS: Record<number, string> = {
  1: colors.tertiary,
  2: '#B9BEC4',
  3: colors.secondary,
};

/** "4d 12h 34m" from milliseconds. Drops empty leading units. */
function formatCountdown(ms: number): string {
  if (ms <= 0) return 'resetting…';
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/** "May 11 – May 17" from two ISO dates. */
function formatRange(startsOn: string, endsOn: string): string {
  const opts = { month: 'short', day: 'numeric', timeZone: 'UTC' } as const;
  const start = new Date(`${startsOn}T00:00:00Z`).toLocaleDateString('en-US', opts);
  const end = new Date(`${endsOn}T00:00:00Z`).toLocaleDateString('en-US', opts);
  return `${start} – ${end}`;
}

export default function LeaderboardTab() {
  const user = useAppSelector((s) => s.auth.user);
  const [board, setBoard] = useState<Board>('weekly');
  const [language, setLanguage] = useState<LanguageCode | undefined>();
  const [level, setLevel] = useState<LearningLevel | undefined>();
  const [league, setLeague] = useState<League | undefined>();

  const weekly = useLeaderboardQuery({ language, level, league });
  // Only fetched once the family board is actually being looked at — most
  // learners aren't on a family plan and would never use the response.
  const family = useFamilyLeaderboardQuery(undefined, { skip: board !== 'family' });
  const friends = useFriendsLeaderboardQuery(undefined, { skip: board !== 'friends' });
  const [inviteFriend, { isLoading: inviting }] = useInviteFriendMutation();

  const period = weekly.data?.period ?? friends.data?.period ?? family.data?.period ?? null;

  // Ticks locally so the countdown moves between refetches, rather than sitting
  // frozen on whatever the last response happened to say.
  const [now, setNow] = useState(() => Date.now());
  const [anchor, setAnchor] = useState(() => Date.now());
  useEffect(() => {
    setAnchor(Date.now());
    setNow(Date.now());
  }, [period?.resetsInMs]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const resetsIn = period ? Math.max(0, period.resetsInMs - (now - anchor)) : 0;

  const rows =
    board === 'weekly'
      ? (weekly.data?.rows ?? [])
      : board === 'friends'
        ? (friends.data?.rows ?? [])
        : (family.data?.rows ?? []);
  const me = weekly.data?.me ?? null;
  const loading =
    board === 'weekly'
      ? weekly.isLoading
      : board === 'friends'
        ? friends.isLoading
        : family.isLoading;

  /**
   * Invite someone by email.
   *
   * An inline field rather than `Alert.prompt`, which exists only on iOS — that
   * would have left every Android learner unable to invite anyone, silently.
   */
  const [inviteEmail, setInviteEmail] = useState('');
  async function handleInviteFriend() {
    const value = inviteEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(value)) {
      Alert.alert('Check the email', 'Enter a valid email address to send an invitation.');
      return;
    }
    try {
      await inviteFriend({ email: value }).unwrap();
      setInviteEmail('');
      Alert.alert('Invitation sent', `We've emailed ${value} an invitation.`);
    } catch (err) {
      Alert.alert('Could not invite', apiErrorMessage(err));
    }
  }

  // The learner's own row, pinned below the list when they placed outside it —
  // the one rank a person always wants to see is their own.
  const myRowInList = rows.some((r) => r.isMe);
  const myPinnedRow: LeaderboardRow | null = useMemo(() => {
    if (myRowInList || !me || me.rank === null || !user) return null;
    return {
      rank: me.rank,
      userId: user.id,
      displayName: 'You',
      avatarUrl: user.avatarUrl ?? null,
      rootPoints: me.rootPoints,
      currentStreakDays: me.currentStreakDays,
      isMe: true,
    };
  }, [myRowInList, me, user]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
            </Pressable>
            <Text style={styles.title}>Leaderboard</Text>
          </View>
          {period ? (
            <View style={styles.weekChip}>
              <Text style={styles.weekNumber}>Week {period.weekNumber}</Text>
              <Text style={styles.weekRange}>{formatRange(period.startsOn, period.endsOn)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Compete. Learn. Grow Together.</Text>
          <Text style={styles.heroBody}>
            Earn Root Points by learning and mastering your language every day.
          </Text>
        </View>

        <View style={styles.segment}>
          <SegmentButton
            label="Weekly"
            active={board === 'weekly'}
            onPress={() => setBoard('weekly')}
          />
          <SegmentButton
            label="Friends"
            active={board === 'friends'}
            onPress={() => setBoard('friends')}
          />
          <SegmentButton
            label="Family"
            active={board === 'family'}
            onPress={() => setBoard('family')}
          />
        </View>

        {board === 'weekly' ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}
            >
              <FilterChip
                label={language ? LANGUAGE_LABELS[language] : 'All languages'}
                onPress={() =>
                  setLanguage((current) => cycle(current, [...LANGUAGE_CODES_IN_USE]))
                }
              />
              <FilterChip
                label={level ? LEARNING_LEVEL_LABELS[level] : 'All levels'}
                onPress={() => setLevel((current) => cycle(current, [...LEARNING_LEVELS]))}
              />
              <FilterChip
                label={LEAGUE_LABELS[league ?? weekly.data?.league ?? 'bronze']}
                tone="primary"
                onPress={() => setLeague((current) => cycle(current, [...LEAGUES]))}
              />
            </ScrollView>
            {period ? (
              <Text style={styles.countdown}>League resets in {formatCountdown(resetsIn)}</Text>
            ) : null}
          </>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.state} />
        ) : board === 'friends' && friends.data && !friends.data.enabled ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyBody}>
              Invite someone to compare Root Points each week. They only ever see your display name,
              streak and points.
            </Text>
            <InviteField
              value={inviteEmail}
              onChange={setInviteEmail}
              busy={inviting}
              onSubmit={handleInviteFriend}
            />
          </View>
        ) : board === 'family' && family.data && !family.data.enabled ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No family plan</Text>
            <Text style={styles.emptyBody}>
              A family plan puts everyone in your household on one board, whatever language they're
              learning.
            </Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nobody has scored yet</Text>
            <Text style={styles.emptyBody}>
              Finish a lesson to earn your first Root Points and open this week's board.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {rows.map((row) => (
              <Row key={row.userId} row={row} />
            ))}
            {board === 'friends' ? (
              <InviteField
                value={inviteEmail}
                onChange={setInviteEmail}
                busy={inviting}
                onSubmit={handleInviteFriend}
              />
            ) : null}
            {myPinnedRow ? (
              <>
                <Text style={styles.pinnedHint}>Your position</Text>
                <Row row={myPinnedRow} delta={me?.rankDelta ?? null} />
              </>
            ) : null}
          </View>
        )}

        {board === 'weekly' && me ? (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Your Progress This Week</Text>
            <View style={styles.progressRow}>
              <Stat value={me.rootPoints.toLocaleString('en-US')} label="Root Points" />
              <Stat value={String(me.lessonsCompleted)} label="Lessons" />
              <Stat value={`${me.masteryScore}%`} label="Mastery" />
              <Stat value={`${me.currentStreakDays}`} label="Day streak" />
            </View>
            {me.nextMilestone !== null ? (
              <View style={styles.milestone}>
                <Text style={styles.milestoneValue}>
                  {me.nextMilestone.toLocaleString('en-US')} RP
                </Text>
                <Text style={styles.milestoneLabel}>
                  {me.rpToNextMilestone} RP to your next milestone
                </Text>
              </View>
            ) : null}
            {me.optedOut ? (
              <Text style={styles.optedOut}>
                You're hidden from public boards. Your points and streak still count — turn this off
                in Profile to appear again.
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Languages offered in the filter. Kept local — the picker is cosmetic. */
const LANGUAGE_CODES_IN_USE: LanguageCode[] = ['yo', 'ig', 'ha'];

/** Steps a filter through undefined → each option → undefined again. */
function cycle<T>(current: T | undefined, options: T[]): T | undefined {
  if (current === undefined) return options[0];
  const next = options.indexOf(current) + 1;
  return next >= options.length ? undefined : options[next];
}

function Row({ row, delta }: { row: LeaderboardRow; delta?: number | null }) {
  const medal = MEDALS[row.rank];
  return (
    <View style={[styles.row, row.isMe && styles.rowMe]}>
      <View style={[styles.rankBadge, medal ? { backgroundColor: medal } : null]}>
        <Text style={[styles.rankText, medal ? styles.rankTextMedal : null]}>{row.rank}</Text>
      </View>
      <UserAvatar name={row.displayName} avatarUrl={row.avatarUrl} size={40} />
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {row.displayName}
        </Text>
        <Text style={styles.rowStreak}>🔥 {row.currentStreakDays}-day streak</Text>
      </View>
      <View style={styles.rowScore}>
        <Text style={styles.rowPoints}>{row.rootPoints.toLocaleString('en-US')}</Text>
        {delta ? (
          <Text style={[styles.rowDelta, delta > 0 ? styles.deltaUp : styles.deltaDown]}>
            {delta > 0 ? `↑ ${delta}` : `↓ ${Math.abs(delta)}`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function InviteField({
  value,
  onChange,
  busy,
  onSubmit,
}: {
  value: string;
  onChange: (next: string) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.inviteBlock}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="their@email.com"
        placeholderTextColor={colors.neutralVariant}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        returnKeyType="send"
        onSubmitEditing={onSubmit}
        style={styles.inviteInput}
      />
      <Pressable
        disabled={busy || value.trim().length === 0}
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.inviteBtn,
          (busy || value.trim().length === 0) && styles.inviteBtnDisabled,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Ionicons name="person-add-outline" size={16} color={colors.white} />
        <Text style={styles.inviteBtnLabel}>{busy ? 'Sending…' : 'Invite'}</Text>
      </Pressable>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function FilterChip({
  label,
  onPress,
  tone,
}: {
  label: string;
  onPress: () => void;
  tone?: 'primary';
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, tone === 'primary' && styles.chipPrimary]}>
      <Text style={[styles.chipLabel, tone === 'primary' && styles.chipLabelPrimary]}>{label}</Text>
      <Ionicons
        name="chevron-down"
        size={14}
        color={tone === 'primary' ? colors.primary : colors.neutralVariant}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.neutral },
  weekChip: {
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  weekNumber: { fontFamily: fonts.bold, fontSize: 12, color: colors.neutral },
  weekRange: { fontFamily: fonts.regular, fontSize: 11, color: colors.neutralVariant },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  heroTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.white },
  heroBody: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.92)' },
  segment: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    padding: 4,
    alignSelf: 'flex-start',
  },
  segmentBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  segmentLabelActive: { color: colors.white },
  filters: { gap: spacing.sm, paddingRight: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  chipPrimary: { borderColor: colors.primaryBorder, backgroundColor: colors.primarySofter },
  chipLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.neutral },
  chipLabelPrimary: { color: colors.primary },
  countdown: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.success,
    textAlign: 'right',
  },
  state: { marginTop: spacing.xl },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowMe: { borderColor: colors.primaryBorder, backgroundColor: colors.primarySofter },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  rankText: { fontFamily: fonts.bold, fontSize: 13, color: colors.neutral },
  rankTextMedal: { color: colors.white },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { fontFamily: fonts.bold, fontSize: 14, color: colors.neutral },
  rowStreak: { fontFamily: fonts.regular, fontSize: 11, color: colors.neutralVariant, marginTop: 2 },
  rowScore: { alignItems: 'flex-end' },
  rowPoints: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.success },
  rowDelta: { fontFamily: fonts.semibold, fontSize: 11, marginTop: 2 },
  deltaUp: { color: colors.success },
  deltaDown: { color: colors.error },
  pinnedHint: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.neutralVariant,
    marginTop: spacing.sm,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    backgroundColor: colors.white,
  },
  emptyTitle: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.neutral },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.neutralVariant,
    lineHeight: 19,
  },
  inviteBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  inviteInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.neutral,
    backgroundColor: colors.white,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  inviteBtnDisabled: { opacity: 0.5 },
  inviteBtnLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  progressCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.white,
  },
  progressTitle: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.neutral },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'flex-start', flex: 1 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.success },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.neutralVariant },
  milestone: {
    backgroundColor: colors.successSurface,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  milestoneValue: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.success },
  milestoneLabel: { fontFamily: fonts.regular, fontSize: 11, color: colors.neutralVariant },
  optedOut: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.neutralVariant,
    lineHeight: 16,
  },
});
