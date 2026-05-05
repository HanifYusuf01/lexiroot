import { Platform, Switch, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/theme';

interface ToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onChange, disabled }: ToggleProps) {
  return (
    <View style={styles.wrap}>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: colors.neutralVariant, true: colors.primary }}
        thumbColor={Platform.OS === 'android' ? colors.white : undefined}
        ios_backgroundColor={colors.neutralVariant}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
  },
});
