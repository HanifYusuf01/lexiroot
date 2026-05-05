import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface LessonCardLockedProps {
  level: number;
  unlockAt: number;
  onPress?: () => void;
}

export function LessonCardLocked({ level, unlockAt, onPress }: LessonCardLockedProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.badge}>
        <Ionicons name="lock-closed" size={20} color={colors.neutralVariant} />
      </View>
      <View style={styles.center}>
        <Text style={styles.title}>Lvl {level}</Text>
        <Text style={styles.subtitle}>Unlocks at {unlockAt} XP</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.neutralVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralVariant,
  },
});
