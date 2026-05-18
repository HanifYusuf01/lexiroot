import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StreakBadge } from '../../src/components/dashboard/StreakBadge';
import { Button } from '../../src/components/ui/Button';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { useAppSelector } from '../../src/store/hooks';
import { useListLessonsQuery, type LessonRow } from '../../src/services/lessonsApi';

const PRIMARY_TIER = 'beginner' as const;
const UNLOCK_THRESHOLDS = [0, 180, 360, 540, 720, 900, 1080, 1260];

export default function LevelsIndex() {
  const { data, isLoading } = useListLessonsQuery({ tier: PRIMARY_TIER, limit: 100 });
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';

  // Group lessons by level number — pick the first non-exercise lesson as the
  // level's title row.
  const levels = useMemo(() => {
    const lessons = data?.items ?? [];
    const byLevel = new Map<number, LessonRow[]>();
    for (const lesson of lessons) {
      const list = byLevel.get(lesson.level) ?? [];
      list.push(lesson);
      byLevel.set(lesson.level, list);
    }
    const entries = Array.from(byLevel.entries())
      .map(([level, list]) => {
        const content = list.find((l) => l.type !== 'exercise') ?? list[0];
        return { level, title: content?.title ?? `Level ${level}` };
      })
      .sort((a, b) => a.level - b.level);
    return entries;
  }, [data]);

  // For v1: first level unlocked, all others locked.
  const currentXp = 30;
  const currentLevel = 1;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.neutral} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Ẹ káàbọ̀, {firstName}</Text>
            <Text style={styles.subtitle}>You&apos;re on a roll!</Text>
          </View>
          <StreakBadge days={5} />
        </View>

        <View style={styles.dailyCard}>
          <View style={styles.dailyIcon}>
            <Ionicons name="trophy" size={20} color={colors.white} />
          </View>
          <View style={styles.dailyBody}>
            <Text style={styles.dailyTitle}>Daily Challenge</Text>
            <Text style={styles.dailySub}>3/5 exercises done</Text>
          </View>
          <View style={styles.dailyXp}>
            <Text style={styles.dailyXpText}>+50XP</Text>
          </View>
        </View>

        {isLoading ? (
          <Text style={styles.placeholder}>Loading levels…</Text>
        ) : levels.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.placeholder}>No levels available yet.</Text>
            <Button label="Back" variant="outline" onPress={() => router.back()} />
          </View>
        ) : (
          <View style={styles.levelList}>
            {levels.map((lvl) => {
              const unlocked = lvl.level <= currentLevel;
              const xpToUnlock = UNLOCK_THRESHOLDS[lvl.level - 1] ?? lvl.level * 180;
              return (
                <LevelRow
                  key={lvl.level}
                  level={lvl.level}
                  title={lvl.title}
                  unlocked={unlocked}
                  active={lvl.level === currentLevel}
                  currentXp={currentXp}
                  targetXp={UNLOCK_THRESHOLDS[lvl.level] ?? lvl.level * 180}
                  xpToUnlock={xpToUnlock}
                  onPress={() => {
                    if (!unlocked) return;
                    router.push(`/levels/${PRIMARY_TIER}/${lvl.level}` as never);
                  }}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface LevelRowProps {
  level: number;
  title: string;
  unlocked: boolean;
  active: boolean;
  currentXp: number;
  targetXp: number;
  xpToUnlock: number;
  onPress: () => void;
}

function LevelRow({
  level,
  title,
  unlocked,
  active,
  currentXp,
  targetXp,
  xpToUnlock,
  onPress,
}: LevelRowProps) {
  if (active) {
    const progress = Math.min(1, currentXp / targetXp);
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.activeCard, pressed && styles.pressed]}>
        <View style={styles.activeRow}>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Lvl {level}</Text>
          </View>
          <View style={styles.activeBody}>
            <Text style={styles.activeTitle}>{title}</Text>
            <Text style={styles.activeMeta}>Level {level}</Text>
          </View>
          <Text style={styles.activeXp}>
            {currentXp}/{targetXp} XP
          </Text>
        </View>
        <View style={styles.activeTrack}>
          <View style={[styles.activeFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.activeBonus}>
          <Ionicons name="star" size={12} color={colors.tertiary} />
          <Text style={styles.activeBonusText}>+10 XP after next lesson</Text>
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable disabled={!unlocked} onPress={onPress} style={styles.lockedCard}>
      <View style={styles.lockedBadge}>
        <Ionicons name="lock-closed" size={16} color={colors.neutralVariant} />
      </View>
      <View style={styles.lockedBody}>
        <Text style={styles.lockedTitle}>Lvl {level}</Text>
        <Text style={styles.lockedMeta}>Unlocks at {xpToUnlock} XP</Text>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.xs,
  },
  headerText: { flex: 1 },
  greeting: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.neutral,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    marginTop: 2,
  },
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dailyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyBody: { flex: 1 },
  dailyTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: colors.white,
  },
  dailySub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  dailyXp: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  dailyXpText: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    color: colors.primary,
  },
  placeholder: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  levelList: {
    gap: spacing.sm,
  },
  activeCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.85 },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activeBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.white,
  },
  activeBody: { flex: 1 },
  activeTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  activeMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
  },
  activeXp: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  activeTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  activeFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  activeBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeBonusText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.neutralVariant,
  },
  lockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  lockedBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedBody: { flex: 1 },
  lockedTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
  lockedMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
    marginTop: 2,
  },
});
