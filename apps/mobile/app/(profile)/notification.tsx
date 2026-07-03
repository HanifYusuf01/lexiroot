import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SettingsRow } from '../../src/components/ui/SettingsRow';
import { TimePicker } from '../../src/components/ui/TimePicker';
import { Toggle } from '../../src/components/ui/Toggle';
import { colors, spacing } from '../../src/constants/theme';
import { useEnablePushNotifications } from '../../src/hooks/usePushNotifications';
import {
  cancelDailyReminder,
  scheduleDailyReminder,
} from '../../src/services/notifications';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  type UpdateSettingsBody,
} from '../../src/services/settingsApi';
import { formatHHMM, parseHHMM } from '../../src/utils/time';

const DEFAULT_REMINDER_TIME = '00:30';

/** Remote-push toggles that require OS permission before they can deliver. */
type PushToggleKey = 'streakReminder' | 'achievementAlerts' | 'culturalContentAlert';

export default function NotificationScreen() {
  const { data: settings } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();
  const { enable } = useEnablePushNotifications();

  function patch(body: UpdateSettingsBody) {
    updateSettings(body);
  }

  // Enabling a push toggle first requests OS permission. If the user denies it,
  // we leave the toggle off rather than silently storing a preference that can
  // never deliver.
  async function togglePush(key: PushToggleKey, value: boolean) {
    if (!value) {
      patch({ [key]: false });
      return;
    }
    const granted = await enable();
    if (!granted) {
      Alert.alert(
        'Notifications are off',
        'Enable notifications for LexiRoot in your device settings to receive these alerts.',
      );
      return;
    }
    patch({ [key]: true });
  }

  async function toggleDailyReminder(value: boolean) {
    if (!value) {
      await cancelDailyReminder();
      patch({ dailyReminder: false });
      return;
    }
    const granted = await enable();
    if (!granted) {
      Alert.alert(
        'Notifications are off',
        'Enable notifications for LexiRoot in your device settings to receive daily reminders.',
      );
      return;
    }
    const time = settings?.dailyReminderTime ?? DEFAULT_REMINDER_TIME;
    await scheduleDailyReminder(time);
    patch({ dailyReminder: true, dailyReminderTime: time });
  }

  async function changeReminderTime(date: Date) {
    const time = formatHHMM(date);
    await scheduleDailyReminder(time);
    patch({ dailyReminderTime: time });
  }

  const dailyOn = settings?.dailyReminder ?? false;
  const reminderTime = parseHHMM(settings?.dailyReminderTime ?? DEFAULT_REMINDER_TIME);

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
              onChange={(v) => togglePush('streakReminder', v)}
            />
          }
        />
        <SettingsRow
          title="Achievement Alerts"
          right={
            <Toggle
              value={settings?.achievementAlerts ?? false}
              onChange={(v) => togglePush('achievementAlerts', v)}
            />
          }
        />
        <SettingsRow
          title="Daily Reminder"
          right={<Toggle value={dailyOn} onChange={toggleDailyReminder} />}
          last={!dailyOn}
        />
        {dailyOn ? (
          <View style={styles.dailyTimeRow}>
            <TimePicker value={reminderTime} onChange={changeReminderTime} />
          </View>
        ) : null}
        <SettingsRow
          title="Cultural Content alert"
          right={
            <Toggle
              value={settings?.culturalContentAlert ?? false}
              onChange={(v) => togglePush('culturalContentAlert', v)}
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
