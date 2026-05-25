import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExerciseTopBar } from '../../components/exercise/ExerciseTopBar';
import { MascotSadIcon } from '../../components/icons/MascotSadIcon';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface LessonFailureScreenProps {
  skillTitle: string;
  level: number;
  userName: string;
  correctCount: number;
  totalCount: number;
  xpEarned: number;
  xpTarget: number;
  progress: number;
  xpReward: number;
  onTryAgain: () => void;
  onClose?: () => void;
}

export function LessonFailureScreen({
  skillTitle,
  level,
  userName,
  correctCount,
  totalCount,
  xpEarned,
  xpTarget,
  progress,
  xpReward,
  onTryAgain,
  onClose,
}: LessonFailureScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topBarWrap}>
        <ExerciseTopBar progress={progress} xpReward={xpReward} onClose={onClose} />
      </View>
      <View style={styles.header}>
        <Text style={styles.title}>{skillTitle}</Text>
        <Text style={styles.subtitle}>Lvl {level}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.mascotRow}>
          <View style={styles.mascotBox}>
            <MascotSadIcon size={80} />
          </View>
          <View style={[styles.bubble, { borderColor: colors.primaryBorder }]}>
            <Text style={styles.bubbleText}>
              Almost there {userName}!{'\n'}You need to complete this lesson before unlocking the{' '}
              <Text style={styles.bubbleEmphasis}>next level.</Text>
            </Text>
          </View>
        </View>

        <View style={styles.statsBlock}>
          <Text style={styles.stat}>
            Questions Correct: {correctCount}/{totalCount}
          </Text>
          <Text style={styles.stat}>
            XP Earned: {xpEarned}/{xpTarget}
          </Text>
          <Text style={styles.stat}>
            Next Level: {correctCount}/{totalCount}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={onTryAgain}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Text style={styles.btnText}>Try again!</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBarWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: 4,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    color: colors.neutral,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  mascotBox: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bubble: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  bubbleText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutral,
    lineHeight: 19,
  },
  bubbleEmphasis: {
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  statsBlock: {
    gap: spacing.sm,
  },
  stat: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  btn: {
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  pressed: { opacity: 0.85 },
});
