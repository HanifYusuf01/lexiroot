import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type SkillTheme } from '../../constants/theme';

interface PlayButtonProps {
  theme: SkillTheme;
  onPress?: () => void;
  isPlaying?: boolean;
}

export function PlayButton({ theme, onPress, isPlaying = false }: PlayButtonProps) {
  return (
    <View
      style={[
        styles.wrap,
        isPlaying && { backgroundColor: theme.border, borderColor: theme.main },
      ]}
    >
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
    </View>
  );
}

const styles = StyleSheet.create({
  // Glow ring — transparent by default, picks up the theme's soft border
  // color when isPlaying flips on. Padding sets the ring thickness.
  wrap: {
    padding: 6,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
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
