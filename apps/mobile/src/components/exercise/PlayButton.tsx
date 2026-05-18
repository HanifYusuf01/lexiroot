import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type SkillTheme } from '../../constants/theme';

interface PlayButtonProps {
  theme: SkillTheme;
  onPress?: () => void;
}

export function PlayButton({ theme, onPress }: PlayButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: theme.main, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="play" size={28} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 88,
    height: 72,
    borderRadius: radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  pressed: {
    opacity: 0.85,
  },
});
