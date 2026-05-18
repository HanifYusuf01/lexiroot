import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius, spacing, type SkillTheme } from '../../constants/theme';

type CheckButtonState = 'disabled' | 'active' | 'correct' | 'incorrect';

interface CheckButtonProps {
  label?: string;
  state: CheckButtonState;
  theme: SkillTheme;
  onPress?: () => void;
}

export function CheckButton({ label = 'Check', state, theme, onPress }: CheckButtonProps) {
  let background: string = colors.neutralSoft;
  let textColor: string = colors.neutralVariant;
  let borderColor: string | undefined;
  let borderWidth = 0;

  if (state === 'active') {
    background = colors.primary;
    textColor = colors.white;
  } else if (state === 'correct') {
    background = colors.success;
    textColor = colors.white;
  } else if (state === 'incorrect') {
    background = colors.primary;
    textColor = colors.white;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={state === 'disabled'}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: background, borderColor, borderWidth },
        pressed && state !== 'disabled' && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>
        {state === 'correct' || state === 'incorrect' ? 'Continue' : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 56,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});
