import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SettingsRow } from '../../src/components/ui/SettingsRow';
import { TimePicker } from '../../src/components/ui/TimePicker';
import { Toggle } from '../../src/components/ui/Toggle';
import { colors, spacing } from '../../src/constants/theme';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  type UpdateSettingsBody,
} from '../../src/services/settingsApi';
import { formatHHMM, parseHHMM } from '../../src/utils/time';

export default function NotificationScreen() {
  const { data: settings } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();

  function patch(body: UpdateSettingsBody) {
    updateSettings(body);
  }

  const dailyOn = settings?.dailyReminder ?? false;
  const reminderTime = parseHHMM(settings?.dailyReminderTime ?? '00:30');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Notification" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SettingsRow
          title="Streak Reminder"
          right={
            <Toggle
              value={settings?.streakReminder ?? false}
              onChange={(v) => patch({ streakReminder: v })}
            />
          }
        />
        <SettingsRow
          title="Achievement Alerts"
          right={
            <Toggle
              value={settings?.achievementAlerts ?? false}
              onChange={(v) => patch({ achievementAlerts: v })}
            />
          }
        />
        <SettingsRow
          title="Daily Reminder"
          right={
            <Toggle
              value={dailyOn}
              onChange={(v) =>
                patch({
                  dailyReminder: v,
                  // Seed a default time when first turning it on.
                  dailyReminderTime:
                    v && !settings?.dailyReminderTime ? '00:30' : settings?.dailyReminderTime,
                })
              }
            />
          }
          last={!dailyOn}
        />
        {dailyOn ? (
          <View style={styles.dailyTimeRow}>
            <TimePicker
              value={reminderTime}
              onChange={(d) => patch({ dailyReminderTime: formatHHMM(d) })}
            />
          </View>
        ) : null}
        <SettingsRow
          title="Cultural Content alert"
          right={
            <Toggle
              value={settings?.culturalContentAlert ?? false}
              onChange={(v) => patch({ culturalContentAlert: v })}
            />
          }
          last
        />
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
    paddingBottom: spacing.xl,
  },
  dailyTimeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
