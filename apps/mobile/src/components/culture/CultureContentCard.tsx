import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CULTURAL_CONTENT_TYPE_LABELS, type CulturalContentType } from '@lexiroot/shared';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface Props {
  type: CulturalContentType;
  title: string;
  subtitle: string;
  coverImageUrl: string | null;
  audioUrl: string | null;
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
  completed = false,
  onReadPress,
  onListenPress,
}: Props) {
  const readLabel = `Read ${CULTURAL_CONTENT_TYPE_LABELS[type]}`;

  return (
    <View style={styles.card}>
      <View pointerEvents="none" style={styles.blob} />

      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : (
            <Text style={styles.subtitle} numberOfLines={1}>
              {`A ${CULTURAL_CONTENT_TYPE_LABELS[type].toLowerCase()}`}
            </Text>
          )}
        </View>
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]} />
        )}
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
            completed && { backgroundColor: colors.primary },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    padding: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    top: -28,
    right: -40,
    width: 120,
    height: 90,
    borderBottomLeftRadius: 70,
    borderTopLeftRadius: 50,
    backgroundColor: colors.primary,
    opacity: 0.85,
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
    color: colors.primary,
  },
  subtitle: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
    opacity: 0.85,
  },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
  },
  thumbPlaceholder: {
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
    paddingVertical: 9,
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
    borderColor: colors.primary,
  },
});
