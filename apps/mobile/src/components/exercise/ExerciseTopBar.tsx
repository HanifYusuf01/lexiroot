import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface ExerciseTopBarProps {
  progress: number;
  xpReward: number;
  onClose?: () => void;
}

export function ExerciseTopBar({ progress, xpReward, onClose }: ExerciseTopBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.wrap}>
      <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
        <Ionicons name="close" size={22} color={colors.neutral} />
      </Pressable>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${clamped * 100}%` },
          ]}
        />
      </View>
      <View style={styles.xpWrap}>
        <Text style={styles.xpText}>{xpReward}</Text>
        <Ionicons name="add" size={12} color={colors.primary} style={styles.xpPlus} />
        <Ionicons name="star" size={14} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  xpWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 52,
    justifyContent: 'flex-end',
    gap: 2,
  },
  xpText: {
    fontFamily: fonts.extrabold,
    fontSize: 16,
    color: colors.primary,
  },
  xpPlus: {
    marginHorizontal: -2,
  },
});
