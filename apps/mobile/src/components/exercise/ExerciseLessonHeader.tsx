import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, type SkillTheme } from '../../constants/theme';

interface ExerciseLessonHeaderProps {
  title: string;
  level: number;
  /** When provided, shows a speed multiplier badge (e.g. "1x") on the right. */
  speedBadge?: string;
  /** Theme tint for the speed badge border/text. */
  theme?: SkillTheme;
  onSpeedPress?: () => void;
}

export function ExerciseLessonHeader({
  title,
  level,
  speedBadge,
  theme,
  onSpeedPress,
}: ExerciseLessonHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Lvl {level}</Text>
      </View>
      {speedBadge ? (
        <Pressable
          onPress={onSpeedPress}
          style={[
            styles.badge,
            {
              borderColor: theme?.main ?? colors.primary,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: theme?.main ?? colors.primary }]}>
            {speedBadge}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    gap: 2,
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
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
  },
});
