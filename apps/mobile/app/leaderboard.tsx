import { useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { LeaderboardEntry } from '@lexiroot/shared';
import { useGetLeaderboardQuery } from '../src/services/gamificationApi';
import { useAppSelector } from '../src/store/hooks';
import { UserAvatar } from '../src/components/ui/UserAvatar';
import { colors, fonts, radius, spacing } from '../src/constants/theme';
import { formatNumber } from '../src/utils/format';

const { width: screenWidth } = Dimensions.get('window');
const podiumWidth = Math.min(screenWidth, 430);

export default function LeaderboardScreen() {
  const router = useRouter();
  const me = useAppSelector((s) => s.auth.user);
  const { data, isLoading } = useGetLeaderboardQuery({ page: 1, limit: 50 });

  const podium = useMemo(() => {
    const items = data?.items ?? [];
    // Podium order: #2 left, #1 center, #3 right, matching the screenshot.
    return {
      first: items[0],
      second: items[1],
      third: items[2],
    };
  }, [data?.items]);
  const rest = useMemo(() => data?.items.slice(3) ?? [], [data?.items]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.neutral} />
        </Pressable>
        <Text style={styles.title}>leaderboard</Text>
        <View style={styles.closeBtn} />
      </View>

      {isLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.podiumStage}>
            <Podium first={podium.first} second={podium.second} third={podium.third} />
          </View>

          <View style={styles.sheet}>
            <Text style={styles.sectionTitle}>Top Rankings</Text>
            <Text style={styles.sectionSubtitle}>
              The highest-ranking learners based on XP earned.
            </Text>

            <View style={styles.list}>
              {rest.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isMe={entry.userId === me?.id}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

interface PodiumProps {
  first?: LeaderboardEntry;
  second?: LeaderboardEntry;
  third?: LeaderboardEntry;
}

function Podium({ first, second, third }: PodiumProps) {
  return (
    <View style={styles.podium}>
      <PodiumColumn entry={second} place={2} variant="left" />
      <PodiumColumn entry={first} place={1} variant="center" />
      <PodiumColumn entry={third} place={3} variant="right" />
    </View>
  );
}

function PodiumColumn({
  entry,
  place,
  variant,
}: {
  entry?: LeaderboardEntry;
  place: number;
  variant: 'left' | 'center' | 'right';
}) {
  const isCenter = variant === 'center';
  const columnStyle =
    variant === 'left'
      ? styles.colLeft
      : variant === 'right'
        ? styles.colRight
        : styles.colCenter;
  const bodyStyle =
    variant === 'left'
      ? styles.bodyLeft
      : variant === 'right'
        ? styles.bodyRight
        : styles.bodyCenter;

  return (
    <View style={[styles.podiumColumn, columnStyle]}>
      {entry ? (
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <UserAvatar
              name={entry.displayName}
              avatarUrl={entry.avatarUrl}
              size={isCenter ? 54 : 48}
            />
          </View>
          <RankBadge rank={place} size={isCenter ? 26 : 24} style={styles.avatarRankBadge} />
        </View>
      ) : null}
      <View style={[styles.body, bodyStyle]}>
        <View style={styles.bodyLip} />
        <Text
          style={styles.bodyXp}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {entry ? formatNumber(entry.xp) : '0'} XP
        </Text>
        <Text
          style={styles.bodyName}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {entry?.displayName ?? 'Learner'}
        </Text>
      </View>
    </View>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <View style={styles.rowAvatar}>
        <UserAvatar name={entry.displayName} avatarUrl={entry.avatarUrl} size={40} />
        <RankBadge rank={entry.rank} size={22} style={styles.rowRankBadge} />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.displayName}
          {isMe ? <Text style={styles.rowMeTag}>  (you)</Text> : null}
        </Text>
        {entry.country ? <Text style={styles.rowMeta}>{entry.country}</Text> : null}
      </View>
      <View style={styles.rowXp}>
        <Text style={styles.rowXpValue}>{formatNumber(entry.xp)}</Text>
        <Text style={styles.rowXpLabel}>XP</Text>
      </View>
    </View>
  );
}

function RankBadge({
  rank,
  size,
  style,
}: {
  rank: number;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  const badgeColor =
    rank === 1
      ? '#FFB400'
      : rank === 2
        ? '#20B958'
        : rank === 3
          ? '#6C3FC5'
          : colors.primary;
  return (
    <View
      style={[
        styles.rankBadge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: badgeColor,
        },
        style,
      ]}
    >
      <Text style={[styles.rankBadgeText, { fontSize: Math.max(11, Math.round(size * 0.5)) }]}>
        {rank}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FCE4E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 14,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.black,
    fontSize: 30,
    color: colors.primary,
  },
  loadingBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroller: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  podiumStage: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  podium: {
    width: podiumWidth,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  podiumColumn: {
    alignItems: 'center',
  },
  colLeft: {
    width: 112,
    zIndex: 1,
  },
  colRight: {
    width: 112,
    zIndex: 1,
  },
  colCenter: {
    width: 126,
    marginHorizontal: -10,
    zIndex: 3,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -16,
    zIndex: 5,
  },
  avatarRing: {
    padding: 3,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: '#2C8CCB',
  },
  avatarRankBadge: {
    position: 'absolute',
    left: -6,
    top: -6,
    borderWidth: 2,
    borderColor: colors.white,
    zIndex: 6,
  },
  body: {
    width: '100%',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  bodyCenter: {
    height: 158,
  },
  bodyLeft: {
    height: 122,
  },
  bodyRight: {
    height: 106,
  },
  bodyLip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#B23A22',
  },
  bodyXp: {
    fontFamily: fonts.black,
    fontSize: 16,
    color: '#FFD43B',
    textAlign: 'center',
  },
  bodyName: {
    fontFamily: fonts.black,
    fontSize: 15,
    color: '#FFD43B',
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 112,
  },
  sheet: {
    flex: 1,
    minHeight: 620,
    marginTop: -20,
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 24,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: '#0E1F2A',
    paddingHorizontal: 22,
  },
  sectionSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.neutralVariant,
    paddingHorizontal: 22,
    marginTop: 4,
    marginBottom: 18,
  },
  list: {
    paddingHorizontal: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
  },
  rowMe: {
    backgroundColor: colors.primarySofter,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
  },
  rowAvatar: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  rowRankBadge: {
    position: 'absolute',
    left: -3,
    top: -2,
    borderWidth: 1,
    borderColor: colors.white,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: '#10212B',
  },
  rowMeTag: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
  },
  rowMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#A3A0A0',
    marginTop: 2,
  },
  rowXp: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: '#FCE9E6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 7,
  },
  rowXpValue: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.primary,
  },
  rowXpLabel: {
    fontFamily: fonts.black,
    fontSize: 13,
    color: colors.primary,
  },
  rankBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontFamily: fonts.extrabold,
    color: colors.white,
    lineHeight: 18,
  },
});
