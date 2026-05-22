import type { ReactNode } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text } from 'react-native';
import { CultureMedallionBadge } from '../../src/components/achievements/CultureMedallionBadge';
import { ShieldBadge } from '../../src/components/achievements/ShieldBadge';
import { AchievementScreen } from '../../src/screens/achievements/AchievementScreen';
import { colors, fonts } from '../../src/constants/theme';

type Kind =
  | 'first-lesson'
  | 'ten-lessons'
  | 'fifty-lessons'
  | 'seven-day-streak'
  | 'culture-explorer'
  | 'level-up';

interface VariantParams {
  level?: string;
}

interface Variant {
  badge: ReactNode;
  caption: string;
  title: string;
  subtitle: string;
}

function ShieldNumber({ value }: { value: string }) {
  return (
    <ShieldBadge>
      <Text style={styles.shieldNumber}>{value}</Text>
    </ShieldBadge>
  );
}

function ShieldFlame() {
  return (
    <ShieldBadge>
      <Ionicons name="flame" size={30} color={colors.primary} />
    </ShieldBadge>
  );
}

function ShieldLightning() {
  return (
    <ShieldBadge>
      <Ionicons name="flash" size={30} color={colors.warning} />
    </ShieldBadge>
  );
}

const VARIANTS: Record<Kind, (params: VariantParams) => Variant> = {
  'first-lesson': () => ({
    badge: <ShieldNumber value="1" />,
    caption: "Let's do this!",
    title: 'First Lesson Completed',
    subtitle: 'You completed your first lesson.',
  }),
  'ten-lessons': () => ({
    badge: <ShieldNumber value="10" />,
    caption: 'Consistent Learner',
    title: 'Ten Lessons Completed',
    subtitle: 'Congratulations! You just completed your tenth lesson.',
  }),
  'fifty-lessons': () => ({
    badge: <ShieldNumber value="50" />,
    caption: 'Consistent Learner',
    title: 'Fifty Lessons Completed',
    subtitle: 'Congratulations! You just completed your fiftieth lesson.',
  }),
  'seven-day-streak': () => ({
    badge: <ShieldFlame />,
    caption: '7-Day Streak',
    title: 'Streak Milestone 🔥',
    subtitle: "You've been learning consistently all week.",
  }),
  'culture-explorer': () => ({
    badge: <CultureMedallionBadge />,
    caption: 'Person of culture',
    title: 'Culture Explorer',
    subtitle: "You've explored more stories than 90% of learners.",
  }),
  'level-up': (params) => ({
    badge: <ShieldLightning />,
    caption: `Level ${params.level ?? '5'} Reached`,
    title: 'Level Up ⚡',
    subtitle: "You're making steady progress.",
  }),
};

export default function AchievementRoute() {
  const params = useLocalSearchParams<{ kind?: string; level?: string }>();
  const kind = (params.kind ?? '') as Kind;
  const builder = VARIANTS[kind];

  if (!builder) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <AchievementScreen
          badge={null}
          caption=""
          title="Unknown achievement"
          subtitle={`No variant configured for "${kind}".`}
          onClose={() => router.back()}
          onContinue={() => router.back()}
        />
      </>
    );
  }

  const variant = builder({ level: params.level });
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AchievementScreen
        badge={variant.badge}
        caption={variant.caption}
        title={variant.title}
        subtitle={variant.subtitle}
        onClose={() => router.back()}
        onContinue={() => router.back()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  shieldNumber: {
    fontFamily: fonts.extrabold,
    fontSize: 26,
    color: colors.neutral,
  },
});
