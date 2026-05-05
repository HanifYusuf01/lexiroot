import { ReactNode, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Hides the divider below the header when collapsed. */
  last?: boolean;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  last,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  }

  return (
    <View>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.header,
          !open && !last && styles.headerDivider,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.neutral}
        />
      </Pressable>
      {open ? <View style={styles.panel}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  headerDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.neutral,
  },
  panel: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    backgroundColor: colors.primarySofter,
    overflow: 'hidden',
  },
});
