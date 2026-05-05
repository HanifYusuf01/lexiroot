import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CollapsibleSection } from '../../src/components/ui/CollapsibleSection';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SettingsCheckbox } from '../../src/components/ui/SettingsCheckbox';
import { SettingsRow } from '../../src/components/ui/SettingsRow';
import { Toggle } from '../../src/components/ui/Toggle';
import { colors, spacing } from '../../src/constants/theme';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  type UpdateSettingsBody,
} from '../../src/services/settingsApi';
import type { LanguageLevelPref, LessonDifficulty } from '@lexiroot/shared';

const LANGUAGE_LEVELS: { key: LanguageLevelPref; label: string }[] = [
  { key: 'starting', label: "I'm just starting" },
  { key: 'a-little', label: 'I know a little' },
  { key: 'basic', label: 'I can have basic conversation' },
  { key: 'fluent', label: 'I can converse very well' },
];

const LESSON_DIFFICULTIES_OPTS: { key: LessonDifficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

export default function PreferencesScreen() {
  const { data: settings } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();

  function patch(body: UpdateSettingsBody) {
    updateSettings(body);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Preferences" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SettingsRow
          title="Sound & Haptics"
          right={
            <Toggle
              value={settings?.soundHaptics ?? false}
              onChange={(v) => patch({ soundHaptics: v })}
            />
          }
        />

        <CollapsibleSection title="Language Level">
          {LANGUAGE_LEVELS.map((opt, i) => (
            <SettingsCheckbox
              key={opt.key}
              label={opt.label}
              checked={settings?.languageLevel === opt.key}
              onChange={(v) => patch({ languageLevel: v ? opt.key : null })}
              last={i === LANGUAGE_LEVELS.length - 1}
            />
          ))}
        </CollapsibleSection>

        <CollapsibleSection title="Lesson Difficulty">
          {LESSON_DIFFICULTIES_OPTS.map((opt, i) => (
            <SettingsCheckbox
              key={opt.key}
              label={opt.label}
              checked={settings?.lessonDifficulty === opt.key}
              onChange={(v) => patch({ lessonDifficulty: v ? opt.key : null })}
              last={i === LESSON_DIFFICULTIES_OPTS.length - 1}
            />
          ))}
        </CollapsibleSection>

        <SettingsRow
          title="Auto-play audio"
          right={
            <Toggle
              value={settings?.autoplayAudio ?? false}
              onChange={(v) => patch({ autoplayAudio: v })}
            />
          }
          last
        />
        <View style={styles.bottomSpacer} />
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
    paddingTop: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
