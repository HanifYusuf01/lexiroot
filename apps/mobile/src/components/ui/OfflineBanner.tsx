import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../../constants/theme';
import { useIsOnline } from '../../hooks/useIsOnline';

// How long the "Back online" confirmation stays before sliding away.
const ONLINE_NOTICE_MS = 2500;

/**
 * Thin status strip that slides down from the top whenever the device loses
 * connectivity. While offline it stays visible; when the connection returns it
 * briefly flashes a "Back online" confirmation and then hides itself. Sits above
 * all screens so the learner always knows their connectivity state.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;
  const prevOnline = useRef(isOnline);
  const [showReconnected, setShowReconnected] = useState(false);

  // Detect the offline → online transition so we can show a transient
  // confirmation instead of just disappearing.
  useEffect(() => {
    if (isOnline && !prevOnline.current) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), ONLINE_NOTICE_MS);
      prevOnline.current = isOnline;
      return () => clearTimeout(timer);
    }
    prevOnline.current = isOnline;
  }, [isOnline]);

  // Visible while offline, or briefly after reconnecting.
  const visible = !isOnline || showReconnected;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -80,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        showReconnected && styles.containerOnline,
        { paddingTop: insets.top + spacing.xs, transform: [{ translateY }] },
      ]}
    >
      <Ionicons
        name={showReconnected ? 'cloud-done-outline' : 'cloud-offline-outline'}
        size={16}
        color={colors.white}
      />
      <Text style={styles.text}>
        {showReconnected
          ? "You're back online"
          : "You're offline — using downloaded content"}
      </Text>
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
  containerOnline: {
    backgroundColor: colors.success,
  },
  text: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
});
