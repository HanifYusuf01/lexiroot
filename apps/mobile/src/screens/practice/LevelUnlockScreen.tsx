import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface LevelUnlockScreenProps {
  headline: string;
  description: string;
  onContinue: () => void;
  onClose?: () => void;
}

export function LevelUnlockScreen({
  headline,
  description,
  onContinue,
  onClose,
}: LevelUnlockScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.neutral} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.titleSmall}>You just Unlocked a new Level!</Text>
        <View style={styles.padlock}>
          <Ionicons name="lock-open" size={88} color={colors.warning} />
        </View>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.description}>{description}</Text>
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
  titleSmall: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
  },
  padlock: {
    marginVertical: spacing.lg,
  },
  headline: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    color: colors.primary,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
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
