import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES, type CountryCode } from '@lexiroot/shared';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { CountryPickerModal } from './CountryPickerModal';

interface PhoneFieldProps {
  country: CountryCode;
  digits: string;
  onChangeCountry: (code: CountryCode) => void;
  onChangeDigits: (digits: string) => void;
  placeholder?: string;
  error?: string;
}

export function PhoneField({
  country,
  digits,
  onChangeCountry,
  onChangeDigits,
  placeholder = 'Phone number',
  error,
}: PhoneFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const info = COUNTRIES[country];

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, error ? styles.rowError : null]}>
        <Pressable onPress={() => setPickerOpen(true)} style={styles.dialBtn} hitSlop={4}>
          <Text style={styles.flag}>{info.flag}</Text>
          <Text style={styles.dial}>{info.dialCode}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.neutralVariant} />
        </Pressable>
        <View style={styles.divider} />
        <TextInput
          value={digits}
          onChangeText={(v) => onChangeDigits(v.replace(/[^\d]/g, ''))}
          placeholder={placeholder}
          placeholderTextColor={colors.neutralVariant}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <CountryPickerModal
        visible={pickerOpen}
        selected={country}
        onSelect={onChangeCountry}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
  },
  rowError: {
    borderColor: colors.error,
  },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  flag: {
    fontSize: 20,
  },
  dial: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.neutral,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutral,
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});
