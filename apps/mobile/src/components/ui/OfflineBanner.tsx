import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../../constants/theme';
import { useIsOnline } from '../../hooks/useIsOnline';

/**
 * Thin status strip that slides down from the top whenever the device loses
 * connectivity. Renders nothing while online. Sits above all screens so the
 * learner always knows when they're working from cached content.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: isOnline ? -80 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOnline, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { paddingTop: insets.top + spacing.xs, transform: [{ translateY }] }]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color={colors.white} />
      <Text style={styles.text}>You&apos;re offline — using downloaded content</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.neutral,
  },
  text: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
});
