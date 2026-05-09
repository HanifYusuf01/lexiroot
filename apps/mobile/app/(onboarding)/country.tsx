import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES, type CountryCode } from '@lexiroot/shared';
import { Button } from '../../src/components/ui/Button';
import { CountryPickerModal } from '../../src/components/ui/CountryPickerModal';
import { QuestionBubble } from '../../src/components/ui/QuestionBubble';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { useAppDispatch, useAppSelector } from '../../src/store/hooks';
import { setCountry } from '../../src/store/slices/onboardingSlice';

export default function CountryScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.onboarding.country);
  const selected: CountryCode = country ?? 'NG';
  const info = COUNTRIES[selected];
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleContinue() {
    if (!country) dispatch(setCountry(selected));
    router.push('/reason');
  }

  return (
    <ScreenContainer showBack>
      <View style={styles.body}>
        <QuestionBubble question="What country are you from?" />
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
        >
          <Text style={styles.flag}>{info.flag}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {info.name}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.neutralVariant} />
        </Pressable>
      </View>
      <Button label="Continue" onPress={handleContinue} />

      <CountryPickerModal
        visible={pickerOpen}
        selected={selected}
        onSelect={(c) => dispatch(setCountry(c))}
        onClose={() => setPickerOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
  fieldPressed: {
    backgroundColor: colors.neutralSoft,
  },
  flag: {
    fontSize: 22,
  },
  name: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.neutral,
  },
});
