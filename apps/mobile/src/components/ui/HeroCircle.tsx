import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/theme';

type Variant = 'primary' | 'soft' | 'neutral';

interface HeroCircleProps {
  size?: number;
  variant?: Variant;
}

export function HeroCircle({ size = 220, variant = 'primary' }: HeroCircleProps) {
  const background =
    variant === 'primary'
      ? colors.primary
      : variant === 'soft'
        ? colors.primarySoft
        : colors.neutralSoft;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    alignSelf: 'center',
  },
});
