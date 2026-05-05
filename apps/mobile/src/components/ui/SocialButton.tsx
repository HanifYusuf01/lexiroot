import { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface SocialButtonProps {
  label: string;
  iconName?: IconName;
  iconColor?: string;
  icon?: ReactNode;
  onPress?: () => void;
}

export function SocialButton({ label, iconName, iconColor, icon, onPress }: SocialButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        {icon
          ? icon
          : iconName
            ? <Ionicons name={iconName} size={20} color={iconColor ?? colors.neutral} />
            : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  pressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.primary,
  },
});
