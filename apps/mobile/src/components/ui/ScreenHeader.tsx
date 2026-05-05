import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, fonts, spacing } from '../../constants/theme';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  bordered?: boolean;
}

export function ScreenHeader({ title, onBack, right, bordered = true }: ScreenHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) onBack();
    else if (router.canGoBack()) router.back();
  }

  return (
    <View style={[styles.container, bordered && styles.bordered]}>
      <Pressable onPress={handleBack} hitSlop={12} style={styles.slot}>
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.slot}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 52,
  },
  bordered: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  slot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.primary,
    textAlign: 'center',
  },
});
