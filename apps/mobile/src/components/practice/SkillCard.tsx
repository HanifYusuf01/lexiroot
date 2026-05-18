import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, type SkillTheme } from '../../constants/theme';
import { SkillIcon } from '../icons/SkillIcon';
import { ProgressRing } from './ProgressRing';

interface SkillCardProps {
  theme: SkillTheme;
  progress: number;
  onPress?: () => void;
}

export function SkillCard({ theme, progress, onPress }: SkillCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.main }]}>
          <SkillIcon skill={theme.key} color={theme.on} size={22} />
        </View>
        <ProgressRing progress={progress} color={theme.main} size={48} stroke={5} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {theme.title}
        </Text>
        <Text style={styles.level}>Level {theme.level}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutralSoft,
    gap: spacing.md,
    shadowColor: colors.black,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.9,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.neutral,
  },
  level: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.neutralVariant,
  },
});
