import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  error?: string;
  helper?: string;
  isPassword?: boolean;
  label?: string;
  softBg?: boolean;
}

export function TextField({
  error,
  helper,
  isPassword,
  label,
  softBg,
  ...inputProps
}: TextFieldProps) {
  const [hidden, setHidden] = useState(!!isPassword);

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.container,
          softBg && styles.containerSoft,
          !!error && styles.containerError,
        ]}
      >
        <TextInput
          style={styles.input}
          secureTextEntry={isPassword && hidden}
          placeholderTextColor={colors.neutralVariant}
          autoCorrect={false}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.neutralVariant}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    backgroundColor: colors.white,
  },
  containerSoft: {
    backgroundColor: colors.primarySofter,
    borderColor: colors.primaryBorder,
  },
  containerError: {
    borderColor: colors.error,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.neutral,
    marginBottom: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.neutral,
    paddingVertical: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.error,
  },
  helperText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.neutralVariant,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});
