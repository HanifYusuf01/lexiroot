import { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export type MascotMood = 'idle' | 'happy' | 'sad';

interface AnimatedMascotProps {
  /**
   * idle  — gentle breathing bob, makes any resting mascot feel alive
   * happy — bouncy little dance (correct answers, lesson completed)
   * sad   — droops and sways slowly (retry / almost-there screens)
   */
  mood?: MascotMood;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Wraps a static mascot SVG and gives it a looping personality animation.
// The artwork stays in its own icon file (pure SVG); motion lives here so the
// same wrapper can animate the head, full-body, or sad mascot everywhere.
export function AnimatedMascot({ mood = 'idle', children, style }: AnimatedMascotProps) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(translateY);
    cancelAnimation(rotate);
    cancelAnimation(scale);

    if (mood === 'happy') {
      // A quick celebratory dance: hop, wiggle side to side, and pop.
      translateY.value = withRepeat(
        withSequence(
          withTiming(-14, { duration: 240, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 240, easing: Easing.bounce }),
        ),
        -1,
      );
      rotate.value = withRepeat(
        withSequence(
          withTiming(-9, { duration: 180, easing: Easing.inOut(Easing.quad) }),
          withTiming(9, { duration: 360, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 180, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.07, { duration: 240 }),
          withTiming(1, { duration: 240 }),
        ),
        -1,
      );
    } else if (mood === 'sad') {
      // Droops down a touch and sways slowly, like a sigh.
      translateY.value = withTiming(4, { duration: 600 });
      scale.value = withTiming(0.97, { duration: 600 });
      rotate.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(4, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else {
      // Idle: a calm breathing bob so resting mascots never feel static.
      scale.value = 1;
      translateY.value = withRepeat(
        withTiming(-5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
      rotate.value = withRepeat(
        withSequence(
          withTiming(-2.5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(2.5, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    }

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(rotate);
      cancelAnimation(scale);
    };
  }, [mood, translateY, rotate, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotateZ: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
