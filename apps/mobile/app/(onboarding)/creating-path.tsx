import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeroCircle } from '../../src/components/ui/HeroCircle';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { colors, fonts, spacing } from '../../src/constants/theme';

const TRANSITION_MS = 2500;

export default function CreatingPathScreen() {
  const router = useRouter();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spin]);

  useEffect(() => {
    const timer = setTimeout(() => router.replace('/ready'), TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [router]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <View style={styles.hero}>
          <HeroCircle variant="primary" size={180} />
        </View>
        <Text style={styles.title}>Creating your{'\n'}learning path</Text>
        <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]}>
          <Ionicons name="sync-outline" size={60} color={colors.secondary} />
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 38,
    lineHeight: 36,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  spinner: {
    marginTop: spacing.md,
  },
});
