import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CrownIcon } from '../icons/CrownIcon';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface UpgradePromoCardProps {
  languageLabel?: string;
  onPress?: () => void;
}

export function UpgradePromoCard({
  languageLabel = 'Yoruba',
  onPress,
}: UpgradePromoCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.corner} />
      <View style={styles.icon}>
        <CrownIcon size={44} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Unlock full {languageLabel}{'\n'}Journey</Text>
        <Text style={styles.subtitle}>All lessons, stories &amp; audio</Text>
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      >
        <Text style={styles.btnLabel}>Upgrade</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    top: -22,
    right: -22,
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.chatBubbleUser,
    opacity: 0.85,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 19,
    color: colors.white,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 4,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primarySofter,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primary,
  },
});
