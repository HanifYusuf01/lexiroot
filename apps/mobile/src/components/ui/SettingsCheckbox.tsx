import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface SettingsCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Hides the bottom divider — use on the last row of a group. */
  last?: boolean;
}

export function SettingsCheckbox({ label, checked, onChange, last }: SettingsCheckboxProps) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? (
          <Ionicons name="checkmark" size={14} color={colors.white} />
        ) : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryBorder,
  },
  pressed: {
    opacity: 0.7,
  },
  box: {
    width: 18,
    height: 18,
    borderRadius: radius.sm / 2,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutral,
    flex: 1,
  },
});
