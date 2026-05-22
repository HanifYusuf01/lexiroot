import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CULTURAL_CONTENT_TYPE_LABELS, type CulturalContentType } from '@lexiroot/shared';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface Props {
  type: CulturalContentType;
  title: string;
  subtitle: string;
  coverImageUrl: string | null;
  audioUrl: string | null;
  variant?: 'soft' | 'primary';
  completed?: boolean;
  onReadPress: () => void;
  onListenPress: () => void;
}

export function CultureContentCard({
  type,
  title,
  subtitle,
  coverImageUrl,
  audioUrl,
  variant = 'primary',
  completed = false,
  onReadPress,
  onListenPress,
}: Props) {
  const isSoft = variant === 'soft';
  const readLabel = type === 'proverb' ? 'Read Proverb' : 'Read Story';

  const bg = isSoft ? colors.primarySoft : colors.primary;
  const blobBg = isSoft ? colors.primaryBorder : colors.primarySoft;
  const titleColor = isSoft ? colors.primary : colors.white;
  const subtitleColor = isSoft ? colors.primary : colors.white;
  const ringColor = isSoft ? colors.primary : colors.white;
  const ringFill = completed ? (isSoft ? colors.primary : colors.white) : 'transparent';

  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View
        pointerEvents="none"
        style={[styles.blob, { backgroundColor: blobBg }]}
      />

      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : (
            <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
              {`A ${CULTURAL_CONTENT_TYPE_LABELS[type].toLowerCase()}`}
            </Text>
          )}
        </View>
        {isSoft && coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={styles.thumb} />
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={onReadPress}>
            <Text style={styles.actionLabel}>{readLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, !audioUrl && styles.actionBtnDisabled]}
            onPress={audioUrl ? onListenPress : undefined}
          >
            <Text style={styles.actionLabel}>Listen Now</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.ring,
            { borderColor: ringColor, backgroundColor: ringFill },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    top: -32,
    right: -40,
    width: 140,
    height: 100,
    borderBottomLeftRadius: 80,
    borderTopLeftRadius: 60,
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.primarySofter,
  },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexShrink: 1,
  },
  actionBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  actionBtnDisabled: {
    opacity: 0.55,
  },
  actionLabel: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  ring: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
});
