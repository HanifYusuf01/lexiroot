import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, type SkillTheme } from '../../constants/theme';

interface PathNodeProps {
  state: 'locked' | 'unlocked' | 'current';
  level?: number;
  theme: SkillTheme;
  onPress?: () => void;
}

export function PathNode({ state, level, theme, onPress }: PathNodeProps) {
  if (state === 'locked') {
    return (
      <View style={[styles.node, styles.locked]}>
        <Ionicons name="lock-closed" size={22} color={colors.neutralVariant} />
      </View>
    );
  }

  const bg = state === 'current' ? theme.main : theme.main;
  const shadow = state === 'current' ? styles.currentShadow : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.node,
        { backgroundColor: bg },
        shadow,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.levelText}>Lvl {level}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  node: {
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locked: {
    backgroundColor: colors.neutralSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  currentShadow: {
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  levelText: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: colors.white,
  },
});
