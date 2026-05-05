import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

type Variant = 'primary' | 'ghost' | 'outline';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'outline' && styles.outline,
        isDisabled && variant === 'primary' && styles.primaryDisabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelPrimary,
            variant === 'ghost' && styles.labelGhost,
            variant === 'outline' && styles.labelOutline,
            isDisabled && variant === 'primary' && styles.labelDisabled,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  primaryDisabled: {
    backgroundColor: colors.neutralSoft,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  labelPrimary: {
    color: colors.white,
  },
  labelGhost: {
    color: colors.neutral,
  },
  labelOutline: {
    color: colors.primary,
  },
  labelDisabled: {
    color: colors.neutralVariant,
  },
});
