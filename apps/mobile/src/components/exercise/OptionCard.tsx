import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, type SkillTheme } from '../../constants/theme';

type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect';

interface OptionCardProps {
  label: string;
  state: OptionState;
  theme: SkillTheme;
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function OptionCard({
  label,
  state,
  theme,
  onPress,
  disabled,
  fullWidth,
}: OptionCardProps) {
  let borderColor: string = colors.border;
  let backgroundColor: string = colors.white;

  if (state === 'selected') {
    borderColor = theme.main;
    backgroundColor = theme.softer;
  } else if (state === 'correct') {
    borderColor = colors.success;
    backgroundColor = colors.successSurface;
  } else if (state === 'incorrect') {
    borderColor = colors.errorStrong;
    backgroundColor = colors.errorSurface;
  }

  const labelColor =
    state === 'correct'
      ? colors.success
      : state === 'incorrect'
        ? colors.errorStrong
        : state === 'selected'
          ? theme.main
          : colors.neutralVariant;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        fullWidth ? styles.fullWidth : styles.grid,
        { borderColor, backgroundColor },
        pressed && !disabled && styles.pressed,
      ]}
    >
      {state === 'correct' ? (
        <View style={styles.tick}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        </View>
      ) : null}
      <Text style={[styles.label, fullWidth && styles.labelMeaning, { color: labelColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    // Thicker bottom edge gives the card a pressable 3D feel — same color
    // as the rest of the border, just heavier on the bottom.
    borderBottomWidth: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  grid: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  labelMeaning: {
    fontSize: 15,
    textAlign: 'center',
  },
});
