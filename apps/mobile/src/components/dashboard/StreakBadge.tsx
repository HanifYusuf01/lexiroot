import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface StreakBadgeProps {
  days: number;
}

export function StreakBadge({ days }: StreakBadgeProps) {
  return (
    <View style={styles.pill}>
      <Text style={styles.flame}>🔥</Text>
      <Text style={styles.label}>{days}-day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  flame: {
    fontSize: 14,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
});
