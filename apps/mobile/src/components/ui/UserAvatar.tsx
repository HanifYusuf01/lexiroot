import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../constants/theme';

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  fallbackText?: string;
}

function initialsOf(name?: string | null): string {
  if (!name) return '';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function UserAvatar({ name, avatarUrl, size = 44, fallbackText }: UserAvatarProps) {
  const initials = initialsOf(name) || fallbackText || 'LR';
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: radius.full },
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: radius.full }}
        />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: Math.max(12, Math.round(size * 0.35)) },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontFamily: fonts.extrabold,
    color: colors.white,
    letterSpacing: 0.5,
  },
});
