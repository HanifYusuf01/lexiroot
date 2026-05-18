import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RecognitionItemPayload } from '@lexiroot/shared';
import { ExerciseTopBar } from '../../../../src/components/exercise/ExerciseTopBar';
import {
  useGetLessonQuery,
  useListEntriesQuery,
} from '../../../../src/services/lessonsApi';
import { colors, fonts, radius, spacing } from '../../../../src/constants/theme';

export default function RecognitionLessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lessonQuery = useGetLessonQuery(lessonId ?? '', { skip: !lessonId });
  const entriesQuery = useListEntriesQuery(lessonId ?? '', { skip: !lessonId });
  const [index, setIndex] = useState(0);

  const entries = (entriesQuery.data ?? []).filter((e) => e.kind === 'recognition-item');
  const lesson = lessonQuery.data;
  const total = entries.length;
  const current = entries[index];

  if (!lessonId) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Text style={styles.fallbackText}>Lesson not found</Text>
      </SafeAreaView>
    );
  }

  if (lessonQuery.isLoading || entriesQuery.isLoading) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Text style={styles.fallbackText}>Couldn&apos;t load lesson</Text>
      </SafeAreaView>
    );
  }

  if (total === 0 || !current) {
    return (
      <SafeAreaView style={styles.fallback} edges={['top']}>
        <Text style={styles.fallbackText}>Nothing to learn here yet</Text>
      </SafeAreaView>
    );
  }

  const payload = current.payload as RecognitionItemPayload;
  const progress = (index + 1) / total;
  const isLast = index + 1 >= total;

  function advance() {
    if (isLast) {
      router.replace(`/practice/lesson/${lessonId}` as never);
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.topBarWrap}>
        <ExerciseTopBar
          progress={progress}
          xpReward={lesson.xpReward ?? 0}
          onClose={() => router.back()}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.imageCard}>
          <Image
            source={{ uri: payload.imageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.word}>{payload.word}</Text>
        <Text style={styles.caption}>
          {index + 1} of {total}
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={advance}
          style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
        >
          <Text style={styles.continueText}>{isLast ? 'Start Practice' : 'Continue'}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBarWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  imageCard: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 320,
    borderRadius: radius.xl,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '70%',
    height: '70%',
  },
  word: {
    fontFamily: fonts.extrabold,
    fontSize: 32,
    color: colors.primary,
    textAlign: 'center',
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralVariant,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  continueBtn: {
    minHeight: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  continueText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  fallback: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  fallbackText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.neutral,
  },
});
