import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface OptionCardProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  hint?: string;
  onPress?: () => void;
}

export function OptionCard({ label, selected, disabled, hint, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[styles.label, selected && styles.labelSelected, disabled && styles.labelDisabled]}
      >
        {label}
      </Text>
      {hint ? (
        <View style={styles.hintWrap}>
          <Text style={styles.hint}>{hint}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primarySofter,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  cardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardDisabled: {
    backgroundColor: colors.neutralSoft,
    borderColor: colors.neutralSoft,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    flex: 1,
    color: colors.neutral,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  labelSelected: {
    color: colors.white,
  },
  labelDisabled: {
    color: colors.neutralVariant,
  },
  hintWrap: {
    marginLeft: spacing.sm,
  },
  hint: {
    color: colors.neutralVariant,
    fontFamily: fonts.medium,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
