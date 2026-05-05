import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../constants/theme';

interface SettingsRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  hideChevron?: boolean;
  /** Custom right element — replaces the chevron (e.g. a Toggle). */
  right?: ReactNode;
  /** Hides the bottom divider — use on the last row of a group. */
  last?: boolean;
}

export function SettingsRow({ title, subtitle, onPress, hideChevron, right, last }: SettingsRowProps) {
  const showChevron = !right && !hideChevron;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && onPress && styles.pressed,
      ]}
    >
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? right : null}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.neutralVariant} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.neutral,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.neutralVariant,
    marginTop: 2,
  },
});
