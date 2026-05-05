import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../constants/theme';

interface HeroCardProps {
  height?: number;
}

export function HeroCard({ height = 160 }: HeroCardProps) {
  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.blob} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    top: -20,
    left: -20,
    width: 160,
    height: 110,
    backgroundColor: colors.primarySoft,
    borderBottomRightRadius: 80,
    borderTopRightRadius: 40,
  },
});
