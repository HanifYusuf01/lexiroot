import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../../constants/theme';

// SVG viewBox the shield paths are designed against. Children area sits over
// the white inner circle whose dimensions are pinned below in CIRCLE_*.
const VB_W = 120;
const VB_H = 132;

// White inner circle — content (number / icon) is centered here.
const CIRCLE_CX = 60;
const CIRCLE_CY = 64;
const CIRCLE_R = 26;

// Outer darker shield outline (rim) — drawn first so the inner sits on top
// with a couple of pixels of dark border showing all around.
const OUTER_PATH =
  'M 60 4 C 79 4 94 6 106 11 C 113 13 116 17 116 25 L 116 71 C 116 97 102 116 60 132 C 18 116 4 97 4 71 L 4 25 C 4 17 7 13 14 11 C 26 6 41 4 60 4 Z';

// Inner shield body — lighter coral fill.
const INNER_PATH =
  'M 60 11 C 76 11 89 13 100 17 C 105 19 108 22 108 28 L 108 68 C 108 91 96 109 60 124 C 24 109 12 91 12 68 L 12 28 C 12 22 15 19 20 17 C 31 13 44 11 60 11 Z';

interface ShieldBadgeProps {
  /** Width in DP. Height scales to match the shield aspect ratio (~1.1×). */
  size?: number;
  children?: ReactNode;
}

export function ShieldBadge({ size = 140, children }: ShieldBadgeProps) {
  const scale = size / VB_W;
  const height = VB_H * scale;
  const contentLeft = (CIRCLE_CX - CIRCLE_R) * scale;
  const contentTop = (CIRCLE_CY - CIRCLE_R) * scale;
  const contentSize = CIRCLE_R * 2 * scale;

  return (
    <View style={[styles.wrap, { width: size, height }]}>
      <Svg width={size} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Path d={OUTER_PATH} fill={colors.primaryDark} />
        <Path d={INNER_PATH} fill={colors.primary} />
        <Circle cx={CIRCLE_CX} cy={CIRCLE_CY} r={CIRCLE_R} fill={colors.white} />
      </Svg>
      <View
        style={[
          styles.content,
          {
            left: contentLeft,
            top: contentTop,
            width: contentSize,
            height: contentSize,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
