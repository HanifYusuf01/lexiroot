import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing } from '../../constants/theme';

interface ScreenContainerProps {
  children: ReactNode;
  showBack?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
}

export function ScreenContainer({ children, showBack, showSkip, onSkip }: ScreenContainerProps) {
  const router = useRouter();
  const canBack = showBack && router.canGoBack();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerSlot}>
          {canBack ? (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.icon}>‹</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.headerSlot}>
          {showSkip ? (
            <Pressable onPress={onSkip} hitSlop={12}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 44,
  },
  headerSlot: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
    color: colors.neutral,
    lineHeight: 32,
  },
  skip: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.neutralVariant,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
