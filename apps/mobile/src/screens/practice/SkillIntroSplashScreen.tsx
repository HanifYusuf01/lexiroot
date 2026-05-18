import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing, type SkillTheme } from '../../constants/theme';

interface SkillIntroSplashScreenProps {
  theme: SkillTheme;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onContinue: () => void;
  onClose?: () => void;
}

export function SkillIntroSplashScreen({
  theme,
  title,
  description,
  iconName,
  onContinue,
  onClose,
}: SkillIntroSplashScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={colors.neutral} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={[styles.iconCircle, { backgroundColor: theme.softer }]}>
          <Ionicons name={iconName} size={64} color={theme.main} />
        </View>
        <Text style={[styles.title, { color: theme.main }]}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: theme.main },
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 34,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
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
