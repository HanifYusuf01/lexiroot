import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HeroCard } from '../../src/components/dashboard/HeroCard';
import { LessonCardActive } from '../../src/components/dashboard/LessonCardActive';
import { LessonCardLocked } from '../../src/components/dashboard/LessonCardLocked';
import { StreakBadge } from '../../src/components/dashboard/StreakBadge';
import { WeekDots } from '../../src/components/dashboard/WeekDots';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { useAppSelector } from '../../src/store/hooks';

export default function Home() {
  const user = useAppSelector((s) => s.auth.user);
  const firstName = user?.displayName?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Ẹ káàbọ̀, {firstName}</Text>
            <Text style={styles.subtitle}>You&apos;re on a roll!</Text>
          </View>
          <StreakBadge days={5} />
        </View>

        <View style={styles.weekWrap}>
          <WeekDots currentDay={5} />
        </View>

        <View style={styles.heroWrap}>
          <HeroCard />
        </View>

        <Text style={styles.sectionTitle}>Jump back in</Text>

        <View style={styles.lessons}>
          <LessonCardActive
            level={1}
            title="Basics"
            currentXp={30}
            targetXp={180}
            xpPerLesson={20}
          />
          <LessonCardLocked level={2} unlockAt={180} />
        </View>

        <Pressable style={styles.viewAll} hitSlop={8}>
          <Text style={styles.viewAllText}>View all levels</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.neutral} />
        </Pressable>
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
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
  weekWrap: {
    paddingVertical: spacing.xs,
  },
  heroWrap: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.neutral,
    marginTop: spacing.xs,
  },
  lessons: {
    gap: spacing.sm,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  viewAllText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
});
