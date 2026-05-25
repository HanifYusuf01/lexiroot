import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { MascotHeadIcon } from '../icons/MascotHeadIcon';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';

interface Props {
  proverb: string;
  translation: string;
  audioUrl: string | null;
  onViewAllPress: () => void;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RootNuggetCard({ proverb, translation, audioUrl, onViewAllPress }: Props) {
  const playback = useAudioPlayback(audioUrl);

  const remaining = playback.isPlaying
    ? Math.max(0, playback.duration - playback.currentTime)
    : playback.duration;

  const onListenPress = () => {
    if (!playback.isReady) return;
    if (playback.isPlaying) {
      playback.stop();
    } else {
      playback.play();
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.mascotWrap}>
          <MascotHeadIcon size={72} />
        </View>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>ROOT NUGGET</Text>
          <Text style={styles.proverb} numberOfLines={3}>
            {proverb}
          </Text>
          <Text style={styles.translation} numberOfLines={3}>
            {translation}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.listenBtn, !playback.isReady && styles.listenBtnDisabled]}
          onPress={onListenPress}
          disabled={!playback.isReady}
          hitSlop={6}
        >
          <Ionicons
            name={playback.isPlaying ? 'pause' : 'play'}
            size={14}
            color={colors.white}
          />
          <Text style={styles.listenLabel}>
            {playback.isReady ? `Listen · ${formatTime(remaining)}` : 'No audio'}
          </Text>
        </Pressable>

        <Pressable style={styles.viewAll} hitSlop={8} onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>View nuggets</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySofter,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  mascotWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.primary,
  },
  proverb: {
    marginTop: 4,
    fontFamily: fonts.extrabold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.neutral,
  },
  translation: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.neutralVariant,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  listenBtnDisabled: {
    opacity: 0.5,
  },
  listenLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
});
