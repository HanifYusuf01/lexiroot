import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, type SkillTheme } from '../../constants/theme';
import { PathNode } from './PathNode';

export type PathNodeState = 'locked' | 'unlocked' | 'current';

export interface PathStep {
  id: string;
  state: PathNodeState;
  level?: number;
  /** Horizontal anchor 0..1 across the path width */
  x: number;
}

interface SkillPathProps {
  steps: PathStep[];
  theme: SkillTheme;
  onPressNode?: (step: PathStep) => void;
}

const NODE_SIZE = 76;
const ROW_HEIGHT = 100;

export function SkillPath({ steps, theme, onPressNode }: SkillPathProps) {
  const screenWidth = Dimensions.get('window').width - spacing.lg * 2;
  const available = screenWidth - NODE_SIZE;

  const positions = steps.map((step) => ({
    step,
    left: Math.max(0, Math.min(available, step.x * available)),
  }));

  const totalHeight = ROW_HEIGHT * steps.length;

  const pathD = positions
    .map((pos, idx) => {
      const cx = pos.left + NODE_SIZE / 2;
      const cy = idx * ROW_HEIGHT + NODE_SIZE / 2;
      if (idx === 0) return `M ${cx} ${cy}`;
      const prev = positions[idx - 1];
      const prevCx = prev.left + NODE_SIZE / 2;
      const prevCy = (idx - 1) * ROW_HEIGHT + NODE_SIZE / 2;
      const midY = (prevCy + cy) / 2;
      return `C ${prevCx} ${midY}, ${cx} ${midY}, ${cx} ${cy}`;
    })
    .join(' ');

  return (
    <View style={[styles.wrap, { height: totalHeight, width: screenWidth }]}>
      <Svg width={screenWidth} height={totalHeight} style={StyleSheet.absoluteFill}>
        <Path
          d={pathD}
          stroke={colors.neutralSoft}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="6 6"
          fill="none"
        />
      </Svg>
      {positions.map((pos, idx) => (
        <View
          key={pos.step.id}
          style={[
            styles.nodeWrap,
            {
              left: pos.left,
              top: idx * ROW_HEIGHT,
            },
          ]}
        >
          <PathNode
            state={pos.step.state}
            level={pos.step.level}
            theme={theme}
            onPress={() => onPressNode?.(pos.step)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignSelf: 'center',
  },
  nodeWrap: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE,
  },
});
