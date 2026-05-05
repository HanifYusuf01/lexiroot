import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../constants/theme';

interface StarRatingProps {
  /** 0–5 */
  value: number;
  onChange: (next: number) => void;
  size?: number;
  count?: number;
}

export function StarRating({ value, onChange, size = 36, count = 5 }: StarRatingProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => {
        const filled = i < value;
        return (
          <Pressable key={i} onPress={() => onChange(i + 1)} hitSlop={6}>
            <Ionicons
              name={filled ? 'star' : 'star'}
              size={size}
              color={filled ? colors.warning : colors.neutralSoft}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
