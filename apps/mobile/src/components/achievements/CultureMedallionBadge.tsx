import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import { colors } from '../../constants/theme';

// Decorative medallion used for the Culture Explorer achievement. The outer
// ring carries a tiled Ankara-style pattern (dark with white motifs); the
// inner disc is the brand coral with a white five-pointed star centered.
const VB = 144;
const RING_R = 70;
const INNER_R = 46;
const STAR_OUTER = 16;
const STAR_INNER = 7;

// Build a five-point star path centered at (cx, cy).
function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    // Start at top (angle = -PI/2) and rotate clockwise.
    const angle = -Math.PI / 2 + (Math.PI / 5) * i;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  points.push('Z');
  return points.join(' ');
}

interface CultureMedallionBadgeProps {
  size?: number;
}

export function CultureMedallionBadge({ size = 144 }: CultureMedallionBadgeProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${VB} ${VB}`}>
        <Defs>
          {/* Tiled Ankara-style motif: dark ground with white diamond + dot
              repeated across the ring. */}
          <Pattern
            id="ankara"
            x={0}
            y={0}
            width={14}
            height={14}
            patternUnits="userSpaceOnUse"
          >
            <Rect width={14} height={14} fill={colors.black} />
            <Path d="M 7 2 L 10 7 L 7 12 L 4 7 Z" fill={colors.white} />
            <Circle cx={1} cy={1} r={1} fill={colors.white} />
            <Circle cx={13} cy={13} r={1} fill={colors.white} />
          </Pattern>
        </Defs>
        {/* Outer ring — patterned fill, red disc on top creates the ring. */}
        <Circle cx={VB / 2} cy={VB / 2} r={RING_R} fill="url(#ankara)" />
        {/* Subtle rim line between ring and inner disc. */}
        <Circle
          cx={VB / 2}
          cy={VB / 2}
          r={INNER_R + 2}
          fill="none"
          stroke={colors.primaryDark}
          strokeWidth={2}
        />
        <Circle cx={VB / 2} cy={VB / 2} r={INNER_R} fill={colors.primary} />
        <Path
          d={starPath(VB / 2, VB / 2, STAR_OUTER, STAR_INNER)}
          fill={colors.white}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
