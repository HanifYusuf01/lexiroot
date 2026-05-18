import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface XpTransitionScreenProps {
  xp: number;
  variant: 'correct' | 'incorrect';
  onContinue: () => void;
}

export function XpTransitionScreen({ xp, variant, onContinue }: XpTransitionScreenProps) {
  const accent = variant === 'correct' ? colors.success : colors.primary;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Text style={[styles.xp, { color: accent }]}>
          {variant === 'correct' ? '+' : ''}
          {xp} XP
        </Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: accent },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.btnText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xp: {
    fontFamily: fonts.extrabold,
    fontSize: 42,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  btn: {
    minHeight: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  pressed: { opacity: 0.85 },
});
