import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  CULTURAL_CONTENT_TYPE_LABELS,
  LANGUAGE_LABELS,
  type CulturalContentBody,
  type CulturalProverbBody,
  type CulturalStoryBody,
} from '@lexiroot/shared';
import * as Linking from 'expo-linking';
import { colors, fonts, radius, spacing } from '../../src/constants/theme';
import { useGetCulturalContentQuery } from '../../src/services/culturalContentApi';
import { useAudioPlayback } from '../../src/hooks/useAudioPlayback';
import { parseHtmlBlocks, type Block, type InlineRun } from '../../src/utils/htmlRenderer';

type ReadLang = 'english' | 'translated';

function isProverbBody(b: CulturalContentBody): b is CulturalProverbBody {
  return Object.prototype.hasOwnProperty.call(b, 'explanation');
}

export default function CultureReaderScreen() {
  const router = useRouter();
  const { id, autoplay } = useLocalSearchParams<{ id: string; autoplay?: string }>();
  const { data: item, isLoading } = useGetCulturalContentQuery(id!, { skip: !id });

  const [lang, setLang] = useState<ReadLang>('translated');
  const [langPickerOpen, setLangPickerOpen] = useState(false);

  const playback = useAudioPlayback(item?.audioUrl ?? null);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoplay === '1' && playback.isReady && !playback.isPlaying) {
      playback.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback.isReady, autoplay]);

  useEffect(() => {
    progress.stopAnimation();
    if (playback.isPlaying) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 60_000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
    }
  }, [playback.isPlaying, progress]);

  if (isLoading || !item) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const title = lang === 'translated'
    ? item.titleTranslated || item.titleEnglish
    : item.titleEnglish;

  const langLabel = LANGUAGE_LABELS[item.language];
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.neutral} />
        </Pressable>
        <Pressable
          onPress={() => setLangPickerOpen(true)}
          style={styles.langPicker}
          hitSlop={8}
        >
          <Text style={styles.langPickerLabel}>
            {lang === 'translated' ? langLabel : 'English'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.neutral} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{title}</Text>

        {item.audioUrl ? (
          <View style={styles.player}>
            <Text style={styles.playerLabel}>Listen to narration</Text>
            <View style={styles.playerRow}>
              <Pressable
                onPress={playback.isPlaying ? playback.stop : playback.play}
                style={styles.playerBtn}
              >
                <Ionicons
                  name={playback.isPlaying ? 'pause' : 'play'}
                  size={20}
                  color={colors.white}
                />
              </Pressable>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              </View>
              <Pressable
                onPress={() => {
                  playback.stop();
                  playback.play();
                }}
                style={styles.playerBtn}
              >
                <Ionicons name="refresh" size={18} color={colors.white} />
              </Pressable>
            </View>
          </View>
        ) : null}

        <ReaderBody body={item.body} lang={lang} type={item.type} />
      </ScrollView>

      <Modal
        visible={langPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLangPickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setLangPickerOpen(false)}>
          <View style={styles.modalCard}>
            <LangOption
              label={langLabel}
              active={lang === 'translated'}
              onPress={() => {
                setLang('translated');
                setLangPickerOpen(false);
              }}
            />
            <LangOption
              label="English"
              active={lang === 'english'}
              onPress={() => {
                setLang('english');
                setLangPickerOpen(false);
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function LangOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.langOption} onPress={onPress}>
      <Text style={[styles.langOptionLabel, active && styles.langOptionActive]}>{label}</Text>
      {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
    </Pressable>
  );
}

function ReaderBody({
  body,
  lang,
  type,
}: {
  body: CulturalContentBody;
  lang: ReadLang;
  type: 'story' | 'folktale' | 'proverb';
}) {
  const blocks = useMemo<Block[]>(() => {
    if (isProverbBody(body)) {
      const out: Block[] = [];
      out.push({
        kind: 'heading',
        level: 2,
        runs: [{ text: CULTURAL_CONTENT_TYPE_LABELS[type] }],
      });
      out.push(...parseHtmlBlocks(body.explanation));
      if (body.usageExample) {
        out.push({ kind: 'heading', level: 2, runs: [{ text: 'Usage example' }] });
        out.push(...parseHtmlBlocks(body.usageExample));
      }
      return out;
    }
    const raw = lang === 'translated' ? body.contentTranslated : body.contentEnglish;
    return parseHtmlBlocks(raw);
  }, [body, lang, type]);

  if (blocks.length === 0) return null;

  return (
    <View style={styles.body}>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </View>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.kind === 'heading') {
    const style = block.level === 2 ? styles.h2 : styles.h3;
    return (
      <Text style={style}>
        <Runs runs={block.runs} />
      </Text>
    );
  }
  if (block.kind === 'list') {
    return (
      <View style={styles.list}>
        {block.items.map((item, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.bullet}>{block.ordered ? `${i + 1}.` : '•'}</Text>
            <Text style={styles.blockText}>
              <Runs runs={item} />
            </Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <Text style={styles.blockText}>
      <Runs runs={block.runs} />
    </Text>
  );
}

function Runs({ runs }: { runs: InlineRun[] }) {
  return (
    <>
      {runs.map((run, i) => {
        const style: import('react-native').TextStyle = {};
        if (run.bold) style.fontFamily = fonts.bold;
        if (run.italic) style.fontStyle = 'italic';
        if (run.underline) style.textDecorationLine = 'underline';
        if (run.href) {
          style.color = colors.primary;
          style.textDecorationLine = 'underline';
          return (
            <Text key={i} style={style} onPress={() => Linking.openURL(run.href!)}>
              {run.text}
            </Text>
          );
        }
        return (
          <Text key={i} style={style}>
            {run.text}
          </Text>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  langPickerLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.neutral,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.primary,
    lineHeight: 34,
    marginTop: spacing.sm,
  },
  player: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  playerLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
  playerRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  playerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
  },
  body: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  h2: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    lineHeight: 24,
    color: colors.neutral,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.neutral,
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  blockText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 24,
    color: colors.neutral,
  },
  list: {
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bullet: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 24,
    color: colors.neutral,
    minWidth: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    minWidth: 160,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  langOptionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.neutral,
  },
  langOptionActive: {
    color: colors.primary,
  },
});
