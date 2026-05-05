import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';

type DayState = 'completed' | 'current' | 'future';

interface DayItem {
  state: DayState;
  index: number;
}

interface WeekDotsProps {
  currentDay: number;
}

export function WeekDots({ currentDay }: WeekDotsProps) {
  const days: DayItem[] = Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    let state: DayState = 'future';
    if (dayNum < currentDay) state = 'completed';
    else if (dayNum === currentDay) state = 'current';
    return { index: dayNum, state };
  });

  return (
    <View style={styles.row}>
      {days.map((d) => (
        <View key={d.index} style={styles.col}>
          <Dot state={d.state} />
          <Text
            style={[
              styles.label,
              d.state === 'current' && styles.labelCurrent,
              d.state === 'future' && styles.labelFuture,
            ]}
          >
            Day {d.index}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Dot({ state }: { state: DayState }) {
  if (state === 'current') {
    return <View style={[styles.dot, styles.dotCurrent]} />;
  }
  if (state === 'completed') {
    return (
      <View style={[styles.dot, styles.dotCompleted]}>
        <Ionicons name="checkmark" size={16} color={colors.primary} />
      </View>
    );
  }
  return (
    <View style={[styles.dot, styles.dotFuture]}>
      <Ionicons name="checkmark" size={16} color={colors.neutralVariant} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  col: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dotCompleted: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  dotCurrent: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dotFuture: {
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.neutral,
  },
  labelCurrent: {
    color: colors.primary,
  },
  labelFuture: {
    color: colors.neutralVariant,
  },
});
