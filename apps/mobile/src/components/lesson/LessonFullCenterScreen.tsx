import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';

interface LessonFullCenterScreenProps {
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Layout used for intro / practice-intro / level-complete / unlocked screens.
 * Top-left X close button, centered hero content, fixed-bottom footer (usually
 * the Continue button).
 */
export function LessonFullCenterScreen({ onClose, children, footer }: LessonFullCenterScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {onClose ? (
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
            <Ionicons name="close" size={22} color={colors.neutral} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  close: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
});
