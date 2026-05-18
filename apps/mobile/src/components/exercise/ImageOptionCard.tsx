import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, type SkillTheme } from '../../constants/theme';

type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect';

interface ImageOptionCardProps {
  imageUrl: string;
  state: OptionState;
  theme: SkillTheme;
  onPress?: () => void;
  disabled?: boolean;
}

export function ImageOptionCard({
  imageUrl,
  state,
  theme,
  onPress,
  disabled,
}: ImageOptionCardProps) {
  let borderColor: string = colors.border;
  let backgroundColor: string = colors.white;

  if (state === 'selected') {
    borderColor = theme.main;
    backgroundColor = theme.softer;
  } else if (state === 'correct') {
    borderColor = colors.success;
    backgroundColor = '#E6F8EC';
  } else if (state === 'incorrect') {
    borderColor = colors.error;
    backgroundColor = '#FDECEC';
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        { borderColor, backgroundColor },
        pressed && !disabled && styles.pressed,
      ]}
    >
      {state === 'correct' ? (
        <View style={styles.tick}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        </View>
      ) : null}
      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
});
