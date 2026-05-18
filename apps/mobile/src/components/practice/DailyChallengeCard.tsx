import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing, type SkillTheme } from '../../constants/theme';

interface DailyChallengeCardProps {
  theme: SkillTheme;
  done: number;
  total: number;
  xpReward: number;
}

export function DailyChallengeCard({ theme, done, total, xpReward }: DailyChallengeCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: theme.main }]}>
      <View style={styles.blob} />
      <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
        <Ionicons name="desktop" size={20} color={colors.white} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Daily Challenge</Text>
        <Text style={styles.progress}>
          {done}/{total} exercises done
        </Text>
      </View>
      <View style={[styles.xpBadge, { backgroundColor: theme.soft }]}>
        <Text style={[styles.xpText, { color: theme.main }]}>+{xpReward}XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -10,
    right: -20,
    width: 80,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderBottomLeftRadius: 40,
    borderTopLeftRadius: 30,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: colors.white,
  },
  progress: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  xpBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  xpText: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
  },
});
