import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { colors, fonts, spacing } from '../../constants/theme';

interface AchievementScreenProps {
  badge: ReactNode;
  caption: string;
  title: string;
  subtitle: string;
  continueLabel?: string;
  onClose: () => void;
  onContinue: () => void;
}

export function AchievementScreen({
  badge,
  caption,
  title,
  subtitle,
  continueLabel = 'Continue',
  onClose,
  onContinue,
}: AchievementScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color={colors.neutral} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.badgeWrap}>{badge}</View>
        <Text style={styles.caption}>{caption}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.footer}>
        <Button label={continueLabel} onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primarySofter,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  badgeWrap: {
    marginBottom: spacing.md,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.primary,
    textAlign: 'center',
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
