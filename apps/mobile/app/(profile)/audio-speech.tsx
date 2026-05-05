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
import type { VoicePlaybackSpeed } from '@lexiroot/shared';

const PLAYBACK_SPEEDS: { key: VoicePlaybackSpeed; label: string }[] = [
  { key: 'slow', label: 'Slow' },
  { key: 'medium', label: 'Medium' },
  { key: 'fast', label: 'Fast' },
];

export default function AudioSpeechScreen() {
  const { data: settings } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();

  function patch(body: UpdateSettingsBody) {
    updateSettings(body);
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Audio & Speech" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <CollapsibleSection title="Voice playback speed">
          {PLAYBACK_SPEEDS.map((opt, i) => (
            <SettingsCheckbox
              key={opt.key}
              label={opt.label}
              checked={settings?.voicePlaybackSpeed === opt.key}
              onChange={(v) => patch({ voicePlaybackSpeed: v ? opt.key : null })}
              last={i === PLAYBACK_SPEEDS.length - 1}
            />
          ))}
        </CollapsibleSection>

        <SettingsRow
          title="Microphone access"
          right={
            <Toggle
              value={settings?.microphoneAccess ?? false}
              onChange={(v) => patch({ microphoneAccess: v })}
            />
          }
        />
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
