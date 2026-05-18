import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface LessonSuccessScreenProps {
  xpEarned: number;
  onContinue: () => void;
  onClose?: () => void;
}

export function LessonSuccessScreen({
  xpEarned,
  onContinue,
  onClose,
}: LessonSuccessScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.neutral} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Ionicons name="flash" size={120} color={colors.primary} />
        <Text style={styles.completed}>Lesson completed!</Text>
        <Text style={styles.xp}>+{xpEarned} XP</Text>
        <Text style={styles.encouragement}>Well done! You are making progress</Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <Text style={styles.btnText}>Continue</Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  completed: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.neutral,
    marginTop: spacing.lg,
  },
  xp: {
    fontFamily: fonts.extrabold,
    fontSize: 42,
    color: colors.primary,
  },
  encouragement: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
