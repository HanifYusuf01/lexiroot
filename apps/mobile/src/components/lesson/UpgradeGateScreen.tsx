import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../constants/theme';
import { Button } from '../ui/Button';
import { LessonFullCenterScreen } from './LessonFullCenterScreen';

interface UpgradeGateScreenProps {
  /** Called when the learner dismisses the gate (top-left close). */
  onClose: () => void;
}

/**
 * Shown when a free learner reaches the end of the free access level or tries to
 * open a premium level (lesson or practice). The Upgrade CTA routes into the
 * existing upgrade flow. Re-enable the gate via entitlements, not by editing
 * this screen.
 */
export function UpgradeGateScreen({ onClose }: UpgradeGateScreenProps) {
  return (
    <LessonFullCenterScreen
      onClose={onClose}
      footer={<Button label="Upgrade" onPress={() => router.push('/upgrade' as never)} />}
    >
      <Text style={styles.tagline}>You&apos;ve unlocked a new level! 🎉</Text>
      <Text style={styles.title}>Upgrade to Premium to continue learning.</Text>
    </LessonFullCenterScreen>
  );
}

const styles = StyleSheet.create({
  tagline: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
  },
});
