import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../src/constants/theme';
import { MascotIcon } from '../../src/components/icons/MascotIcon';
import { AnimatedMascot } from '../../src/components/mascot/AnimatedMascot';
import { CultureContentCard } from '../../src/components/culture/CultureContentCard';
import { useListCulturalContentQuery } from '../../src/services/culturalContentApi';

export default function CultureTab() {
  const router = useRouter();
  const { data, isLoading } = useListCulturalContentQuery({ limit: 50 });

  const items = data?.items ?? [];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Pressable
              onPress={() => router.replace('/(tabs)/home')}
              hitSlop={12}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color={colors.neutral} />
            </Pressable>
            <Text style={styles.title}>Culture &amp; Stories</Text>
            <Text style={styles.subtitle}>
              Explore proverbs, folktales, and cultural wisdom.
            </Text>
          </View>
          <View style={styles.mascot}>
            <AnimatedMascot mood="idle">
              <MascotIcon size={110} />
            </AnimatedMascot>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>No cultural content yet. Check back soon.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <CultureContentCard
                key={item.id}
                type={item.type}
                title={item.titleTranslated || item.titleEnglish}
                subtitle={item.shortDescription}
                coverImageUrl={item.coverImageUrl}
                audioUrl={item.audioUrl}
                onReadPress={() => router.push(`/culture/${item.id}`)}
                onListenPress={() => router.push(`/culture/${item.id}?autoplay=1`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    color: colors.neutral,
    lineHeight: 32,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
    lineHeight: 20,
  },
  mascot: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  list: {
    gap: spacing.md,
  },
  center: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  empty: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.neutralVariant,
  },
});
