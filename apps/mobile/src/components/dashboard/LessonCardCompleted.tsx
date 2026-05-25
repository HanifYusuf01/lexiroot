import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface LessonCardCompletedProps {
  level: number;
  title: string;
  xpEarned: number;
  onPress?: () => void;
}

export function LessonCardCompleted({
  level,
  title,
  xpEarned,
  onPress,
}: LessonCardCompletedProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Lvl {level}</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.meta}>Completed · +{xpEarned} XP</Text>
        </View>
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
    backgroundColor: colors.successSurface,
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
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.white,
  },
  center: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.success,
  },
});
